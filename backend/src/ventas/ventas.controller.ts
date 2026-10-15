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
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
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

  // Registrar venta en mostrador POS
  @Post()
  async createVenta(@CurrentUser() user: any, @Body() dto: CreateVentaDto) {
    return this.ventasService.createVenta(user.id, user.sucursalId, dto);
  }

  // Listar ventas realizadas con ganancia en 3FN
  @Get()
  async findAll(
    @Query('cajaId') cajaId?: string,
    @Query('sucursalId') sucursalId?: string
  ) {
    return this.ventasService.findAll(
      cajaId ? parseInt(cajaId, 10) : undefined,
      sucursalId ? parseInt(sucursalId, 10) : undefined
    );
  }

  // Consultar recibo de venta individual
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ventasService.findOne(id);
  }
}
