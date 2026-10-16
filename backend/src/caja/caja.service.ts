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
import { EstadoCaja } from '@prisma/client';
import { roundMoney } from '../common/utils/money.util';

@Injectable()
export class CajaService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Obtener la sesión de caja actualmente ABIERTA para el usuario o sucursal
  async getSesionActiva(usuarioId: number, sucursalId?: number) {
    const caja = await this.prisma.cajaDiaria.findFirst({
      where: {
        usuarioAperturaId: usuarioId,
        ...(sucursalId ? { sucursalId } : {}),
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

  // 2. Abrir turno de caja
  async abrirCaja(usuarioId: number, dto: AbrirCajaDto) {
    // Validar que no tenga otra caja abierta
    const cajaAbierta = await this.prisma.cajaDiaria.findFirst({
      where: {
        usuarioAperturaId: usuarioId,
        sucursalId: dto.sucursalId,
        estado: EstadoCaja.ABIERTA,
      },
    });

    if (cajaAbierta) {
      throw new ConflictException(
        `Ya tienes una sesión de caja ABIERTA (#${cajaAbierta.id}) en esta sucursal. Debes cerrarla antes de iniciar un nuevo turno.`
      );
    }

    return this.prisma.cajaDiaria.create({
      data: {
        sucursalId: dto.sucursalId,
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
  async cerrarCaja(cajaId: number, usuarioId: number, dto: CerrarCajaDto) {
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
  async registrarGasto(cajaId: number, usuarioId: number, dto: RegistrarGastoDto) {
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

  // 6. Historial de Cajas Cerradas para Auditoría
  async getHistorial(sucursalId?: number) {
    return this.prisma.cajaDiaria.findMany({
      where: {
        estado: EstadoCaja.CERRADA,
        ...(sucursalId ? { sucursalId } : {}),
      },
      include: {
        sucursal: { select: { id: true, nombre: true, ciudad: true } },
        usuarioApertura: { select: { id: true, nombre: true } },
        usuarioCierre: { select: { id: true, nombre: true } },
        _count: {
          select: { ventas: true, gastosOperativos: true },
        },
      },
      orderBy: { fechaCierre: 'desc' },
      take: 30,
    });
  }
}
