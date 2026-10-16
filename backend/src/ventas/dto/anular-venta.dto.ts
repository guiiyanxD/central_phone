import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AnularVentaDto {
  @IsNotEmpty({ message: 'El motivo de anulación es obligatorio.' })
  @IsString({ message: 'El motivo de anulación debe ser un texto válido.' })
  @MinLength(10, { message: 'El motivo de anulación debe contener al menos 10 caracteres.' })
  motivo: string;
}
