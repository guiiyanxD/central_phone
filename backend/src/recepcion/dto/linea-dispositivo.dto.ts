import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CondicionDispositivo } from '@prisma/client';

export class NuevaVarianteInlineDto {
  @IsNumber({}, { message: 'El ID del modelo es obligatorio para crear una nueva variante.' })
  @IsNotEmpty()
  modeloId: number;

  @IsString({ message: 'El color es obligatorio.' })
  @IsNotEmpty()
  color: string;

  @IsNumber({}, { message: 'La capacidad en GB es obligatoria.' })
  @IsNotEmpty()
  capacidadGb: number;

  @IsString()
  @IsOptional()
  tipoSim?: string;
}

export class LineaDispositivoDto {
  @IsNumber()
  @IsOptional()
  varianteId?: number;

  // Soporte para US09: Creación in-line ("al vuelo") si la variante no existía
  @ValidateNested()
  @Type(() => NuevaVarianteInlineDto)
  @IsOptional()
  nuevaVariante?: NuevaVarianteInlineDto;

  @IsString({ message: 'El número de serie es obligatorio.' })
  @IsNotEmpty({ message: 'Número de serie requerido.' })
  numeroSerie: string;

  @IsString()
  @IsOptional()
  imei1?: string;

  @IsString()
  @IsOptional()
  imei2?: string;

  @IsEnum(CondicionDispositivo, { message: 'Condición debe ser NUEVO, USADO o OPEN_BOX.' })
  @IsOptional()
  condicion?: CondicionDispositivo;

  @IsNumber({}, { message: 'El costo en Bolivianos (Bs) debe ser numérico.' })
  @IsNotEmpty({ message: 'Costo en Bs requerido.' })
  costoBs: number;

  @IsNumber({}, { message: 'El costo en Dólares ($) debe ser numérico.' })
  @IsNotEmpty({ message: 'Costo en $ requerido.' })
  costoUsd: number;

  @IsNumber({}, { message: 'El precio de venta sugerido (Bs) debe ser numérico.' })
  @IsOptional()
  precioVentaSugeridoBs?: number;
}
