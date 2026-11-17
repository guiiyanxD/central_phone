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
      const safeMessage = (error.message || '').replace(
        /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?::\d+)?\b/g,
        '[REDACTED_IP]',
      );
      this.logger.error(`Fallo en healthcheck de base de datos: ${safeMessage}`);
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
