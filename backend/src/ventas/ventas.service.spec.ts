import { Test, TestingModule } from '@nestjs/testing';
import { VentasService } from './ventas.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EstadoCaja, EstadoInventario, TipoItemVenta } from '@prisma/client';

describe('VentasService', () => {
  let service: VentasService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentasService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<VentasService>(VentasService);
  });

  describe('createVenta', () => {
    const usuarioId = 1;
    const sucursalId = 1;

    it('debe lanzar BadRequestException si no existe una caja abierta para el turno', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue(null);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 1000 }],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar BadRequestException si el carrito está completamente vacío', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 5,
        estado: EstadoCaja.ABIERTA,
      } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          dispositivos: [],
          accesorios: [],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si el método de pago no existe', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 5,
        estado: EstadoCaja.ABIERTA,
      } as any);
      prisma.metodoPago.findUnique.mockResolvedValue(null);
      prisma.metodoPago.findFirst.mockResolvedValue(null);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'BITCOIN_INVENTADO',
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 1000 }],
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si es cobro QR o transferencia sin referencia bancaria', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({
        id: 5,
        estado: EstadoCaja.ABIERTA,
      } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({
        id: 2,
        codigo: 'QR_SIMPLE',
        nombre: 'Pago QR',
      } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'QR_SIMPLE',
          comprobanteReferencia: '',
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 1000 }],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException si el teléfono no se encuentra DISPONIBLE', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        estadoInventario: EstadoInventario.VENDIDO,
        variante: { modelo: { nombreModelo: 'iPhone 15' } },
        costoBs: 4000,
      } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 4500 }],
        })
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar BadRequestException si el precio pactado es menor al costo de adquisición del dispositivo', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        estadoInventario: EstadoInventario.DISPONIBLE,
        variante: { modelo: { nombreModelo: 'iPhone 15' } },
        costoBs: 5000,
      } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          dispositivos: [{ dispositivoId: 10, precioVentaBs: 4800 }], // Menor a costo
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException si el stock del lote de accesorios es insuficiente', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      prisma.loteAccesorio.findUnique.mockResolvedValue({
        id: 3,
        stockActual: 2,
        costoUnitarioBs: 20,
        accesorio: { nombre: 'Funda Silicona' },
        nombreDiferenciador: 'MagSafe',
      } as any);

      await expect(
        service.createVenta(usuarioId, sucursalId, {
          metodoPagoCodigo: 'EFECTIVO',
          accesorios: [{ loteAccesorioId: 3, cantidad: 5, precioVentaBs: 50 }],
        })
      ).rejects.toThrow(ConflictException);
    });

    it('debe procesar exitosamente la venta atómica de un teléfono y un accesorio', async () => {
      prisma.cajaDiaria.findFirst.mockResolvedValue({ id: 5, estado: EstadoCaja.ABIERTA } as any);
      prisma.metodoPago.findUnique.mockResolvedValue({ id: 1, codigo: 'EFECTIVO' } as any);

      // Mock teléfono
      prisma.dispositivo.findUnique.mockResolvedValue({
        id: 10,
        estadoInventario: EstadoInventario.DISPONIBLE,
        costoBs: 4000,
        variante: { modelo: { nombreModelo: 'iPhone 15' } },
      } as any);

      // Mock accesorio
      prisma.loteAccesorio.findUnique.mockResolvedValue({
        id: 20,
        stockActual: 10,
        costoUnitarioBs: 30,
        accesorio: { nombre: 'Cargador 20W' },
        nombreDiferenciador: 'Caja Sellada',
      } as any);

      // Mock creación de venta y detalle
      prisma.venta.create.mockResolvedValue({ id: 101, totalVentaBs: 4600 } as any);
      prisma.detalleVenta.create.mockResolvedValue({ id: 1 } as any);

      prisma.venta.findUnique.mockResolvedValue({
        id: 101,
        totalVentaBs: 4600,
        detalles: [
          { tipoItem: TipoItemVenta.DISPOSITIVO, cantidad: 1, costoUnitarioBs: 4000, precioUnitarioBs: 4500 },
          { tipoItem: TipoItemVenta.ACCESORIO, cantidad: 1, costoUnitarioBs: 30, precioUnitarioBs: 100 },
        ],
      } as any);

      const result = await service.createVenta(usuarioId, sucursalId, {
        metodoPagoCodigo: 'EFECTIVO',
        dispositivos: [{ dispositivoId: 10, precioVentaBs: 4500 }],
        accesorios: [{ loteAccesorioId: 20, cantidad: 1, precioVentaBs: 100 }],
      });

      expect(prisma.dispositivo.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { estadoInventario: EstadoInventario.VENDIDO },
      });

      expect(prisma.loteAccesorio.update).toHaveBeenCalledWith({
        where: { id: 20 },
        data: { stockActual: 9 },
      });

      expect(result.id).toBe(101);
    });
  });

  describe('findAll', () => {
    it('debe calcular dinámicamente la ganancia neta en 3FN para cada venta', async () => {
      prisma.venta.findMany.mockResolvedValue([
        {
          id: 1,
          totalVentaBs: 5000,
          detalles: [
            { costoUnitarioBs: 4000, cantidad: 1, precioUnitarioBs: 4800, subtotalBs: 4800 },
            { costoUnitarioBs: 50, cantidad: 2, precioUnitarioBs: 100, subtotalBs: 200 },
          ],
        },
      ] as any);

      const res = await service.findAll();
      expect(res).toHaveLength(1);
      // Costo total = 4000 + 100 = 4100
      expect(res[0].costoTotalBs).toBe(4100);
      // Ganancia neta = 5000 - 4100 = 900
      expect(res[0].gananciaNetaBs).toBe(900);
    });
  });

  describe('findOne', () => {
    it('debe lanzar NotFoundException si la venta no existe', async () => {
      prisma.venta.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar venta con ganancia neta calculada', async () => {
      prisma.venta.findUnique.mockResolvedValue({
        id: 7,
        totalVentaBs: 1000,
        detalles: [
          { costoUnitarioBs: 700, cantidad: 1 },
        ],
      } as any);

      const res = await service.findOne(7);
      expect(res.costoTotalBs).toBe(700);
      expect(res.gananciaNetaBs).toBe(300);
    });
  });
});
