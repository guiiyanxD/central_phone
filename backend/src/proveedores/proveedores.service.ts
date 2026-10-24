import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { QueryProveedorDto } from './dto/query-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query?: QueryProveedorDto) {
    const where: Prisma.ProveedorWhereInput = {};

    // Por defecto, solo proveedores activos a menos que se solicite includeInactivos
    if (!query?.includeInactivos) {
      where.activo = true;
    }

    if (query?.search && query.search.trim() !== '') {
      const term = query.search.trim();
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { apellido: { contains: term, mode: 'insensitive' } },
        { empresa: { contains: term, mode: 'insensitive' } },
        { telefono: { contains: term, mode: 'insensitive' } },
        { contactoReferencia: { contains: term, mode: 'insensitive' } },
      ];
    }

    return this.prisma.proveedor.findMany({
      where,
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
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
        _count: {
          select: { notasIngreso: true },
        },
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
        apellido: createProveedorDto.apellido?.trim() || null,
        empresa: createProveedorDto.empresa?.trim() || null,
        telefono: createProveedorDto.telefono?.trim() || null,
        contactoReferencia: createProveedorDto.contactoReferencia?.trim() || null,
        activo: true,
      },
    });
  }

  async update(id: number, updateProveedorDto: UpdateProveedorDto) {
    await this.findOne(id);

    return this.prisma.proveedor.update({
      where: { id },
      data: {
        ...(updateProveedorDto.nombre !== undefined && {
          nombre: updateProveedorDto.nombre.trim(),
        }),
        ...(updateProveedorDto.apellido !== undefined && {
          apellido: updateProveedorDto.apellido?.trim() || null,
        }),
        ...(updateProveedorDto.empresa !== undefined && {
          empresa: updateProveedorDto.empresa?.trim() || null,
        }),
        ...(updateProveedorDto.telefono !== undefined && {
          telefono: updateProveedorDto.telefono?.trim() || null,
        }),
        ...(updateProveedorDto.contactoReferencia !== undefined && {
          contactoReferencia: updateProveedorDto.contactoReferencia?.trim() || null,
        }),
        ...(updateProveedorDto.activo !== undefined && {
          activo: updateProveedorDto.activo,
        }),
      },
    });
  }

  async toggleStatus(id: number) {
    const proveedor = await this.findOne(id);

    return this.prisma.proveedor.update({
      where: { id },
      data: { activo: !proveedor.activo },
    });
  }
}
