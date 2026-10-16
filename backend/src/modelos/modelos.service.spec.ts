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

  describe('findDispositivos (Confidencialidad RBAC)', () => {
    const rawDispositivos = [
      {
        id: 10,
        imei1: '354928110000001',
        numeroSerie: 'SERIE1',
        costoBs: 4000,
        costoUsd: 570,
        precioVentaSugeridoBs: 4800,
        estadoInventario: 'DISPONIBLE',
      },
    ];

    it('debe censurar costoBs y costoUsd si el usuario tiene rol VENDEDOR', async () => {
      prisma.dispositivo.findMany.mockResolvedValue(rawDispositivos as any);

      const res = await service.findDispositivos(undefined, undefined, undefined, 'VENDEDOR');
      expect(res).toHaveLength(1);
      expect((res[0] as any).costoBs).toBeUndefined();
      expect((res[0] as any).costoUsd).toBeUndefined();
      expect(res[0].precioVentaSugeridoBs).toBe(4800);
    });

    it('debe incluir costoBs y costoUsd si el usuario tiene rol ADMIN', async () => {
      prisma.dispositivo.findMany.mockResolvedValue(rawDispositivos as any);

      const res = await service.findDispositivos(undefined, undefined, undefined, 'ADMIN');
      expect(res).toHaveLength(1);
      expect((res[0] as any).costoBs).toBe(4000);
      expect((res[0] as any).costoUsd).toBe(570);
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

  describe('importarDesdeCsv', () => {
    it('debe lanzar BadRequestException si el contenido CSV está vacío o solo tiene cabecera', async () => {
      await expect(service.importarDesdeCsv('#,Modelo,Color,Capacidad')).rejects.toThrow(
        BadRequestException
      );
    });

    it('debe parsear filas CSV e importar modelos y variantes correctamente', async () => {
      const csv = `#,Modelo,Color,Capacidad
1,iPhone 18 Pro,Titanio Negro,256GB
2,iPhone 18 Pro,Titanio Blanco,1TB`;

      prisma.modeloDispositivo.findFirst.mockResolvedValue(null);
      prisma.modeloDispositivo.create.mockResolvedValue({ id: 10, nombreModelo: 'iPhone 18 Pro' } as any);
      prisma.varianteDispositivo.findUnique.mockResolvedValue(null);
      prisma.varianteDispositivo.create.mockResolvedValue({ id: 1 } as any);

      const res = await service.importarDesdeCsv(csv);
      expect(res.success).toBe(true);
      expect(res.totalProcesados).toBe(2);
      expect(res.variantesCreadas).toBe(2);
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
