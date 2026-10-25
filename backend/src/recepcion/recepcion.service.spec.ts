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

    it('debe crear accesorio base in-line al vuelo y persistir el lote de accesorio en la nota de ingreso exitosamente', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue({ id: 2, nombre: 'Cargadores' } as any);
      prisma.accesorio.findFirst.mockResolvedValue(null);
      prisma.accesorio.create.mockResolvedValue({ id: 88, nombre: 'Cargador Rápido 20W Anker', categoriaId: 2 } as any);

      prisma.notaIngreso.create.mockResolvedValue({ id: 60, totalCostoBs: 500 } as any);
      prisma.loteAccesorio.create.mockResolvedValue({ id: 12 } as any);
      prisma.notaIngreso.findUnique.mockResolvedValue({
        id: 60,
        totalCostoBs: 500,
        dispositivos: [],
        lotesAccesorio: [{ id: 12 }],
      } as any);

      const res = await service.createNotaIngreso(
        {
          ...baseDto,
          dispositivos: [],
          accesorios: [
            {
              nuevoAccesorio: {
                categoriaId: 2,
                nombre: 'Cargador Rápido 20W Anker',
                descripcion: 'Cargador USB-C de 20W',
              },
              nombreDiferenciador: 'Blanco en Caja Sellada',
              cantidad: 10,
              costoUnitarioBs: 50,
              precioVentaBs: 90,
            },
          ],
        },
        usuarioId
      );

      expect(prisma.categoriaAccesorio.findUnique).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(prisma.accesorio.create).toHaveBeenCalledWith({
        data: {
          categoriaId: 2,
          nombre: 'Cargador Rápido 20W Anker',
          descripcion: 'Cargador USB-C de 20W',
        },
      });
      expect(prisma.loteAccesorio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            accesorioId: 88,
            nombreDiferenciador: 'Blanco en Caja Sellada',
            cantidadInicial: 10,
            stockActual: 10,
          }),
        })
      );
      expect(res.id).toBe(60);
    });

    it('debe lanzar BadRequestException si un lote no tiene ni accesorioId ni nuevoAccesorio', async () => {
      await expect(
        service.createNotaIngreso(
          {
            ...baseDto,
            dispositivos: [],
            accesorios: [
              {
                nombreDiferenciador: 'Lote sin accesorio',
                cantidad: 5,
                costoUnitarioBs: 10,
                precioVentaBs: 20,
              } as any,
            ],
          },
          usuarioId
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('debe permitir registrar una MacBook con número de serie y sin IMEI si el modelo es de tipo MAC', async () => {
      prisma.varianteDispositivo.findUnique.mockResolvedValue({
        id: 10,
        modelo: { id: 5, nombreModelo: 'MacBook Air 13 M3', tipo: 'MAC' },
      } as any);
      prisma.dispositivo.findUnique.mockResolvedValue(null);
      prisma.notaIngreso.create.mockResolvedValue({ id: 55 } as any);
      prisma.dispositivo.create.mockResolvedValue({ id: 101 } as any);
      prisma.notaIngreso.findUnique.mockResolvedValue({
        id: 55,
        dispositivos: [{ id: 101, numeroSerie: 'C02G9999MD6R', imei1: null }],
        lotesAccesorio: [],
      } as any);

      const res = await service.createNotaIngreso(
        {
          ...baseDto,
          dispositivos: [
            {
              varianteId: 10,
              numeroSerie: 'C02G9999MD6R',
              costoBs: 8000,
              costoUsd: 1150,
              precioVentaSugeridoBs: 9500,
            },
          ],
        },
        usuarioId
      );

      expect(prisma.dispositivo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            numeroSerie: 'C02G9999MD6R',
            imei1: null,
          }),
        })
      );
      expect(res.id).toBe(55);
    });

    it('debe lanzar BadRequestException si se intenta registrar un IPHONE sin IMEI 1', async () => {
      prisma.varianteDispositivo.findUnique.mockResolvedValue({
        id: 11,
        modelo: { id: 6, nombreModelo: 'iPhone 15 Pro', tipo: 'IPHONE' },
      } as any);
      prisma.dispositivo.findUnique.mockResolvedValue(null);

      await expect(
        service.createNotaIngreso(
          {
            ...baseDto,
            dispositivos: [
              {
                varianteId: 11,
                numeroSerie: 'F2LZ9999XXXX',
                costoBs: 5000,
                costoUsd: 720,
              },
            ],
          },
          usuarioId
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('debe lanzar NotFoundException si la nota no existe', async () => {
      prisma.notaIngreso.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar la nota de ingreso existente con costos y resumen financiero si es ADMIN', async () => {
      prisma.notaIngreso.findUnique.mockResolvedValue({
        id: 25,
        totalCostoBs: 4300,
        dispositivos: [
          {
            id: 1,
            costoBs: 4000,
            costoUsd: 580,
            precioVentaSugeridoBs: 5000,
            estadoInventario: 'VENDIDO',
            detalleVentas: [{ id: 10, subtotalBs: 5000 }],
          },
        ],
        lotesAccesorio: [
          {
            id: 1,
            cantidadInicial: 10,
            stockActual: 8,
            costoUnitarioBs: 30,
            precioVentaBs: 60,
            detalleVentas: [{ id: 20, cantidad: 2, subtotalBs: 120 }],
          },
        ],
      } as any);

      const res = await service.findOne(25, 'ADMIN');
      expect(res.id).toBe(25);
      expect(res.dispositivos[0].costoBs).toBe(4000);
      expect(res.lotesAccesorio[0].costoUnitarioBs).toBe(30);

      // Métricas financieras calculadas
      expect(res.resumenFinanciero).toBeDefined();
      expect(res.resumenFinanciero.totalCostoBs).toBe(4300);
      expect(res.resumenFinanciero.totalCostoUsd).toBe(580);
      expect(res.resumenFinanciero.totalDispositivos).toBe(1);
      expect(res.resumenFinanciero.totalAccesorios).toBe(10);
      expect(res.resumenFinanciero.totalUnidadesIngresadas).toBe(11);
      expect(res.resumenFinanciero.totalUnidadesVendidas).toBe(3); // 1 disp + 2 accesorios
      expect(res.resumenFinanciero.totalVentaProyectadaBs).toBe(5600); // 5000 + (10 * 60)
      expect(res.resumenFinanciero.totalVentaRealizadaBs).toBe(5120); // 5000 + 120
      expect(res.resumenFinanciero.porcentajeVentaRealizada).toBeGreaterThan(90);
      expect(res.resumenFinanciero.margenRealizadoBs).toBe(1060); // 5120 - (4000 + 2*30) = 1060
    });

    it('debe purgar costos mayoristas si quien consulta no es ADMIN (CENTRALPHONE-CONF-003)', async () => {
      prisma.notaIngreso.findUnique.mockResolvedValue({
        id: 25,
        totalCostoBs: 4300,
        dispositivos: [{ id: 1, costoBs: 4000, costoUsd: 580, precioVentaSugeridoBs: 5000 }],
        lotesAccesorio: [{ id: 1, cantidadInicial: 10, stockActual: 10, costoUnitarioBs: 30, precioVentaBs: 60 }],
      } as any);

      const res = await service.findOne(25, 'VENDEDOR');
      expect(res.id).toBe(25);
      expect((res.dispositivos[0] as any).costoBs).toBeUndefined();
      expect((res.dispositivos[0] as any).costoUsd).toBeUndefined();
      expect((res.lotesAccesorio[0] as any).costoUnitarioBs).toBeUndefined();
      expect((res.resumenFinanciero as any).totalCostoBs).toBeUndefined();
      expect((res.resumenFinanciero as any).margenProyectadoBs).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('debe retornar el listado paginado de notas de ingreso con meta', async () => {
      prisma.notaIngreso.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }] as any);
      prisma.notaIngreso.count.mockResolvedValue(2);

      const res = await service.findAll();
      expect(res.data).toHaveLength(2);
      expect(res.meta.total).toBe(2);
      expect(res.meta.page).toBe(1);
      expect(res.meta.limit).toBe(10);
    });

    it('debe aplicar filtros de búsqueda, fechas, proveedor y sucursal', async () => {
      prisma.notaIngreso.findMany.mockResolvedValue([{ id: 1 }] as any);
      prisma.notaIngreso.count.mockResolvedValue(1);

      const res = await service.findAll(
        {
          sucursalId: 1,
          proveedorId: 2,
          fechaDesde: '2026-10-01',
          fechaHasta: '2026-10-31',
          search: 'FACT-99',
          page: 2,
          limit: 5,
        },
        'ADMIN'
      );

      expect(res.data).toHaveLength(1);
      expect(res.meta.page).toBe(2);
      expect(res.meta.limit).toBe(5);
      expect(prisma.notaIngreso.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: expect.objectContaining({
            sucursalId: 1,
            proveedorId: 2,
            fechaIngreso: expect.any(Object),
            OR: expect.any(Array),
          }),
        })
      );
    });
  });
});
