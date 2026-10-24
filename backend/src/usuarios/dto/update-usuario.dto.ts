import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { RolUsuario } from '@prisma/client';

export class UpdateUsuarioDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsOptional()
  nombre?: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto.' })
  @IsOptional()
  apellido?: string;

  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @Matches(/@centralphone\.com$/i, {
    message: 'El correo electrónico debe pertenecer obligatoriamente al dominio @centralphone.com',
  })
  @IsOptional()
  email?: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsOptional()
  telefono?: string;

  @Type(() => Number)
  @IsInt({ message: 'El ID de sucursal debe ser un número entero.' })
  @IsOptional()
  sucursalId?: number | null;

  @IsEnum(RolUsuario, { message: 'El rol debe ser ADMIN o VENDEDOR.' })
  @IsOptional()
  rol?: RolUsuario;
}
