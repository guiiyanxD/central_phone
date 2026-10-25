import { IsOptional, IsString } from 'class-validator';

export class UpdateTipoDispositivoDto {
  @IsString({ message: 'El nombre del tipo de dispositivo debe ser texto.' })
  @IsOptional()
  nombre?: string;

  @IsString({ message: 'La descripción debe ser texto.' })
  @IsOptional()
  descripcion?: string;
}
