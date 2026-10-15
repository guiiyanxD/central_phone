import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class RegistrarGastoDto {
  @IsNumber({}, { message: 'El ID de la categoría de gasto debe ser numérico.' })
  @IsNotEmpty({ message: 'La categoría de gasto es obligatoria.' })
  categoriaId: number;

  @IsNumber({}, { message: 'El monto del gasto debe ser numérico.' })
  @IsPositive({ message: 'El monto del gasto debe ser mayor a 0 Bs.' })
  @IsNotEmpty({ message: 'El monto es obligatorio.' })
  montoBs: number;

  @IsString({ message: 'El concepto del gasto debe ser una descripción clara.' })
  @IsNotEmpty({ message: 'El concepto del gasto es obligatorio (ej: Compra 5 chips Tigo para clientes).' })
  concepto: string;

  @IsNumber({}, { message: 'El método de pago debe ser numérico.' })
  @IsOptional()
  metodoPagoId?: number;
}
