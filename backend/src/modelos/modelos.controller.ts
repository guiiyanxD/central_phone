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
import { ModelosService } from './modelos.service';
import { CreateModeloDto } from './dto/create-modelo.dto';
import { AddVarianteDto } from './dto/add-variante.dto';
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

  // Listado de inventario de equipos físicos con búsqueda de IMEI / Serie
  @Get('dispositivos')
  async findDispositivos(
    @Query('sucursalId') sucursalId?: string,
    @Query('estado') estado?: string,
    @Query('busqueda') busqueda?: string,
    @CurrentUser('rol') userRole?: string,
  ) {
    return this.modelosService.findDispositivos(
      sucursalId ? parseInt(sucursalId, 10) : undefined,
      estado,
      busqueda,
      userRole,
    );
  }

  // US18: Línea de vida y trazabilidad completa por IMEI
  @Get('dispositivos/:imei/linea-vida')
  async getLineaVida(
    @Param('imei') imei: string,
    @CurrentUser('rol') userRole?: string,
  ) {
    return this.modelosService.getLineaVidaImei(imei, userRole);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modelosService.findOne(id);
  }

  // Alta de nuevo modelo (Admin)
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async create(@Body() createModeloDto: CreateModeloDto) {
    return this.modelosService.create(createModeloDto);
  }

  // Agregar variante a modelo (Admin o Vendedor en recepción in-line)
  @Post(':id/variantes')
  async addVariante(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddVarianteDto,
  ) {
    return this.modelosService.addVariante(id, dto);
  }

  // Importar combinaciones oficiales desde CSV
  @Post('importar-csv')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async importarCsv(@Body() body: any) {
    const csvContent = typeof body === 'string' ? body : (body?.csvContent ?? '');
    if (typeof csvContent === 'string' && csvContent.trim().length > 0) {
      return this.modelosService.importarDesdeCsv(csvContent);
    }
    return this.modelosService.importarArchivoLocalDefault();
  }
}
