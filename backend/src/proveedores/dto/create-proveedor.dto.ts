import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProveedorDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre del contacto es obligatorio.' })
  nombre: string;

  @IsString({ message: 'El apellido debe ser una cadena de texto.' })
  @IsOptional()
  apellido?: string;

  @IsString({ message: 'La empresa debe ser una cadena de texto.' })
  @IsOptional()
  empresa?: string;

  @IsString({ message: 'El teléfono debe ser una cadena de texto.' })
  @IsOptional()
  telefono?: string;

  @IsString({ message: 'El contacto de referencia debe ser texto.' })
  @IsOptional()
  contactoReferencia?: string;
}
