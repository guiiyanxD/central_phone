import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAccesorioDto {
  @IsNumber({}, { message: 'El ID de la categoría debe ser un número.' })
  @IsNotEmpty({ message: 'La categoría es obligatoria.' })
  categoriaId: number;

  @IsString({ message: 'El nombre del accesorio debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del accesorio base es obligatorio (ej: Funda iPhone 13).' })
  nombre: string;

  @IsString({ message: 'La descripción del accesorio debe ser texto.' })
  @IsOptional()
  descripcion?: string;
}
