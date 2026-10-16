import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class UpdateConfiguracionDto {
  @IsString()
  @IsOptional()
  nombreEmpresa?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString({ message: 'La URL o ruta de la imagen del QR es obligatoria.' })
  @IsNotEmpty({ message: 'La imagen del QR oficial no puede estar vacía.' })
  @Matches(
    /^(data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+|\/[a-zA-Z0-9_\-\/.]+\.(png|jpg|jpeg|webp)|https?:\/\/.+)$/,
    {
      message:
        'El formato o protocolo de la imagen del QR no está permitido. Solo se admite PNG, JPEG o WEBP.',
    },
  )
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
