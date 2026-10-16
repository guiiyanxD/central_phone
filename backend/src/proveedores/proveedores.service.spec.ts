import { Test, TestingModule } from '@nestjs/testing';
import { ProveedoresService } from './proveedores.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { NotFoundException } from '@nestjs/common';

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

  it('debe listar todos los proveedores', async () => {
    prisma.proveedor.findMany.mockResolvedValue([{ id: 1, nombre: 'Beby' }] as any);

    const res = await service.findAll();
    expect(res).toHaveLength(1);
    expect(res[0].nombre).toBe('Beby');
  });

  it('debe lanzar NotFoundException si el proveedor no existe', async () => {
    prisma.proveedor.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('debe retornar el proveedor encontrado', async () => {
    prisma.proveedor.findUnique.mockResolvedValue({ id: 2, nombre: 'Javier' } as any);

    const res = await service.findOne(2);
    expect(res.id).toBe(2);
  });

  it('debe crear un proveedor exitosamente', async () => {
    prisma.proveedor.create.mockResolvedValue({ id: 5, nombre: 'Gabriela' } as any);

    const res = await service.create({ nombre: 'Gabriela' });
    expect(res.id).toBe(5);
  });

  it('debe actualizar un proveedor existente', async () => {
    prisma.proveedor.findUnique.mockResolvedValue({ id: 1, nombre: 'Beby' } as any);
    prisma.proveedor.update.mockResolvedValue({ id: 1, nombre: 'Beby Actualizado' } as any);

    const res = await service.update(1, { nombre: 'Beby Actualizado' });
    expect(res.nombre).toBe('Beby Actualizado');
  });
});
