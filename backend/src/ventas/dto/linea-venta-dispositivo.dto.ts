import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class LineaVentaDispositivoDto {
  @IsNumber({}, { message: 'El ID del dispositivo físico debe ser numérico.' })
  @IsNotEmpty({ message: 'El dispositivo es obligatorio.' })
  dispositivoId: number;

  @IsNumber({}, { message: 'El precio de venta en Bs debe ser numérico.' })
  @IsPositive({ message: 'El precio de venta debe ser mayor a 0.' })
  @IsNotEmpty({ message: 'El precio de venta es obligatorio.' })
  precioVentaBs: number;
}
