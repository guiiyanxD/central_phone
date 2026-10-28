import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LineaDispositivoDto } from './linea-dispositivo.dto';
import { LineaLoteAccesorioDto } from './linea-lote-accesorio.dto';

export class UpdateNotaIngresoDto {
  @IsNumber({}, { message: 'El ID del proveedor debe ser numérico.' })
  @IsOptional()
  proveedorId?: number;

  @IsNumber({}, { message: 'El ID de la sucursal de destino debe ser numérico.' })
  @IsOptional()
  sucursalId?: number;

  @IsString()
  @IsOptional()
  numeroComprobante?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaDispositivoDto)
  @IsOptional()
  dispositivos?: LineaDispositivoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaLoteAccesorioDto)
  @IsOptional()
  accesorios?: LineaLoteAccesorioDto[];
}
