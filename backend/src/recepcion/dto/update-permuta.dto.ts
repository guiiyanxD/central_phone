import {
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
import { ProveedorMinoristaDto } from './create-permuta.dto';

export class UpdateDispositivoPermutaDto {
  @IsNumber()
  @IsOptional()
  varianteId?: number;

  @IsString()
  @IsOptional()
  numeroSerie?: string;

  @IsString()
  @IsOptional()
  imei1?: string;

  @IsString()
  @IsOptional()
  imei2?: string;

  @IsInt({ message: 'El porcentaje de batería debe ser un número entero.' })
  @Min(1, { message: 'El porcentaje de batería mínimo es 1%.' })
  @Max(100, { message: 'El porcentaje de batería máximo es 100%.' })
  @IsOptional()
  porcentajeBateria?: number;

  @IsNumber({}, { message: 'El costo de compra/toma en Bs debe ser numérico.' })
  @Min(1, { message: 'El costo de compra en Bs debe ser mayor a 0.' })
  @IsOptional()
  costoBs?: number;
}

export class UpdatePermutaDto {
  @ValidateNested()
  @Type(() => ProveedorMinoristaDto)
  @IsOptional()
  proveedorMinorista?: ProveedorMinoristaDto;

  @ValidateNested()
  @Type(() => UpdateDispositivoPermutaDto)
  @IsOptional()
  dispositivo?: UpdateDispositivoPermutaDto;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsDateString({}, { message: 'La fecha de ingreso debe ser una fecha válida (formato ISO).' })
  @IsOptional()
  fechaIngreso?: string;
}
