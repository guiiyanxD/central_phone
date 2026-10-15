import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.proveedor.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { notasIngreso: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id },
      include: {
        notasIngreso: {
          orderBy: { fechaIngreso: 'desc' },
          take: 10,
          include: {
            sucursal: { select: { id: true, nombre: true } },
          },
        },
      },
    });

    if (!proveedor) {
      throw new NotFoundException(`El proveedor con ID ${id} no existe.`);
    }

    return proveedor;
  }

  async create(createProveedorDto: CreateProveedorDto) {
    return this.prisma.proveedor.create({
      data: {
        nombre: createProveedorDto.nombre.trim(),
        telefono: createProveedorDto.telefono,
        contactoReferencia: createProveedorDto.contactoReferencia,
      },
    });
  }

  async update(id: number, updateProveedorDto: UpdateProveedorDto) {
    await this.findOne(id);
    return this.prisma.proveedor.update({
      where: { id },
      data: updateProveedorDto,
    });
  }
}
