import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotaIngresoDto } from './dto/create-nota-ingreso.dto';
import { UpdateNotaIngresoDto } from './dto/update-nota-ingreso.dto';
import { AnularNotaIngresoDto } from './dto/anular-nota-ingreso.dto';
import { QueryNotasIngresoDto } from './dto/query-notas-ingreso.dto';
import { CondicionDispositivo, EstadoInventario, EstadoVenta, Prisma } from '@prisma/client';

@Injectable()
export class RecepcionService {
  private readonly logger = new Logger('RecepcionService');

  constructor(private readonly prisma: PrismaService) {}

  async createNotaIngreso(dto: CreateNotaIngresoDto, usuarioId: number) {
    const {
      proveedorId,
      sucursalId,
      numeroComprobante,
      observaciones,
      dispositivos = [],
      accesorios = [],
    } = dto;

    if (dispositivos.length === 0 && accesorios.length === 0) {
      throw new BadRequestException(
        'La Nota de Ingreso debe incluir al menos un dispositivo o un lote de accesorios.',
      );
    }

    // Verificar proveedor y sucursal
    const [proveedor, sucursal] = await Promise.all([
      this.prisma.proveedor.findUnique({ where: { id: proveedorId } }),
      this.prisma.sucursal.findUnique({ where: { id: sucursalId } }),
    ]);

    if (!proveedor) {
      throw new NotFoundException(`El proveedor con ID ${proveedorId} no existe.`);
    }
    if (!sucursal) {
      throw new NotFoundException(`La sucursal con ID ${sucursalId} no existe.`);
    }

    // 1. Validar duplicidad interna dentro del mismo payload de entrada
    const seriesEnPayload = new Set<string>();
    const imeisEnPayload = new Set<string>();

    for (const d of dispositivos) {
      const serie = d.numeroSerie?.trim();
      if (!serie) {
        throw new BadRequestException('Todo dispositivo debe tener un número de serie obligatorio.');
      }

      if (seriesEnPayload.has(serie)) {
        throw new ConflictException(`El número de serie '${serie}' está duplicado en la misma entrega.`);
      }
      seriesEnPayload.add(serie);

      const imei1 = d.imei1?.trim();
      if (imei1) {
        if (imeisEnPayload.has(imei1)) {
          throw new ConflictException(`El IMEI 1 '${imei1}' está duplicado en la misma entrega.`);
        }
        imeisEnPayload.add(imei1);
      }

      if (d.imei2 && d.imei2.trim().length > 0) {
        const imei2 = d.imei2.trim();
        if (imeisEnPayload.has(imei2)) {
          throw new ConflictException(`El IMEI 2 '${imei2}' está duplicado en la misma entrega.`);
        }
        imeisEnPayload.add(imei2);
      }
    }

    for (const a of accesorios) {
      if (!a.accesorioId && !a.nuevoAccesorio) {
        throw new BadRequestException(
          `El lote de accesorio '${a.nombreDiferenciador}' debe tener un accesorioId o un nuevoAccesorio definido.`,
        );
      }
    }

    // 2. Transacción Atómica ACID para verificar unicidad contra DB y persistir
    return this.prisma.$transaction(async (tx) => {
      // Validar contra la base de datos
      for (const d of dispositivos) {
        const serie = d.numeroSerie.trim();
        const imei1 = d.imei1?.trim();

        const serieExistente = await tx.dispositivo.findUnique({
          where: { numeroSerie: serie },
        });
        if (serieExistente) {
          throw new ConflictException(`El número de serie '${serie}' ya se encuentra registrado en el sistema.`);
        }

        if (imei1) {
          const imei1Existente = await tx.dispositivo.findFirst({
            where: {
              OR: [{ imei1 }, { imei2: imei1 }],
            },
          });
          if (imei1Existente) {
            throw new ConflictException(`El IMEI 1 '${imei1}' ya se encuentra registrado en el sistema.`);
          }
        }

        if (d.imei2 && d.imei2.trim().length > 0) {
          const imei2Clean = d.imei2.trim();
          const imei2Existente = await tx.dispositivo.findFirst({
            where: {
              OR: [{ imei1: imei2Clean }, { imei2: imei2Clean }],
            },
          });
          if (imei2Existente) {
            throw new ConflictException(`El IMEI 2 '${d.imei2}' ya se encuentra registrado en el sistema.`);
          }
        }
      }

      // 3. Resolver variantes (soportando US09: creación in-line "al vuelo")
      const dispositivosParaCrear: Array<{
        varianteId: number;
        numeroSerie: string;
        imei1: string | null;
        imei2?: string | null;
        condicion: CondicionDispositivo;
        costoBs: number;
        costoUsd: number;
        precioVentaSugeridoBs: number;
      }> = [];

      for (const d of dispositivos) {
        let resolvedVarianteId = d.varianteId;
        let modeloTipo: string = 'IPHONE';
        let nombreModelo = 'Dispositivo';

        // Si se envió la creación rápida in-line
        if (d.nuevaVariante) {
          const { modeloId, color, capacidadGb, tipoSim = 'SIM Físico' } = d.nuevaVariante;
          const modeloFound = await tx.modeloDispositivo.findUnique({ where: { id: modeloId } });
          if (modeloFound) {
            modeloTipo = modeloFound.tipo;
            nombreModelo = modeloFound.nombreModelo;
          }

          let variante = await tx.varianteDispositivo.findUnique({
            where: {
              modeloId_color_capacidadGb_tipoSim: {
                modeloId,
                color: color.trim(),
                capacidadGb,
                tipoSim,
              },
            },
          });

          if (!variante) {
            variante = await tx.varianteDispositivo.create({
              data: {
                modeloId,
                color: color.trim(),
                capacidadGb,
                tipoSim,
              },
            });
          }
          resolvedVarianteId = variante.id;
        } else if (resolvedVarianteId) {
          const varianteFound = await tx.varianteDispositivo.findUnique({
            where: { id: resolvedVarianteId },
            include: { modelo: true },
          });
          if (varianteFound?.modelo) {
            modeloTipo = varianteFound.modelo.tipo;
            nombreModelo = varianteFound.modelo.nombreModelo;
          }
        }

        if (!resolvedVarianteId) {
          throw new BadRequestException('Cada dispositivo debe especificar un varianteId o una nuevaVariante.');
        }

        const imei1Clean = d.imei1?.trim() || null;
        if (modeloTipo === 'IPHONE' && !imei1Clean) {
          throw new BadRequestException(
            `El dispositivo '${nombreModelo}' es de tipo IPHONE y requiere obligatoriamente un IMEI 1 válido.`,
          );
        }

        const precioSugerido =
          d.precioVentaSugeridoBs !== undefined && d.precioVentaSugeridoBs !== null
            ? Number(d.precioVentaSugeridoBs)
            : Math.round(Number(d.costoBs) * 1.15);

        dispositivosParaCrear.push({
          varianteId: resolvedVarianteId,
          numeroSerie: d.numeroSerie.trim(),
          imei1: imei1Clean,
          imei2: d.imei2?.trim() || null,
          condicion: d.condicion || CondicionDispositivo.NUEVO,
          costoBs: d.costoBs,
          costoUsd: d.costoUsd,
          precioVentaSugeridoBs: precioSugerido,
        });
      }

      // 4. Calcular costo total de la entrega en Bs
      let totalCostoBs = 0;
      dispositivos.forEach((d) => {
        totalCostoBs += Number(d.costoBs);
      });
      accesorios.forEach((a) => {
        totalCostoBs += Number(a.costoUnitarioBs) * a.cantidad;
      });

      // 5. Crear cabecera de Nota de Ingreso
      const nota = await tx.notaIngreso.create({
        data: {
          proveedorId,
          sucursalId,
          usuarioId,
          numeroComprobante,
          totalCostoBs,
          observaciones,
        },
      });

      // 6. Insertar dispositivos serializados
      for (const disp of dispositivosParaCrear) {
        await tx.dispositivo.create({
          data: {
            notaIngresoId: nota.id,
            sucursalId,
            varianteId: disp.varianteId,
            numeroSerie: disp.numeroSerie,
            imei1: disp.imei1,
            imei2: disp.imei2,
            condicion: disp.condicion,
            costoBs: disp.costoBs,
            costoUsd: disp.costoUsd,
            precioVentaSugeridoBs: disp.precioVentaSugeridoBs,
            estadoInventario: EstadoInventario.DISPONIBLE,
          },
        });
      }

      // 7. Insertar lotes diferenciados de accesorios (US10 con soporte al vuelo)
      for (const acc of accesorios) {
        let resolvedAccesorioId = acc.accesorioId;

        if (acc.nuevoAccesorio) {
          const { categoriaId, nombre, descripcion } = acc.nuevoAccesorio;
          const catExistente = await tx.categoriaAccesorio.findUnique({
            where: { id: categoriaId },
          });
          if (!catExistente) {
            throw new NotFoundException(`La categoría de accesorio con ID ${categoriaId} no existe.`);
          }

          let accesorioExistente = await tx.accesorio.findFirst({
            where: {
              categoriaId,
              nombre: { equals: nombre.trim(), mode: 'insensitive' },
            },
          });

          if (!accesorioExistente) {
            accesorioExistente = await tx.accesorio.create({
              data: {
                categoriaId,
                nombre: nombre.trim(),
                descripcion: descripcion?.trim() || null,
              },
            });
          }
          resolvedAccesorioId = accesorioExistente.id;
        }

        if (!resolvedAccesorioId) {
          throw new BadRequestException(
            `No se pudo resolver el accesorio base para el lote '${acc.nombreDiferenciador}'.`,
          );
        }

        await tx.loteAccesorio.create({
          data: {
            notaIngresoId: nota.id,
            sucursalId,
            accesorioId: resolvedAccesorioId,
            nombreDiferenciador: acc.nombreDiferenciador.trim(),
            costoUnitarioBs: acc.costoUnitarioBs,
            precioVentaBs: acc.precioVentaBs,
            cantidadInicial: acc.cantidad,
            stockActual: acc.cantidad, // El stock inicial es igual a la cantidad ingresada
            activo: true,
          },
        });
      }

      // Retornar la nota completa con sus líneas creadas
      return tx.notaIngreso.findUnique({
        where: { id: nota.id },
        include: {
          proveedor: true,
          sucursal: true,
          usuario: {
            select: { id: true, nombre: true, email: true },
          },
          dispositivos: {
            include: {
              variante: {
                include: { modelo: true },
              },
            },
          },
          lotesAccesorio: {
            include: {
              accesorio: true,
            },
          },
        },
      });
    });
  }

