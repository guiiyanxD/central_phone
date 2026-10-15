import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddVarianteDto {
  @IsString({ message: 'El color debe ser texto.' })
  @IsNotEmpty({ message: 'El color es obligatorio.' })
  color: string;

  @IsNumber({}, { message: 'La capacidad en GB debe ser un número entero (ej: 128, 256, 512, 1024).' })
  @IsNotEmpty({ message: 'La capacidad en GB es obligatoria.' })
  capacidadGb: number;

  @IsString()
  @IsOptional()
  tipoSim?: string;
}
