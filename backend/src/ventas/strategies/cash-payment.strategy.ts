import { Injectable } from '@nestjs/common';
import { IPaymentStrategy, PaymentValidationResult } from './payment-strategy.interface';
import { CreateVentaDto } from '../dto/create-venta.dto';

@Injectable()
export class CashPaymentStrategy implements IPaymentStrategy {
  readonly codes = ['EFECTIVO'];
  readonly impactsCashDrawer = true;

  validatePayment(_dto: CreateVentaDto): PaymentValidationResult {
    return { isValid: true };
  }
}
