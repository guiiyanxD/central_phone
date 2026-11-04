import { IsNotEmpty, IsString } from 'class-validator';

export class AnularGastoDispositivoDto {
  @IsString({ message: 'El motivo de anulación debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El motivo de anulación es obligatorio para auditoría.' })
  motivo: string;
}
