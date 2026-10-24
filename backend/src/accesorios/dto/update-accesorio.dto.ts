import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAccesorioDto {
  @IsNumber({}, { message: 'El ID de la categoría debe ser un número.' })
  @IsOptional()
  categoriaId?: number;

  @IsString({ message: 'El nombre del accesorio debe ser texto.' })
  @IsOptional()
  nombre?: string;

  @IsString({ message: 'La descripción del accesorio debe ser texto.' })
  @IsOptional()
  descripcion?: string;
}
