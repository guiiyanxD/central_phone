import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LineaVentaDispositivoDto } from './linea-venta-dispositivo.dto';
import { LineaVentaAccesorioDto } from './linea-venta-accesorio.dto';
import { ClienteDto } from './cliente.dto';
import { NuevaVarianteInlineDto } from '../../recepcion/dto/linea-dispositivo.dto';

export class PermutaTradeInDto {
  @IsNumber()
  @IsOptional()
  varianteId?: number;

  @ValidateNested()
  @Type(() => NuevaVarianteInlineDto)
  @IsOptional()
  nuevaVariante?: NuevaVarianteInlineDto;

  @IsString({ message: 'El IMEI 1 del teléfono en permuta es obligatorio.' })
  @IsNotEmpty({ message: 'IMEI 1 requerido para permuta.' })
  imei1: string;

  @IsString()
  @IsOptional()
  imei2?: string;

  @IsString()
  @IsOptional()
  numeroSerie?: string;

  @IsInt({ message: 'El porcentaje de batería debe ser un número entero.' })
  @Min(1, { message: 'El porcentaje de batería mínimo es 1%.' })
  @Max(100, { message: 'El porcentaje de batería máximo es 100%.' })
  @IsNotEmpty({ message: 'El porcentaje de salud de batería es obligatorio.' })
  porcentajeBateria: number;

  @IsNumber({}, { message: 'El valor de toma acordado en Bs debe ser numérico.' })
  @Min(0.01, { message: 'El valor de toma en permuta debe ser mayor a 0.' })
  valorTomaBs: number;
}

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
  @IsNotEmpty({ message: 'Los datos del cliente son obligatorios para procesar la venta.' })
  cliente: ClienteDto;

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

  @ValidateNested()
  @Type(() => PermutaTradeInDto)
  @IsOptional()
  permuta?: PermutaTradeInDto;

  @IsNumber()
  @IsOptional()
  montoEfectivoMixtoBs?: number;
}
