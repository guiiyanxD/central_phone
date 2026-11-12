import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoProveedor } from '@prisma/client';

export class QueryProveedorDto {
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  includeInactivos?: boolean;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(TipoProveedor, { message: 'El tipo debe ser MAYORISTA o MINORISTA.' })
  @IsOptional()
  tipo?: TipoProveedor;
}
