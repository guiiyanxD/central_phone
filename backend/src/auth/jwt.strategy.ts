import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no configurado en variables de entorno');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: number; email: string; rol: string }) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
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

    if (!user || !user.activo) {
      throw new UnauthorizedException('El usuario no existe o se encuentra inactivo.');
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
