import { Test, TestingModule } from '@nestjs/testing';
import { ModelosService } from './modelos.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('ModelosService', () => {
  let service: ModelosService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModelosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ModelosService>(ModelosService);
  });

  describe('create (Invariante de Catálogo)', () => {
    it('debe lanzar BadRequestException si se intenta crear un modelo sin variantes', async () => {
      await expect(
        service.create({
          nombreModelo: 'iPhone 17 Pro',
          marca: 'Apple',
          variantes: [],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('debe crear el modelo y sus variantes atómicamente si tiene al menos una variante', async () => {
      prisma.modeloDispositivo.create.mockResolvedValue({
        id: 1,
        nombreModelo: 'iPhone 16 Pro',
        marca: 'Apple',
      } as any);

      prisma.varianteDispositivo.createMany.mockResolvedValue({ count: 1 } as any);

      prisma.modeloDispositivo.findUnique.mockResolvedValue({
        id: 1,
        nombreModelo: 'iPhone 16 Pro',
        marca: 'Apple',
        variantes: [{ id: 1, color: 'Natural Titanium', capacidadGb: 256 }],
      } as any);

      const res = await service.create({
        nombreModelo: 'iPhone 16 Pro',
        marca: 'Apple',
        variantes: [
          { color: 'Natural Titanium', capacidadGb: 256, tipoSim: 'SIM Físico' },
        ],
      });

      expect(prisma.modeloDispositivo.create).toHaveBeenCalled();
      expect(prisma.varianteDispositivo.createMany).toHaveBeenCalled();
      expect(res.id).toBe(1);
    });
  });

  describe('findDispositivos (Paginación, Filtros y Confidencialidad RBAC)', () => {
    const rawDispositivos = [
      {
        id: 10,
        imei1: '354928110000001',
        numeroSerie: 'SERIE1',
        condicion: 'NUEVO',
        costoBs: 4000,
        costoUsd: 570,
        precioVentaSugeridoBs: 4800,
        estadoInventario: 'DISPONIBLE',
      },
    ];

    it('debe censurar costoBs y costoUsd si el usuario tiene rol VENDEDOR', async () => {
      prisma.dispositivo.findMany.mockResolvedValue(rawDispositivos as any);
      prisma.dispositivo.count.mockResolvedValue(1);

      const res = await service.findDispositivos({}, 'VENDEDOR');
      expect(res.data).toHaveLength(1);
      expect((res.data[0] as any).costoBs).toBeUndefined();
      expect((res.data[0] as any).costoUsd).toBeUndefined();
      expect(res.data[0].precioVentaSugeridoBs).toBe(4800);
      expect(res.meta.total).toBe(1);
    });

    it('debe incluir costoBs y costoUsd si el usuario tiene rol ADMIN', async () => {
      prisma.dispositivo.findMany.mockResolvedValue(rawDispositivos as any);
      prisma.dispositivo.count.mockResolvedValue(1);

      const res = await service.findDispositivos({}, 'ADMIN');
      expect(res.data).toHaveLength(1);
      expect((res.data[0] as any).costoBs).toBe(4000);
      expect((res.data[0] as any).costoUsd).toBe(570);
      expect(res.meta.total).toBe(1);
    });

    it('debe filtrar por IMEI o Serie', async () => {
      prisma.dispositivo.findMany.mockResolvedValue(rawDispositivos as any);
      prisma.dispositivo.count.mockResolvedValue(1);

      await service.findDispositivos({ imei: '3549281' }, 'ADMIN');
      expect(prisma.dispositivo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { imei1: { contains: '3549281', mode: 'insensitive' } },
                ]),
              }),
            ]),
          }),
        })
      );
    });

    it('debe filtrar por proveedor a través de notaIngreso', async () => {
      prisma.dispositivo.findMany.mockResolvedValue(rawDispositivos as any);
      prisma.dispositivo.count.mockResolvedValue(1);

      await service.findDispositivos({ proveedorId: 3 }, 'ADMIN');
      expect(prisma.dispositivo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notaIngreso: expect.objectContaining({
              proveedorId: 3,
            }),
          }),
        })
      );
    });

    it('debe filtrar por rango de fechas de ingreso', async () => {
      prisma.dispositivo.findMany.mockResolvedValue(rawDispositivos as any);
      prisma.dispositivo.count.mockResolvedValue(1);

      await service.findDispositivos({ fechaDesde: '2026-10-01', fechaHasta: '2026-10-21' }, 'ADMIN');
      expect(prisma.dispositivo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            notaIngreso: expect.objectContaining({
              fechaIngreso: expect.objectContaining({
                gte: expect.any(Date),
                lte: expect.any(Date),
              }),
            }),
          }),
        })
      );
    });

    it('debe filtrar por condición y sucursal', async () => {
      prisma.dispositivo.findMany.mockResolvedValue(rawDispositivos as any);
      prisma.dispositivo.count.mockResolvedValue(1);

      await service.findDispositivos({ condicion: 'NUEVO', sucursalId: 2 }, 'ADMIN');
      expect(prisma.dispositivo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            condicion: 'NUEVO',
            sucursalId: 2,
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('debe lanzar NotFoundException si el modelo no existe', async () => {
      prisma.modeloDispositivo.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar el modelo encontrado', async () => {
      prisma.modeloDispositivo.findUnique.mockResolvedValue({ id: 5, nombreModelo: 'iPhone 15' } as any);

      const res = await service.findOne(5);
      expect(res.id).toBe(5);
    });
  });

  describe('addVariante', () => {
    it('debe lanzar NotFoundException si el modelo no existe', async () => {
      prisma.modeloDispositivo.findUnique.mockResolvedValue(null);

      await expect(
        service.addVariante(99, { color: 'Azul', capacidadGb: 128 })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si la variante ya existe para ese modelo', async () => {
      prisma.modeloDispositivo.findUnique.mockResolvedValue({ id: 1 } as any);
      prisma.varianteDispositivo.findUnique.mockResolvedValue({ id: 10 } as any);

      await expect(
        service.addVariante(1, { color: 'Azul', capacidadGb: 128 })
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear la variante exitosamente', async () => {
      prisma.modeloDispositivo.findUnique.mockResolvedValue({ id: 1 } as any);
      prisma.varianteDispositivo.findUnique.mockResolvedValue(null);
      prisma.varianteDispositivo.create.mockResolvedValue({
        id: 15,
        modeloId: 1,
        color: 'Verde',
        capacidadGb: 256,
      } as any);

      const res = await service.addVariante(1, { color: 'Verde', capacidadGb: 256 });
      expect(res.id).toBe(15);
    });
  });

  describe('updateVariante', () => {
    it('debe lanzar NotFoundException si la variante no existe', async () => {
      prisma.varianteDispositivo.findUnique.mockResolvedValue(null);

      await expect(
        service.updateVariante(999, { color: 'Rojo' })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si colisiona con otra variante del mismo modelo', async () => {
      prisma.varianteDispositivo.findUnique.mockResolvedValue({
        id: 1,
        modeloId: 10,
        color: 'Azul',
        capacidadGb: 128,
        tipoSim: 'SIM Físico',
      } as any);

      prisma.varianteDispositivo.findFirst.mockResolvedValue({
        id: 2,
        modeloId: 10,
        color: 'Negro',
        capacidadGb: 128,
        tipoSim: 'SIM Físico',
      } as any);

      await expect(
        service.updateVariante(1, { color: 'Negro' })
      ).rejects.toThrow(ConflictException);
    });

    it('debe actualizar la variante exitosamente si no hay colisión', async () => {
      prisma.varianteDispositivo.findUnique.mockResolvedValue({
        id: 1,
        modeloId: 10,
        color: 'Azul',
        capacidadGb: 128,
        tipoSim: 'SIM Físico',
      } as any);

      prisma.varianteDispositivo.findFirst.mockResolvedValue(null);
      prisma.varianteDispositivo.update.mockResolvedValue({
        id: 1,
        modeloId: 10,
        color: 'Titanio Azul',
        capacidadGb: 256,
        tipoSim: 'eSIM Exclusivo',
      } as any);

      const res = await service.updateVariante(1, {
        color: 'Titanio Azul',
        capacidadGb: 256,
        tipoSim: 'eSIM Exclusivo',
      });

      expect(res.color).toBe('Titanio Azul');
      expect(res.capacidadGb).toBe(256);
      expect(prisma.varianteDispositivo.update).toHaveBeenCalled();
    });
  });

  describe('deleteVariante', () => {
    it('debe lanzar NotFoundException si la variante no existe', async () => {
      prisma.varianteDispositivo.findUnique.mockResolvedValue(null);

      await expect(service.deleteVariante(999)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si tiene dispositivos asociados', async () => {
      prisma.varianteDispositivo.findUnique.mockResolvedValue({
        id: 1,
        modeloId: 10,
        _count: { dispositivos: 3 },
      } as any);

      await expect(service.deleteVariante(1)).rejects.toThrow(ConflictException);
    });

    it('debe lanzar BadRequestException si es la única variante del modelo', async () => {
      prisma.varianteDispositivo.findUnique.mockResolvedValue({
        id: 1,
        modeloId: 10,
        _count: { dispositivos: 0 },
      } as any);

      prisma.varianteDispositivo.count.mockResolvedValue(1);

      await expect(service.deleteVariante(1)).rejects.toThrow(BadRequestException);
    });

    it('debe eliminar la variante exitosamente si no tiene dispositivos y quedan más variantes', async () => {
      prisma.varianteDispositivo.findUnique.mockResolvedValue({
        id: 1,
        modeloId: 10,
        _count: { dispositivos: 0 },
      } as any);

      prisma.varianteDispositivo.count.mockResolvedValue(3);
      prisma.varianteDispositivo.delete.mockResolvedValue({ id: 1 } as any);

      const res = await service.deleteVariante(1);
      expect(res.success).toBe(true);
      expect(prisma.varianteDispositivo.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('getLineaVidaImei', () => {
    it('debe lanzar BadRequestException si el IMEI está vacío', async () => {
      await expect(service.getLineaVidaImei('')).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar NotFoundException si no existe el dispositivo', async () => {
      prisma.dispositivo.findFirst.mockResolvedValue(null);

      await expect(service.getLineaVidaImei('351111111111111')).rejects.toThrow(
        NotFoundException
      );
    });

    it('debe retornar la línea de vida completa con costos para ADMIN', async () => {
      prisma.dispositivo.findFirst.mockResolvedValue({
        id: 1,
        imei1: '351111111111111',
        imei2: '352222222222222',
        numeroSerie: 'SN123456',
        condicion: 'NUEVO',
        estadoInventario: 'VENDIDO',
        precioVentaSugeridoBs: 5000,
        costoBs: 4000,
        costoUsd: 580,
        variante: {
          modelo: { nombreModelo: 'iPhone 15 Pro', marca: 'Apple' },
          color: 'Titanio Natural',
          capacidadGb: 256,
          tipoSim: 'eSIM',
        },
        sucursal: { id: 1, nombre: 'Central', ciudad: 'Santa Cruz' },
        notaIngreso: {
          id: 10,
          proveedor: { id: 2, nombre: 'Mayorista USA', telefono: '77788899' },
          usuario: { id: 1, nombre: 'Admin User' },
          sucursal: { id: 1, nombre: 'Central' },
          fechaIngreso: new Date(),
          numeroComprobante: 'FAC-001',
        },
        detalleVentas: [
          {
            id: 100,
            precioUnitarioBs: 5200,
            costoUnitarioBs: 4000,
            venta: {
              id: 50,
              comprobanteReferencia: 'TK-123456',
              fechaHora: new Date(),
              estado: 'COMPLETADA',
              usuario: { id: 2, nombre: 'Vendedor Pepe' },
              cliente: { id: 3, nombreCompleto: 'Carlos Gomez', telefono: '70012345', ciNit: '889900' },
              metodoPago: { nombre: 'Efectivo' },
              caja: { sucursal: { nombre: 'Central' } },
            },
          },
        ],
      } as any);

      const res = await service.getLineaVidaImei('351111111111111', 'ADMIN');

      expect(res.dispositivo.imei1).toBe('351111111111111');
      expect(res.dispositivo.costoBs).toBe(4000);
      expect(res.origen.proveedor).toBe('Mayorista USA');
      expect(res.venta?.cliente?.nombre).toBe('Carlos Gomez');
      expect(res.venta?.gananciaBs).toBe(1200);
      expect(res.garantia.garantiaVigente).toBe(true);
    });

    it('debe retornar la línea de vida buscando por número de serie (ej: MacBook o AirPods sin IMEI)', async () => {
      prisma.dispositivo.findFirst.mockResolvedValue({
        id: 2,
        imei1: null,
        imei2: null,
        numeroSerie: 'C02G1234MD6R',
        condicion: 'NUEVO',
        estadoInventario: 'DISPONIBLE',
        precioVentaSugeridoBs: 9500,
        costoBs: 8000,
        costoUsd: 1150,
        variante: {
          modelo: { nombreModelo: 'MacBook Air 13 M3', marca: 'Apple', tipo: 'MAC' },
          color: 'Medianoche',
          capacidadGb: 256,
          tipoSim: 'No Aplica',
        },
        sucursal: { id: 1, nombre: 'Sucursal Central', ciudad: 'Santa Cruz' },
        notaIngreso: {
          id: 10,
          proveedor: { id: 1, nombre: 'Beby', telefono: '70000000' },
          usuario: { id: 1, nombre: 'Admin' },
          sucursal: { id: 1, nombre: 'Sucursal Central' },
          numeroComprobante: 'FAC-999',
          fechaIngreso: new Date(),
        },
        detalleVentas: [],
      } as any);

      const res = await service.getLineaVidaImei('C02G1234MD6R', 'ADMIN');
      expect(res.dispositivo.numeroSerie).toBe('C02G1234MD6R');
      expect(res.dispositivo.imei1).toBeNull();
      expect(res.dispositivo.modelo).toBe('MacBook Air 13 M3');
      expect(prisma.dispositivo.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([{ numeroSerie: 'C02G1234MD6R' }]),
          }),
        })
      );
    });

    it('debe ocultar costos mayoristas y ganancia si el usuario es VENDEDOR', async () => {
      prisma.dispositivo.findFirst.mockResolvedValue({
        id: 1,
        imei1: '351111111111111',
        imei2: null,
        numeroSerie: 'SN123456',
        condicion: 'NUEVO',
        estadoInventario: 'DISPONIBLE',
        precioVentaSugeridoBs: 5000,
        costoBs: 4000,
        costoUsd: 580,
        variante: {
          modelo: { nombreModelo: 'iPhone 15', marca: 'Apple' },
          color: 'Negro',
          capacidadGb: 128,
          tipoSim: 'SIM Físico',
        },
        sucursal: { id: 1, nombre: 'Central', ciudad: 'Santa Cruz' },
        notaIngreso: {
          id: 10,
          proveedor: { id: 2, nombre: 'Mayorista USA' },
          usuario: { id: 1, nombre: 'Admin User' },
          sucursal: { id: 1, nombre: 'Central' },
          fechaIngreso: new Date(),
          numeroComprobante: 'FAC-001',
        },
        detalleVentas: [],
      } as any);

      const res = await service.getLineaVidaImei('351111111111111', 'VENDEDOR');

      expect(res.dispositivo.costoBs).toBeUndefined();
      expect(res.origen.costoUnitarioBs).toBeUndefined();
      expect(res.venta).toBeNull();
    });
  });
});
