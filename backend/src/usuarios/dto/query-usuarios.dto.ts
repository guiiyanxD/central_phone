import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { RolUsuario } from '@prisma/client';

export class QueryUsuariosDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sucursalId?: number;

  @IsEnum(RolUsuario)
  @IsOptional()
  rol?: RolUsuario;

  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}
