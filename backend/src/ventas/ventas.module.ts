import { Module } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfiguracionModule } from '../configuracion/configuracion.module';
import {
  CashPaymentStrategy,
  QrPaymentStrategy,
  TransferPaymentStrategy,
  PosCardPaymentStrategy,
  PaymentStrategyRegistry,
} from './strategies';

@Module({
  imports: [PrismaModule, ConfiguracionModule],
  controllers: [VentasController],
  providers: [
    VentasService,
    CashPaymentStrategy,
    QrPaymentStrategy,
    TransferPaymentStrategy,
    PosCardPaymentStrategy,
    PaymentStrategyRegistry,
  ],
  exports: [VentasService, PaymentStrategyRegistry],
})
export class VentasModule {}

