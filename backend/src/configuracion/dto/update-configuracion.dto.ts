import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateConfiguracionDto {
  @IsString()
  @IsOptional()
  nombreEmpresa?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString({ message: 'La URL o ruta de la imagen del QR es obligatoria.' })
  @IsNotEmpty({ message: 'La imagen del QR oficial no puede estar vacía.' })
  qrOficialImagenUrl: string;

  @IsString()
  @IsNotEmpty({ message: 'El banco oficial es obligatorio.' })
  bancoOficial: string;

  @IsString()
  @IsNotEmpty({ message: 'El titular de la cuenta es obligatorio.' })
  titularCuenta: string;

  @IsString()
  @IsNotEmpty({ message: 'El número de cuenta es obligatorio.' })
  numeroCuenta: string;

  @IsString()
  @IsOptional()
  tipoCuenta?: string;
}
