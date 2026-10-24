import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { CreateAccesorioDto } from './dto/create-accesorio.dto';
import { UpdateAccesorioDto } from './dto/update-accesorio.dto';
import { QueryLotesDto } from './dto/query-lotes.dto';

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
  async findAll(categoriaId?: number, sucursalId?: number, userRole?: string) {
    const accesorios = await this.prisma.accesorio.findMany({
      where: categoriaId ? { categoriaId } : {},
      orderBy: { nombre: 'asc' },
      include: {
        categoria: {
          select: { id: true, nombre: true },
        },
        _count: {
          select: { lotes: true },
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

    if (userRole !== 'ADMIN') {
      accesorios.forEach((acc) => {
        acc.lotes?.forEach((lote: any) => {
          delete lote.costoUnitarioBs;
        });
      });
    }

    return accesorios;
  }

  async findOne(id: number, userRole?: string) {
    const accesorio = await this.prisma.accesorio.findUnique({
      where: { id },
      include: {
        categoria: true,
        _count: {
          select: { lotes: true },
        },
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

    if (userRole !== 'ADMIN') {
      accesorio.lotes?.forEach((lote: any) => {
        delete lote.costoUnitarioBs;
      });
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
        descripcion: dto.descripcion?.trim() || null,
        categoriaId: dto.categoriaId,
      },
      include: {
        categoria: true,
        _count: {
          select: { lotes: true },
        },
      },
    });
  }

  async updateAccesorio(id: number, dto: UpdateAccesorioDto) {
    const accesorio = await this.prisma.accesorio.findUnique({
      where: { id },
    });

    if (!accesorio) {
      throw new NotFoundException(`El accesorio con ID ${id} no fue encontrado.`);
    }

    if (dto.categoriaId !== undefined) {
      const categoria = await this.prisma.categoriaAccesorio.findUnique({
        where: { id: dto.categoriaId },
      });
      if (!categoria) {
        throw new NotFoundException(`La categoría con ID ${dto.categoriaId} no existe.`);
      }
    }

    return this.prisma.accesorio.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion?.trim() || null }),
        ...(dto.categoriaId !== undefined && { categoriaId: dto.categoriaId }),
      },
      include: {
        categoria: true,
        _count: {
          select: { lotes: true },
        },
      },
    });
  }

  async deleteAccesorio(id: number) {
    const accesorio = await this.prisma.accesorio.findUnique({
      where: { id },
      include: {
        _count: {
          select: { lotes: true },
        },
      },
    });

    if (!accesorio) {
      throw new NotFoundException(`El accesorio con ID ${id} no fue encontrado.`);
    }

    if (accesorio._count.lotes > 0) {
      throw new BadRequestException(
        `No se puede eliminar el accesorio "${accesorio.nombre}" porque tiene ${accesorio._count.lotes} lote(s) asociados en el inventario.`,
      );
    }

    return this.prisma.accesorio.delete({
      where: { id },
    });
  }

  // --- INVENTARIO DE LOTES FÍSICOS CON PAGINACIÓN Y FILTROS ---
  async findLotes(query: QueryLotesDto, userRole?: string) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      activo: true,
    };

    if (query.sucursalId && Number(query.sucursalId) > 0) {
      where.sucursalId = Number(query.sucursalId);
    }

    if (query.categoriaId && Number(query.categoriaId) > 0) {
      where.accesorio = {
        ...(where.accesorio || {}),
        categoriaId: Number(query.categoriaId),
      };
    }

    if (query.stock === 'EN_STOCK') {
      where.stockActual = { gt: 0 };
    } else if (query.stock === 'AGOTADO') {
      where.stockActual = { lte: 0 };
    }

    if (query.busqueda && query.busqueda.trim()) {
      const q = query.busqueda.trim();
      where.OR = [
        { nombreDiferenciador: { contains: q, mode: 'insensitive' } },
        {
          accesorio: {
            nombre: { contains: q, mode: 'insensitive' },
          },
        },
        {
          accesorio: {
            categoria: {
              nombre: { contains: q, mode: 'insensitive' },
            },
          },
        },
        {
          sucursal: {
            nombre: { contains: q, mode: 'insensitive' },
          },
        },
      ];
    }

    const [lotes, total] = await Promise.all([
      this.prisma.loteAccesorio.findMany({
        where,
        include: {
          accesorio: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              categoria: {
                select: { id: true, nombre: true },
              },
            },
          },
          sucursal: {
            select: { id: true, nombre: true, ciudad: true },
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
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loteAccesorio.count({ where }),
    ]);

    // Confidencialidad de costos mayoristas (Regla Inmutable RBAC Financiero CENTRALPHONE-CONF-001)
    const safeData = lotes.map((lote) => {
      if (userRole && userRole !== 'ADMIN') {
        const { costoUnitarioBs, ...safe } = lote;
        return safe;
      }
      return lote;
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: safeData,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