  async findAll(
    queryOrSucursalId?: QueryNotasIngresoDto | number,
    proveedorIdOrUserRole?: number | string,
    userRoleParam?: string,
  ) {
    let query: QueryNotasIngresoDto = {};
    let userRole: string | undefined = undefined;

    if (typeof queryOrSucursalId === 'number') {
      query = {
        sucursalId: queryOrSucursalId,
        proveedorId: typeof proveedorIdOrUserRole === 'number' ? proveedorIdOrUserRole : undefined,
      };
      userRole = userRoleParam;
    } else if (queryOrSucursalId && typeof queryOrSucursalId === 'object') {
      query = queryOrSucursalId;
      userRole = typeof proveedorIdOrUserRole === 'string' ? proveedorIdOrUserRole : userRoleParam;
    } else {
      userRole = typeof proveedorIdOrUserRole === 'string' ? proveedorIdOrUserRole : userRoleParam;
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.NotaIngresoWhereInput = {};

    if (query.sucursalId) {
      where.sucursalId = query.sucursalId;
    }

    if (query.proveedorId) {
      where.proveedorId = query.proveedorId;
    }

    // Rango de fechas
    if (query.fechaDesde || query.fechaHasta) {
      where.fechaIngreso = {};
      if (query.fechaDesde) {
        where.fechaIngreso.gte = new Date(
          query.fechaDesde.includes('T') ? query.fechaDesde : `${query.fechaDesde}T00:00:00.000Z`,
        );
      }
      if (query.fechaHasta) {
        where.fechaIngreso.lte = new Date(
          query.fechaHasta.includes('T') ? query.fechaHasta : `${query.fechaHasta}T23:59:59.999Z`,
        );
      }
    }

    // Búsqueda libre
    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { numeroComprobante: { contains: term, mode: 'insensitive' } },
        { observaciones: { contains: term, mode: 'insensitive' } },
        { proveedor: { nombre: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.notaIngreso.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaIngreso: 'desc' },
        include: {
          proveedor: { select: { id: true, nombre: true } },
          sucursal: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombre: true } },
          _count: {
            select: {
              dispositivos: true,
              lotesAccesorio: true,
            },
          },
        },
      }),
      this.prisma.notaIngreso.count({ where }),
    ]);

    if (userRole && userRole !== 'ADMIN') {
      data.forEach((item: any) => {
        delete item.totalCostoBs;
      });
    }

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
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

  async findOne(id: number, userRole?: string) {
    const nota = await this.prisma.notaIngreso.findUnique({
      where: { id },
      include: {
        proveedor: true,
        sucursal: true,
        usuario: { select: { id: true, nombre: true, email: true } },
        dispositivos: {
          include: {
            variante: {
              include: { modelo: true },
            },
            detalleVentas: {
              where: { venta: { estado: EstadoVenta.COMPLETADA } },
              select: {
                id: true,
                precioUnitarioBs: true,
                costoUnitarioBs: true,
                subtotalBs: true,
                venta: {
                  select: {
                    id: true,
                    fechaHora: true,
                    comprobanteReferencia: true,
                  },
                },
              },
            },
          },
        },
        lotesAccesorio: {
          include: {
            accesorio: {
              include: { categoria: true },
            },
            detalleVentas: {
              where: { venta: { estado: EstadoVenta.COMPLETADA } },
              select: {
                id: true,
                cantidad: true,
                precioUnitarioBs: true,
                costoUnitarioBs: true,
                subtotalBs: true,
                venta: {
                  select: {
                    id: true,
                    fechaHora: true,
                    comprobanteReferencia: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!nota) {
      throw new NotFoundException(`La Nota de Ingreso con ID ${id} no existe.`);
    }

    // Cálculos de métricas financieras de dispositivos
    let dispositivosVendidos = 0;
    let totalVentaRealizadaDispositivosBs = 0;
    let costoRealizadoDispositivosBs = 0;
    let totalVentaProyectadaDispositivosBs = 0;
    let totalCostoDispositivosBs = 0;
    let totalCostoUsd = 0;

    for (const d of nota.dispositivos) {
      const costoBs = Number(d.costoBs || 0);
      const costoUsd = Number(d.costoUsd || 0);
      const precioSugeridoBs = Number(d.precioVentaSugeridoBs || 0);

      totalCostoDispositivosBs += costoBs;
      totalCostoUsd += costoUsd;
      totalVentaProyectadaDispositivosBs += precioSugeridoBs;

      const ventaCompletada = d.detalleVentas?.[0];
      const estaVendido = d.estadoInventario === EstadoInventario.VENDIDO || !!ventaCompletada;

      if (estaVendido) {
        dispositivosVendidos++;
        const precioCobrado = ventaCompletada ? Number(ventaCompletada.subtotalBs) : precioSugeridoBs;
        totalVentaRealizadaDispositivosBs += precioCobrado;
        costoRealizadoDispositivosBs += costoBs;
      }
    }

    // Cálculos de métricas financieras de lotes de accesorios
    let accesoriosTotalUnidades = 0;
    let accesoriosVendidos = 0;
    let totalVentaRealizadaAccesoriosBs = 0;
    let costoRealizadoAccesoriosBs = 0;
    let totalVentaProyectadaAccesoriosBs = 0;
    let totalCostoAccesoriosBs = 0;

    for (const lote of nota.lotesAccesorio) {
      const costoUnitarioBs = Number(lote.costoUnitarioBs || 0);
      const precioVentaBs = Number(lote.precioVentaBs || 0);
      const cantInicial = lote.cantidadInicial || 0;
      const stockActual = lote.stockActual || 0;

      accesoriosTotalUnidades += cantInicial;
      totalCostoAccesoriosBs += costoUnitarioBs * cantInicial;
      totalVentaProyectadaAccesoriosBs += precioVentaBs * cantInicial;

      const cantVendidaDetalles =
        lote.detalleVentas?.reduce((sum: number, dv: any) => sum + (dv.cantidad || 0), 0) || 0;
      const unidadesVendidasLote = Math.max(cantVendidaDetalles, cantInicial - stockActual);

      accesoriosVendidos += unidadesVendidasLote;

      const ventaCobradaLote =
        lote.detalleVentas?.reduce((sum: number, dv: any) => sum + Number(dv.subtotalBs || 0), 0) ||
        unidadesVendidasLote * precioVentaBs;

      totalVentaRealizadaAccesoriosBs += ventaCobradaLote;
      costoRealizadoAccesoriosBs += unidadesVendidasLote * costoUnitarioBs;
    }

    const totalCostoBs =
      Number(nota.totalCostoBs) || totalCostoDispositivosBs + totalCostoAccesoriosBs;
    const totalDispositivos = nota.dispositivos.length;
    const totalAccesorios = accesoriosTotalUnidades;
    const totalUnidadesIngresadas = totalDispositivos + totalAccesorios;
    const totalUnidadesVendidas = dispositivosVendidos + accesoriosVendidos;
    const porcentajeUnidadesVendidas =
      totalUnidadesIngresadas > 0
        ? Math.round((totalUnidadesVendidas / totalUnidadesIngresadas) * 1000) / 10
        : 0;

    const totalVentaProyectadaBs =
      totalVentaProyectadaDispositivosBs + totalVentaProyectadaAccesoriosBs;
    const margenProyectadoBs = totalVentaProyectadaBs - totalCostoBs;
    const porcentajeMargenProyectado =
      totalVentaProyectadaBs > 0
        ? Math.round((margenProyectadoBs / totalVentaProyectadaBs) * 1000) / 10
        : 0;

    const totalVentaRealizadaBs =
      totalVentaRealizadaDispositivosBs + totalVentaRealizadaAccesoriosBs;
    const porcentajeVentaRealizada =
      totalVentaProyectadaBs > 0
        ? Math.round((totalVentaRealizadaBs / totalVentaProyectadaBs) * 1000) / 10
        : 0;

    const costoRealizadoBs = costoRealizadoDispositivosBs + costoRealizadoAccesoriosBs;
    const margenRealizadoBs = totalVentaRealizadaBs - costoRealizadoBs;

    const resumenFinanciero = {
      totalCostoBs,
      totalCostoUsd,
      totalDispositivos,
      totalAccesorios,
      totalUnidadesIngresadas,
      totalUnidadesVendidas,
      porcentajeUnidadesVendidas,
      totalVentaProyectadaBs,
      margenProyectadoBs,
      porcentajeMargenProyectado,
      totalVentaRealizadaBs,
      porcentajeVentaRealizada,
      margenRealizadoBs,
    };

    if (userRole && userRole !== 'ADMIN') {
      nota.dispositivos?.forEach((disp: any) => {
        delete disp.costoBs;
        delete disp.costoUsd;
        delete disp.detalleVentas;
      });
      nota.lotesAccesorio?.forEach((lote: any) => {
        delete lote.costoUnitarioBs;
        delete lote.detalleVentas;
      });
      return {
        ...nota,
        resumenFinanciero: {
          totalDispositivos,
          totalAccesorios,
          totalUnidadesIngresadas,
          totalUnidadesVendidas,
          porcentajeUnidadesVendidas,
          totalVentaProyectadaBs,
          totalVentaRealizadaBs,
          porcentajeVentaRealizada,
        },
      };
    }

    return {
      ...nota,
      resumenFinanciero,
    };
  }

  async anularNotaIngreso(id: number, dto: AnularNotaIngresoDto, usuarioId: number) {
    const nota = await this.prisma.notaIngreso.findUnique({
      where: { id },
      include: {
        dispositivos: {
          include: {
            detalleVentas: {
              where: { venta: { estado: EstadoVenta.COMPLETADA } },
            },
          },
        },
        lotesAccesorio: {
          include: {
            detalleVentas: {
              where: { venta: { estado: EstadoVenta.COMPLETADA } },
            },
          },
        },
      },
    });

    if (!nota) {
      throw new NotFoundException(`La Nota de Ingreso con ID ${id} no existe.`);
    }

    if (nota.estado === 'ANULADA') {
      throw new BadRequestException('La Nota de Ingreso ya fue anulada previamente.');
    }

    // Comprobar si algún dispositivo o lote tiene ventas asociadas
    const dispositivosVendidos = nota.dispositivos.filter(
      (d) => d.estadoInventario === EstadoInventario.VENDIDO || (d.detalleVentas && d.detalleVentas.length > 0),
    );

    const lotesVendidos = nota.lotesAccesorio.filter(
      (l) => (l.detalleVentas && l.detalleVentas.length > 0) || l.stockActual < l.cantidadInicial,
    );

    if (dispositivosVendidos.length > 0 || lotesVendidos.length > 0) {
      const itemsVendidos: string[] = [];
      if (dispositivosVendidos.length > 0) {
        itemsVendidos.push(`${dispositivosVendidos.length} equipo(s)`);
      }
      if (lotesVendidos.length > 0) {
        itemsVendidos.push(`${lotesVendidos.length} lote(s) de accesorios con salidas`);
      }
      throw new BadRequestException(
        `No se puede anular la Nota de Ingreso #${nota.id} porque ya cuenta con unidades vendidas (${itemsVendidos.join(', ')}). Debe gestionar las devoluciones correspondientes antes de anular.`,
      );
    }

    // Transacción atómica de anulación
    return this.prisma.$transaction(async (tx) => {
      // 1. Eliminar dispositivos físicos asociados no vendidos (libera unique de numeroSerie, imei1, imei2)
      await tx.dispositivo.deleteMany({
        where: { notaIngresoId: id },
      });

      // 2. Desactivar lotes de accesorios y poner stock en 0
      await tx.loteAccesorio.updateMany({
        where: { notaIngresoId: id },
        data: {
          activo: false,
          stockActual: 0,
        },
      });

      // 3. Actualizar estado de la nota de ingreso
      const notaActualizada = await tx.notaIngreso.update({
        where: { id },
        data: {
          estado: 'ANULADA',
          anuladaEn: new Date(),
          motivoAnulacion: dto.motivo.trim(),
        },
        include: {
          proveedor: true,
          sucursal: true,
          usuario: { select: { id: true, nombre: true, email: true } },
        },
      });

      this.logger.log(`Nota de Ingreso #${id} anulada por usuario ${usuarioId}. Motivo: ${dto.motivo.trim()}`);

      return {
        success: true,
        message: `Nota de Ingreso #${id} anulada exitosamente.`,
        nota: notaActualizada,
      };
    });
  }

  async updateNotaIngreso(id: number, dto: UpdateNotaIngresoDto, usuarioId: number) {
    const nota = await this.prisma.notaIngreso.findUnique({
      where: { id },
      include: {
        dispositivos: {
          include: {
            detalleVentas: {
              where: { venta: { estado: EstadoVenta.COMPLETADA } },
            },
          },
        },
        lotesAccesorio: {
          include: {
            detalleVentas: {
              where: { venta: { estado: EstadoVenta.COMPLETADA } },
            },
          },
        },
      },
    });

    if (!nota) {
      throw new NotFoundException(`La Nota de Ingreso con ID ${id} no existe.`);
    }

    if (nota.estado === 'ANULADA') {
      throw new BadRequestException('No se puede modificar una Nota de Ingreso que ha sido anulada.');
    }

    const {
      proveedorId,
      sucursalId,
      numeroComprobante,
      observaciones,
      dispositivos,
      accesorios,
    } = dto;

    if (proveedorId && proveedorId !== nota.proveedorId) {
      const prov = await this.prisma.proveedor.findUnique({ where: { id: proveedorId } });
      if (!prov) {
        throw new NotFoundException(`El proveedor con ID ${proveedorId} no existe.`);
      }
    }

    const effectiveSucursalId = sucursalId ?? nota.sucursalId;
    if (sucursalId && sucursalId !== nota.sucursalId) {
      const suc = await this.prisma.sucursal.findUnique({ where: { id: sucursalId } });
      if (!suc) {
        throw new NotFoundException(`La sucursal con ID ${sucursalId} no existe.`);
      }
      const anySold =
        nota.dispositivos.some((d) => d.estadoInventario === EstadoInventario.VENDIDO || d.detalleVentas.length > 0) ||
        nota.lotesAccesorio.some((l) => l.detalleVentas.length > 0 || l.stockActual < l.cantidadInicial);
      if (anySold) {
        throw new BadRequestException('No se puede cambiar la sucursal de una recepción que ya tiene unidades vendidas.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Si se envían dispositivos en el payload
      if (dispositivos !== undefined) {
        // 1. Validar que ningún dispositivo vendido haya sido eliminado de la recepción
        const dispositivosVendidosEnDb = nota.dispositivos.filter(
          (d) => d.estadoInventario === EstadoInventario.VENDIDO || d.detalleVentas.length > 0,
        );

        for (const dispVendido of dispositivosVendidosEnDb) {
          const presenteEnPayload = dispositivos.find(
            (d) => (d.id && d.id === dispVendido.id) || d.numeroSerie?.trim() === dispVendido.numeroSerie,
          );
          if (!presenteEnPayload) {
            throw new BadRequestException(
              `El dispositivo con serie '${dispVendido.numeroSerie}' ya fue vendido y no puede ser removido de la nota.`,
            );
          }
        }

        // 2. Validar duplicidad interna en el payload
        const seriesEnPayload = new Set<string>();
        const imeisEnPayload = new Set<string>();

        for (const d of dispositivos) {
          const serie = d.numeroSerie?.trim();
          if (!serie) {
            throw new BadRequestException('Todo dispositivo debe tener un número de serie obligatorio.');
          }
          if (seriesEnPayload.has(serie)) {
            throw new ConflictException(`El número de serie '${serie}' está duplicado en la entrega.`);
          }
          seriesEnPayload.add(serie);

          const imei1 = d.imei1?.trim();
          if (imei1) {
            if (imeisEnPayload.has(imei1)) {
              throw new ConflictException(`El IMEI 1 '${imei1}' está duplicado en la entrega.`);
            }
            imeisEnPayload.add(imei1);
          }

          if (d.imei2 && d.imei2.trim().length > 0) {
            const imei2 = d.imei2.trim();
            if (imeisEnPayload.has(imei2)) {
              throw new ConflictException(`El IMEI 2 '${imei2}' está duplicado en la entrega.`);
            }
            imeisEnPayload.add(imei2);
          }
        }

        // 3. Identificar dispositivos a eliminar (los que existían en DB no vendidos y no vienen en el payload)
        const incomingIds = new Set(dispositivos.filter((d) => d.id).map((d) => d.id!));
        const dispositivosAEliminar = nota.dispositivos.filter(
          (d) => !incomingIds.has(d.id) && d.estadoInventario !== EstadoInventario.VENDIDO && d.detalleVentas.length === 0,
        );

        if (dispositivosAEliminar.length > 0) {
          await tx.dispositivo.deleteMany({
            where: { id: { in: dispositivosAEliminar.map((d) => d.id) } },
          });
        }

        // 4. Procesar actualización o creación de dispositivos
        for (const d of dispositivos) {
          const serie = d.numeroSerie.trim();
          const imei1 = d.imei1?.trim() || null;
          const imei2 = d.imei2?.trim() || null;

          // Validar colisión contra DB excluyendo el propio ID si ya existe
          const serieExistente = await tx.dispositivo.findFirst({
            where: {
              numeroSerie: serie,
              ...(d.id ? { id: { not: d.id } } : {}),
            },
          });
          if (serieExistente) {
            throw new ConflictException(`El número de serie '${serie}' ya se encuentra registrado en el sistema.`);
          }

          if (imei1) {
            const imei1Existente = await tx.dispositivo.findFirst({
              where: {
                OR: [{ imei1 }, { imei2: imei1 }],
                ...(d.id ? { id: { not: d.id } } : {}),
              },
            });
            if (imei1Existente) {
              throw new ConflictException(`El IMEI 1 '${imei1}' ya se encuentra registrado en el sistema.`);
            }
          }

          if (imei2) {
            const imei2Existente = await tx.dispositivo.findFirst({
              where: {
                OR: [{ imei1: imei2 }, { imei2 }],
                ...(d.id ? { id: { not: d.id } } : {}),
              },
            });
            if (imei2Existente) {
              throw new ConflictException(`El IMEI 2 '${imei2}' ya se encuentra registrado en el sistema.`);
            }
          }

          // Resolver variante
          let resolvedVarianteId = d.varianteId;
          let modeloTipo = 'IPHONE';
          let nombreModelo = 'Dispositivo';

          if (d.nuevaVariante) {
            const { modeloId, color, capacidadGb, tipoSim = 'SIM Físico' } = d.nuevaVariante;
            const modeloFound = await tx.modeloDispositivo.findUnique({ where: { id: modeloId } });
            if (modeloFound) {
              modeloTipo = modeloFound.tipo;
              nombreModelo = modeloFound.nombreModelo;
            }

            let variante = await tx.varianteDispositivo.findUnique({
              where: {
                modeloId_color_capacidadGb_tipoSim: {
                  modeloId,
                  color: color.trim(),
                  capacidadGb,
                  tipoSim,
                },
              },
            });

            if (!variante) {
              variante = await tx.varianteDispositivo.create({
                data: {
                  modeloId,
                  color: color.trim(),
                  capacidadGb,
                  tipoSim,
                },
              });
            }
            resolvedVarianteId = variante.id;
          } else if (resolvedVarianteId) {
            const varianteFound = await tx.varianteDispositivo.findUnique({
              where: { id: resolvedVarianteId },
              include: { modelo: true },
            });
            if (varianteFound?.modelo) {
              modeloTipo = varianteFound.modelo.tipo;
              nombreModelo = varianteFound.modelo.nombreModelo;
            }
          }

          if (!resolvedVarianteId) {
            throw new BadRequestException('Cada dispositivo debe especificar un varianteId o una nuevaVariante.');
          }

          if (modeloTipo === 'IPHONE' && !imei1) {
            throw new BadRequestException(
              `El dispositivo '${nombreModelo}' es de tipo IPHONE y requiere obligatoriamente un IMEI 1 válido.`,
            );
          }

          const precioSugerido =
            d.precioVentaSugeridoBs !== undefined && d.precioVentaSugeridoBs !== null
              ? Number(d.precioVentaSugeridoBs)
              : Math.round(Number(d.costoBs) * 1.15);

          if (d.id) {
            // Actualizar dispositivo existente
            const dispDb = nota.dispositivos.find((item) => item.id === d.id);
            const yaVendido =
              dispDb && (dispDb.estadoInventario === EstadoInventario.VENDIDO || dispDb.detalleVentas.length > 0);

            if (yaVendido) {
              await tx.dispositivo.update({
                where: { id: d.id },
                data: {
                  precioVentaSugeridoBs: precioSugerido,
                },
              });
            } else {
              await tx.dispositivo.update({
                where: { id: d.id },
                data: {
                  varianteId: resolvedVarianteId,
                  sucursalId: effectiveSucursalId,
                  numeroSerie: serie,
                  imei1,
                  imei2,
                  condicion: d.condicion || CondicionDispositivo.NUEVO,
                  costoBs: d.costoBs,
                  costoUsd: d.costoUsd,
                  precioVentaSugeridoBs: precioSugerido,
                },
              });
            }
          } else {
            // Crear nuevo dispositivo en esta nota
            await tx.dispositivo.create({
              data: {
                notaIngresoId: id,
                sucursalId: effectiveSucursalId,
                varianteId: resolvedVarianteId,
                numeroSerie: serie,
                imei1,
                imei2,
                condicion: d.condicion || CondicionDispositivo.NUEVO,
                costoBs: d.costoBs,
                costoUsd: d.costoUsd,
                precioVentaSugeridoBs: precioSugerido,
                estadoInventario: EstadoInventario.DISPONIBLE,
              },
            });
          }
        }
      }

      // Si se envían accesorios en el payload
      if (accesorios !== undefined) {
        // Validar lotes con ventas que no hayan sido eliminados
        const lotesVendidosEnDb = nota.lotesAccesorio.filter(
          (l) => l.detalleVentas.length > 0 || l.stockActual < l.cantidadInicial,
        );

        for (const loteVendido of lotesVendidosEnDb) {
          const presente = accesorios.find((a) => a.id && a.id === loteVendido.id);
          if (!presente) {
            throw new BadRequestException(
              `El lote '${loteVendido.nombreDiferenciador}' ya cuenta con ventas y no puede ser removido de la recepción.`,
            );
          }
        }

        const incomingLotIds = new Set(accesorios.filter((a) => a.id).map((a) => a.id!));
        const lotesAEliminar = nota.lotesAccesorio.filter(
          (l) => !incomingLotIds.has(l.id) && l.detalleVentas.length === 0 && l.stockActual === l.cantidadInicial,
        );

        if (lotesAEliminar.length > 0) {
          await tx.loteAccesorio.deleteMany({
            where: { id: { in: lotesAEliminar.map((l) => l.id) } },
          });
        }

        for (const acc of accesorios) {
          let resolvedAccesorioId = acc.accesorioId;

          if (acc.nuevoAccesorio) {
            const { categoriaId, nombre, descripcion } = acc.nuevoAccesorio;
            const catExistente = await tx.categoriaAccesorio.findUnique({ where: { id: categoriaId } });
            if (!catExistente) {
              throw new NotFoundException(`La categoría de accesorio con ID ${categoriaId} no existe.`);
            }

            let accesorioExistente = await tx.accesorio.findFirst({
              where: {
                categoriaId,
                nombre: { equals: nombre.trim(), mode: 'insensitive' },
              },
            });

            if (!accesorioExistente) {
              accesorioExistente = await tx.accesorio.create({
                data: {
                  categoriaId,
                  nombre: nombre.trim(),
                  descripcion: descripcion?.trim() || null,
                },
              });
            }
            resolvedAccesorioId = accesorioExistente.id;
          }

          if (acc.id) {
            const loteDb = nota.lotesAccesorio.find((l) => l.id === acc.id);
            const tieneVentas = loteDb && (loteDb.detalleVentas.length > 0 || loteDb.stockActual < loteDb.cantidadInicial);

            if (tieneVentas) {
              await tx.loteAccesorio.update({
                where: { id: acc.id },
                data: {
                  nombreDiferenciador: acc.nombreDiferenciador.trim(),
                  precioVentaBs: acc.precioVentaBs,
                },
              });
            } else {
              await tx.loteAccesorio.update({
                where: { id: acc.id },
                data: {
                  ...(resolvedAccesorioId ? { accesorioId: resolvedAccesorioId } : {}),
                  sucursalId: effectiveSucursalId,
                  nombreDiferenciador: acc.nombreDiferenciador.trim(),
                  costoUnitarioBs: acc.costoUnitarioBs,
                  precioVentaBs: acc.precioVentaBs,
                  cantidadInicial: acc.cantidad,
                  stockActual: acc.cantidad,
                },
              });
            }
          } else {
            if (!resolvedAccesorioId) {
              throw new BadRequestException(
                `No se pudo resolver el accesorio base para el lote '${acc.nombreDiferenciador}'.`,
              );
            }
            await tx.loteAccesorio.create({
              data: {
                notaIngresoId: id,
                sucursalId: effectiveSucursalId,
                accesorioId: resolvedAccesorioId,
                nombreDiferenciador: acc.nombreDiferenciador.trim(),
                costoUnitarioBs: acc.costoUnitarioBs,
                precioVentaBs: acc.precioVentaBs,
                cantidadInicial: acc.cantidad,
                stockActual: acc.cantidad,
                activo: true,
              },
            });
          }
        }
      }

      // Si cambió de sucursal, asegurar que todos los dispositivos y lotes queden actualizados
      if (sucursalId && sucursalId !== nota.sucursalId) {
        await tx.dispositivo.updateMany({ where: { notaIngresoId: id }, data: { sucursalId } });
        await tx.loteAccesorio.updateMany({ where: { notaIngresoId: id }, data: { sucursalId } });
      }

      // 5. Recalcular totalCostoBs
      const allCurrentDispositivos = await tx.dispositivo.findMany({ where: { notaIngresoId: id } });
      const allCurrentLotes = await tx.loteAccesorio.findMany({ where: { notaIngresoId: id } });

      let totalCostoBs = 0;
      allCurrentDispositivos.forEach((d) => {
        totalCostoBs += Number(d.costoBs);
      });
      allCurrentLotes.forEach((l) => {
        totalCostoBs += Number(l.costoUnitarioBs) * l.cantidadInicial;
      });

      // 6. Actualizar cabecera de la Nota de Ingreso
      await tx.notaIngreso.update({
        where: { id },
        data: {
          ...(proveedorId ? { proveedorId } : {}),
          ...(sucursalId ? { sucursalId } : {}),
          numeroComprobante: numeroComprobante !== undefined ? numeroComprobante : nota.numeroComprobante,
          observaciones: observaciones !== undefined ? observaciones : nota.observaciones,
          totalCostoBs,
        },
      });

      this.logger.log(`Nota de Ingreso #${id} actualizada exitosamente por usuario ${usuarioId}.`);
    });

    return this.findOne(id, 'ADMIN');
  }
}
