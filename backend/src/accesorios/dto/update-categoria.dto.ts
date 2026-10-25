import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoriaDto {
  @IsString({ message: 'El nombre de la categoría debe ser texto.' })
  @IsOptional()
  nombre?: string;

  @IsString({ message: 'La descripción de la categoría debe ser texto.' })
  @IsOptional()
  descripcion?: string;
}
