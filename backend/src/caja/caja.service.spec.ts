import { Test, TestingModule } from '@nestjs/testing';
import { CajaService } from './caja.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
    it('debe retornar null si no hay ninguna caja abierta en la sucursal', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue(null);

      const res = await service.getSesionActiva(1);
      expect(res).toBeNull();
    });

    it('debe calcular el resumen financiero dinámico de la caja abierta de la sucursal', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 10,
        sucursalId: 1,
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

      const res = await service.getSesionActiva(1);
      expect(res).not.toBeNull();
      // saldo = 200 (inicial) + 1000 (ventas efectivo) - 50 (gasto efectivo) = 1150
      expect(res?.resumenFinanciero.saldoEfectivoEnCaja).toBe(1150);
      expect(res?.resumenFinanciero.totalRecaudadoTotal).toBe(1500);
      expect(res?.resumenFinanciero.totalVentasDigitales).toBe(500);
    });
  });

  describe('abrirCaja', () => {
    it('debe lanzar ConflictException si la sucursal ya tiene una caja abierta', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 1,
        sucursalId: 1,
        estado: EstadoCaja.ABIERTA,
        fechaApertura: new Date(),
        sucursal: { id: 1, nombre: 'Sucursal Central' },
      } as any);

      await expect(
        service.abrirCaja(1, 1, { sucursalId: 1, montoInicialEfectivo: 100 }, 'VENDEDOR')
      ).rejects.toThrow(/Ya existe una caja ABIERTA en Sucursal Central/);
    });

    it('debe crear exitosamente una nueva sesión de caja para la sucursal', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue(null);
      prisma.cajaDiaria.create.mockResolvedValue({
        id: 12,
        sucursalId: 1,
        usuarioAperturaId: 1,
        montoInicialEfectivo: 150,
        estado: EstadoCaja.ABIERTA,
      } as any);

      const res = await service.abrirCaja(1, 1, { sucursalId: 1, montoInicialEfectivo: 150 }, 'VENDEDOR');
      expect(res.id).toBe(12);
      expect(prisma.cajaDiaria.create).toHaveBeenCalled();
    });
  });

  describe('cerrarCaja (Arqueo Ciego)', () => {
    const cajaAbiertaMock = {
      id: 10,
      sucursalId: 1,
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

      await expect(service.cerrarCaja(999, 1, 1, { montoFinalEfectivo: 600 }, 'VENDEDOR')).rejects.toThrow(
        NotFoundException
      );
    });

    it('debe lanzar BadRequestException si la caja ya está cerrada', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 1,
        estado: EstadoCaja.CERRADA,
      } as any);

      await expect(service.cerrarCaja(10, 1, 1, { montoFinalEfectivo: 600 }, 'VENDEDOR')).rejects.toThrow(
        BadRequestException
      );
    });

    it('debe lanzar ForbiddenException si un vendedor de otra sucursal intenta cerrar la caja (CENTRALPHONE-CONF-004)', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(cajaAbiertaMock as any);

      // Vendedor asignado a sucursal 2 intentando cerrar caja de sucursal 1
      await expect(
        service.cerrarCaja(10, 2, 2, { montoFinalEfectivo: 600 }, 'VENDEDOR')
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe permitir a un ADMIN cerrar la caja de cualquier sucursal', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(cajaAbiertaMock as any);
      prisma.cajaDiaria.update.mockResolvedValue({
        id: 10,
        estado: EstadoCaja.CERRADA,
        montoFinalEfectivo: 600,
        diferenciaEfectivo: 0,
      } as any);

      // Admin asignado a sucursal 2 cerrando caja de sucursal 1
      const res = await service.cerrarCaja(10, 99, 2, { montoFinalEfectivo: 600 }, 'ADMIN');
      expect(res.estado).toBe(EstadoCaja.CERRADA);
    });

    it('debe cerrar la caja sin requerir justificación si el conteo físico coincide exactamente con el teórico', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(cajaAbiertaMock as any);
      prisma.cajaDiaria.update.mockResolvedValue({
        id: 10,
        estado: EstadoCaja.CERRADA,
        montoFinalEfectivo: 600,
        diferenciaEfectivo: 0,
      } as any);

      const res = await service.cerrarCaja(10, 1, 1, { montoFinalEfectivo: 600 }, 'VENDEDOR');
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
        service.cerrarCaja(10, 1, 1, { montoFinalEfectivo: 550, justificacion: '' }, 'VENDEDOR')
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

      const res = await service.cerrarCaja(10, 1, 1, {
        montoFinalEfectivo: 550,
        justificacion: 'Faltante por error en vuelto entregado al cliente',
      }, 'VENDEDOR');

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
    it('debe lanzar ForbiddenException si un vendedor de otra sucursal intenta registrar un gasto (CENTRALPHONE-CONF-004)', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 1,
        estado: EstadoCaja.ABIERTA,
        montoInicialEfectivo: 200,
        ventas: [],
        gastosOperativos: [],
      } as any);

      // Vendedor de sucursal 2 intentando registrar gasto en caja de sucursal 1
      await expect(
        service.registrarGasto(10, 2, 2, {
          categoriaId: 1,
          montoBs: 20,
          concepto: 'Gasto indebido',
        }, 'VENDEDOR')
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe lanzar BadRequestException si el gasto en efectivo supera el saldo disponible en caja', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 1,
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
        service.registrarGasto(10, 1, 1, {
          categoriaId: 1,
          montoBs: 100, // Supera los 50 en caja
          concepto: 'Compra insumos de limpieza',
        }, 'VENDEDOR')
      ).rejects.toThrow(BadRequestException);
    });

    it('debe registrar el gasto exitosamente si el vendedor pertenece a la sucursal y hay saldo disponible', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue({
        id: 10,
        sucursalId: 1,
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

      const res = await service.registrarGasto(10, 1, 1, {
        categoriaId: 1,
        montoBs: 30,
        concepto: 'Compra insumos',
      }, 'VENDEDOR');

      expect(res.id).toBe(4);
    });
  });

  describe('getUsuariosCaja', () => {
    it('debe listar los usuarios activos filtrando por sucursal opcional', async () => {
      prisma.usuario.findMany.mockResolvedValue([
        { id: 1, nombre: 'Yuli Cajera', rol: 'VENDEDOR' },
      ] as any);

      const res = await service.getUsuariosCaja(1);
      expect(res).toHaveLength(1);
      expect(prisma.usuario.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ activo: true, sucursalId: 1 }),
        })
      );
    });
  });

  describe('getHistorial (Paginación y Filtros Multi-Criterio)', () => {
    const mockCajas = [
      { id: 10, estado: EstadoCaja.CERRADA, sucursalId: 1 },
      { id: 9, estado: EstadoCaja.CERRADA, sucursalId: 1 },
    ];

    it('debe retornar datos paginados y metadatos correctos', async () => {
      prisma.cajaDiaria.findMany.mockResolvedValue(mockCajas as any);
      prisma.cajaDiaria.count.mockResolvedValue(25);

      const res = await service.getHistorial({ page: 2, limit: 10 }, 'ADMIN');
      expect(res.data).toHaveLength(2);
      expect(res.meta.total).toBe(25);
      expect(res.meta.page).toBe(2);
      expect(res.meta.limit).toBe(10);
      expect(res.meta.totalPages).toBe(3);
      expect(res.meta.hasNextPage).toBe(true);
      expect(res.meta.hasPrevPage).toBe(true);

      expect(prisma.cajaDiaria.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          where: expect.objectContaining({ estado: EstadoCaja.CERRADA }),
        })
      );
    });

    it('debe filtrar por sucursal especificada', async () => {
      prisma.cajaDiaria.findMany.mockResolvedValue([mockCajas[0]] as any);
      prisma.cajaDiaria.count.mockResolvedValue(1);

      const res = await service.getHistorial({ sucursalId: 2 }, 'ADMIN');
      expect(res.data).toHaveLength(1);
      expect(prisma.cajaDiaria.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ sucursalId: 2 }),
        })
      );
    });

    it('debe filtrar por usuario de apertura o cierre', async () => {
      prisma.cajaDiaria.findMany.mockResolvedValue([mockCajas[0]] as any);
      prisma.cajaDiaria.count.mockResolvedValue(1);

      await service.getHistorial({ usuarioId: 5 }, 'ADMIN');
      expect(prisma.cajaDiaria.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ usuarioAperturaId: 5 }, { usuarioCierreId: 5 }],
          }),
        })
      );
    });

    it('debe filtrar por rango de fechas (fechaDesde y fechaHasta)', async () => {
      prisma.cajaDiaria.findMany.mockResolvedValue([mockCajas[0]] as any);
      prisma.cajaDiaria.count.mockResolvedValue(1);

      await service.getHistorial({ fechaDesde: '2026-10-01', fechaHasta: '2026-10-21' }, 'ADMIN');
      expect(prisma.cajaDiaria.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fechaApertura: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('debe aplicar búsqueda textual en campos relevantes', async () => {
      prisma.cajaDiaria.findMany.mockResolvedValue([mockCajas[0]] as any);
      prisma.cajaDiaria.count.mockResolvedValue(1);

      await service.getHistorial({ search: 'Equipetrol' }, 'ADMIN');
      expect(prisma.cajaDiaria.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { sucursal: { nombre: { contains: 'Equipetrol', mode: 'insensitive' } } },
            ]),
          }),
        })
      );
    });
  });

  describe('getCajaDetalle', () => {
    const mockCajaDetalle = {
      id: 10,
      sucursalId: 1,
      montoInicialEfectivo: 300,
      montoFinalEfectivo: 1500,
      montoTeoricoEfectivo: 1500,
      diferenciaEfectivo: 0,
      justificacion: null,
      sucursal: { id: 1, nombre: 'Sucursal Central', ciudad: 'Santa Cruz' },
      usuarioApertura: { id: 1, nombre: 'Alex Gomez (Admin)', rol: 'ADMIN' },
      usuarioCierre: { id: 2, nombre: 'Yuli Mostrador', rol: 'VENDEDOR' },
      gastosOperativos: [
        {
          id: 1,
          montoBs: 50,
          metodoPago: { codigo: 'EFECTIVO' },
          concepto: 'Limpieza',
          categoria: { nombre: 'Mantenimiento' },
          usuario: { id: 2, nombre: 'Yuli Mostrador' },
        },
      ],
      ventas: [
        {
          id: 101,
          totalVentaBs: 1000,
          estado: 'COMPLETADA',
          metodoPago: { codigo: 'EFECTIVO', nombre: 'Efectivo en Caja' },
          cliente: { nombreCompleto: 'Juan Perez' },
          usuario: { id: 2, nombre: 'Yuli Mostrador' },
          detalles: [
            {
              id: 1,
              cantidad: 1,
              costoUnitarioBs: 600,
              precioUnitarioBs: 1000,
              subtotalBs: 1000,
              dispositivo: {
                id: 5,
                numeroSerie: 'SN123',
                imei1: '356789012345678',
                variante: {
                  color: 'Negro',
                  capacidadGb: 128,
                  modelo: { nombreModelo: 'iPhone 13' },
                },
              },
            },
          ],
        },
        {
          id: 102,
          totalVentaBs: 250,
          estado: 'COMPLETADA',
          metodoPago: { codigo: 'STATIC_QR', nombre: 'QR Simple Oficial' },
          cliente: { nombreCompleto: 'Maria Gomez' },
          usuario: { id: 2, nombre: 'Yuli Mostrador' },
          detalles: [
            {
              id: 2,
              cantidad: 1,
              costoUnitarioBs: 50,
              precioUnitarioBs: 250,
              subtotalBs: 250,
              loteAccesorio: {
                id: 12,
                nombreDiferenciador: 'MagSafe Oficial',
                accesorio: { nombre: 'Funda Silicona' },
              },
            },
          ],
        },
      ],
    };

    it('debe retornar el detalle completo con rentabilidad para ADMIN', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(mockCajaDetalle as any);

      const res = await service.getCajaDetalle(10, 'ADMIN');

      expect(res.caja.id).toBe(10);
      expect(res.caja.ventas).toHaveLength(2);
      expect(res.caja.ventas[0].costoTotalBs).toBe(600);
      expect(res.caja.ventas[0].gananciaNetaBs).toBe(400);
      expect(res.resumenFinanciero.totalVentasEfectivo).toBe(1000);
      expect(res.resumenFinanciero.totalVentasDigitales).toBe(250);
      expect(res.resumenFinanciero.totalVentasTotal).toBe(1250);
      expect(res.resumenFinanciero.totalGastosEfectivo).toBe(50);
      expect(res.resumenFinanciero.saldoTeoricoEfectivo).toBe(1250); // 300 + 1000 - 50 = 1250
      expect(res.resumenFinanciero.totalCostoMercaderia).toBe(650); // 600 + 50
      expect(res.resumenFinanciero.gananciaNetaVentas).toBe(600); // 1250 - 650
      expect(res.resumenFinanciero.gananciaNetaOperativa).toBe(550); // 600 - 50
    });

    it('debe sanitizar los costos unitarios cuando el usuario es VENDEDOR', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(mockCajaDetalle as any);

      const res = await service.getCajaDetalle(10, 'VENDEDOR', 1);

      expect(res.caja.ventas[0].detalles[0]).not.toHaveProperty('costoUnitarioBs');
      expect(res.caja.ventas[0]).not.toHaveProperty('costoTotalBs');
      expect(res.caja.ventas[0]).not.toHaveProperty('gananciaNetaBs');
      expect(res.resumenFinanciero).not.toHaveProperty('totalCostoMercaderia');
      expect(res.resumenFinanciero).not.toHaveProperty('gananciaNetaVentas');
    });

    it('debe lanzar ForbiddenException si un VENDEDOR consulta una caja de otra sucursal (BOLA)', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(mockCajaDetalle as any);

      await expect(service.getCajaDetalle(10, 'VENDEDOR', 2)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('debe lanzar NotFoundException si la caja no existe', async () => {
      prisma.cajaDiaria.findUnique.mockResolvedValue(null);

      await expect(service.getCajaDetalle(999, 'ADMIN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
