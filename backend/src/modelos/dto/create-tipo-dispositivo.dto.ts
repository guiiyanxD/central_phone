import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTipoDispositivoDto {
  @IsString({ message: 'El nombre del tipo de dispositivo debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del tipo de dispositivo es obligatorio.' })
  nombre: string;

  @IsString({ message: 'La descripción debe ser texto.' })
  @IsOptional()
  descripcion?: string;
}
