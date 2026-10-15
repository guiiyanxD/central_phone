import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { CreateAccesorioDto } from './dto/create-accesorio.dto';

@Injectable()
export class AccesoriosService {
  constructor(private readonly prisma: PrismaService) {}

  // --- CATEGORÍAS ---
  async findAllCategorias() {
    return this.prisma.categoriaAccesorio.findMany({
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: { accesorios: true },
        },
      },
    });
  }

  async createCategoria(dto: CreateCategoriaDto) {
    const existing = await this.prisma.categoriaAccesorio.findUnique({
      where: { nombre: dto.nombre.trim() },
    });

    if (existing) {
      throw new ConflictException(`La categoría '${dto.nombre}' ya existe.`);
    }

    return this.prisma.categoriaAccesorio.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion,
      },
    });
  }

  // --- ACCESORIOS BASE & LOTES ---
  async findAll(categoriaId?: number, sucursalId?: number) {
    return this.prisma.accesorio.findMany({
      where: categoriaId ? { categoriaId } : {},
      orderBy: { nombre: 'asc' },
      include: {
        categoria: {
          select: { id: true, nombre: true },
        },
        lotes: {
          where: {
            activo: true,
            ...(sucursalId ? { sucursalId } : {}),
          },
          include: {
            sucursal: {
              select: { id: true, nombre: true },
            },
          },
          orderBy: { fechaIngreso: 'desc' },
        },
      },
    });
  }

  async findOne(id: number) {
    const accesorio = await this.prisma.accesorio.findUnique({
      where: { id },
      include: {
        categoria: true,
        lotes: {
          include: {
            sucursal: {
              select: { id: true, nombre: true },
            },
            notaIngreso: {
              select: {
                id: true,
                fechaIngreso: true,
                numeroComprobante: true,
                proveedor: { select: { id: true, nombre: true } },
              },
            },
          },
        },
      },
    });

    if (!accesorio) {
      throw new NotFoundException(`El accesorio con ID ${id} no fue encontrado.`);
    }

    return accesorio;
  }

  async createAccesorio(dto: CreateAccesorioDto) {
    const categoria = await this.prisma.categoriaAccesorio.findUnique({
      where: { id: dto.categoriaId },
    });

    if (!categoria) {
      throw new NotFoundException(`La categoría con ID ${dto.categoriaId} no existe.`);
    }

    return this.prisma.accesorio.create({
      data: {
        nombre: dto.nombre.trim(),
        categoriaId: dto.categoriaId,
      },
      include: {
        categoria: true,
      },
    });
  }
}
