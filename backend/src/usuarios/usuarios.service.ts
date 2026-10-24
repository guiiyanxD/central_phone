import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma, RolUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { QueryUsuariosDto } from './dto/query-usuarios.dto';

@Injectable()
export class UsuariosService {
  private readonly userSelect = {
    id: true,
    sucursalId: true,
    nombre: true,
    apellido: true,
    email: true,
    telefono: true,
    rol: true,
    activo: true,
    creadoEn: true,
    actualizadoEn: true,
    sucursal: {
      select: {
        id: true,
        nombre: true,
        ciudad: true,
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUsuariosDto) {
    const { sucursalId, rol, activo, search } = query;

    const where: Prisma.UsuarioWhereInput = {};

    if (sucursalId !== undefined) {
      where.sucursalId = sucursalId;
    }

    if (rol !== undefined) {
      where.rol = rol;
    }

    if (activo !== undefined) {
      where.activo = activo;
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { nombre: { contains: term, mode: 'insensitive' } },
        { apellido: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    return this.prisma.usuario.findMany({
      where,
      select: this.userSelect,
      orderBy: { creadoEn: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    return user;
  }

  async create(dto: CreateUsuarioDto) {
    const email = dto.email.trim().toLowerCase();

    if (!email.endsWith('@centralphone.com')) {
      throw new BadRequestException('El correo debe pertenecer obligatoriamente al dominio @centralphone.com');
    }

    const existingUser = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Regla de seguridad UX: no revelar que ya está en uso, responder exactamente:
      throw new ConflictException('Probar con otro nombre de usuario');
    }

    if (dto.sucursalId) {
      const sucursalExists = await this.prisma.sucursal.findUnique({
        where: { id: dto.sucursalId },
      });
      if (!sucursalExists) {
        throw new BadRequestException('La sucursal seleccionada no existe.');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.usuario.create({
      data: {
        nombre: dto.nombre.trim(),
        apellido: dto.apellido?.trim() || null,
        email,
        telefono: dto.telefono?.trim() || null,
        passwordHash,
        rol: dto.rol || RolUsuario.VENDEDOR,
        sucursalId: dto.sucursalId || null,
        activo: true,
      },
      select: this.userSelect,
    });
  }

  async update(id: number, dto: UpdateUsuarioDto, currentUserId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    // Salvaguarda Anti-Auto-Bloqueo: el administrador no puede degradar su propio rol
    if (id === currentUserId && dto.rol && dto.rol !== RolUsuario.ADMIN) {
      throw new BadRequestException('No puedes revocar tu propio rol de administrador.');
    }

    let email = user.email;
    if (dto.email) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (!normalizedEmail.endsWith('@centralphone.com')) {
        throw new BadRequestException('El correo debe pertenecer obligatoriamente al dominio @centralphone.com');
      }

      if (normalizedEmail !== user.email) {
        const duplicate = await this.prisma.usuario.findUnique({
          where: { email: normalizedEmail },
        });
        if (duplicate) {
          throw new ConflictException('Probar con otro nombre de usuario');
        }
        email = normalizedEmail;
      }
    }

    if (dto.sucursalId) {
      const sucursalExists = await this.prisma.sucursal.findUnique({
        where: { id: dto.sucursalId },
      });
      if (!sucursalExists) {
        throw new BadRequestException('La sucursal seleccionada no existe.');
      }
    }

    const data: Prisma.UsuarioUpdateInput = {
      ...(dto.nombre && { nombre: dto.nombre.trim() }),
      ...(dto.apellido !== undefined && { apellido: dto.apellido?.trim() || null }),
      ...(dto.email && { email }),
      ...(dto.telefono !== undefined && { telefono: dto.telefono?.trim() || null }),
      ...(dto.rol && { rol: dto.rol }),
      ...(dto.sucursalId !== undefined && {
        sucursal: dto.sucursalId ? { connect: { id: dto.sucursalId } } : { disconnect: true },
      }),
    };

    return this.prisma.usuario.update({
      where: { id },
      data,
      select: this.userSelect,
    });
  }

  async updatePassword(id: number, dto: UpdatePasswordDto) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.usuario.update({
      where: { id },
      data: { passwordHash },
    });

    return {
      message: 'Contraseña actualizada exitosamente.',
    };
  }

  async toggleStatus(id: number, currentUserId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado.`);
    }

    // Salvaguarda Anti-Auto-Bloqueo: un administrador no puede desactivar su propia cuenta
    if (id === currentUserId && user.activo) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta de administrador.');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: !user.activo },
      select: this.userSelect,
    });
  }
}
