import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';

describe('ProveedoresService', () => {
  let service: ProveedoresService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProveedoresService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProveedoresService>(ProveedoresService);
  });

  describe('findAll', () => {
    it('debe listar solo proveedores activos por defecto', async () => {
      prisma.proveedor.findMany.mockResolvedValue([
        { id: 1, nombre: 'Roberto', empresa: 'Miami Wholesale', activo: true },
      ] as any);

      const res = await service.findAll();
      expect(res).toHaveLength(1);
      expect(res[0].nombre).toBe('Roberto');
      expect(prisma.proveedor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activo: true },
        }),
      );
    });

    it('debe incluir inactivos cuando includeInactivos es true', async () => {
      prisma.proveedor.findMany.mockResolvedValue([
        { id: 1, nombre: 'Roberto', activo: true },
        { id: 2, nombre: 'Javier', activo: false },
      ] as any);

      const res = await service.findAll({ includeInactivos: true });
      expect(res).toHaveLength(2);
      expect(prisma.proveedor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('debe filtrar por término de búsqueda en varios campos', async () => {
      prisma.proveedor.findMany.mockResolvedValue([
        { id: 1, nombre: 'Roberto', empresa: 'Miami Wholesale' },
      ] as any);

      const res = await service.findAll({ search: 'Miami' });
      expect(res).toHaveLength(1);
      expect(prisma.proveedor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            activo: true,
            OR: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('debe retornar el proveedor encontrado', async () => {
      prisma.proveedor.findUnique.mockResolvedValue({
        id: 2,
        nombre: 'Javier',
        empresa: 'Distribuidora Cell',
      } as any);

      const res = await service.findOne(2);
      expect(res.id).toBe(2);
      expect(res.empresa).toBe('Distribuidora Cell');
    });

    it('debe lanzar NotFoundException si el proveedor no existe', async () => {
      prisma.proveedor.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe crear un proveedor exitosamente con todos sus campos y activo=true', async () => {
      prisma.proveedor.create.mockResolvedValue({
        id: 5,
        nombre: 'Gabriela',
        apellido: 'Vargas',
        empresa: 'Importadora Gaby',
        telefono: '77788990',
        activo: true,
      } as any);

      const res = await service.create({
        nombre: 'Gabriela',
        apellido: 'Vargas',
        empresa: 'Importadora Gaby',
        telefono: '77788990',
      });

      expect(res.id).toBe(5);
      expect(res.empresa).toBe('Importadora Gaby');
      expect(prisma.proveedor.create).toHaveBeenCalledWith({
        data: {
          nombre: 'Gabriela',
          apellido: 'Vargas',
          empresa: 'Importadora Gaby',
          telefono: '77788990',
          contactoReferencia: null,
          activo: true,
        },
      });
    });
  });

  describe('update', () => {
    it('debe actualizar un proveedor existente', async () => {
      prisma.proveedor.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Beby',
        empresa: 'Beby Corp',
      } as any);
      prisma.proveedor.update.mockResolvedValue({
        id: 1,
        nombre: 'Beby Actualizado',
        empresa: 'Beby Wholesale SRL',
      } as any);

      const res = await service.update(1, {
        nombre: 'Beby Actualizado',
        empresa: 'Beby Wholesale SRL',
      });

      expect(res.nombre).toBe('Beby Actualizado');
      expect(res.empresa).toBe('Beby Wholesale SRL');
    });
  });

  describe('toggleStatus', () => {
    it('debe alternar el estado activo de true a false', async () => {
      prisma.proveedor.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Beby',
        activo: true,
      } as any);
      prisma.proveedor.update.mockResolvedValue({
        id: 1,
        nombre: 'Beby',
        activo: false,
      } as any);

      const res = await service.toggleStatus(1);
      expect(res.activo).toBe(false);
      expect(prisma.proveedor.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { activo: false },
      });
    });
  });
});
