import { IsOptional, IsString } from 'class-validator';

export class UpdateProveedorDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  contactoReferencia?: string;
}
