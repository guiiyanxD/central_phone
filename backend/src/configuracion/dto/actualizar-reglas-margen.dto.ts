import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CategoriaMargen, TipoAumentoMargen } from '@prisma/client';

export class ItemReglaMargenDto {
  @IsEnum(CategoriaMargen)
  @IsNotEmpty()
  categoria: CategoriaMargen;

  @IsEnum(TipoAumentoMargen)
  @IsNotEmpty()
  tipoAumento: TipoAumentoMargen;

  @IsNumber()
  @Min(0)
  valorBs: number;

  @IsEnum(TipoAumentoMargen)
  @IsOptional()
  tipoAumentoUsd?: TipoAumentoMargen;

  @IsNumber()
  @IsOptional()
  @Min(0)
  valorUsd?: number;
}

export class ActualizarReglasMargenDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemReglaMargenDto)
  reglas: ItemReglaMargenDto[];
}
