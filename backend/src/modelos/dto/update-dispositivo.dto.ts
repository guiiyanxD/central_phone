import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateDispositivoDto {
  @IsString()
  @Length(8, 20, { message: 'El IMEI 1 debe tener entre 8 y 20 caracteres.' })
  @IsOptional()
  imei1?: string;

  @IsString()
  @Length(8, 20, { message: 'El IMEI 2 debe tener entre 8 y 20 caracteres.' })
  @IsOptional()
  imei2?: string;

  @IsString()
  @Length(3, 50, { message: 'El número de serie debe tener entre 3 y 50 caracteres.' })
  @IsOptional()
  numeroSerie?: string;

  @IsInt({ message: 'El porcentaje de batería debe ser un número entero.' })
  @Min(1, { message: 'El porcentaje de batería mínimo es 1%.' })
  @Max(100, { message: 'El porcentaje de batería máximo es 100%.' })
  @IsOptional()
  porcentajeBateria?: number;

  @IsString()
  @MaxLength(255, { message: 'Los detalles físicos no pueden superar los 255 caracteres.' })
  @IsOptional()
  detallesFisicos?: string;

  @IsNumber({}, { message: 'El costo de compra/toma en Bs debe ser numérico.' })
  @Min(0.01, { message: 'El costo de compra en Bs debe ser mayor a 0.' })
  @IsOptional()
  costoBs?: number;
}
