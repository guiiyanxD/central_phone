import {
  IsArray,
  IsBoolean,
  IsDateString,
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
import { NuevaVarianteInlineDto } from './linea-dispositivo.dto';

export class ProveedorMinoristaDto {
  @IsString({ message: 'El nombre del cliente/proveedor es obligatorio.' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío.' })
  nombre: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsString({ message: 'El teléfono de contacto es obligatorio.' })
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío.' })
  telefono: string;
}

export class GastoInicialPermutaDto {
  @IsString({ message: 'El concepto del gasto es obligatorio.' })
  @IsNotEmpty({ message: 'El concepto no puede estar vacío.' })
  concepto: string;

  @IsNumber({}, { message: 'El costo del gasto en Bs debe ser numérico.' })
  @Min(0.01, { message: 'El costo del gasto debe ser mayor a 0.' })
  costoBs: number;

  @IsString()
  @IsOptional()
  observacion?: string;

  @IsBoolean()
  @IsOptional()
  aplicoEnCaja?: boolean; // Por defecto true

  @IsDateString({}, { message: 'La fecha del gasto debe tener un formato de fecha válido.' })
  @IsOptional()
  fechaGasto?: string;
}

export class DispositivoPermutaDto {
  @IsNumber()
  @IsOptional()
  varianteId?: number;

  @ValidateNested()
  @Type(() => NuevaVarianteInlineDto)
  @IsOptional()
  nuevaVariante?: NuevaVarianteInlineDto;

  @IsString({ message: 'El número de serie es obligatorio.' })
  @IsNotEmpty({ message: 'Número de serie requerido.' })
  numeroSerie: string;

  @IsString({ message: 'El IMEI 1 es obligatorio.' })
  @IsNotEmpty({ message: 'IMEI 1 requerido.' })
  imei1: string;

  @IsString()
  @IsOptional()
  imei2?: string;

  @IsInt({ message: 'El porcentaje de batería debe ser un número entero.' })
  @Min(1, { message: 'El porcentaje de batería mínimo es 1%.' })
  @Max(100, { message: 'El porcentaje de batería máximo es 100%.' })
  @IsNotEmpty({ message: 'El porcentaje de salud de batería es obligatorio.' })
  porcentajeBateria: number;

  @IsNumber({}, { message: 'El costo de compra/toma en Bs debe ser numérico.' })
  @Min(1, { message: 'El costo de compra en Bs debe ser mayor a 0.' })
  costoBs: number;

  @IsString()
  @IsOptional()
  detallesFisicos?: string;
}

export class CreatePermutaDto {
  @ValidateNested()
  @Type(() => ProveedorMinoristaDto)
  @IsNotEmpty({ message: 'Los datos del proveedor minorista son obligatorios.' })
  proveedorMinorista: ProveedorMinoristaDto;

  @IsNumber({}, { message: 'La sucursal de destino es obligatoria.' })
  @IsNotEmpty({ message: 'Sucursal requerida.' })
  sucursalId: number;

  @ValidateNested()
  @Type(() => DispositivoPermutaDto)
  @IsNotEmpty({ message: 'Los datos del dispositivo iPhone son obligatorios.' })
  dispositivo: DispositivoPermutaDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GastoInicialPermutaDto)
  @IsOptional()
  gastosIniciales?: GastoInicialPermutaDto[];

  @IsString()
  @IsOptional()
  observaciones?: string;
}
