import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { AddVarianteDto } from './dto/add-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';
import { QueryDispositivosDto } from './dto/query-dispositivos.dto';
import { TipoDispositivo } from '@prisma/client';
import { roundMoney } from '../common/utils/money.util';

@Injectable()
export class ModelosService {
  private readonly logger = new Logger('ModelosService');

  constructor(private readonly prisma: PrismaService) {}

  // Creación atómica de modelo con al menos una variante obligatoria
  async create(createModeloDto: CreateModeloDto) {
    const { nombreModelo, marca = 'Apple', descripcion, variantes } = createModeloDto;

    if (!variantes || variantes.length === 0) {
      throw new BadRequestException(
        'Regla inmutable de negocio: Todo modelo debe crearse obligatoriamente con al menos una variante.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const modelo = await tx.modeloDispositivo.create({
        data: {
          nombreModelo,
          tipo: createModeloDto.tipo || TipoDispositivo.IPHONE,
          marca,
          descripcion,
        },
      });

      const variantesData = variantes.map((v) => ({
        modeloId: modelo.id,
        color: v.color.trim(),
        capacidadGb: v.capacidadGb,
        tipoSim: v.tipoSim || 'SIM Físico',
      }));

      await tx.varianteDispositivo.createMany({
        data: variantesData,
        skipDuplicates: true,
      });

      return tx.modeloDispositivo.findUnique({
        where: { id: modelo.id },
        include: {
          variantes: true,
        },
      });
    });
  }

  async findAll() {
    return this.prisma.modeloDispositivo.findMany({
      orderBy: { nombreModelo: 'asc' },
      include: {
        variantes: {
          orderBy: [{ capacidadGb: 'asc' }, { color: 'asc' }],
          include: {
            _count: {
              select: {
                dispositivos: {
                  where: { estadoInventario: 'DISPONIBLE' },
                },
              },
            },
          },
        },
        _count: {
          select: {
            variantes: true,
          },
        },
      },
    });
  }

  async findDispositivos(
    queryOrSucursalId?: QueryDispositivosDto | number,
    estadoParam?: string,
    busquedaParam?: string,
    userRoleParam?: string,
  ) {
    let query: QueryDispositivosDto = {};
    let userRole = userRoleParam;

    if (typeof queryOrSucursalId === 'object' && queryOrSucursalId !== null) {
      query = queryOrSucursalId;
      userRole = estadoParam; // cuando se invoca como (dto, userRole)
    } else {
      query = {
        sucursalId: typeof queryOrSucursalId === 'number' ? queryOrSucursalId : undefined,
        estado: estadoParam,
        busqueda: busquedaParam,
      };
      userRole = userRoleParam;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    // 1. Sucursal
    if (query.sucursalId) {
      where.sucursalId = Number(query.sucursalId);
    }

    // 2. Tipo de Dispositivo (IPHONE, MAC, IPAD, WATCH, AIRPODS, OTRO)
    if (query.tipo && query.tipo !== 'TODOS') {
      where.variante = {
        ...(where.variante || {}),
        modelo: {
          ...(where.variante?.modelo || {}),
          tipo: query.tipo as TipoDispositivo,
        },
      };
    }

    // 3. Estado de Inventario
    if (query.estado && query.estado !== 'TODOS') {
      where.estadoInventario = query.estado;
    }

    // 3. Condición (NUEVO, USADO, OPEN_BOX)
    if (query.condicion && query.condicion !== 'TODAS') {
      where.condicion = query.condicion;
    }

    // 4. Proveedor (a través de notaIngreso)
    if (query.proveedorId && Number(query.proveedorId) > 0) {
      where.notaIngreso = {
        ...(where.notaIngreso || {}),
        proveedorId: Number(query.proveedorId),
      };
    }

    // 5. Rango de fechas de recepción / ingreso
    if (query.fechaDesde || query.fechaHasta) {
      where.notaIngreso = {
        ...(where.notaIngreso || {}),
        fechaIngreso: {},
      };
      if (query.fechaDesde) {
        const [y, m, d] = query.fechaDesde.split('-').map(Number);
        where.notaIngreso.fechaIngreso.gte = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (query.fechaHasta) {
        const [y, m, d] = query.fechaHasta.split('-').map(Number);
        where.notaIngreso.fechaIngreso.lte = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
    }

    const andConditions: any[] = [];

    // 6. Búsqueda específica por IMEI o Serie
    if (query.imei && query.imei.trim()) {
      const qImei = query.imei.trim();
      andConditions.push({
        OR: [
          { imei1: { contains: qImei, mode: 'insensitive' } },
          { imei2: { contains: qImei, mode: 'insensitive' } },
          { numeroSerie: { contains: qImei, mode: 'insensitive' } },
        ],
      });
    }

    // 7. Búsqueda específica por Nombre de Producto (Modelo)
    if (query.nombreProducto && query.nombreProducto.trim()) {
      const qMod = query.nombreProducto.trim();
      andConditions.push({
        variante: {
          modelo: {
            nombreModelo: { contains: qMod, mode: 'insensitive' },
          },
        },
      });
    }

    // 8. Búsqueda general 'busqueda'
    if (query.busqueda && query.busqueda.trim()) {
      const q = query.busqueda.trim();
      andConditions.push({
        OR: [
          { imei1: { contains: q, mode: 'insensitive' } },
          { imei2: { contains: q, mode: 'insensitive' } },
          { numeroSerie: { contains: q, mode: 'insensitive' } },
          {
            variante: {
              modelo: {
                nombreModelo: { contains: q, mode: 'insensitive' },
              },
            },
          },
          {
            variante: {
              color: { contains: q, mode: 'insensitive' },
            },
          },
          {
            notaIngreso: {
              proveedor: {
                nombre: { contains: q, mode: 'insensitive' },
              },
            },
          },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [dispositivos, total] = await Promise.all([
      this.prisma.dispositivo.findMany({
        where,
        include: {
          variante: {
            include: {
              modelo: true,
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
      this.prisma.dispositivo.count({ where }),
    ]);

    // Confidencialidad de costos mayoristas (Regla Inmutable RBAC Financiero CENTRALPHONE-CONF-001)
    const safeData = dispositivos.map((d) => {
      if (userRole && userRole !== 'ADMIN') {
        const { costoBs, costoUsd, ...safe } = d;
        return safe;
      }
      return d;
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

  // US18: Línea de vida y trazabilidad completa por IMEI o Número de Serie
  async getLineaVidaImei(imeiOrSerie: string, userRole?: string) {
    if (!imeiOrSerie || imeiOrSerie.trim().length === 0) {
      throw new BadRequestException('El número de IMEI o de Serie es obligatorio para consultar la línea de vida.');
    }
    const cleanId = imeiOrSerie.trim();

    const dispositivo = await this.prisma.dispositivo.findFirst({
      where: {
        OR: [
          { imei1: cleanId },
          { imei2: cleanId },
          { numeroSerie: cleanId },
        ],
      },
      include: {
        variante: {
          include: { modelo: true },
        },
        sucursal: {
          select: { id: true, nombre: true, ciudad: true },
        },
        notaIngreso: {
          include: {
            proveedor: { select: { id: true, nombre: true, contactoReferencia: true, telefono: true } },
            usuario: { select: { id: true, nombre: true } },
            sucursal: { select: { id: true, nombre: true } },
          },
        },
        detalleVentas: {
          include: {
            venta: {
              include: {
                cliente: true,
                usuario: { select: { id: true, nombre: true } },
                anuladoPor: { select: { id: true, nombre: true } },
                metodoPago: true,
                caja: {
                  include: {
                    sucursal: { select: { id: true, nombre: true } },
                  },
                },
              },
            },
          },
          orderBy: { id: 'desc' },
        },
      },
    });

    if (!dispositivo) {
      throw new NotFoundException(`No se encontró ningún dispositivo registrado con el identificador "${cleanId}".`);
    }

    const detalleVenta = dispositivo.detalleVentas[0] || null;
    const venta = detalleVenta?.venta || null;
    const esAdmin = userRole === 'ADMIN';

    let diasDesdeVenta: number | null = null;
    let garantiaVigente: boolean | null = null;
    if (venta && venta.estado === 'COMPLETADA') {
      const ahora = new Date();
      const fechaVenta = new Date(venta.fechaHora);
      const diffTime = Math.abs(ahora.getTime() - fechaVenta.getTime());
      diasDesdeVenta = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      garantiaVigente = diasDesdeVenta <= 365;
    }

    return {
      dispositivo: {
        id: dispositivo.id,
        imei1: dispositivo.imei1,
        imei2: dispositivo.imei2,
        numeroSerie: dispositivo.numeroSerie,
        condicion: dispositivo.condicion,
        estadoInventario: dispositivo.estadoInventario,
        precioVentaSugeridoBs: Number(dispositivo.precioVentaSugeridoBs),
        costoBs: esAdmin ? Number(dispositivo.costoBs) : undefined,
        costoUsd: esAdmin ? Number(dispositivo.costoUsd) : undefined,
        modelo: dispositivo.variante.modelo.nombreModelo,
        marca: dispositivo.variante.modelo.marca,
        color: dispositivo.variante.color,
        capacidadGb: dispositivo.variante.capacidadGb,
        tipoSim: dispositivo.variante.tipoSim,
        sucursalActual: dispositivo.sucursal,
      },
      origen: {
        notaIngresoId: dispositivo.notaIngreso.id,
        proveedor: dispositivo.notaIngreso.proveedor?.nombre || 'Proveedor Mayorista',
        proveedorTelefono: dispositivo.notaIngreso.proveedor?.telefono || null,
        fechaIngreso: dispositivo.notaIngreso.fechaIngreso,
        numeroComprobante: dispositivo.notaIngreso.numeroComprobante,
        sucursalIngreso: dispositivo.notaIngreso.sucursal?.nombre,
        usuarioReceptor: dispositivo.notaIngreso.usuario?.nombre,
        costoUnitarioBs: esAdmin ? Number(dispositivo.costoBs) : undefined,
        costoUnitarioUsd: esAdmin ? Number(dispositivo.costoUsd) : undefined,
      },
      venta: venta
        ? {
            id: venta.id,
            ticketReferencia: venta.comprobanteReferencia,
            fechaVenta: venta.fechaHora,
            estadoVenta: venta.estado,
            motivoAnulacion: venta.motivoAnulacion,
            fechaAnulacion: venta.fechaAnulacion,
            anuladoPor: venta.anuladoPor?.nombre || null,
            vendedor: venta.usuario?.nombre || 'Vendedor',
            cliente: venta.cliente
              ? {
                  id: venta.cliente.id,
                  nombre: venta.cliente.nombreCompleto,
                  telefono: venta.cliente.telefono,
                  ciNit: venta.cliente.ciNit,
                }
              : null,
            metodoPago: venta.metodoPago.nombre,
            precioVentaCobradoBs: Number(detalleVenta.precioUnitarioBs),
            costoUnitarioBs: esAdmin ? Number(detalleVenta.costoUnitarioBs) : undefined,
            gananciaBs: esAdmin
              ? roundMoney(Number(detalleVenta.precioUnitarioBs) - Number(detalleVenta.costoUnitarioBs))
              : undefined,
            sucursalVenta: venta.caja?.sucursal?.nombre || dispositivo.sucursal.nombre,
          }
        : null,
      garantia: {
        estadoInventario: dispositivo.estadoInventario,
        diasDesdeVenta,
        garantiaVigente,
        periodoMeses: 12,
      },
    };
  }

  async findOne(id: number) {
    const modelo = await this.prisma.modeloDispositivo.findUnique({
      where: { id },
      include: {
        variantes: {
          include: {
            dispositivos: {
              where: { estadoInventario: 'DISPONIBLE' },
              include: {
                sucursal: {
                  select: { id: true, nombre: true },
                },
              },
            },
          },
        },
      },
    });

    if (!modelo) {
      throw new NotFoundException(`El modelo con ID ${id} no existe.`);
    }

    return modelo;
  }

  async addVariante(modeloId: number, dto: AddVarianteDto) {
    const modelo = await this.prisma.modeloDispositivo.findUnique({
      where: { id: modeloId },
    });

    if (!modelo) {
      throw new NotFoundException(`El modelo con ID ${modeloId} no existe.`);
    }

    const tipoSim = dto.tipoSim || 'SIM Físico';

    const existing = await this.prisma.varianteDispositivo.findUnique({
      where: {
        modeloId_color_capacidadGb_tipoSim: {
          modeloId,
          color: dto.color.trim(),
          capacidadGb: dto.capacidadGb,
          tipoSim,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `La variante (${dto.color}, ${dto.capacidadGb}GB, ${tipoSim}) ya existe para este modelo.`,
      );
    }

    return this.prisma.varianteDispositivo.create({
      data: {
        modeloId,
        color: dto.color.trim(),
        capacidadGb: dto.capacidadGb,
        tipoSim,
      },
    });
  }

  // Actualizar una variante existente (Exclusivo ADMIN)
  async updateVariante(id: number, dto: UpdateVarianteDto) {
    const variante = await this.prisma.varianteDispositivo.findUnique({
      where: { id },
    });

    if (!variante) {
      throw new NotFoundException(`La variante con ID ${id} no existe.`);
    }

    const color = dto.color !== undefined ? dto.color.trim() : variante.color;
    const capacidadGb = dto.capacidadGb !== undefined ? dto.capacidadGb : variante.capacidadGb;
    const tipoSim = dto.tipoSim !== undefined ? dto.tipoSim : variante.tipoSim;

    // Verificar si ya existe otra variante con la misma combinación exacta en este modelo
    const existing = await this.prisma.varianteDispositivo.findFirst({
      where: {
        modeloId: variante.modeloId,
        color,
        capacidadGb,
        tipoSim,
        id: { not: id },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe otra variante con la combinación (${color}, ${capacidadGb}GB, ${tipoSim}) para este modelo.`,
      );
    }

    return this.prisma.varianteDispositivo.update({
      where: { id },
      data: {
        color,
        capacidadGb,
        tipoSim,
      },
    });
  }

  // Eliminar una variante existente (Exclusivo ADMIN con doble validación de integridad)
  async deleteVariante(id: number) {
    const variante = await this.prisma.varianteDispositivo.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            dispositivos: true,
          },
        },
      },
    });

    if (!variante) {
      throw new NotFoundException(`La variante con ID ${id} no existe.`);
    }

    // 1. Integridad referencial: Bloquear si tiene equipos físicos asociados
    if (variante._count.dispositivos > 0) {
      throw new ConflictException(
        `No se puede eliminar la variante porque tiene ${variante._count.dispositivos} equipo(s) asociado(s) en inventario o ventas.`,
      );
    }

    // 2. Invariante de negocio: Todo modelo debe tener al menos una variante
    const totalVariantesModelo = await this.prisma.varianteDispositivo.count({
      where: { modeloId: variante.modeloId },
    });

    if (totalVariantesModelo <= 1) {
      throw new BadRequestException(
        'Regla inmutable de negocio: No se puede eliminar la única variante del modelo. Todo modelo debe contar con al menos una variante.',
      );
    }

    await this.prisma.varianteDispositivo.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Variante eliminada exitosamente.',
      varianteId: id,
    };
  }
}
