import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Límite controlado de Payload para subida segura de imágenes del negocio (QR y Logos)
  app.use(json({ limit: '6mb' }));
  app.use(urlencoded({ extended: true, limit: '6mb' }));

  // Prefijo global de API
  app.setGlobalPrefix('api/v1');

  // Configuración de CORS basada en variables de entorno
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin,
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

  const port = process.env.BACKEND_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 CentralPhone Backend API corriendo en puerto ${port} (prefijo: /api/v1)`);
}
bootstrap();
