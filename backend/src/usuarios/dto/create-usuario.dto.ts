import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { RolUsuario } from '@prisma/client';

export class CreateUsuarioDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto.' })
  @IsOptional()
  apellido?: string;

  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @Matches(/@centralphone\.com$/i, {
    message: 'El correo electrónico debe pertenecer obligatoriamente al dominio @centralphone.com',
  })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  email: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsOptional()
  telefono?: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @Type(() => Number)
  @IsInt({ message: 'El ID de sucursal debe ser un número entero.' })
  @IsOptional()
  sucursalId?: number;

  @IsEnum(RolUsuario, { message: 'El rol debe ser ADMIN o VENDEDOR.' })
  @IsOptional()
  rol?: RolUsuario;
}
