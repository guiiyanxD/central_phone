import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotaIngresoDto } from './dto/create-nota-ingreso.dto';
import { CondicionDispositivo, EstadoInventario } from '@prisma/client';

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
      const serie = d.numeroSerie.trim();
      const imei1 = d.imei1.trim();

      if (seriesEnPayload.has(serie)) {
        throw new ConflictException(`El número de serie '${serie}' está duplicado en la misma entrega.`);
      }
      seriesEnPayload.add(serie);

      if (imeisEnPayload.has(imei1)) {
        throw new ConflictException(`El IMEI 1 '${imei1}' está duplicado en la misma entrega.`);
      }
      imeisEnPayload.add(imei1);

      if (d.imei2 && d.imei2.trim().length > 0) {
        const imei2 = d.imei2.trim();
        if (imeisEnPayload.has(imei2)) {
          throw new ConflictException(`El IMEI 2 '${imei2}' está duplicado en la misma entrega.`);
        }
        imeisEnPayload.add(imei2);
      }
    }

    // 2. Transacción Atómica ACID para verificar unicidad contra DB y persistir
    return this.prisma.$transaction(async (tx) => {
      // Validar contra la base de datos
      for (const d of dispositivos) {
        const serieExistente = await tx.dispositivo.findUnique({
          where: { numeroSerie: d.numeroSerie.trim() },
        });
        if (serieExistente) {
          throw new ConflictException(`El número de serie '${d.numeroSerie}' ya se encuentra registrado en el sistema.`);
        }

        const imei1Existente = await tx.dispositivo.findUnique({
          where: { imei1: d.imei1.trim() },
        });
        if (imei1Existente) {
          throw new ConflictException(`El IMEI 1 '${d.imei1}' ya está registrado en el sistema.`);
        }

        if (d.imei2 && d.imei2.trim().length > 0) {
          const imei2Existente = await tx.dispositivo.findFirst({
            where: {
              OR: [{ imei1: d.imei2.trim() }, { imei2: d.imei2.trim() }],
            },
          });
          if (imei2Existente) {
            throw new ConflictException(`El IMEI 2 '${d.imei2}' ya está registrado en el sistema.`);
          }
        }
      }

      // 3. Resolver variantes (soportando US09: creación in-line "al vuelo")
      const dispositivosParaCrear: Array<{
        varianteId: number;
        numeroSerie: string;
        imei1: string;
        imei2?: string;
        condicion: CondicionDispositivo;
        costoBs: number;
        costoUsd: number;
      }> = [];

      for (const d of dispositivos) {
        let resolvedVarianteId = d.varianteId;

        // Si se envió la creación rápida in-line
        if (d.nuevaVariante) {
          const { modeloId, color, capacidadGb, tipoSim = 'SIM Físico' } = d.nuevaVariante;
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
        }

        if (!resolvedVarianteId) {
          throw new BadRequestException('Cada dispositivo debe especificar un varianteId o una nuevaVariante.');
        }

        dispositivosParaCrear.push({
          varianteId: resolvedVarianteId,
          numeroSerie: d.numeroSerie.trim(),
          imei1: d.imei1.trim(),
          imei2: d.imei2 ? d.imei2.trim() : null,
          condicion: d.condicion || CondicionDispositivo.NUEVO,
          costoBs: d.costoBs,
          costoUsd: d.costoUsd,
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
            estadoInventario: EstadoInventario.DISPONIBLE,
          },
        });
      }

      // 7. Insertar lotes diferenciados de accesorios (US10)
      for (const acc of accesorios) {
        await tx.loteAccesorio.create({
          data: {
            notaIngresoId: nota.id,
            sucursalId,
            accesorioId: acc.accesorioId,
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

  async findAll(sucursalId?: number, proveedorId?: number) {
    return this.prisma.notaIngreso.findMany({
      where: {
        ...(sucursalId ? { sucursalId } : {}),
        ...(proveedorId ? { proveedorId } : {}),
      },
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
    });
  }

  async findOne(id: number) {
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
          },
        },
        lotesAccesorio: {
          include: {
            accesorio: {
              include: { categoria: true },
            },
          },
        },
      },
    });

    if (!nota) {
      throw new NotFoundException(`La Nota de Ingreso con ID ${id} no existe.`);
    }

    return nota;
  }
}
