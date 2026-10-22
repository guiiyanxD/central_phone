import { Injectable } from '@nestjs/common';
import { IPaymentStrategy, PaymentValidationResult } from './payment-strategy.interface';
import { CreateVentaDto } from '../dto/create-venta.dto';

@Injectable()
export class PosCardPaymentStrategy implements IPaymentStrategy {
  readonly codes = ['TARJETA_POS'];
  readonly impactsCashDrawer = false;

  validatePayment(_dto: CreateVentaDto): PaymentValidationResult {
    return { isValid: true };
  }
}
