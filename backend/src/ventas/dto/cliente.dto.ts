import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ClienteDto {
  @IsString({ message: 'El nombre completo del cliente es obligatorio.' })
  @IsNotEmpty({ message: 'Nombre del cliente requerido.' })
  nombreCompleto: string;

  @IsString({ message: 'El teléfono del cliente es obligatorio.' })
  @IsNotEmpty({ message: 'Teléfono requerido para garantía y recibo.' })
  telefono: string;

  @IsString()
  @IsOptional()
  ciNit?: string;
}
