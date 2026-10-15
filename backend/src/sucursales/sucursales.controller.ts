import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '@prisma/client';

@Controller('sucursales')
@UseGuards(JwtAuthGuard)
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Get()
  async findAll(@Query('includeInactivas') includeInactivas?: string) {
    return this.sucursalesService.findAll(includeInactivas === 'true');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sucursalesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async create(@Body() createSucursalDto: CreateSucursalDto) {
    return this.sucursalesService.create(createSucursalDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSucursalDto: UpdateSucursalDto,
  ) {
    return this.sucursalesService.update(id, updateSucursalDto);
  }
}
