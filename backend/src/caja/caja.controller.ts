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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('caja')
@UseGuards(JwtAuthGuard)
export class CajaController {
  constructor(private readonly cajaService: CajaService) {}

  // Obtener sesión de caja actualmente activa
  @Get('activa')
  async getSesionActiva(
    @CurrentUser() user: any,
    @Query('sucursalId') sucursalId?: string
  ) {
    return this.cajaService.getSesionActiva(
      user.id,
      sucursalId ? parseInt(sucursalId, 10) : user.sucursalId
    );
  }

  // Apertura de turno de caja
  @Post('abrir')
  async abrirCaja(@CurrentUser() user: any, @Body() dto: AbrirCajaDto) {
    return this.cajaService.abrirCaja(user.id, dto);
  }

  // Cierre de caja con arqueo físico a ciegas (US12)
  @Post(':id/cerrar')
  async cerrarCaja(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: CerrarCajaDto
  ) {
    return this.cajaService.cerrarCaja(id, user.id, dto);
  }

  // Registro de gasto operativo menor (US13)
  @Post(':id/gastos')
  async registrarGasto(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() dto: RegistrarGastoDto
  ) {
    return this.cajaService.registrarGasto(id, user.id, dto);
  }

  // Categorías de gastos operativos
  @Get('categorias-gasto')
  async getCategoriasGasto() {
    return this.cajaService.getCategoriasGasto();
  }

  // Historial de cajas cerradas
  @Get('historial')
  async getHistorial(@Query('sucursalId') sucursalId?: string) {
    return this.cajaService.getHistorial(
      sucursalId ? parseInt(sucursalId, 10) : undefined
    );
  }
}
