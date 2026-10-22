import { Injectable } from '@nestjs/common';
import { IPaymentStrategy, PaymentValidationResult } from './payment-strategy.interface';
import { CashPaymentStrategy } from './cash-payment.strategy';
import { QrPaymentStrategy } from './qr-payment.strategy';
import { TransferPaymentStrategy } from './transfer-payment.strategy';
import { PosCardPaymentStrategy } from './pos-card-payment.strategy';
import { CreateVentaDto } from '../dto/create-venta.dto';

@Injectable()
export class PaymentStrategyRegistry {
  private readonly strategies = new Map<string, IPaymentStrategy>();

  constructor(
    cashStrategy: CashPaymentStrategy,
    qrStrategy: QrPaymentStrategy,
    transferStrategy: TransferPaymentStrategy,
    cardStrategy: PosCardPaymentStrategy,
  ) {
    this.registerStrategy(cashStrategy);
    this.registerStrategy(qrStrategy);
    this.registerStrategy(transferStrategy);
    this.registerStrategy(cardStrategy);
  }

  registerStrategy(strategy: IPaymentStrategy) {
    for (const code of strategy.codes) {
      this.strategies.set(code.toUpperCase(), strategy);
    }
  }

  getStrategy(code: string): IPaymentStrategy | undefined {
    return this.strategies.get(code?.toUpperCase());
  }

  hasStrategy(code: string): boolean {
    return this.strategies.has(code?.toUpperCase());
  }

  impactsCashDrawer(code: string): boolean {
    const strategy = this.getStrategy(code);
    return strategy ? strategy.impactsCashDrawer : false;
  }

  validatePayment(code: string, dto: CreateVentaDto): PaymentValidationResult {
    const strategy = this.getStrategy(code);
    if (!strategy) {
      // Si el método no tiene estrategia específica (ej. nuevos métodos sin validaciones adicionales), es válido por defecto
      return { isValid: true };
    }
    return strategy.validatePayment(dto);
  }
}
