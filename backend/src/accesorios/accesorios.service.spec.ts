import { Test, TestingModule } from '@nestjs/testing';
import { AccesoriosService } from './accesorios.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('AccesoriosService', () => {
  let service: AccesoriosService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccesoriosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AccesoriosService>(AccesoriosService);
  });

  describe('createCategoria', () => {
    it('debe lanzar ConflictException si la categoría ya existe', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue({ id: 1, nombre: 'Fundas' } as any);

      await expect(service.createCategoria({ nombre: 'Fundas' })).rejects.toThrow(
        ConflictException
      );
    });

    it('debe crear la categoría exitosamente', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue(null);
      prisma.categoriaAccesorio.create.mockResolvedValue({ id: 2, nombre: 'Cargadores' } as any);

      const res = await service.createCategoria({ nombre: 'Cargadores' });
      expect(res.id).toBe(2);
    });
  });

  describe('findAllCategorias', () => {
    it('debe listar todas las categorías', async () => {
      prisma.categoriaAccesorio.findMany.mockResolvedValue([{ id: 1, nombre: 'Fundas' }] as any);

      const res = await service.findAllCategorias();
      expect(res).toHaveLength(1);
    });
  });

  describe('updateCategoria', () => {
    it('debe lanzar NotFoundException si la categoría no existe', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCategoria(999, { nombre: 'Nueva' })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar ConflictException si el nuevo nombre ya está ocupado', async () => {
      prisma.categoriaAccesorio.findUnique
        .mockResolvedValueOnce({ id: 1, nombre: 'Fundas' } as any) // find existing by id
        .mockResolvedValueOnce({ id: 2, nombre: 'Cables' } as any); // find duplicate name

      await expect(
        service.updateCategoria(1, { nombre: 'Cables' })
      ).rejects.toThrow(ConflictException);
    });

    it('debe actualizar la categoría exitosamente', async () => {
      prisma.categoriaAccesorio.findUnique
        .mockResolvedValueOnce({ id: 1, nombre: 'Fundas' } as any)
        .mockResolvedValueOnce(null);

      prisma.categoriaAccesorio.update.mockResolvedValue({
        id: 1,
        nombre: 'Fundas y Cases',
        descripcion: 'Protección general',
        _count: { accesorios: 3 },
      } as any);

      const res = await service.updateCategoria(1, {
        nombre: 'Fundas y Cases',
        descripcion: 'Protección general',
      });

      expect(res.nombre).toBe('Fundas y Cases');
    });
  });

  describe('deleteCategoria', () => {
    it('debe lanzar NotFoundException si la categoría a eliminar no existe', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue(null);

      await expect(service.deleteCategoria(999)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si la categoría tiene accesorios asociados', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Fundas',
        _count: { accesorios: 5 },
      } as any);

      await expect(service.deleteCategoria(1)).rejects.toThrow(BadRequestException);
    });

    it('debe eliminar la categoría exitosamente si no tiene accesorios asociados', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue({
        id: 2,
        nombre: 'Obsoletos',
        _count: { accesorios: 0 },
      } as any);
      prisma.categoriaAccesorio.delete.mockResolvedValue({ id: 2 } as any);

      const res = await service.deleteCategoria(2);
      expect(res.message).toContain('eliminada exitosamente');
      expect(prisma.categoriaAccesorio.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    });
  });

  describe('createAccesorio', () => {
    it('debe lanzar NotFoundException si la categoría no existe', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue(null);

      await expect(
        service.createAccesorio({ categoriaId: 999, nombre: 'Funda Pro' })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe crear el accesorio exitosamente con descripcion', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue({ id: 1 } as any);
      prisma.accesorio.create.mockResolvedValue({
        id: 10,
        nombre: 'Funda Pro',
        descripcion: 'Protección reforzada',
        categoriaId: 1,
      } as any);

      const res = await service.createAccesorio({
        categoriaId: 1,
        nombre: 'Funda Pro',
        descripcion: 'Protección reforzada',
      });
      expect(res.id).toBe(10);
      expect(prisma.accesorio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombre: 'Funda Pro',
            descripcion: 'Protección reforzada',
            categoriaId: 1,
          }),
        }),
      );
    });
  });

  describe('updateAccesorio', () => {
    it('debe lanzar NotFoundException si el accesorio no existe', async () => {
      prisma.accesorio.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAccesorio(999, { nombre: 'Nuevo Nombre' })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar NotFoundException si la nueva categoría no existe', async () => {
      prisma.accesorio.findUnique.mockResolvedValue({ id: 1, nombre: 'Funda' } as any);
      prisma.categoriaAccesorio.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAccesorio(1, { categoriaId: 888 })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe actualizar el accesorio exitosamente', async () => {
      prisma.accesorio.findUnique.mockResolvedValue({ id: 1, nombre: 'Funda' } as any);
      prisma.accesorio.update.mockResolvedValue({
        id: 1,
        nombre: 'Funda MagSafe',
        descripcion: 'Con imán',
      } as any);

      const res = await service.updateAccesorio(1, {
        nombre: 'Funda MagSafe',
        descripcion: 'Con imán',
      });
      expect(res.nombre).toBe('Funda MagSafe');
      expect(prisma.accesorio.update).toHaveBeenCalled();
    });
  });

  describe('deleteAccesorio', () => {
    it('debe lanzar NotFoundException si el accesorio a eliminar no existe', async () => {
      prisma.accesorio.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccesorio(999)).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar BadRequestException si el accesorio tiene lotes de inventario asociados', async () => {
      prisma.accesorio.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Funda iPhone 13',
        _count: { lotes: 3 },
      } as any);

      await expect(service.deleteAccesorio(1)).rejects.toThrow(BadRequestException);
    });

    it('debe eliminar el accesorio exitosamente si tiene 0 lotes asociados', async () => {
      prisma.accesorio.findUnique.mockResolvedValue({
        id: 10,
        nombre: 'Accesorio Sin Stock',
        _count: { lotes: 0 },
      } as any);
      prisma.accesorio.delete.mockResolvedValue({ id: 10 } as any);

      const res = await service.deleteAccesorio(10);
      expect(res.id).toBe(10);
      expect(prisma.accesorio.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    });
  });

  describe('findAll', () => {
    const lotesMock = [
      {
        id: 1,
        nombreDiferenciador: 'Transparente',
        costoUnitarioBs: 25,
        precioVentaBs: 50,
        stockActual: 10,
      },
    ];

    it('debe mantener costoUnitarioBs en los lotes si el usuario es ADMIN', async () => {
      prisma.accesorio.findMany.mockResolvedValue([
        { id: 1, nombre: 'Funda iPhone 15', lotes: [...lotesMock] },
      ] as any);

      const res = await service.findAll(undefined, undefined, 'ADMIN');
      expect(res[0].lotes[0].costoUnitarioBs).toBe(25);
    });

    it('debe purgar costoUnitarioBs en los lotes si el usuario es VENDEDOR (CENTRALPHONE-CONF-002)', async () => {
      prisma.accesorio.findMany.mockResolvedValue([
        { id: 1, nombre: 'Funda iPhone 15', lotes: [{ ...lotesMock[0] }] },
      ] as any);

      const res = await service.findAll(undefined, undefined, 'VENDEDOR');
      expect((res[0].lotes[0] as any).costoUnitarioBs).toBeUndefined();
      expect(res[0].lotes[0].precioVentaBs).toBe(50);
    });
  });

  describe('findOne', () => {
    it('debe lanzar NotFoundException si el accesorio no existe', async () => {
      prisma.accesorio.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar el accesorio encontrado con costoUnitarioBs si es ADMIN', async () => {
      prisma.accesorio.findUnique.mockResolvedValue({
        id: 5,
        nombre: 'MagSafe',
        lotes: [
          { id: 1, nombreDiferenciador: 'OEM', costoUnitarioBs: 40, precioVentaBs: 90 },
        ],
      } as any);

      const res = await service.findOne(5, 'ADMIN');
      expect(res.id).toBe(5);
      expect(res.lotes[0].costoUnitarioBs).toBe(40);
    });

    it('debe purgar costoUnitarioBs en los lotes si quien consulta es VENDEDOR (CENTRALPHONE-CONF-002)', async () => {
      prisma.accesorio.findUnique.mockResolvedValue({
        id: 5,
        nombre: 'MagSafe',
        lotes: [
          { id: 1, nombreDiferenciador: 'OEM', costoUnitarioBs: 40, precioVentaBs: 90 },
        ],
      } as any);

      const res = await service.findOne(5, 'VENDEDOR');
      expect(res.id).toBe(5);
      expect((res.lotes[0] as any).costoUnitarioBs).toBeUndefined();
      expect(res.lotes[0].precioVentaBs).toBe(90);
    });
  });

  describe('findLotes', () => {
    it('debe retornar lotes paginados con metadatos e incluir costoUnitarioBs si el rol es ADMIN', async () => {
      const mockLotes = [
        {
          id: 1,
          nombreDiferenciador: 'Silicona Simple',
          costoUnitarioBs: 25,
          precioVentaBs: 60,
          stockActual: 10,
          sucursal: { id: 1, nombre: 'Central' },
          accesorio: { id: 1, nombre: 'Funda iPhone 13', categoria: { id: 1, nombre: 'Fundas' } },
        },
      ];
      prisma.loteAccesorio.findMany.mockResolvedValue(mockLotes as any);
      prisma.loteAccesorio.count.mockResolvedValue(1);

      const res = await service.findLotes({ page: 1, limit: 10 }, 'ADMIN');

      expect(res.data).toHaveLength(1);
      expect(res.data[0].costoUnitarioBs).toBe(25);
      expect(res.meta.total).toBe(1);
      expect(res.meta.page).toBe(1);
      expect(res.meta.limit).toBe(10);
      expect(res.meta.totalPages).toBe(1);
      expect(res.meta.hasNextPage).toBe(false);
      expect(res.meta.hasPrevPage).toBe(false);
    });

    it('debe purgar costoUnitarioBs de los lotes si el rol es VENDEDOR (CENTRALPHONE-CONF-001)', async () => {
      const mockLotes = [
        {
          id: 1,
          nombreDiferenciador: 'Silicona Simple',
          costoUnitarioBs: 25,
          precioVentaBs: 60,
          stockActual: 10,
          sucursal: { id: 1, nombre: 'Central' },
          accesorio: { id: 1, nombre: 'Funda iPhone 13', categoria: { id: 1, nombre: 'Fundas' } },
        },
      ];
      prisma.loteAccesorio.findMany.mockResolvedValue(mockLotes as any);
      prisma.loteAccesorio.count.mockResolvedValue(1);

      const res = await service.findLotes({ page: 1, limit: 10 }, 'VENDEDOR');

      expect(res.data).toHaveLength(1);
      expect(res.data[0].costoUnitarioBs).toBeUndefined();
      expect(res.data[0].precioVentaBs).toBe(60);
    });

    it('debe aplicar filtros por sucursal, categoría, búsqueda y stock', async () => {
      prisma.loteAccesorio.findMany.mockResolvedValue([]);
      prisma.loteAccesorio.count.mockResolvedValue(0);

      await service.findLotes(
        {
          sucursalId: 2,
          categoriaId: 1,
          stock: 'EN_STOCK',
          busqueda: 'Silicona',
        },
        'ADMIN'
      );

      expect(prisma.loteAccesorio.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            activo: true,
            sucursalId: 2,
            stockActual: { gt: 0 },
            accesorio: { categoriaId: 1 },
            OR: expect.any(Array),
          }),
        })
      );
    });
  });
});
