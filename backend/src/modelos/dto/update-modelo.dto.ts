import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateModeloDto {
  @IsString({ message: 'El nombre del modelo debe ser texto.' })
  @MinLength(2, { message: 'El nombre del modelo debe tener al menos 2 caracteres.' })
  @IsOptional()
  nombreModelo?: string;

  @IsString({ message: 'La marca debe ser texto.' })
  @IsOptional()
  marca?: string;

  @IsString({ message: 'El tipo de dispositivo debe ser texto.' })
  @IsOptional()
  tipo?: string;

  @IsNumber({}, { message: 'El ID del tipo de dispositivo debe ser numérico.' })
  @IsOptional()
  tipoId?: number;

  @IsString({ message: 'La descripción debe ser texto.' })
  @IsOptional()
  descripcion?: string;
}
