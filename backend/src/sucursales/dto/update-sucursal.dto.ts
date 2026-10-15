import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSucursalDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsString()
  @IsOptional()
  telefono?: string;

  @IsString()
  @IsOptional()
  ciudad?: string;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
