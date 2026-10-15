import {
  IsArray,
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateVarianteDto } from './create-variante.dto';

export class CreateModeloDto {
  @IsString({ message: 'El nombre del modelo debe ser texto (ej: iPhone 18 Pro).' })
  @IsNotEmpty({ message: 'El nombre del modelo es obligatorio.' })
  nombreModelo: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  // INVARIANTE INMUTABLE: Todo modelo DEBE crearse obligatoriamente con al menos una variante
  @IsArray({ message: 'Las variantes deben enviarse en formato de lista.' })
  @ArrayMinSize(1, { message: 'Invariante de catálogo: Todo modelo debe nacer obligatoriamente con al menos una variante.' })
  @ValidateNested({ each: true })
  @Type(() => CreateVarianteDto)
  variantes: CreateVarianteDto[];
}
