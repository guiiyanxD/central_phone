import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoriaDto {
  @IsString({ message: 'El nombre de la categoría debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio.' })
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}
