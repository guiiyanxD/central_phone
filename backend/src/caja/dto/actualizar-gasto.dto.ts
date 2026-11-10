import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class ActualizarGastoDto {
  @IsNumber({}, { message: 'El ID de la categoría de gasto debe ser numérico.' })
  @IsOptional()
  categoriaId?: number;

  @IsNumber({}, { message: 'El monto del gasto debe ser numérico.' })
  @IsPositive({ message: 'El monto del gasto debe ser mayor a 0 Bs.' })
  @IsOptional()
  montoBs?: number;

  @IsString({ message: 'El concepto del gasto debe ser una descripción clara.' })
  @IsOptional()
  concepto?: string;

  @IsNumber({}, { message: 'El método de pago debe ser numérico.' })
  @IsOptional()
  metodoPagoId?: number;
}
