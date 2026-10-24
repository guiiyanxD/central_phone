import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProveedorDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto.' })
  @IsOptional()
  nombre?: string;

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

  @IsBoolean({ message: 'El estado activo debe ser un valor booleano.' })
  @IsOptional()
  activo?: boolean;
}
