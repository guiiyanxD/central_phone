import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno en la base de datos.';
    let errorType = 'InternalServerError';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || [];
        const fieldStr = Array.isArray(target) ? target.join(', ') : 'campo';
        message = `Ya existe un registro con el mismo valor único (${fieldStr}).`;
        errorType = 'Conflict';
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = (exception.meta?.cause as string) || 'El registro solicitado no fue encontrado.';
        errorType = 'NotFound';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name || 'relación';
        message = `Violación de integridad referencial: el registro relacionado (${field}) no existe o está protegido.`;
        errorType = 'BadRequest';
        break;
      }
      case 'P2014': {
        status = HttpStatus.BAD_REQUEST;
        message = 'La modificación viola una relación requerida en la base de datos.';
        errorType = 'BadRequest';
        break;
      }
      default:
        this.logger.error(`Prisma error no mapeado [${exception.code}]: ${exception.message}`);
        break;
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: errorType,
      prismaCode: exception.code,
      timestamp: new Date().toISOString(),
    });
  }
}
