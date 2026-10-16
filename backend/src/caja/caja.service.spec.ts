import { Test, TestingModule } from '@nestjs/testing';
import { CajaService } from './caja.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EstadoCaja } from '@prisma/client';

describe('CajaService', () => {
  let service: CajaService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CajaService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CajaService>(CajaService);
  });

  describe('getSesionActiva', () => {
    it('debe retornar null si no hay ninguna caja abierta', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue(null);

      const res = await service.getSesionActiva(1, 1);
      expect(res).toBeNull();
    });

    it('debe calcular el resumen financiero dinámico de la caja abierta', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 10,
        montoInicialEfectivo: 200,
        estado: EstadoCaja.ABIERTA,
        ventas: [
          { totalVentaBs: 1000, metodoPago: { codigo: 'EFECTIVO' } },
          { totalVentaBs: 500, metodoPago: { codigo: 'QR_SIMPLE' } },
        ],
        gastosOperativos: [
          { montoBs: 50, metodoPago: { codigo: 'EFECTIVO' } },
        ],
      } as any);

      const res = await service.getSesionActiva(1, 1);
      expect(res).not.toBeNull();
      // saldo = 200 (inicial) + 1000 (ventas efectivo) - 50 (gasto efectivo) = 1150
      expect(res?.resumenFinanciero.saldoEfectivoEnCaja).toBe(1150);
      expect(res?.resumenFinanciero.totalRecaudadoTotal).toBe(1500);
      expect(res?.resumenFinanciero.totalVentasDigitales).toBe(500);
    });
  });

  describe('abrirCaja', () => {
    it('debe lanzar ConflictException si el usuario ya tiene una caja abierta', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 1,
        estado: EstadoCaja.ABIERTA,
      } as any);

      await expect(
        service.abrirCaja(1, { sucursalId: 1, montoInicialEfectivo: 100 })
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear exitosamente una nueva sesión de caja', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue(null);
      prisma.cajaDiaria.create.mockResolvedValue({
        id: 12,
        sucursalId: 1,
        usuarioAperturaId: 1,
        montoInicialEfectivo: 150,
        estado: EstadoCaja.ABIERTA,
      } as any);

      const res = await service.abrirCaja(1, { sucursalId: 1, montoInicialEfectivo: 150 });
      expect(res.id).toBe(12);
      expect(prisma.cajaDiaria.create).toHaveBeenCalled();
    });
  });

  describe('cerrarCaja (Arqueo Ciego)', () => {
    const cajaAbiertaMock = {
      id: 10,
      estado: EstadoCaja.ABIERTA,
      montoInicialEfectivo: 200,
      ventas: [
        { totalVentaBs: 500, metodoPago: { codigo: 'EFECTIVO' } },
      ],
      gastosOperativos: [
        { montoBs: 100, metodoPago: { codigo: 'EFECTIVO' } },
      ],
    };
    // Balance teórico = 200 + 500 - 100 = 600

    it('debe lanzar NotFoundException si la caja no existe', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(null);

      await expect(service.cerrarCaja(999, 1, { montoFinalEfectivo: 600 })).rejects.toThrow(
        NotFoundException
      );
    });

    it('debe lanzar BadRequestException si la caja ya está cerrada', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue({
        id: 10,
        estado: EstadoCaja.CERRADA,
      } as any);

      await expect(service.cerrarCaja(10, 1, { montoFinalEfectivo: 600 })).rejects.toThrow(
        BadRequestException
      );
    });

    it('debe cerrar la caja sin requerir justificación si el conteo físico coincide exactamente con el teórico', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(cajaAbiertaMock as any);
      prisma.cajaDiaria.update.mockResolvedValue({
        id: 10,
        estado: EstadoCaja.CERRADA,
        montoFinalEfectivo: 600,
        diferenciaEfectivo: 0,
      } as any);

      const res = await service.cerrarCaja(10, 1, { montoFinalEfectivo: 600 });
      expect(res.estado).toBe(EstadoCaja.CERRADA);
      expect(prisma.cajaDiaria.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            diferenciaEfectivo: 0,
            estado: EstadoCaja.CERRADA,
          }),
        })
      );
    });

    it('debe lanzar BadRequestException si existe descuadre y no se proporciona justificación', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(cajaAbiertaMock as any);

      // Conteo 550 cuando el teórico es 600 (faltante de 50) sin justificación
      await expect(
        service.cerrarCaja(10, 1, { montoFinalEfectivo: 550, justificacion: '' })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe permitir el cierre con descuadre si se proporciona una justificación', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(cajaAbiertaMock as any);
      prisma.cajaDiaria.update.mockResolvedValue({
        id: 10,
        estado: EstadoCaja.CERRADA,
        montoFinalEfectivo: 550,
        diferenciaEfectivo: -50,
        justificacion: 'Faltante por error en vuelto entregado al cliente',
      } as any);

      const res = await service.cerrarCaja(10, 1, {
        montoFinalEfectivo: 550,
        justificacion: 'Faltante por error en vuelto entregado al cliente',
      });

      expect(res.estado).toBe(EstadoCaja.CERRADA);
      expect(prisma.cajaDiaria.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            diferenciaEfectivo: -50,
            justificacion: 'Faltante por error en vuelto entregado al cliente',
          }),
        })
      );
    });
  });

  describe('registrarGasto', () => {
    it('debe lanzar BadRequestException si el gasto en efectivo supera el saldo disponible en caja', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue({
        id: 10,
        estado: EstadoCaja.ABIERTA,
        montoInicialEfectivo: 50,
        ventas: [],
        gastosOperativos: [],
      } as any);

      prisma.metodoPago.findUnique.mockResolvedValue({
        id: 1,
        codigo: 'EFECTIVO',
      } as any);

      await expect(
        service.registrarGasto(10, 1, {
          categoriaId: 1,
          montoBs: 100, // Supera los 50 en caja
          concepto: 'Compra insumos de limpieza',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe registrar el gasto exitosamente si hay saldo disponible', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue({
        id: 10,
        estado: EstadoCaja.ABIERTA,
        montoInicialEfectivo: 200,
        ventas: [],
        gastosOperativos: [],
      } as any);

      prisma.metodoPago.findUnique.mockResolvedValue({
        id: 1,
        codigo: 'EFECTIVO',
      } as any);

      prisma.gastoOperativo.create.mockResolvedValue({
        id: 4,
        montoBs: 30,
        concepto: 'Compra insumos',
      } as any);

      const res = await service.registrarGasto(10, 1, {
        categoriaId: 1,
        montoBs: 30,
        concepto: 'Compra insumos',
      });

      expect(res.id).toBe(4);
    });
  });
});
