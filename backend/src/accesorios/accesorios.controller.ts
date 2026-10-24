import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccesoriosService } from './accesorios.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { CreateAccesorioDto } from './dto/create-accesorio.dto';
import { UpdateAccesorioDto } from './dto/update-accesorio.dto';
import { QueryLotesDto } from './dto/query-lotes.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolUsuario } from '@prisma/client';

@Controller('accesorios')
@UseGuards(JwtAuthGuard)
export class AccesoriosController {
  constructor(private readonly accesoriosService: AccesoriosService) {}

  // --- CATEGORÍAS ---
  @Get('categorias')
  async findAllCategorias() {
    return this.accesoriosService.findAllCategorias();
  }

  @Post('categorias')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async createCategoria(@Body() dto: CreateCategoriaDto) {
    return this.accesoriosService.createCategoria(dto);
  }

  // --- ACCESORIOS BASE ---
  @Get()
  async findAll(
    @CurrentUser('rol') userRole?: string,
    @Query('categoriaId') categoriaId?: string,
    @Query('sucursalId') sucursalId?: string,
  ) {
    return this.accesoriosService.findAll(
      categoriaId ? parseInt(categoriaId, 10) : undefined,
      sucursalId ? parseInt(sucursalId, 10) : undefined,
      userRole,
    );
  }

  // --- INVENTARIO DE LOTES FÍSICOS CON PAGINACIÓN Y FILTROS ---
  @Get('lotes')
  async findLotes(
    @Query() query: QueryLotesDto,
    @CurrentUser('rol') userRole?: string,
  ) {
    return this.accesoriosService.findLotes(query, userRole);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('rol') userRole?: string,
  ) {
    return this.accesoriosService.findOne(id, userRole);
  }

  @Post()
  async createAccesorio(@Body() dto: CreateAccesorioDto) {
    return this.accesoriosService.createAccesorio(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async updateAccesorio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAccesorioDto,
  ) {
    return this.accesoriosService.updateAccesorio(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async deleteAccesorio(@Param('id', ParseIntPipe) id: number) {
    return this.accesoriosService.deleteAccesorio(id);
  }
}
