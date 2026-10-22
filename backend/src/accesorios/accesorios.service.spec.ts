import { Test, TestingModule } from '@nestjs/testing';
import { AccesoriosService } from './accesorios.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { NotFoundException, ConflictException } from '@nestjs/common';

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

  describe('createAccesorio', () => {
    it('debe lanzar NotFoundException si la categoría no existe', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue(null);

      await expect(
        service.createAccesorio({ categoriaId: 999, nombre: 'Funda Pro' })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe crear el accesorio exitosamente', async () => {
      prisma.categoriaAccesorio.findUnique.mockResolvedValue({ id: 1 } as any);
      prisma.accesorio.create.mockResolvedValue({ id: 10, nombre: 'Funda Pro', categoriaId: 1 } as any);

      const res = await service.createAccesorio({ categoriaId: 1, nombre: 'Funda Pro' });
      expect(res.id).toBe(10);
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
});
