import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { AnularVentaDto } from './dto/anular-venta.dto';
import { EstadoCaja, EstadoInventario, EstadoVenta, TipoItemVenta } from '@prisma/client';
import { roundMoney } from '../common/utils/money.util';
import { VentaResponseMapper } from './mappers/venta-response.mapper';
import { PaymentStrategyRegistry } from './strategies';

@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentRegistry: PaymentStrategyRegistry,
  ) {}

  // 1. Procesar Venta en Mostrador POS (US14, US15 con Transacción ACID e Invariantes)
  async createVenta(
    usuarioId: number,
    userSucursalId: number,
    dto: CreateVentaDto,
    userRole?: string,
  ) {
    // Regla de Aislamiento Multi-Sucursal (CENTRALPHONE-CONF-006):
    if (userRole !== 'ADMIN' && dto.sucursalId && dto.sucursalId !== userSucursalId) {
      throw new ForbiddenException(
        'Los vendedores no pueden registrar ventas en una sucursal distinta a la suya.',
      );
    }
    const sucursalId =
      userRole === 'ADMIN' && dto.sucursalId ? dto.sucursalId : userSucursalId;

    if (!sucursalId) {
      throw new BadRequestException(
        'Debes especificar o tener asignada una sucursal para procesar la venta.',
      );
    }

    // Regla Inmutable 7: Control Obligatorio de Caja de la Sucursal
    const cajaActiva = await this.prisma.cajaDiaria.findFirst({
      where: {
        sucursalId,
        estado: EstadoCaja.ABIERTA,
      },
    });

    if (!cajaActiva) {
      throw new BadRequestException(
        'No es posible procesar ventas sin una caja ABIERTA en esta sucursal. Por favor, abre la caja de la tienda antes de cobrar.',
      );
    }

    if (dto.cajaId && dto.cajaId !== cajaActiva.id) {
      throw new BadRequestException(
        'La caja especificada no corresponde a la sesión activa de esta sucursal.',
      );
    }

    const cajaId = cajaActiva.id;

    const dispositivos = dto.dispositivos || [];
    const accesorios = dto.accesorios || [];

    // Regla de Negocio: Datos del comprador obligatorios para garantía y trazabilidad
    if (
      !dto.cliente ||
      !dto.cliente.nombreCompleto ||
      dto.cliente.nombreCompleto.trim().length === 0 ||
      !dto.cliente.telefono ||
      dto.cliente.telefono.trim().length === 0
    ) {
      throw new BadRequestException(
        'Los datos del cliente (nombre completo y teléfono de contacto) son obligatorios para procesar la venta y emitir la garantía.'
      );
    }

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

    // Regla Inmutable 5 y OCP: Validación desacoplada mediante PaymentStrategyRegistry
    const paymentValidation = this.paymentRegistry.validatePayment(
      dto.metodoPagoCodigo,
      dto,
    );
    if (!paymentValidation.isValid) {
      throw new BadRequestException(paymentValidation.errorMessage);
    }

    // Ejecutar Transacción ACID
    return this.prisma.$transaction(async (tx) => {
      // Regla Inmutable 7 (Protección ACID/TOCTOU): Verificar que la caja siga ABIERTA dentro de la transacción
      const cajaTransaccional = await tx.cajaDiaria.findFirst({
        where: {
          id: cajaId,
          sucursalId,
          estado: EstadoCaja.ABIERTA,
        },
      });

      if (!cajaTransaccional) {
        throw new ConflictException(
          'La sesión de caja fue cerrada o no está activa en esta sucursal al momento de confirmar la venta.',
        );
      }

      // 1. Cliente (Registro o vinculación obligatoria para trazabilidad)
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
      } else {
        cliente = await tx.cliente.update({
          where: { id: cliente.id },
          data: {
            nombreCompleto: dto.cliente.nombreCompleto.trim(),
            ciNit: dto.cliente.ciNit?.trim() || cliente.ciNit,
          },
        });
      }
      const clienteId = cliente?.id || null;

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

        // Regla de Aislamiento Multi-Sucursal (CENTRALPHONE-CONF-006):
        if (disp.sucursalId !== sucursalId) {
          throw new BadRequestException(
            `El equipo '${disp.variante.modelo.nombreModelo}' (IMEI: ${disp.imei1}) pertenece a otra sucursal y no puede venderse en esta tienda.`,
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

        // Marcar dispositivo como VENDIDO de forma atómica y condicional (ACID-003)
        const updatedDisp = await tx.dispositivo.updateMany({
          where: {
            id: disp.id,
            estadoInventario: EstadoInventario.DISPONIBLE,
          },
          data: { estadoInventario: EstadoInventario.VENDIDO },
        });

        if (updatedDisp.count === 0) {
          throw new ConflictException(
            `El equipo '${disp.variante.modelo.nombreModelo}' (IMEI: ${disp.imei1}) acaba de ser vendido o reservado por otra terminal concurrente.`,
          );
        }

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

        // Regla de Aislamiento Multi-Sucursal (CENTRALPHONE-CONF-006):
        if (lote.sucursalId !== sucursalId) {
          throw new BadRequestException(
            `El lote de accesorio '${lote.accesorio.nombre}' [${lote.nombreDiferenciador}] pertenece a otra sucursal y no puede venderse en esta tienda.`,
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

        // Descontar inventario del lote de forma atómica en SQL (Cero Read-Modify-Write / ACID-002)
        const updatedLote = await tx.loteAccesorio.updateMany({
          where: {
            id: lote.id,
            stockActual: { gte: item.cantidad },
          },
          data: {
            stockActual: {
              decrement: item.cantidad,
            },
          },
        });

        if (updatedLote.count === 0) {
          throw new ConflictException(
            `Stock insuficiente para el accesorio '${lote.accesorio.nombre}' [${lote.nombreDiferenciador}]. Fue agotado por otra terminal concurrente.`,
          );
        }

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

  // 2. Anular Venta con Rollback Atómico (US19 - Regla ACID y Trazabilidad)
  async anularVenta(ventaId: number, adminUserId: number, dto: AnularVentaDto) {
    return this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findUnique({
        where: { id: ventaId },
        include: { detalles: true, caja: true },
      });

      if (!venta) {
        throw new NotFoundException(`La venta #${ventaId} no existe.`);
      }

      if (venta.estado === EstadoVenta.ANULADA) {
        throw new BadRequestException('Esta venta ya se encuentra anulada.');
      }

      // 1. Revertir inventario de teléfonos (Regla 1: Vuelto a DISPONIBLE)
      for (const det of venta.detalles) {
        if (det.tipoItem === TipoItemVenta.DISPOSITIVO && det.dispositivoId) {
          await tx.dispositivo.update({
            where: { id: det.dispositivoId },
            data: { estadoInventario: EstadoInventario.DISPONIBLE },
          });
        }

        // 2. Revertir stock de lotes de accesorios
        if (det.tipoItem === TipoItemVenta.ACCESORIO && det.loteAccesorioId) {
          await tx.loteAccesorio.update({
            where: { id: det.loteAccesorioId },
            data: { stockActual: { increment: det.cantidad } },
          });
        }
      }

      // 3. Marcar venta como ANULADA con auditoría completa
      return tx.venta.update({
        where: { id: venta.id },
        data: {
          estado: EstadoVenta.ANULADA,
          motivoAnulacion: dto.motivo.trim(),
          anuladoPorUsuarioId: adminUserId,
          fechaAnulacion: new Date(),
        },
        include: {
          detalles: true,
          cliente: true,
          metodoPago: true,
          anuladoPor: { select: { id: true, nombre: true, email: true } },
        },
      });
    });
  }

  // 3. Consultar listado de ventas (con cálculo dinámico de ganancia neta en 3FN)
  async findAll(
    cajaId?: number,
    sucursalId?: number,
    estado?: EstadoVenta,
    userRole?: string,
  ) {
    const ventas = await this.prisma.venta.findMany({
      where: {
        ...(cajaId ? { cajaId } : {}),
        ...(sucursalId ? { caja: { sucursalId } } : {}),
        ...(estado ? { estado } : {}),
      },
      include: {
        cliente: true,
        usuario: { select: { id: true, nombre: true } },
        anuladoPor: { select: { id: true, nombre: true } },
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

    // Calcular ganancia neta en 3FN y aplicar confidencialidad RBAC (CENTRALPHONE-CONF-001)
    return VentaResponseMapper.toManyResponse(ventas, userRole);
  }

  // 4. Reporte Financiero de Rentabilidad Neta Consolidada (US17)
  async getReporteRentabilidad(
    fechaInicio?: string,
    fechaFin?: string,
    sucursalId?: number,
  ) {
    let fechaFiltro: any = {};
    if (fechaInicio) {
      const s = fechaInicio.length === 10 ? `${fechaInicio}T00:00:00` : fechaInicio;
      const gte = new Date(s);
      if (!isNaN(gte.getTime())) {
        fechaFiltro.gte = gte;
      }
    }
    if (fechaFin) {
      const s = fechaFin.length === 10 ? `${fechaFin}T23:59:59.999` : fechaFin;
      const lte = new Date(s);
      if (!isNaN(lte.getTime())) {
        fechaFiltro.lte = lte;
      }
    }

    const whereVenta: any = {
      ...(Object.keys(fechaFiltro).length > 0 ? { fechaHora: fechaFiltro } : {}),
      ...(sucursalId ? { caja: { sucursalId } } : {}),
    };

    const todasLasVentas = await this.prisma.venta.findMany({
      where: whereVenta,
      include: {
        cliente: true,
        usuario: { select: { id: true, nombre: true } },
        anuladoPor: { select: { id: true, nombre: true } },
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
    });

    const ventasCompletadas = todasLasVentas.filter((v) => v.estado === EstadoVenta.COMPLETADA);
    const ventasAnuladas = todasLasVentas.filter((v) => v.estado === EstadoVenta.ANULADA);

    let totalIngresosBs = 0;
    let totalCostoMercaderiaBs = 0;
    let totalDispositivosVendidos = 0;
    let totalAccesoriosVendidos = 0;

    const ingresosPorMetodoPago: Record<string, number> = {};

    for (const v of ventasCompletadas) {
      const totalVenta = Number(v.totalVentaBs) || 0;
      totalIngresosBs = roundMoney(totalIngresosBs + totalVenta);

      const metodo = v.metodoPago.nombre || v.metodoPago.codigo;
      ingresosPorMetodoPago[metodo] = roundMoney((ingresosPorMetodoPago[metodo] || 0) + totalVenta);

      for (const d of v.detalles) {
        const costoDet = Number(d.costoUnitarioBs) * d.cantidad;
        totalCostoMercaderiaBs = roundMoney(totalCostoMercaderiaBs + costoDet);
        if (d.tipoItem === TipoItemVenta.DISPOSITIVO) {
          totalDispositivosVendidos += d.cantidad;
        } else {
          totalAccesoriosVendidos += d.cantidad;
        }
      }
    }

    const gananciaBrutaBs = roundMoney(totalIngresosBs - totalCostoMercaderiaBs);

    const whereGastos: any = {
      ...(Object.keys(fechaFiltro).length > 0 ? { fechaHora: fechaFiltro } : {}),
      ...(sucursalId ? { caja: { sucursalId } } : {}),
    };

    const gastos = await this.prisma.gastoOperativo.findMany({
      where: whereGastos,
      include: {
        categoria: true,
        metodoPago: true,
        caja: {
          include: {
            sucursal: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { fechaHora: 'desc' },
    });

    let totalGastosOperativosBs = 0;
    const gastosPorCategoria: Record<string, number> = {};

    for (const g of gastos) {
      const monto = Number(g.montoBs) || 0;
      totalGastosOperativosBs = roundMoney(totalGastosOperativosBs + monto);
      const cat = g.categoria.nombre;
      gastosPorCategoria[cat] = roundMoney((gastosPorCategoria[cat] || 0) + monto);
    }

    const gananciaNetaRealBs = roundMoney(gananciaBrutaBs - totalGastosOperativosBs);
    const margenNetoPorcentaje = totalIngresosBs > 0 ? roundMoney((gananciaNetaRealBs / totalIngresosBs) * 100) : 0;

    const transacciones = todasLasVentas.map((v) => {
      let costoVenta = 0;
      for (const d of v.detalles) {
        costoVenta += Number(d.costoUnitarioBs) * d.cantidad;
      }
      const totalVenta = Number(v.totalVentaBs);
      const ganancia = roundMoney(totalVenta - costoVenta);

      return {
        id: v.id,
        fechaHora: v.fechaHora,
        estado: v.estado,
        motivoAnulacion: v.motivoAnulacion,
        fechaAnulacion: v.fechaAnulacion,
        anuladoPor: v.anuladoPor?.nombre || null,
        comprobanteReferencia: v.comprobanteReferencia,
        vendedor: v.usuario.nombre,
        cliente: v.cliente?.nombreCompleto || 'Cliente Mostrador',
        clienteTelefono: v.cliente?.telefono || null,
        sucursal: v.caja.sucursal.nombre,
        metodoPago: v.metodoPago.nombre,
        totalVentaBs: totalVenta,
        costoTotalBs: roundMoney(costoVenta),
        gananciaBs: ganancia,
        itemsCount: v.detalles.length,
        detalles: v.detalles.map((d) => ({
          id: d.id,
          tipoItem: d.tipoItem,
          cantidad: d.cantidad,
          nombreItem: d.tipoItem === 'DISPOSITIVO'
            ? `${d.dispositivo?.variante?.modelo?.nombreModelo || 'iPhone'} (${d.dispositivo?.variante?.color || ''}, ${d.dispositivo?.variante?.capacidadGb || ''}GB)`
            : d.loteAccesorio?.accesorio?.nombre || 'Accesorio',
          imei: d.dispositivo?.imei1 || null,
          costoUnitarioBs: Number(d.costoUnitarioBs),
          precioUnitarioBs: Number(d.precioUnitarioBs),
          subtotalBs: Number(d.subtotalBs),
        })),
      };
    });

    return {
      resumen: {
        totalIngresosBs,
        totalCostoMercaderiaBs,
        gananciaBrutaBs,
        totalGastosOperativosBs,
        gananciaNetaRealBs,
        margenNetoPorcentaje,
        cantidadVentasCompletadas: ventasCompletadas.length,
        cantidadVentasAnuladas: ventasAnuladas.length,
        totalDispositivosVendidos,
        totalAccesoriosVendidos,
        totalGastosCount: gastos.length,
      },
      desgloseMetodosPago: ingresosPorMetodoPago,
      desgloseGastosPorCategoria: gastosPorCategoria,
      transacciones,
    };
  }

  // 3. Consultar una venta individual (Ticket de Compra)
  async findOne(id: number, userRole?: string) {
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

    // Confidencialidad Financiera RBAC (CENTRALPHONE-CONF-001) y cálculo en 3FN
    return VentaResponseMapper.toResponse(venta, userRole);
  }

  // 4. Métodos de Pago Activos
  async getMetodosPago() {
    return this.prisma.metodoPago.findMany({
      where: { activo: true },
      orderBy: { id: 'asc' },
    });
  }
}
