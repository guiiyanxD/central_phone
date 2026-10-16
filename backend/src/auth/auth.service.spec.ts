import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrismaService;
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = createPrismaMock();
    jwtService = { signAsync: jest.fn().mockResolvedValue('jwt_mock_token_123') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'inexistente@centralphone.com', password: '123' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la cuenta de usuario está desactivada', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        email: 'inactivo@centralphone.com',
        activo: false,
      } as any);

      await expect(
        service.login({ email: 'inactivo@centralphone.com', password: '123' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const hash = await bcrypt.hash('password_correcto', 10);
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        email: 'user@centralphone.com',
        passwordHash: hash,
        activo: true,
      } as any);

      await expect(
        service.login({ email: 'user@centralphone.com', password: 'password_erroneo' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe autenticar exitosamente y retornar token JWT y datos de sesión', async () => {
      const hash = await bcrypt.hash('admin123', 10);
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        nombre: 'Admin Central',
        email: 'admin@centralphone.com',
        passwordHash: hash,
        rol: 'ADMIN',
        activo: true,
        sucursalId: 1,
        sucursal: { id: 1, nombre: 'Sucursal Central', ciudad: 'La Paz' },
      } as any);

      const res = await service.login({ email: 'admin@centralphone.com', password: 'admin123' });
      expect(res.accessToken).toBe('jwt_mock_token_123');
      expect(res.user.nombre).toBe('Admin Central');
    });
  });

  describe('register', () => {
    it('debe lanzar ConflictException si el correo ya está registrado', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 1 } as any);

      await expect(
        service.register({
          nombre: 'Nuevo',
          email: 'yaexiste@centralphone.com',
          password: 'password',
          sucursalId: 1,
        })
      ).rejects.toThrow(ConflictException);
    });

    it('debe lanzar NotFoundException si la sucursal no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.sucursal.findUnique.mockResolvedValue(null);

      await expect(
        service.register({
          nombre: 'Nuevo',
          email: 'nuevo@centralphone.com',
          password: 'password',
          sucursalId: 999,
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('debe registrar el usuario exitosamente y retornar datos del nuevo usuario', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);
      prisma.sucursal.findUnique.mockResolvedValue({ id: 1, nombre: 'Central', ciudad: 'La Paz' } as any);

      prisma.usuario.create.mockResolvedValue({
        id: 10,
        nombre: 'Carlos Vendedor',
        email: 'carlos@centralphone.com',
        rol: 'VENDEDOR',
        sucursal: { id: 1, nombre: 'Central', ciudad: 'La Paz' },
      } as any);

      const res = await service.register({
        nombre: 'Carlos Vendedor',
        email: 'carlos@centralphone.com',
        password: 'password123',
        sucursalId: 1,
      });

      expect(res.id).toBe(10);
      expect(res.email).toBe('carlos@centralphone.com');
    });
  });

  describe('getMe', () => {
    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.getMe(999)).rejects.toThrow(NotFoundException);
    });

    it('debe retornar el perfil del usuario autenticado', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 2, nombre: 'Vendedor', sucursal: null } as any);

      const res = await service.getMe(2);
      expect(res.nombre).toBe('Vendedor');
    });
  });
});
