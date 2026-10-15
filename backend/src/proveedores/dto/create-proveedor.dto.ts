import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProveedorDto {
  @IsString({ message: 'El nombre del proveedor debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del proveedor es obligatorio (ej: Beby, Javier, Gabriela).' })
  nombre: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  contactoReferencia?: string;
}
