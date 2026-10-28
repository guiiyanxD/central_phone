import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RecepcionService } from './recepcion.service';
import { CreateNotaIngresoDto } from './dto/create-nota-ingreso.dto';
import { UpdateNotaIngresoDto } from './dto/update-nota-ingreso.dto';
import { AnularNotaIngresoDto } from './dto/anular-nota-ingreso.dto';
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
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async createNotaIngreso(
    @Body() dto: CreateNotaIngresoDto,
    @CurrentUser('id') usuarioId: number,
  ) {
    return this.recepcionService.createNotaIngreso(dto, usuarioId);
  }

  @Put('notas-ingreso/:id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async updateNotaIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNotaIngresoDto,
    @CurrentUser('id') usuarioId: number,
  ) {
    return this.recepcionService.updateNotaIngreso(id, dto, usuarioId);
  }

  @Post('notas-ingreso/:id/anular')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async anularNotaIngreso(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularNotaIngresoDto,
    @CurrentUser('id') usuarioId: number,
  ) {
    return this.recepcionService.anularNotaIngreso(id, dto, usuarioId);
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
