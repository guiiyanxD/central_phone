import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { RolUsuario } from '@prisma/client';

export class RegisterDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @IsEnum(RolUsuario, { message: 'El rol debe ser ADMIN o VENDEDOR.' })
  @IsOptional()
  rol?: RolUsuario;

  @IsOptional()
  sucursalId?: number;
}
