import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { validateImagePayload } from '../common/utils/image-validator.util';

@Injectable()
export class ConfiguracionService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureConfiguracionExists();
  }

  // Garantiza que el registro singleton (id = 1) siempre exista
  private async ensureConfiguracionExists() {
    const config = await this.prisma.configuracionNegocio.findUnique({
      where: { id: 1 },
    });

    if (!config) {
      await this.prisma.configuracionNegocio.create({
        data: {
          id: 1,
          nombreEmpresa: 'CentralPhone',
          logoUrl: '/logo.png',
          qrOficialImagenUrl: '/uploads/qr/qr_oficial.png',
          bancoOficial: 'Banco de Crédito BCP',
          titularCuenta: 'Alex Gomez (CentralPhone Oficial)',
          numeroCuenta: '201-50893214-3-12',
          tipoCuenta: 'Caja de Ahorro Bs',
        },
      });
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
    // Verificación estricta de Magic Bytes, formato MIME y esquemas peligrosos
    validateImagePayload(dto.qrOficialImagenUrl, 'qrOficialImagenUrl');
    if (dto.logoUrl) {
      validateImagePayload(dto.logoUrl, 'logoUrl');
    }

    return this.prisma.configuracionNegocio.upsert({
      where: { id: 1 },
      update: {
        ...dto,
        actualizadoPorUsuarioId: adminUserId,
      },
      create: {
        id: 1,
        ...dto,
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
