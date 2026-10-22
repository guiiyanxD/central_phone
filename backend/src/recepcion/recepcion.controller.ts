import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RecepcionService } from './recepcion.service';
import { CreateNotaIngresoDto } from './dto/create-nota-ingreso.dto';
import { QueryNotasIngresoDto } from './dto/query-notas-ingreso.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolUsuario } from '@prisma/client';

@Controller('recepcion')
@UseGuards(JwtAuthGuard)
export class RecepcionController {
  constructor(private readonly recepcionService: RecepcionService) {}

  @Post('notas-ingreso')
  async createNotaIngreso(
    @Body() dto: CreateNotaIngresoDto,
    @CurrentUser('id') usuarioId: number,
  ) {
    return this.recepcionService.createNotaIngreso(dto, usuarioId);
  }

  @Get('notas-ingreso')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async findAll(
    @Query() query: QueryNotasIngresoDto,
    @CurrentUser('rol') userRole?: string,
  ) {
    return this.recepcionService.findAll(query, userRole);
  }

  @Get('notas-ingreso/:id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('rol') userRole?: string,
  ) {
    return this.recepcionService.findOne(id, userRole);
  }
}
