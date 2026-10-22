import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Blindaje de Cabeceras HTTP con Helmet (Cross-Origin Resource Policy para QR de POS en tablets/mostrador)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Cierre controlado de conexiones a base de datos ante señales del SO / Docker
  app.enableShutdownHooks();

  // Límite controlado de Payload para subida segura de imágenes del negocio (QR y Logos)
  app.use(json({ limit: '6mb' }));
  app.use(urlencoded({ extended: true, limit: '6mb' }));

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  // Filtro Global para captura y mapeo de excepciones de Prisma ORM
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  // Configuración de CORS con soporte para red local (tablets y móviles de mostrador)
  const allowedOriginsEnv = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin) return callback(null, true);

      if (allowedOriginsEnv.includes(requestOrigin) || allowedOriginsEnv.includes('*')) {
        return callback(null, true);
      }

      const isLocalOrLan =
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          requestOrigin,
        );

      if (isLocalOrLan) {
        return callback(null, true);
      }

      callback(null, false);
    },
    credentials: true,
  });

  // Tubería global de validación tipada
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || process.env.BACKEND_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 CentralPhone Backend API corriendo en puerto ${port} (prefijo: /api/v1)`);
}
bootstrap();
