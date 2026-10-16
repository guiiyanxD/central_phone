import { Test, TestingModule } from '@nestjs/testing';
import { RecepcionService } from './recepcion.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

describe('RecepcionService', () => {
  let service: RecepcionService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecepcionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RecepcionService>(RecepcionService);
  });

  describe('createNotaIngreso', () => {
    const usuarioId = 1;
    const baseDto = {
      proveedorId: 1,
      sucursalId: 1,
      numeroComprobante: 'FAC-123',
    };

    beforeEach(() => {
      prisma.proveedor.findUnique.mockResolvedValue({ id: 1, nombre: 'Beby' } as any);
      prisma.sucursal.findUnique.mockResolvedValue({ id: 1, nombre: 'Sucursal Central' } as any);
    });

    it('debe lanzar BadRequestException si no se envían ni teléfonos ni accesorios', async () => {
      await expect(
        service.createNotaIngreso(
          {
            ...baseDto,
            dispositivos: [],
            accesorios: [],
          },
          usuarioId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException si hay números de serie duplicados en la misma entrega', async () => {
      await expect(
        service.createNotaIngreso(
          {
            ...baseDto,
            dispositivos: [
              {
                varianteId: 1,
                numeroSerie: 'SERIE-DUPLICADA',
                imei1: '354928110000001',
                costoBs: 1000,
                costoUsd: 140,
              },
              {
                varianteId: 1,
                numeroSerie: 'SERIE-DUPLICADA',
                imei1: '354928110000002',
                costoBs: 1000,
                costoUsd: 140,
              },
            ],
          },
          usuarioId
        )
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si hay IMEI 1 duplicados en la misma entrega', async () => {
      await expect(
        service.createNotaIngreso(
          {
            ...baseDto,
            dispositivos: [
              {
                varianteId: 1,
                numeroSerie: 'SERIE-001',
                imei1: '354928117777777',
                costoBs: 1000,
                costoUsd: 140,
              },
              {
                varianteId: 1,
                numeroSerie: 'SERIE-002',
                imei1: '354928117777777',
                costoBs: 1000,
                costoUsd: 140,
              },
            ],
          },
          usuarioId
        )
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si el número de serie ya existe en la base de datos', async () => {
      prisma.dispositivo.findUnique.mockResolvedValue({ id: 9 } as any);

      await expect(
        service.createNotaIngreso(
          {
            ...baseDto,
            dispositivos: [
              {
                varianteId: 1,
                numeroSerie: 'SERIE-EXISTENTE',
                imei1: '354928110000001',
                costoBs: 1000,
                costoUsd: 140,
              },
            ],
          },
          usuarioId
        )
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar ConflictException si el IMEI 1 coincide de forma cruzada con un IMEI 2 en base de datos', async () => {
      prisma.dispositivo.findUnique.mockResolvedValue(null);
      // Simula que la búsqueda con OR encuentra coincidencia
      prisma.dispositivo.findFirst.mockResolvedValue({ id: 8, imei2: '354928110000001' } as any);

      await expect(
        service.createNotaIngreso(
          {
            ...baseDto,
            dispositivos: [
              {
                varianteId: 1,
                numeroSerie: 'SERIE-NUEVA',
                imei1: '354928110000001',
                costoBs: 1000,
                costoUsd: 140,
              },
            ],
          },
          usuarioId
        )
      ).rejects.toThrow(ConflictException);
    });

    it('debe crear variante in-line al vuelo y persistir la nota de ingreso exitosamente', async () => {
      prisma.dispositivo.findUnique.mockResolvedValue(null);
      prisma.dispositivo.findFirst.mockResolvedValue(null);

      // Variante al vuelo no existe previamente
      prisma.varianteDispositivo.findUnique.mockResolvedValue(null);
      prisma.varianteDispositivo.create.mockResolvedValue({
        id: 99,
        modeloId: 1,
        color: 'Titanio Azul',
        capacidadGb: 256,
        tipoSim: 'eSIM',
      } as any);

      prisma.notaIngreso.create.mockResolvedValue({ id: 50, totalCostoBs: 2500 } as any);
      prisma.dispositivo.create.mockResolvedValue({ id: 1 } as any);
      prisma.loteAccesorio.create.mockResolvedValue({ id: 1 } as any);

      prisma.notaIngreso.findUnique.mockResolvedValue({
        id: 50,
        totalCostoBs: 2500,
        dispositivos: [{ id: 1 }],
        lotesAccesorio: [{ id: 1 }],
      } as any);

      const res = await service.createNotaIngreso(
        {
          ...baseDto,
          dispositivos: [
            {
              nuevaVariante: {
                modeloId: 1,
                color: 'Titanio Azul',
                capacidadGb: 256,
                tipoSim: 'eSIM',
              },
              numeroSerie: 'F2LZ999',
              imei1: '354928118888888',
              costoBs: 2000,
              costoUsd: 280,
              precioVentaSugeridoBs: 2400,
            },
          ],
          accesorios: [
            {
              accesorioId: 1,
              nombreDiferenciador: 'MagSafe Oficial',
              cantidad: 5,
              costoUnitarioBs: 100,
              precioVentaBs: 180,
            },
          ],
        },
        usuarioId
      );

      expect(prisma.varianteDispositivo.create).toHaveBeenCalled();
      expect(prisma.notaIngreso.create).toHaveBeenCalled();
      expect(prisma.dispositivo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            varianteId: 99,
            precioVentaSugeridoBs: 2400,
          }),
        })
      );
      expect(res.id).toBe(50);
    });
  });

  describe('findOne', () => {
    it('debe lanzar NotFoundException si la nota no existe', async () => {
      prisma.notaIngreso.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar la nota de ingreso existente', async () => {
      prisma.notaIngreso.findUnique.mockResolvedValue({ id: 25 } as any);

      const res = await service.findOne(25);
      expect(res.id).toBe(25);
    });
  });

  describe('findAll', () => {
    it('debe retornar el listado de notas de ingreso', async () => {
      prisma.notaIngreso.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);

      const res = await service.findAll();
      expect(res).toHaveLength(2);
    });
  });
});
