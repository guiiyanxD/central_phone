import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CajaService } from './caja.service';
import { AbrirCajaDto } from './dto/abrir-caja.dto';
import { CerrarCajaDto } from './dto/cerrar-caja.dto';
import { RegistrarGastoDto } from './dto/registrar-gasto.dto';
import { QueryHistorialDto } from './dto/query-historial.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolUsuario } from '@prisma/client';

@Controller('caja')
@UseGuards(JwtAuthGuard)
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  // Obtener sesión de caja actualmente activa de la sucursal
  @Get('activa')
  async getSesionActiva(
    @CurrentUser() user: any,
    @Query('sucursalId') sucursalId?: string,
  ) {
    const targetSucursalId =
      user.rol === RolUsuario.ADMIN && sucursalId
        ? parseInt(sucursalId, 10)
        : user.sucursalId;
    return this.cajaService.getSesionActiva(targetSucursalId);
  }

  // Apertura de caja de la sucursal
  @Post('abrir')
  async abrirCaja(@CurrentUser() user: any, @Body() dto: AbrirCajaDto) {
    return this.cajaService.abrirCaja(user.id, user.sucursalId, dto, user.rol);
  }

  // Cierre de caja con arqueo físico a ciegas (US12)
  @Post(':id/cerrar')
  async cerrarCaja(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: CerrarCajaDto,
  ) {
    return this.cajaService.cerrarCaja(id, user.id, user.sucursalId, dto, user.rol);
  }

  // Registro de gasto operativo menor (US13)
  @Post(':id/gastos')
  async registrarGasto(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: RegistrarGastoDto,
  ) {
    return this.cajaService.registrarGasto(id, user.id, user.sucursalId, dto, user.rol);
  }

  // Categorías de gastos operativos
  @Get('categorias-gasto')
  async getCategoriasGasto() {
    return this.cajaService.getCategoriasGasto();
  }

  // Usuarios/Cajeros activos para filtros de auditoría
  @Get('usuarios')
  async getUsuariosCaja(@Query('sucursalId') sucursalId?: string) {
    return this.cajaService.getUsuariosCaja(
      sucursalId ? parseInt(sucursalId, 10) : undefined,
    );
  }

  // Historial de cajas cerradas
  @Get('historial')
  async getHistorial(
    @CurrentUser() user: any,
    @Query() query: QueryHistorialDto,
  ) {
    return this.cajaService.getHistorial(query, user.rol, user.sucursalId);
  }

  // Consultar detalle completo de una caja con sus ventas y gastos (US12 / Auditoría ADMIN)
  @Get(':id/detalle')
  async getCajaDetalle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.cajaService.getCajaDetalle(id, user.rol, user.sucursalId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.cajaService.getCajaDetalle(id, user.rol, user.sucursalId);
  }
}
