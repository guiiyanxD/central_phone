import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactivas = false) {
    return this.prisma.sucursal.findMany({
      where: includeInactivas ? {} : { activo: true },
      orderBy: { creadoEn: 'asc' },
      include: {
        _count: {
          select: {
            usuarios: true,
            dispositivos: true,
            lotesAccesorio: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const sucursal = await this.prisma.sucursal.findUnique({
      where: { id },
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            activo: true,
          },
        },
      },
    });

    if (!sucursal) {
      throw new NotFoundException(`La sucursal con ID ${id} no fue encontrada.`);
    }

    return sucursal;
  }

  async create(createSucursalDto: CreateSucursalDto) {
    return this.prisma.sucursal.create({
      data: createSucursalDto,
    });
  }

  async update(id: number, updateSucursalDto: UpdateSucursalDto) {
    await this.findOne(id);
    return this.prisma.sucursal.update({
      where: { id },
      data: updateSucursalDto,
    });
  }
}
