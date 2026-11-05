import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateGastoDispositivoDto {
  @IsString({ message: 'El concepto del gasto debe ser texto.' })
  @IsOptional()
  concepto?: string;

  @IsNumber({}, { message: 'El costo en Bolivianos (Bs) debe ser numérico.' })
  @Min(0.01, { message: 'El costo del gasto debe ser mayor a 0.' })
  @IsOptional()
  costoBs?: number;

  @IsString()
  @IsOptional()
  observacion?: string;

  @IsDateString({}, { message: 'La fecha del gasto debe tener un formato de fecha válido.' })
  @IsOptional()
  fechaGasto?: string;
}
