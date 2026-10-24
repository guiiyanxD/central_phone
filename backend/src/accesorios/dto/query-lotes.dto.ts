import { IsOptional, IsString, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryLotesDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  busqueda?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoriaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sucursalId?: number;

  @IsOptional()
  @IsString()
  @IsIn(['TODOS', 'EN_STOCK', 'AGOTADO'])
  stock?: 'TODOS' | 'EN_STOCK' | 'AGOTADO' = 'TODOS';
}
