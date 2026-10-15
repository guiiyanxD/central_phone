import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RolUsuario } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.usuario.findUnique({
      where: { email },
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales de acceso incorrectas.');
    }

    if (!user.activo) {
      throw new UnauthorizedException('La cuenta de usuario está desactivada.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales de acceso incorrectas.');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      sucursalId: user.sucursalId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        sucursal: user.sucursal,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { nombre, email, password, rol, sucursalId } = registerDto;

    const existingUser = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Ya existe un usuario registrado con este correo.');
    }

    if (sucursalId) {
      const sucursal = await this.prisma.sucursal.findUnique({
        where: { id: sucursalId },
      });
      if (!sucursal) {
        throw new NotFoundException('La sucursal especificada no existe.');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await this.prisma.usuario.create({
      data: {
        nombre,
        email,
        passwordHash,
        rol: rol || RolUsuario.VENDEDOR,
        sucursalId: sucursalId || null,
      },
      include: {
        sucursal: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
          },
        },
      },
    });

    const { passwordHash: _, ...result } = newUser;
    return result;
  }

  async getMe(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        sucursal: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const { passwordHash: _, ...result } = user;
    return result;
  }
}
