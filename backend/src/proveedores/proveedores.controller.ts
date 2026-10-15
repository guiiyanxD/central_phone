import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolUsuario } from '@prisma/client';

@Controller('proveedores')
@UseGuards(JwtAuthGuard)
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Get()
  async findAll() {
    return this.proveedoresService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.proveedoresService.findOne(id);
  }

  @Post()
  async create(@Body() createProveedorDto: CreateProveedorDto) {
    return this.proveedoresService.create(createProveedorDto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RolUsuario.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProveedorDto: UpdateProveedorDto,
  ) {
    return this.proveedoresService.update(id, updateProveedorDto);
  }
}
