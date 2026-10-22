import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateVarianteDto {
  @IsString({ message: 'El color debe ser texto.' })
  @IsOptional()
  color?: string;

  @IsNumber({}, { message: 'La capacidad en GB debe ser un número entero (ej: 0, 128, 256, 512, 1024).' })
  @IsOptional()
  capacidadGb?: number;

  @IsString()
  @IsOptional()
  tipoSim?: string;
}
