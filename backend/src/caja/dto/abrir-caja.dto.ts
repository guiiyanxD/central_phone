import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AbrirCajaDto {
  @IsNumber({}, { message: 'El monto inicial en efectivo debe ser numérico.' })
  @Min(0, { message: 'El monto inicial en efectivo no puede ser negativo.' })
  @IsNotEmpty({ message: 'El monto inicial de apertura es obligatorio.' })
  montoInicialEfectivo: number;

  @IsNumber({}, { message: 'La sucursal es obligatoria.' })
  @IsNotEmpty({ message: 'El ID de la sucursal es obligatorio.' })
  sucursalId: number;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
