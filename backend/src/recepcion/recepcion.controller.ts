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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

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
  async findAll(
    @Query('sucursalId') sucursalId?: string,
    @Query('proveedorId') proveedorId?: string,
  ) {
    return this.recepcionService.findAll(
      sucursalId ? parseInt(sucursalId, 10) : undefined,
      proveedorId ? parseInt(proveedorId, 10) : undefined,
    );
  }

  @Get('notas-ingreso/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recepcionService.findOne(id);
  }
}
