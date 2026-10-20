import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { validateImagePayload } from '../common/utils/image-validator.util';
import { ImageOptimizerService } from '../common/services/image-optimizer.service';

@Injectable()
export class ConfiguracionService implements OnModuleInit {
  private readonly logger = new Logger(ConfiguracionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly imageOptimizer?: ImageOptimizerService,
  ) {}

  async onModuleInit() {
    await this.ensureConfiguracionExists();
  }

  /**
   * Garantiza que el registro singleton (id = 1) siempre exista.
   * Regla Inmutable 9: Resiliencia y Auto-Restauración de Semilla desde el Host Bind Mount.
   */
  private async ensureConfiguracionExists() {
    const config = await this.prisma.configuracionNegocio.findUnique({
      where: { id: 1 },
    });

    // 1. Auto-detectar si ya existe una imagen física de QR persistida en disco
    const persistedQrDataUri = this.imageOptimizer?.readPersistedQrImage?.() || null;

    if (!config) {
      // Si existe imagen real en disco, usar los datos reales del negocio
      const defaultQrUrl = persistedQrDataUri || '/uploads/qr/qr_oficial.png';
      const defaultBanco = persistedQrDataUri
        ? 'Banco Nacional de Bolivia'
        : 'Banco de Crédito BCP';
      const defaultTitular = persistedQrDataUri
        ? 'Williams Wilman Alvarez Zabala'
        : 'Alex Gomez (CentralPhone Oficial)';
      const defaultNumeroCuenta = persistedQrDataUri
        ? '8145086-01025'
        : '201-50893214-3-12';

      await this.prisma.configuracionNegocio.create({
        data: {
          id: 1,
          nombreEmpresa: 'CentralPhone',
          logoUrl: '/logo.png',
          qrOficialImagenUrl: defaultQrUrl,
          bancoOficial: defaultBanco,
          titularCuenta: defaultTitular,
          numeroCuenta: defaultNumeroCuenta,
          tipoCuenta: 'Caja de Ahorro Bs',
        },
      });

      this.logger.log(
        `✅ Configuración de negocio inicializada (Auto-restaurado desde disco: ${!!persistedQrDataUri})`,
      );
    } else if (
      persistedQrDataUri &&
      config.qrOficialImagenUrl === '/uploads/qr/qr_oficial.png'
    ) {
      // Si la BD contiene el placeholder roto pero existe el QR real en disco, auto-reparar
      await this.prisma.configuracionNegocio.update({
        where: { id: 1 },
        data: {
          qrOficialImagenUrl: persistedQrDataUri,
        },
      });
      this.logger.log('✅ QR oficial auto-restaurado desde disco en registro existente.');
    }
  }

  async getConfiguracion() {
    return this.prisma.configuracionNegocio.findUnique({
      where: { id: 1 },
      include: {
        actualizadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });
  }

  async updateConfiguracion(dto: UpdateConfiguracionDto, adminUserId: number) {
    // 1. Verificación estricta de Magic Bytes, formato MIME y esquemas peligrosos
    validateImagePayload(dto.qrOficialImagenUrl, 'qrOficialImagenUrl');
    if (dto.logoUrl) {
      validateImagePayload(dto.logoUrl, 'logoUrl');
    }

    // 2. Regla Inmutable 9: Optimización obligatoria con Sharp y persistencia en disco
    let optimizedQrDataUri = dto.qrOficialImagenUrl;
    if (
      this.imageOptimizer &&
      dto.qrOficialImagenUrl &&
      (dto.qrOficialImagenUrl.startsWith('data:image/') || dto.qrOficialImagenUrl.length > 500)
    ) {
      try {
        const optimizedResult = await this.imageOptimizer.processAndSaveQrImage(
          dto.qrOficialImagenUrl,
        );
        optimizedQrDataUri = optimizedResult.dataUri;
      } catch (err: any) {
        this.logger.warn(
          `No se pudo optimizar con sharp, guardando payload validado: ${err.message}`,
        );
      }
    }

    return this.prisma.configuracionNegocio.upsert({
      where: { id: 1 },
      update: {
        ...dto,
        qrOficialImagenUrl: optimizedQrDataUri,
        actualizadoPorUsuarioId: adminUserId,
      },
      create: {
        id: 1,
        ...dto,
        qrOficialImagenUrl: optimizedQrDataUri,
        actualizadoPorUsuarioId: adminUserId,
      },
      include: {
        actualizadoPor: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });
  }
}
