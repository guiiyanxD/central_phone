import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateGastoDispositivoDto {
  @IsString({ message: 'El concepto del gasto es obligatorio.' })
  @IsNotEmpty({ message: 'El concepto no puede estar vacío.' })
  concepto: string;

  @IsNumber({}, { message: 'El costo en Bolivianos (Bs) debe ser numérico.' })
  @Min(0.01, { message: 'El costo del gasto debe ser mayor a 0.' })
  costoBs: number;

  @IsString()
  @IsOptional()
  observacion?: string;

  @IsBoolean()
  @IsOptional()
  aplicoEnCaja?: boolean; // Por defecto true
}
