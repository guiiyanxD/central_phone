import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { EstadoCaja, EstadoInventario, TipoItemVenta } from '@prisma/client';
import { roundMoney } from '../common/utils/money.util';

@Injectable()
export class VentasService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Procesar Venta en Mostrador POS (US14, US15 con Transacción ACID e Invariantes)
  async createVenta(usuarioId: number, userSucursalId: number, dto: CreateVentaDto) {
    const sucursalId = dto.sucursalId || userSucursalId;

    // Regla Inmutable 7: Control Obligatorio de Caja Diaria
    let cajaId = dto.cajaId;
    if (!cajaId) {
      const cajaActiva = await this.prisma.cajaDiaria.findFirst({
        where: {
          usuarioAperturaId: usuarioId,
          sucursalId,
          estado: EstadoCaja.ABIERTA,
        },
      });

      if (!cajaActiva) {
        throw new BadRequestException(
          'No es posible procesar ventas sin una sesión de caja ABIERTA en esta sucursal. Por favor, abre tu turno de caja antes de cobrar.'
        );
      }
      cajaId = cajaActiva.id;
    } else {
      const caja = await this.prisma.cajaDiaria.findUnique({
        where: { id: cajaId },
      });
      if (!caja || caja.estado !== EstadoCaja.ABIERTA) {
        throw new BadRequestException('La caja especificada no se encuentra ABIERTA.');
      }
    }

    const dispositivos = dto.dispositivos || [];
    const accesorios = dto.accesorios || [];

    if (dispositivos.length === 0 && accesorios.length === 0) {
      throw new BadRequestException(
        'El carrito de venta debe contener al menos un teléfono o accesorio para procesar el cobro.'
      );
    }

    // Regla Inmutable 5: Cobro QR / Transferencia exige referencia bancaria
    let metodoPago = await this.prisma.metodoPago.findUnique({
      where: { codigo: dto.metodoPagoCodigo },
    });

    if (!metodoPago && (dto.metodoPagoCodigo === 'QR_SIMPLE' || dto.metodoPagoCodigo === 'QR_ESTATICO')) {
      metodoPago = await this.prisma.metodoPago.findFirst({
        where: {
          codigo: { in: ['QR_SIMPLE', 'QR_ESTATICO'] },
        },
      });
    }

    if (!metodoPago) {
      throw new NotFoundException(
        `El método de pago '${dto.metodoPagoCodigo}' no existe en el sistema.`
      );
    }

    const esPagoDigital =
      dto.metodoPagoCodigo === 'QR_SIMPLE' ||
      dto.metodoPagoCodigo === 'QR_ESTATICO' ||
      dto.metodoPagoCodigo === 'TRANSFERENCIA';

    if (
      esPagoDigital &&
      (!dto.comprobanteReferencia || dto.comprobanteReferencia.trim().length === 0)
    ) {
      throw new BadRequestException(
        'Para cobros mediante QR Oficial o Transferencia Bancaria, es obligatorio registrar el número de comprobante o referencia bancaria.'
      );
    }

    // Ejecutar Transacción ACID
    return this.prisma.$transaction(async (tx) => {
      // 1. Cliente
      let clienteId: number | null = null;
      if (dto.cliente?.telefono && dto.cliente.nombreCompleto) {
        let cliente = await tx.cliente.findFirst({
          where: { telefono: dto.cliente.telefono.trim() },
        });

        if (!cliente) {
          cliente = await tx.cliente.create({
            data: {
              nombreCompleto: dto.cliente.nombreCompleto.trim(),
              telefono: dto.cliente.telefono.trim(),
              ciNit: dto.cliente.ciNit?.trim() || null,
            },
          });
        }
        clienteId = cliente.id;
      }

      // 2. Procesar Dispositivos Físicos (Regla 1: IMEI/Serie único marcado VENDIDO)
      const detallesParaCrear: Array<{
        tipoItem: TipoItemVenta;
        dispositivoId?: number;
        loteAccesorioId?: number;
        cantidad: number;
        costoUnitarioBs: number;
        precioUnitarioBs: number;
        subtotalBs: number;
      }> = [];

      let totalVentaBs = 0;

      for (const item of dispositivos) {
        const disp = await tx.dispositivo.findUnique({
          where: { id: item.dispositivoId },
          include: {
            variante: {
              include: { modelo: true },
            },
          },
        });

        if (!disp) {
          throw new NotFoundException(
            `El dispositivo con ID ${item.dispositivoId} no existe.`
          );
        }

        if (disp.estadoInventario !== EstadoInventario.DISPONIBLE) {
          throw new ConflictException(
            `El equipo '${disp.variante.modelo.nombreModelo}' (IMEI: ${disp.imei1}) no está disponible para venta (Estado actual: ${disp.estadoInventario}).`
          );
        }

        const precioUnitarioBs = roundMoney(item.precioVentaBs);
        const costoUnitarioBs = roundMoney(disp.costoBs);

        // Invariante Financiero (Fase 2): Precio de venta no puede ser inferior al costo real de adquisición
        if (precioUnitarioBs < costoUnitarioBs) {
          throw new BadRequestException(
            `El precio de venta pactado (Bs ${precioUnitarioBs.toFixed(2)}) para el equipo '${disp.variante.modelo.nombreModelo}' no puede ser inferior a su costo de adquisición real (Bs ${costoUnitarioBs.toFixed(2)}).`
          );
        }

        // Marcar dispositivo como VENDIDO
        await tx.dispositivo.update({
          where: { id: disp.id },
          data: { estadoInventario: EstadoInventario.VENDIDO },
        });

        const subtotal = roundMoney(precioUnitarioBs);
        totalVentaBs = roundMoney(totalVentaBs + subtotal);

        // Regla Inmutable 6: Snapshot de costo y precio al momento exacto de la venta
        detallesParaCrear.push({
          tipoItem: TipoItemVenta.DISPOSITIVO,
          dispositivoId: disp.id,
          cantidad: 1,
          costoUnitarioBs,
          precioUnitarioBs,
          subtotalBs: subtotal,
        });
      }

      // 3. Procesar Lotes de Accesorios (Regla 4: Stock deducido por lote)
      for (const item of accesorios) {
        const lote = await tx.loteAccesorio.findUnique({
          where: { id: item.loteAccesorioId },
          include: { accesorio: true },
        });

        if (!lote) {
          throw new NotFoundException(
            `El lote de accesorio con ID ${item.loteAccesorioId} no existe.`
          );
        }

        if (lote.stockActual < item.cantidad) {
          throw new ConflictException(
            `Stock insuficiente para el accesorio '${lote.accesorio.nombre}' [${lote.nombreDiferenciador}]. Disponible: ${lote.stockActual}, Solicitado: ${item.cantidad}.`
          );
        }

        const precioUnitarioBs = roundMoney(item.precioVentaBs);
        const costoUnitarioBs = roundMoney(lote.costoUnitarioBs);

        // Invariante Financiero (Fase 2): Precio de venta no puede ser inferior al costo unitario
        if (precioUnitarioBs < costoUnitarioBs) {
          throw new BadRequestException(
            `El precio de venta pactado (Bs ${precioUnitarioBs.toFixed(2)}) para el accesorio '${lote.accesorio.nombre}' [${lote.nombreDiferenciador}] no puede ser inferior a su costo de adquisición (Bs ${costoUnitarioBs.toFixed(2)}).`
          );
        }

        // Descontar inventario del lote
        await tx.loteAccesorio.update({
          where: { id: lote.id },
          data: {
            stockActual: lote.stockActual - item.cantidad,
          },
        });

        const subtotal = roundMoney(precioUnitarioBs * item.cantidad);
        totalVentaBs = roundMoney(totalVentaBs + subtotal);

        // Regla Inmutable 6: Snapshot de costo y precio
        detallesParaCrear.push({
          tipoItem: TipoItemVenta.ACCESORIO,
          loteAccesorioId: lote.id,
          cantidad: item.cantidad,
          costoUnitarioBs,
          precioUnitarioBs,
          subtotalBs: subtotal,
        });
      }

      // 4. Crear la cabecera de la Venta
      const ticketRef = `TK-${Date.now().toString().slice(-6)}`;

      const venta = await tx.venta.create({
        data: {
          cajaId,
          usuarioId,
          clienteId,
          metodoPagoId: metodoPago.id,
          totalVentaBs: roundMoney(totalVentaBs),
          comprobanteReferencia: dto.comprobanteReferencia?.trim() || ticketRef,
          comprobanteImagenUrl: dto.comprobanteImagenUrl?.trim() || null,
        },
      });

      // 5. Insertar los detalles con snapshot
      for (const det of detallesParaCrear) {
        await tx.detalleVenta.create({
          data: {
            ventaId: venta.id,
            tipoItem: det.tipoItem,
            dispositivoId: det.dispositivoId,
            loteAccesorioId: det.loteAccesorioId,
            cantidad: det.cantidad,
            costoUnitarioBs: det.costoUnitarioBs,
            precioUnitarioBs: det.precioUnitarioBs,
            subtotalBs: det.subtotalBs,
          },
        });
      }

      // Retornar venta completa con relaciones
      return tx.venta.findUnique({
        where: { id: venta.id },
        include: {
          cliente: true,
          usuario: { select: { id: true, nombre: true } },
          caja: {
            include: {
              sucursal: { select: { id: true, nombre: true, ciudad: true } },
            },
          },
          metodoPago: true,
          detalles: {
            include: {
              dispositivo: {
                include: {
                  variante: {
                    include: { modelo: true },
                  },
                },
              },
              loteAccesorio: {
                include: { accesorio: true },
              },
            },
          },
        },
      });
    });
  }

  // 2. Consultar listado de ventas (con cálculo dinámico de ganancia neta en 3FN)
  async findAll(cajaId?: number, sucursalId?: number) {
    const ventas = await this.prisma.venta.findMany({
      where: {
        ...(cajaId ? { cajaId } : {}),
        ...(sucursalId ? { caja: { sucursalId } } : {}),
      },
      include: {
        cliente: true,
        usuario: { select: { id: true, nombre: true } },
        metodoPago: true,
        caja: {
          include: {
            sucursal: { select: { id: true, nombre: true, ciudad: true } },
          },
        },
        detalles: {
          include: {
            dispositivo: {
              include: {
                variante: { include: { modelo: true } },
              },
            },
            loteAccesorio: {
              include: { accesorio: true },
            },
          },
        },
      },
      orderBy: { fechaHora: 'desc' },
      take: 50,
    });

    // Calcular ganancia neta en 3FN: subtotal_bs - (costo_unitario_bs * cantidad)
    return ventas.map((v) => {
      let costoTotalBs = 0;
      for (const d of v.detalles) {
        costoTotalBs += Number(d.costoUnitarioBs) * d.cantidad;
      }
      const totalVentaBs = Number(v.totalVentaBs);
      const gananciaNetaBs = totalVentaBs - costoTotalBs;

      return {
        ...v,
        costoTotalBs: roundMoney(costoTotalBs),
        gananciaNetaBs: roundMoney(gananciaNetaBs),
      };
    });
  }

  // 3. Consultar una venta individual (Ticket de Compra)
  async findOne(id: number) {
    const venta = await this.prisma.venta.findUnique({
      where: { id },
      include: {
        cliente: true,
        usuario: { select: { id: true, nombre: true } },
        metodoPago: true,
        caja: {
          include: {
            sucursal: true,
          },
        },
        detalles: {
          include: {
            dispositivo: {
              include: {
                variante: { include: { modelo: true } },
              },
            },
            loteAccesorio: {
              include: { accesorio: true },
            },
          },
        },
      },
    });

    if (!venta) {
      throw new NotFoundException(`La venta con ID ${id} no existe.`);
    }

    let costoTotalBs = 0;
    for (const d of venta.detalles) {
      costoTotalBs += Number(d.costoUnitarioBs) * d.cantidad;
    }
    const gananciaNetaBs = Number(venta.totalVentaBs) - costoTotalBs;

    return {
      ...venta,
      costoTotalBs: roundMoney(costoTotalBs),
      gananciaNetaBs: roundMoney(gananciaNetaBs),
    };
  }

  // 4. Métodos de Pago Activos
  async getMetodosPago() {
    return this.prisma.metodoPago.findMany({
      where: { activo: true },
      orderBy: { id: 'asc' },
    });
  }
}
