import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;
}
