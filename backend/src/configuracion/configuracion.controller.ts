import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { UpdateConfiguracionDto } from './dto/update-configuracion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolUsuario } from '@prisma/client';

@Controller('configuracion')
@UseGuards(JwtAuthGuard)
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  // Lectura del QR oficial y parámetros (incluyendo TC) para Vendedores y Administradores
  @Get()
  async getConfiguracion() {
    return this.configuracionService.getConfiguracion();
  }

  // Modificación del QR y cuenta bancaria restringida EXCLUSIVAMENTE a rol ADMIN
  @Put()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async updateConfiguracion(
    @Body() dto: UpdateConfiguracionDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.configuracionService.updateConfiguracion(dto, adminId);
  }

  // Sincronización manual de Tipo de Cambio con API externa WaveSoft Cloud (solo ADMIN)
  @Post('tipo-cambio/sincronizar')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async sincronizarTipoCambio(@CurrentUser('id') adminId: number) {
    return this.configuracionService.sincronizarTipoCambio(adminId);
  }
}
