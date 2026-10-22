import { Injectable } from '@nestjs/common';
import { IPaymentStrategy, PaymentValidationResult } from './payment-strategy.interface';
import { CreateVentaDto } from '../dto/create-venta.dto';

@Injectable()
export class QrPaymentStrategy implements IPaymentStrategy {
  readonly codes = ['QR_SIMPLE', 'QR_ESTATICO'];
  readonly impactsCashDrawer = false;

  validatePayment(dto: CreateVentaDto): PaymentValidationResult {
    if (!dto.comprobanteReferencia || dto.comprobanteReferencia.trim().length === 0) {
      return {
        isValid: false,
        errorMessage:
          'Para cobros mediante QR Oficial o Transferencia Bancaria, es obligatorio registrar el número de comprobante o referencia bancaria.',
      };
    }
    return { isValid: true };
  }
}
