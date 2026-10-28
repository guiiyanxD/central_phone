import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AnularNotaIngresoDto {
  @IsString({ message: 'El motivo de anulación debe ser texto.' })
  @IsNotEmpty({ message: 'El motivo de anulación es obligatorio.' })
  @MinLength(5, { message: 'El motivo de anulación debe tener al menos 5 caracteres.' })
  motivo: string;
}
