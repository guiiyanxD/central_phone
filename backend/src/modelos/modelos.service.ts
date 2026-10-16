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
import * as fs from 'fs';
import * as path from 'path';
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
    sucursalId?: number,
    estado?: string,
    busqueda?: string,
    userRole?: string,
  ) {
    const whereClause: any = {};
    if (sucursalId) {
      whereClause.sucursalId = sucursalId;
    }
    if (estado && estado !== 'TODOS') {
      whereClause.estadoInventario = estado;
    }
    if (busqueda && busqueda.trim().length > 0) {
      const q = busqueda.trim();
      whereClause.OR = [
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
      ];
    }

    const dispositivos = await this.prisma.dispositivo.findMany({
      where: whereClause,
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
          select: { id: true, fechaIngreso: true, numeroComprobante: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    // Confidencialidad de costos mayoristas (Regla Inmutable RBAC Financiero)
    if (userRole && userRole !== 'ADMIN') {
      return dispositivos.map((d) => {
        const { costoBs, costoUsd, ...safeData } = d;
        return safeData;
      });
    }

    return dispositivos;
  }

  // US18: Línea de vida y trazabilidad completa por IMEI
  async getLineaVidaImei(imei: string, userRole?: string) {
    if (!imei || imei.trim().length === 0) {
      throw new BadRequestException('El número de IMEI es obligatorio para consultar la línea de vida.');
    }
    const cleanImei = imei.trim();

    const dispositivo = await this.prisma.dispositivo.findFirst({
      where: {
        OR: [
          { imei1: cleanImei },
          { imei2: cleanImei },
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
      throw new NotFoundException(`No se encontró ningún dispositivo registrado con el IMEI "${cleanImei}".`);
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

  // Importador masivo de catálogo CSV (ej: combinaciones_iphone18.csv)
  async importarDesdeCsv(csvContent: string) {
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) {
      throw new BadRequestException('El archivo CSV está vacío o solo contiene encabezados.');
    }

    // Saltar encabezado (#,Modelo,Color,Capacidad de Almacenamiento)
    const dataRows = lines.slice(1);
    let creadosModelos = 0;
    let creadasVariantes = 0;
    let omitidas = 0;

    for (const row of dataRows) {
      const parts = row.split(',').map((p) => p.trim());
      if (parts.length < 4) continue;

      const modeloNombre = parts[1];
      const color = parts[2];
      const capacidadStr = parts[3]; // "256GB", "1TB", "2TB", etc.

      // Parsear capacidad
      let capacidadGb = 128;
      if (capacidadStr.toUpperCase().includes('TB')) {
        const tbNum = parseInt(capacidadStr.replace(/[^0-9]/g, ''), 10) || 1;
        capacidadGb = tbNum * 1024;
      } else {
        capacidadGb = parseInt(capacidadStr.replace(/[^0-9]/g, ''), 10) || 128;
      }

      // Buscar o crear Modelo
      let modelo = await this.prisma.modeloDispositivo.findFirst({
        where: { nombreModelo: modeloNombre },
      });

      if (!modelo) {
        modelo = await this.prisma.modeloDispositivo.create({
          data: {
            nombreModelo: modeloNombre,
            marca: 'Apple',
          },
        });
        creadosModelos++;
      }

      // Buscar o crear Variante
      const varianteExiste = await this.prisma.varianteDispositivo.findUnique({
        where: {
          modeloId_color_capacidadGb_tipoSim: {
            modeloId: modelo.id,
            color,
            capacidadGb,
            tipoSim: 'SIM Físico',
          },
        },
      });

      if (!varianteExiste) {
        await this.prisma.varianteDispositivo.create({
          data: {
            modeloId: modelo.id,
            color,
            capacidadGb,
            tipoSim: 'SIM Físico',
          },
        });
        creadasVariantes++;
      } else {
        omitidas++;
      }
    }

    return {
      success: true,
      modelosCreados: creadosModelos,
      variantesCreadas: creadasVariantes,
      variantesOmitidas: omitidas,
      totalProcesados: dataRows.length,
    };
  }

  // Permite importar directamente el archivo del proyecto si existe en el disco
  async importarArchivoLocalDefault() {
    const csvPath = path.resolve(process.cwd(), '../docs/requerimientos/combinaciones_iphone18.csv');
    const altPath = path.resolve(process.cwd(), 'docs/requerimientos/combinaciones_iphone18.csv');

    let targetPath = fs.existsSync(csvPath) ? csvPath : fs.existsSync(altPath) ? altPath : null;

    if (!targetPath) {
      this.logger.warn('Archivo combinaciones_iphone18.csv no encontrado para auto-import.');
      return null;
    }

    const content = fs.readFileSync(targetPath, 'utf8');
    return this.importarDesdeCsv(content);
  }
}
