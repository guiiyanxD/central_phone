import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AbrirCajaDto } from './dto/abrir-caja.dto';
import { CerrarCajaDto } from './dto/cerrar-caja.dto';
import { RegistrarGastoDto } from './dto/registrar-gasto.dto';
import { QueryHistorialDto } from './dto/query-historial.dto';
import { EstadoCaja } from '@prisma/client';
import { roundMoney } from '../common/utils/money.util';

@Injectable()
export class CajaService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Obtener la sesión de caja actualmente ABIERTA de la sucursal
  async getSesionActiva(sucursalId?: number) {
    if (!sucursalId) {
      return null;
    }

    const caja = await this.prisma.cajaDiaria.findFirst({
      where: {
        sucursalId,
        estado: EstadoCaja.ABIERTA,
      },
      include: {
        sucursal: {
          select: { id: true, nombre: true, ciudad: true },
        },
        usuarioApertura: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        ventas: {
          include: {
            metodoPago: true,
            cliente: true,
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
          orderBy: { fechaHora: 'desc' },
        },
        gastosOperativos: {
          include: {
            categoria: true,
            metodoPago: true,
            usuario: { select: { id: true, nombre: true } },
          },
          orderBy: { fechaHora: 'desc' },
        },
      },
    });

    if (!caja) {
      return null;
    }

    // Cálculos financieros dinámicos de la sesión activa
    const montoInicial = roundMoney(caja.montoInicialEfectivo);

    let totalVentasEfectivo = 0;
    let totalVentasDigitales = 0;

    for (const v of caja.ventas) {
      if (v.estado === 'ANULADA') continue;
      const monto = Number(v.totalVentaBs) || 0;
      if (v.metodoPago.codigo === 'EFECTIVO') {
        totalVentasEfectivo = roundMoney(totalVentasEfectivo + monto);
      } else {
        totalVentasDigitales = roundMoney(totalVentasDigitales + monto);
      }
    }

    let totalGastosEfectivo = 0;
    let totalGastosOtros = 0;

    for (const g of caja.gastosOperativos) {
      const monto = Number(g.montoBs) || 0;
      if (g.metodoPago.codigo === 'EFECTIVO') {
        totalGastosEfectivo = roundMoney(totalGastosEfectivo + monto);
      } else {
        totalGastosOtros = roundMoney(totalGastosOtros + monto);
      }
    }

    const saldoEfectivoEnCaja = roundMoney(montoInicial + totalVentasEfectivo - totalGastosEfectivo);
    const totalRecaudadoTotal = roundMoney(totalVentasEfectivo + totalVentasDigitales);

    return {
      caja,
      resumenFinanciero: {
        montoInicialEfectivo: montoInicial,
        totalVentasEfectivo,
        totalVentasDigitales,
        totalRecaudadoTotal,
        totalGastosEfectivo,
        totalGastosOtros,
        saldoEfectivoEnCaja,
        cantidadVentas: caja.ventas.filter((v) => v.estado !== 'ANULADA').length,
        cantidadGastos: caja.gastosOperativos.length,
      },
    };
  }

  // 2. Abrir caja de la sucursal
  async abrirCaja(
    usuarioId: number,
    userSucursalId: number,
    dto: AbrirCajaDto,
    userRole?: string,
  ) {
    const sucursalId =
      userRole === 'ADMIN' && dto.sucursalId ? dto.sucursalId : userSucursalId;

    if (!sucursalId) {
      throw new BadRequestException(
        'Debes especificar o tener asignada una sucursal para abrir la caja.',
      );
    }

    // Regla de Negocio: Máximo una caja ABIERTA por sucursal
    const cajaAbierta = await this.prisma.cajaDiaria.findFirst({
      where: {
        sucursalId,
        estado: EstadoCaja.ABIERTA,
      },
      include: {
        sucursal: true,
      },
    });

    if (cajaAbierta) {
      const fechaStr = new Date(cajaAbierta.fechaApertura).toLocaleDateString('es-BO');
      const nomSuc = cajaAbierta.sucursal?.nombre || 'esta sucursal';
      throw new ConflictException(
        `Ya existe una caja ABIERTA en ${nomSuc} (Caja del ${fechaStr} en ${nomSuc}). Todos los vendedores de esta tienda deben operar sobre ella.`,
      );
    }

    return this.prisma.cajaDiaria.create({
      data: {
        sucursalId,
        usuarioAperturaId: usuarioId,
        montoInicialEfectivo: dto.montoInicialEfectivo,
        estado: EstadoCaja.ABIERTA,
        observaciones: dto.observaciones,
      },
      include: {
        sucursal: true,
        usuarioApertura: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });
  }

  // 3. Cierre de caja con Arqueo Físico a Ciegas (US12)
  async cerrarCaja(
    cajaId: number,
    usuarioId: number,
    userSucursalId: number,
    dto: CerrarCajaDto,
    userRole?: string,
  ) {
    const caja = await this.prisma.cajaDiaria.findUnique({
      where: { id: cajaId },
      include: {
        ventas: {
          include: { metodoPago: true },
        },
        gastosOperativos: {
          include: { metodoPago: true },
        },
      },
    });

    if (!caja) {
      throw new NotFoundException(`La caja con ID ${cajaId} no existe.`);
    }

    if (caja.estado === EstadoCaja.CERRADA) {
      throw new BadRequestException('Esta sesión de caja ya se encuentra CERRADA.');
    }

    // Aislamiento Multi-Sucursal (CENTRALPHONE-CONF-004):
    if (userRole !== 'ADMIN' && caja.sucursalId !== userSucursalId) {
      throw new ForbiddenException('No tienes permisos para cerrar la caja de otra sucursal.');
    }

    // Calcular balance teórico en efectivo
    const montoInicial = roundMoney(caja.montoInicialEfectivo);
    const ventasEfectivo = roundMoney(
      caja.ventas
        .filter((v) => v.estado !== 'ANULADA' && v.metodoPago.codigo === 'EFECTIVO')
        .reduce((sum, v) => sum + Number(v.totalVentaBs), 0)
    );

    const gastosEfectivo = roundMoney(
      caja.gastosOperativos
        .filter((g) => g.metodoPago.codigo === 'EFECTIVO')
        .reduce((sum, g) => sum + Number(g.montoBs), 0)
    );

    const balanceTeorico = roundMoney(montoInicial + ventasEfectivo - gastosEfectivo);
    const montoFisicoContado = roundMoney(dto.montoFinalEfectivo);
    const diferencia = roundMoney(montoFisicoContado - balanceTeorico);

    // Regla de Negocio US12: Si hay diferencia (sobrante o faltante), justificación obligatoria
    if (Math.abs(diferencia) > 0.01) {
      if (!dto.justificacion || dto.justificacion.trim().length === 0) {
        throw new BadRequestException(
          `Existe un descuadre en caja de Bs ${diferencia.toFixed(2)} (${
            diferencia < 0 ? 'Faltante' : 'Sobrante'
          } frente al saldo teórico de Bs ${balanceTeorico.toFixed(2)}). Es obligatorio ingresar una justificación detallada para el Administrador.`
        );
      }
    }

    return this.prisma.cajaDiaria.update({
      where: { id: cajaId },
      data: {
        usuarioCierreId: usuarioId,
        fechaCierre: new Date(),
        montoFinalEfectivo: montoFisicoContado,
        montoTeoricoEfectivo: balanceTeorico,
        diferenciaEfectivo: diferencia,
        justificacion: dto.justificacion?.trim() || null,
        estado: EstadoCaja.CERRADA,
        observaciones: dto.observaciones?.trim() || caja.observaciones,
      },
      include: {
        sucursal: true,
        usuarioApertura: { select: { id: true, nombre: true } },
        usuarioCierre: { select: { id: true, nombre: true } },
      },
    });
  }

  // 4. Registro de Gasto Operativo Menor (US13)
  async registrarGasto(
    cajaId: number,
    usuarioId: number,
    userSucursalId: number,
    dto: RegistrarGastoDto,
    userRole?: string,
  ) {
    const caja = await this.prisma.cajaDiaria.findUnique({
      where: { id: cajaId },
      include: {
        ventas: { include: { metodoPago: true } },
        gastosOperativos: { include: { metodoPago: true } },
      },
    });

    if (!caja) {
      throw new NotFoundException(`La caja con ID ${cajaId} no existe.`);
    }

    if (caja.estado !== EstadoCaja.ABIERTA) {
      throw new BadRequestException('No se pueden registrar gastos en una caja cerrada.');
    }

    // Aislamiento Multi-Sucursal (CENTRALPHONE-CONF-004):
    if (userRole !== 'ADMIN' && caja.sucursalId !== userSucursalId) {
      throw new ForbiddenException(
        'No tienes permisos para registrar gastos en la caja de otra sucursal.',
      );
    }

    // Resolver método de pago (default EFECTIVO)
    let metodoPagoId = dto.metodoPagoId;
    if (!metodoPagoId) {
      const mpEfectivo = await this.prisma.metodoPago.findUnique({
        where: { codigo: 'EFECTIVO' },
      });
      if (!mpEfectivo) {
        throw new NotFoundException('Método de pago EFECTIVO no configurado.');
      }
      metodoPagoId = mpEfectivo.id;
    }

    const metodoPago = await this.prisma.metodoPago.findUnique({
      where: { id: metodoPagoId },
    });

    // Control de saldo suficiente si es gasto en efectivo (US13)
    if (metodoPago?.codigo === 'EFECTIVO') {
      const montoInicial = Number(caja.montoInicialEfectivo) || 0;
      const ventasEfectivo = caja.ventas
        .filter((v) => v.metodoPago.codigo === 'EFECTIVO')
        .reduce((sum, v) => sum + Number(v.totalVentaBs), 0);

      const gastosEfectivo = caja.gastosOperativos
        .filter((g) => g.metodoPago.codigo === 'EFECTIVO')
        .reduce((sum, g) => sum + Number(g.montoBs), 0);

      const saldoDisponible = montoInicial + ventasEfectivo - gastosEfectivo;

      if (dto.montoBs > saldoDisponible) {
        throw new BadRequestException(
          `Saldo en efectivo insuficiente en caja para cubrir el egreso. Disponible: Bs ${saldoDisponible.toFixed(2)}, Requerido: Bs ${dto.montoBs.toFixed(2)}.`
        );
      }
    }

    return this.prisma.gastoOperativo.create({
      data: {
        cajaId,
        categoriaId: dto.categoriaId,
        usuarioId,
        metodoPagoId,
        montoBs: dto.montoBs,
        concepto: dto.concepto.trim(),
      },
      include: {
        categoria: true,
        metodoPago: true,
        usuario: { select: { id: true, nombre: true } },
      },
    });
  }

  // 5. Categorías de Gastos Operativos
  async getCategoriasGasto() {
    return this.prisma.categoriaGasto.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  // 5.1. Usuarios/Cajeros activos para filtros de auditoría
  async getUsuariosCaja(sucursalId?: number) {
    return this.prisma.usuario.findMany({
      where: {
        activo: true,
        ...(sucursalId ? { sucursalId } : {}),
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        sucursalId: true,
        sucursal: { select: { id: true, nombre: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // 6. Historial de Cajas Cerradas con Paginación y Filtros Multi-Criterio
  async getHistorial(
    query?: QueryHistorialDto,
    userRole?: string,
    userSucursalId?: number,
  ) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      estado: EstadoCaja.CERRADA,
    };

    // Filtro de sucursal
    if (query?.sucursalId) {
      where.sucursalId = Number(query.sucursalId);
    } else if (userRole !== 'ADMIN' && userSucursalId && query?.sucursalId === undefined) {
      where.sucursalId = userSucursalId;
    }

    // Filtro por usuario (responsable de apertura o cierre)
    if (query?.usuarioId) {
      const uId = Number(query.usuarioId);
      where.OR = [
        { usuarioAperturaId: uId },
        { usuarioCierreId: uId },
      ];
    }

    // Filtro por rango de fechas (fechaApertura)
    if (query?.fechaDesde || query?.fechaHasta) {
      where.fechaApertura = {};
      if (query.fechaDesde) {
        const [y, m, d] = query.fechaDesde.split('-').map(Number);
        where.fechaApertura.gte = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (query.fechaHasta) {
        const [y, m, d] = query.fechaHasta.split('-').map(Number);
        where.fechaApertura.lte = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
    }

    // Búsqueda textual inteligente
    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      const numTerm = parseInt(term, 10);
      const isNum = !isNaN(numTerm);

      const searchConditions: any[] = [
        { justificacion: { contains: term, mode: 'insensitive' } },
        { observaciones: { contains: term, mode: 'insensitive' } },
        { sucursal: { nombre: { contains: term, mode: 'insensitive' } } },
        { usuarioApertura: { nombre: { contains: term, mode: 'insensitive' } } },
        { usuarioCierre: { nombre: { contains: term, mode: 'insensitive' } } },
      ];

      if (isNum) {
        searchConditions.push({ id: numTerm });
      }

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.cajaDiaria.findMany({
        where,
        include: {
          sucursal: { select: { id: true, nombre: true, ciudad: true } },
          usuarioApertura: { select: { id: true, nombre: true } },
          usuarioCierre: { select: { id: true, nombre: true } },
          _count: {
            select: { ventas: true, gastosOperativos: true },
          },
        },
        orderBy: { fechaCierre: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.cajaDiaria.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  // 7. Consultar detalle completo de una caja con sus ventas y gastos (Auditoría ADMIN)
  async getCajaDetalle(id: number, userRole?: string, userSucursalId?: number) {
    const caja = await this.prisma.cajaDiaria.findUnique({
      where: { id },
      include: {
        sucursal: {
          select: { id: true, nombre: true, ciudad: true, direccion: true, telefono: true },
        },
        usuarioApertura: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        usuarioCierre: {
          select: { id: true, nombre: true, email: true, rol: true },
        },
        gastosOperativos: {
          include: {
            categoria: true,
            metodoPago: true,
            usuario: { select: { id: true, nombre: true, email: true } },
          },
          orderBy: { fechaHora: 'asc' },
        },
        ventas: {
          include: {
            metodoPago: true,
            cliente: true,
            usuario: { select: { id: true, nombre: true, email: true } },
            anuladoPor: { select: { id: true, nombre: true, email: true } },
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
          orderBy: { fechaHora: 'asc' },
        },
      },
    });

    if (!caja) {
      throw new NotFoundException(`La caja #${id} no existe.`);
    }

    // Regla de Aislamiento Multi-Sucursal (BOLA): Vendedores solo ven su propia sucursal
    if (userRole !== 'ADMIN' && userSucursalId && caja.sucursalId !== userSucursalId) {
      throw new ForbiddenException(
        'No tienes permisos para consultar el detalle de cajas de otra sucursal.',
      );
    }

    const montoInicial = roundMoney(caja.montoInicialEfectivo);
    let totalVentasEfectivo = 0;
    let totalVentasDigitales = 0;
    let totalCostoMercaderia = 0;

    const isAdmin = userRole === 'ADMIN';

    const ventasProcesadas = caja.ventas.map((v) => {
      let costoVentaBs = 0;
      for (const d of v.detalles) {
        costoVentaBs += Number(d.costoUnitarioBs) * d.cantidad;
      }
      costoVentaBs = roundMoney(costoVentaBs);
      const totalVentaBs = Number(v.totalVentaBs);
      const gananciaNetaBs = roundMoney(totalVentaBs - costoVentaBs);

      if (v.estado !== 'ANULADA') {
        if (v.metodoPago.codigo === 'EFECTIVO') {
          totalVentasEfectivo = roundMoney(totalVentasEfectivo + totalVentaBs);
        } else {
          totalVentasDigitales = roundMoney(totalVentasDigitales + totalVentaBs);
        }
        totalCostoMercaderia = roundMoney(totalCostoMercaderia + costoVentaBs);
      }

      if (!isAdmin) {
        const safeDetalles = v.detalles.map(({ costoUnitarioBs, ...resto }) => resto);
        return {
          ...v,
          detalles: safeDetalles,
        };
      }

      return {
        ...v,
        costoTotalBs: costoVentaBs,
        gananciaNetaBs,
      };
    });

    let totalGastosEfectivo = 0;
    let totalGastosOtros = 0;

    for (const g of caja.gastosOperativos) {
      const monto = Number(g.montoBs) || 0;
      if (g.metodoPago.codigo === 'EFECTIVO') {
        totalGastosEfectivo = roundMoney(totalGastosEfectivo + monto);
      } else {
        totalGastosOtros = roundMoney(totalGastosOtros + monto);
      }
    }

    const totalGastosTotal = roundMoney(totalGastosEfectivo + totalGastosOtros);
    const totalVentasTotal = roundMoney(totalVentasEfectivo + totalVentasDigitales);
    const saldoTeoricoEfectivo = roundMoney(
      montoInicial + totalVentasEfectivo - totalGastosEfectivo,
    );

    const gananciaNetaVentas = isAdmin
      ? roundMoney(totalVentasTotal - totalCostoMercaderia)
      : undefined;
    const gananciaNetaOperativa = isAdmin
      ? roundMoney(gananciaNetaVentas! - totalGastosTotal)
      : undefined;

    return {
      caja: {
        ...caja,
        ventas: ventasProcesadas,
      },
      resumenFinanciero: {
        montoInicialEfectivo: montoInicial,
        totalVentasEfectivo,
        totalVentasDigitales,
        totalVentasTotal,
        totalGastosEfectivo,
        totalGastosOtros,
        totalGastosTotal,
        saldoTeoricoEfectivo,
        montoFinalEfectivo:
          caja.montoFinalEfectivo !== null
            ? roundMoney(caja.montoFinalEfectivo)
            : null,
        diferenciaEfectivo:
          caja.diferenciaEfectivo !== null
            ? roundMoney(caja.diferenciaEfectivo)
            : null,
        cantidadVentas: caja.ventas.length,
        cantidadVentasCompletadas: caja.ventas.filter((v) => v.estado !== 'ANULADA')
          .length,
        cantidadVentasAnuladas: caja.ventas.filter((v) => v.estado === 'ANULADA')
          .length,
        cantidadGastos: caja.gastosOperativos.length,
        ...(isAdmin
          ? {
              totalCostoMercaderia,
              gananciaNetaVentas,
              gananciaNetaOperativa,
            }
          : {}),
      },
    };
  }
}
