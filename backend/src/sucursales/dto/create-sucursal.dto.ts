import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSucursalDto {
  @IsString({ message: 'El nombre de la sucursal debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre de la sucursal es obligatorio.' })
  nombre: string;

  @IsString({ message: 'La dirección debe ser texto.' })
  @IsNotEmpty({ message: 'La dirección es obligatoria.' })
  direccion: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  ciudad?: string;
}
