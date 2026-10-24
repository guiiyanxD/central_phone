import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { QueryUsuariosDto } from './dto/query-usuarios.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  async findAll(@Query() query: QueryUsuariosDto) {
    return this.usuariosService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateUsuarioDto) {
    return this.usuariosService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUsuarioDto,
    @CurrentUser('id') currentUserId: number,
  ) {
    return this.usuariosService.update(id, updateDto, currentUserId);
  }

  @Patch(':id/password')
  async updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() passwordDto: UpdatePasswordDto,
  ) {
    return this.usuariosService.updatePassword(id, passwordDto);
  }

  @Patch(':id/toggle-status')
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') currentUserId: number,
  ) {
    return this.usuariosService.toggleStatus(id, currentUserId);
  }
}
