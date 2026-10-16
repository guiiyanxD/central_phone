import { Test, TestingModule } from '@nestjs/testing';
import { SucursalesService } from './sucursales.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { NotFoundException } from '@nestjs/common';

describe('SucursalesService', () => {
  let service: SucursalesService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SucursalesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SucursalesService>(SucursalesService);
  });

  it('debe listar todas las sucursales activas', async () => {
    prisma.sucursal.findMany.mockResolvedValue([{ id: 1, nombre: 'Sucursal Central', activo: true }] as any);

    const res = await service.findAll();
    expect(res).toHaveLength(1);
    expect(res[0].nombre).toBe('Sucursal Central');
  });

  it('debe lanzar NotFoundException si la sucursal no existe', async () => {
    prisma.sucursal.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('debe retornar la sucursal encontrada', async () => {
    prisma.sucursal.findUnique.mockResolvedValue({ id: 2, nombre: 'Sucursal Sur' } as any);

    const res = await service.findOne(2);
    expect(res.id).toBe(2);
  });

  it('debe crear una sucursal exitosamente', async () => {
    prisma.sucursal.create.mockResolvedValue({ id: 3, nombre: 'Sucursal El Alto' } as any);

    const res = await service.create({
      nombre: 'Sucursal El Alto',
      ciudad: 'El Alto',
      direccion: 'Av. 6 de Marzo',
      telefono: '77700000',
    });
    expect(res.id).toBe(3);
  });

  it('debe actualizar una sucursal existente', async () => {
    prisma.sucursal.findUnique.mockResolvedValue({ id: 1, nombre: 'Sucursal Central' } as any);
    prisma.sucursal.update.mockResolvedValue({ id: 1, nombre: 'Sucursal Central Renovada' } as any);

    const res = await service.update(1, { nombre: 'Sucursal Central Renovada' });
    expect(res.nombre).toBe('Sucursal Central Renovada');
  });
});
