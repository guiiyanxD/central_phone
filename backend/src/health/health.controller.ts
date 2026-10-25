import {
  Controller,
  Get,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger('HealthController');

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @SkipThrottle()
  async check() {
    const startTime = Date.now();
    try {
      // Comprobar conectividad activa y tiempo de respuesta con PostgreSQL
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Date.now() - startTime;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        database: {
          status: 'up',
          latencyMs,
        },
      };
    } catch (error: any) {
      this.logger.error(`Fallo en healthcheck de base de datos: ${error.message}`);
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        database: {
          status: 'down',
          error:
            process.env.NODE_ENV === 'production'
              ? 'Error de conexión con PostgreSQL'
              : error.message || 'Error de conexión con PostgreSQL',
        },
      });
    }
  }
}
