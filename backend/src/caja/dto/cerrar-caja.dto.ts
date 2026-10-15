import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CerrarCajaDto {
  @IsNumber({}, { message: 'El monto físico contado en efectivo debe ser numérico.' })
  @Min(0, { message: 'El conteo físico no puede ser negativo.' })
  @IsNotEmpty({ message: 'El conteo físico a ciegas es obligatorio para el arqueo de cierre.' })
  montoFinalEfectivo: number;

  @IsString({ message: 'La justificación debe ser texto explicativo.' })
  @IsOptional()
  justificacion?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;
}
