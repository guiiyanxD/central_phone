import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CrearCategoriaGastoDto {
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio.' })
  @IsString({ message: 'El nombre de la categoría debe ser texto.' })
  @MinLength(2, { message: 'El nombre debe contener al menos 2 caracteres.' })
  @MaxLength(50, { message: 'El nombre no puede exceder los 50 caracteres.' })
  nombre: string;
}
