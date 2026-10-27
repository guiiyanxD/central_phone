import {
  Injectable,
  Logger,
  OnModuleInit,
  Optional,
  BadRequestException,
  BadGatewayException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { validateImagePayload } from '../common/utils/image-validator.util';
import { ImageOptimizerService } from '../common/services/image-optimizer.service';

@Injectable()
export class ConfiguracionService implements OnModuleInit {
  private readonly logger = new Logger(ConfiguracionService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly configService?: ConfigService,
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

  /**
   * Sincroniza el Tipo de Cambio Oficial y Paralelo consumiendo la API de WaveSoft Cloud.
   * Actualiza el registro singleton de configuracion_negocio con tcOficial, tcParalelo y tcActualizadoEn.
   */
  async sincronizarTipoCambio(adminUserId?: number) {
    const apiUrl =
      this.configService?.get<string>('WAVESOFT_TC_API_URL') ||
      process.env.WAVESOFT_TC_API_URL ||
      'https://wavesoft.cloud/api/v1/tc';
    const apiToken =
      this.configService?.get<string>('WAVESOFT_TC_API_TOKEN')?.trim() ||
      process.env.WAVESOFT_TC_API_TOKEN?.trim() ||
      '';

    if (!apiToken) {
      this.logger.warn('WAVESOFT_TC_API_TOKEN no está configurado en las variables de entorno.');
      throw new BadRequestException(
        'El token de la API de Tipo de Cambio (WAVESOFT_TC_API_TOKEN) no está configurado en el servidor.',
      );
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        this.logger.error(`Error en API WaveSoft (${response.status}): ${errorText}`);
        throw new BadGatewayException(
          `La API externa de Tipo de Cambio respondió con error (${response.status}).`,
        );
      }

      const data: any = await response.json();

      // Mapear campos oficial y paralelo según la especificación acordada (average con fallbacks a sell / buy)
      const tcOficialNum = Number(
        data?.official?.average ?? data?.official?.sell ?? data?.official?.buy ?? 6.96,
      );
      const tcParaleloNum = Number(
        data?.parallel?.average ?? data?.parallel?.sell ?? data?.parallel?.buy ?? 6.96,
      );

      if (isNaN(tcOficialNum) || isNaN(tcParaleloNum)) {
        throw new BadGatewayException('La respuesta de la API de Tipo de Cambio contiene valores no numéricos.');
      }

      const updated = await this.prisma.configuracionNegocio.upsert({
        where: { id: 1 },
        update: {
          tcOficial: tcOficialNum,
          tcParalelo: tcParaleloNum,
          tcActualizadoEn: new Date(),
          actualizadoPorUsuarioId: adminUserId,
        },
        create: {
          id: 1,
          nombreEmpresa: 'CentralPhone',
          qrOficialImagenUrl: '/uploads/qr/qr_oficial.png',
          bancoOficial: 'Banco de Crédito BCP',
          titularCuenta: 'CentralPhone',
          numeroCuenta: '000-0000000',
          tcOficial: tcOficialNum,
          tcParalelo: tcParaleloNum,
          tcActualizadoEn: new Date(),
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

      this.logger.log(
        `✅ Tipo de Cambio sincronizado exitosamente: Oficial Bs ${tcOficialNum.toFixed(2)}, Paralelo Bs ${tcParaleloNum.toFixed(2)}`,
      );

      return updated;
    } catch (err: any) {
      if (err instanceof BadRequestException || err instanceof BadGatewayException) {
        throw err;
      }
      this.logger.error(`Fallo de conexión con API WaveSoft: ${err.message}`);
      throw new BadGatewayException(
        `No se pudo conectar con el servicio externo de Tipo de Cambio: ${err.message}`,
      );
    }
  }
}
