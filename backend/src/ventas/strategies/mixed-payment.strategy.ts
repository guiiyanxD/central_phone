import { Injectable } from '@nestjs/common';
import { IPaymentStrategy, PaymentValidationResult } from './payment-strategy.interface';
import { CreateVentaDto } from '../dto/create-venta.dto';

@Injectable()
export class MixedPaymentStrategy implements IPaymentStrategy {
  readonly codes = ['MIXTO'];
  readonly impactsCashDrawer = false; // El desglose de gaveta se computa en base a montoEfectivoBs en caja.service.ts

  validatePayment(dto: CreateVentaDto): PaymentValidationResult {
    // 1. Validar anticipo en efectivo
    const ef = typeof dto.montoEfectivoMixtoBs === 'number' ? dto.montoEfectivoMixtoBs : 0;
    if (ef <= 0) {
      return {
        isValid: false,
        errorMessage: 'En pago mixto, debes ingresar el monto de anticipo en efectivo recibido mayor a Bs 0.',
      };
    }

    // 2. Validar comprobante/referencia bancaria del saldo QR
    if (!dto.comprobanteReferencia || dto.comprobanteReferencia.trim().length === 0) {
      return {
        isValid: false,
        errorMessage: 'En pago mixto, es obligatorio ingresar el número de comprobante o referencia bancaria del saldo por QR.',
      };
    }

    return { isValid: true };
  }
}
