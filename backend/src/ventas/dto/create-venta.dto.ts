import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LineaVentaDispositivoDto } from './linea-venta-dispositivo.dto';
import { LineaVentaAccesorioDto } from './linea-venta-accesorio.dto';
import { ClienteDto } from './cliente.dto';

export class CreateVentaDto {
  @IsString({ message: 'El código de método de pago es obligatorio.' })
  @IsNotEmpty({ message: 'Método de pago requerido (EFECTIVO, QR_SIMPLE, TRANSFERENCIA).' })
  metodoPagoCodigo: string;

  @IsString()
  @IsOptional()
  comprobanteReferencia?: string;

  @IsString()
  @IsOptional()
  comprobanteImagenUrl?: string;

  @ValidateNested()
  @Type(() => ClienteDto)
  @IsOptional()
  cliente?: ClienteDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaVentaDispositivoDto)
  @IsOptional()
  dispositivos?: LineaVentaDispositivoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaVentaAccesorioDto)
  @IsOptional()
  accesorios?: LineaVentaAccesorioDto[];

  @IsNumber()
  @IsOptional()
  cajaId?: number;

  @IsNumber()
  @IsOptional()
  sucursalId?: number;
}
