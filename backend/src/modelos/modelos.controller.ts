import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ModelosService } from './modelos.service';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { UpdateModeloDto } from './dto/update-modelo.dto';
import { CreateTipoDispositivoDto } from './dto/create-tipo-dispositivo.dto';
import { UpdateTipoDispositivoDto } from './dto/update-tipo-dispositivo.dto';
import { AddVarianteDto } from './dto/add-variante.dto';
import { UpdateVarianteDto } from './dto/update-variante.dto';
import { QueryDispositivosDto } from './dto/query-dispositivos.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('modelos')
@UseGuards(JwtAuthGuard)
export class ModelosController {
  constructor(private readonly modelosService: ModelosService) {}

  @Get()
  async findAll() {
    return this.modelosService.findAll();
  }

  // Listado de inventario de equipos físicos con paginación y búsqueda multi-criterio
  @Get('dispositivos')
  async findDispositivos(
    @Query() query: QueryDispositivosDto,
    @CurrentUser('rol') userRole?: string,
  ) {
    return this.modelosService.findDispositivos(query, userRole);
  }

  // US18: Línea de vida y trazabilidad completa por IMEI
  @Get('dispositivos/:imei/linea-vida')
  async getLineaVida(
    @Param('imei') imei: string,
    @CurrentUser('rol') userRole?: string,
  ) {
    return this.modelosService.getLineaVidaImei(imei, userRole);
  }

  // --- TIPOS DE DISPOSITIVOS ---
  @Get('tipos')
  async findAllTipos() {
    return this.modelosService.findAllTiposDispositivo();
  }

  @Post('tipos')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async createTipo(@Body() dto: CreateTipoDispositivoDto) {
    return this.modelosService.createTipoDispositivo(dto);
  }

  @Put('tipos/:id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async updateTipo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoDispositivoDto,
  ) {
    return this.modelosService.updateTipoDispositivo(id, dto);
  }

  @Delete('tipos/:id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async deleteTipo(@Param('id', ParseIntPipe) id: number) {
    return this.modelosService.deleteTipoDispositivo(id);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modelosService.findOne(id);
  }

  // Alta de nuevo modelo (Admin y Vendedor)
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN, RolUsuario.VENDEDOR)
  async create(@Body() createModeloDto: CreateModeloDto) {
    return this.modelosService.create(createModeloDto);
  }

  // Modificar modelo existente (Exclusivo ADMIN)
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateModeloDto: UpdateModeloDto,
  ) {
    return this.modelosService.update(id, updateModeloDto);
  }

  // Eliminar modelo físicamente (Exclusivo ADMIN)
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.modelosService.delete(id);
  }

  // Agregar variante a modelo (Abierto a todos los usuarios autenticados)
  @Post(':id/variantes')
  async addVariante(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddVarianteDto,
  ) {
    return this.modelosService.addVariante(id, dto);
  }

  // Modificar variante existente (Exclusivo ADMIN)
  @Patch('variantes/:id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async updateVariante(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVarianteDto,
  ) {
    return this.modelosService.updateVariante(id, dto);
  }

  // Eliminar variante existente (Exclusivo ADMIN con validaciones de integridad)
  @Delete('variantes/:id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async deleteVariante(@Param('id', ParseIntPipe) id: number) {
    return this.modelosService.deleteVariante(id);
  }
}
