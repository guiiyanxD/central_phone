import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { AnularVentaDto } from './dto/anular-venta.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario, EstadoVenta } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  // Métodos de pago disponibles (Efectivo, QR Simple Oficial, Transferencia)
  @Get('metodos-pago')
  async getMetodosPago() {
    return this.ventasService.getMetodosPago();
  }

  // Reporte Financiero de Rentabilidad Neta Consolidada (US17 - Exclusivo ADMIN)
  @Get('reporte-rentabilidad')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async getReporteRentabilidad(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('sucursalId') sucursalId?: string,
  ) {
    return this.ventasService.getReporteRentabilidad(
      fechaInicio,
      fechaFin,
      sucursalId ? parseInt(sucursalId, 10) : undefined,
    );
  }

  // Registrar venta en mostrador POS
  @Post()
  async createVenta(@CurrentUser() user: any, @Body() dto: CreateVentaDto) {
    return this.ventasService.createVenta(user.id, user.sucursalId, dto);
  }

  // Anulación atómica de venta con rollback de stock (US19 - Exclusivo ADMIN)
  @Patch(':id/anular')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async anularVenta(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') adminId: number,
    @Body() dto: AnularVentaDto,
  ) {
    return this.ventasService.anularVenta(id, adminId, dto);
  }

  // Listar ventas realizadas con ganancia en 3FN
  @Get()
  async findAll(
    @Query('cajaId') cajaId?: string,
    @Query('sucursalId') sucursalId?: string,
    @Query('estado') estado?: EstadoVenta,
  ) {
    return this.ventasService.findAll(
      cajaId ? parseInt(cajaId, 10) : undefined,
      sucursalId ? parseInt(sucursalId, 10) : undefined,
      estado,
    );
  }

  // Consultar recibo de venta individual
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.findOne(id);
  }
}
