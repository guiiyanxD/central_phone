import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock, MockPrismaService } from '../prisma/prisma.mock';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  describe('findAll', () => {
    it('debe retornar lista de usuarios filtrados', async () => {
      const mockUsers = [
        {
          id: 1,
          nombre: 'Admin',
          apellido: 'Principal',
          email: 'admin@centralphone.com',
          rol: RolUsuario.ADMIN,
          activo: true,
          sucursal: { id: 1, nombre: 'Sede Central', ciudad: 'Santa Cruz' },
        },
      ];
      prisma.usuario.findMany.mockResolvedValue(mockUsers as any);

      const res = await service.findAll({ search: 'Admin' });
      expect(res).toEqual(mockUsers);
      expect(prisma.usuario.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe retornar un usuario si existe', async () => {
      const mockUser = {
        id: 1,
        nombre: 'Admin',
        email: 'admin@centralphone.com',
        rol: RolUsuario.ADMIN,
      };
      prisma.usuario.findUnique.mockResolvedValue(mockUser as any);

      const res = await service.findOne(1);
      expect(res).toEqual(mockUser);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('debe lanzar BadRequestException si el correo no pertenece a @centralphone.com', async () => {
      await expect(
        service.create({
          nombre: 'Juan',
          email: 'juan@gmail.com',
          password: 'password123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe lanzar ConflictException con "Probar con otro nombre de usuario" si ya existe', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 2, email: 'juan@centralphone.com' } as any);

      await expect(
        service.create({
          nombre: 'Juan',
          email: 'juan@centralphone.com',
          password: 'password123',
        }),
      ).rejects.toThrow(new ConflictException('Probar con otro nombre de usuario'));
    });

    it('debe lanzar BadRequestException si la sucursal asignada no existe', async () => {
      prisma.usuario.findUnique.mockResolvedValueOnce(null); // email no existe
      prisma.sucursal.findUnique.mockResolvedValueOnce(null); // sucursal no existe

      await expect(
        service.create({
          nombre: 'Juan',
          email: 'juan@centralphone.com',
          password: 'password123',
          sucursalId: 999,
        }),
      ).rejects.toThrow(new BadRequestException('La sucursal seleccionada no existe.'));
    });

    it('debe crear el usuario correctamente con contraseña hasheada y dominio centralphone.com', async () => {
      prisma.usuario.findUnique.mockResolvedValueOnce(null);
      prisma.sucursal.findUnique.mockResolvedValueOnce({ id: 1, nombre: 'Sede Central' } as any);
      prisma.usuario.create.mockResolvedValue({
        id: 3,
        nombre: 'Carlos',
        apellido: 'Mendoza',
        email: 'carlos.mendoza@centralphone.com',
        telefono: '77712345',
        rol: RolUsuario.VENDEDOR,
        activo: true,
        sucursal: { id: 1, nombre: 'Sede Central', ciudad: 'Santa Cruz' },
      } as any);

      const res = await service.create({
        nombre: 'Carlos',
        apellido: 'Mendoza',
        email: 'carlos.mendoza@centralphone.com',
        telefono: '77712345',
        password: 'secretPassword123',
        sucursalId: 1,
        rol: RolUsuario.VENDEDOR,
      });

      expect(res.id).toBe(3);
      expect(res.email).toBe('carlos.mendoza@centralphone.com');
      expect(prisma.usuario.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('debe rechazar la auto-degradación de rol del propio administrador logueado', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        rol: RolUsuario.ADMIN,
        email: 'admin@centralphone.com',
      } as any);

      await expect(
        service.update(1, { rol: RolUsuario.VENDEDOR }, 1),
      ).rejects.toThrow(new BadRequestException('No puedes revocar tu propio rol de administrador.'));
    });

    it('debe lanzar ConflictException con "Probar con otro nombre de usuario" si cambia a email existente', async () => {
      prisma.usuario.findUnique
        .mockResolvedValueOnce({ id: 2, email: 'vendedor1@centralphone.com' } as any) // usuario a editar
        .mockResolvedValueOnce({ id: 3, email: 'vendedor2@centralphone.com' } as any); // conflicto

      await expect(
        service.update(2, { email: 'vendedor2@centralphone.com' }, 1),
      ).rejects.toThrow(new ConflictException('Probar con otro nombre de usuario'));
    });

    it('debe actualizar los datos correctamente', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 2,
        email: 'vendedor1@centralphone.com',
      } as any);
      prisma.usuario.update.mockResolvedValue({
        id: 2,
        nombre: 'Nuevo Nombre',
        apellido: 'Nuevo Apellido',
        email: 'vendedor1@centralphone.com',
      } as any);

      const res = await service.update(2, { nombre: 'Nuevo Nombre', apellido: 'Nuevo Apellido' }, 1);
      expect(res.nombre).toBe('Nuevo Nombre');
    });
  });

  describe('updatePassword', () => {
    it('debe actualizar la contraseña hasheada del usuario', async () => {
      prisma.usuario.findUnique.mockResolvedValue({ id: 2 } as any);
      prisma.usuario.update.mockResolvedValue({ id: 2 } as any);

      const res = await service.updatePassword(2, { password: 'newPassword123' });
      expect(res.message).toBe('Contraseña actualizada exitosamente.');
      expect(prisma.usuario.update).toHaveBeenCalled();
    });
  });

  describe('toggleStatus', () => {
    it('debe impedir que el administrador se auto-desactive', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 1,
        activo: true,
      } as any);

      await expect(service.toggleStatus(1, 1)).rejects.toThrow(
        new BadRequestException('No puedes desactivar tu propia cuenta de administrador.'),
      );
    });

    it('debe alternar el estado activo a inactivo en otro usuario', async () => {
      prisma.usuario.findUnique.mockResolvedValue({
        id: 2,
        activo: true,
      } as any);
      prisma.usuario.update.mockResolvedValue({
        id: 2,
        activo: false,
      } as any);

      const res = await service.toggleStatus(2, 1);
      expect(res.activo).toBe(false);
    });
  });
});
