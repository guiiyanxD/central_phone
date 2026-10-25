import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NuevoAccesorioInlineDto {
  @IsNumber({}, { message: 'El ID de la categoría debe ser numérico.' })
  @IsNotEmpty({ message: 'La categoría es requerida para crear el accesorio al vuelo.' })
  categoriaId: number;

  @IsString({ message: 'El nombre del accesorio base debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre del accesorio base es obligatorio.' })
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class LineaLoteAccesorioDto {
  @IsNumber({}, { message: 'El ID del accesorio base debe ser numérico.' })
  @IsOptional()
  accesorioId?: number;

  @ValidateNested()
  @Type(() => NuevoAccesorioInlineDto)
  @IsOptional()
  nuevoAccesorio?: NuevoAccesorioInlineDto;

  @IsString({ message: 'El nombre diferenciador debe ser texto (ej: Silicona Simple Bs 40).' })
  @IsNotEmpty({ message: 'El nombre diferenciador del lote es obligatorio para distinguir calidades y precios.' })
  nombreDiferenciador: string;

  @IsNumber({}, { message: 'La cantidad debe ser un número entero.' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0.' })
  @Min(1)
  cantidad: number;

  @IsNumber({}, { message: 'El costo unitario en Bs debe ser numérico.' })
  @IsNotEmpty({ message: 'El costo unitario es obligatorio.' })
  costoUnitarioBs: number;

  @IsNumber({}, { message: 'El precio de venta sugerido en Bs debe ser numérico.' })
  @IsNotEmpty({ message: 'El precio de venta es obligatorio.' })
  precioVentaBs: number;
}
