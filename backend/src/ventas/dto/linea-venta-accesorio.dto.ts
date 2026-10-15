import { IsNotEmpty, IsNumber, IsPositive, Min } from 'class-validator';

export class LineaVentaAccesorioDto {
  @IsNumber({}, { message: 'El ID del lote de accesorio debe ser numérico.' })
  @IsNotEmpty({ message: 'El lote de accesorio es obligatorio.' })
  loteAccesorioId: number;

  @IsNumber({}, { message: 'La cantidad debe ser numérica.' })
  @Min(1, { message: 'La cantidad mínima es 1 unidad.' })
  @IsNotEmpty({ message: 'La cantidad es obligatoria.' })
  cantidad: number;

  @IsNumber({}, { message: 'El precio de venta en Bs debe ser numérico.' })
  @IsPositive({ message: 'El precio de venta debe ser mayor a 0.' })
  @IsNotEmpty({ message: 'El precio de venta es obligatorio.' })
  precioVentaBs: number;
}
