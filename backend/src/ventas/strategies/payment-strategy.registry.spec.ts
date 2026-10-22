import { CashPaymentStrategy } from './cash-payment.strategy';
import { QrPaymentStrategy } from './qr-payment.strategy';
import { TransferPaymentStrategy } from './transfer-payment.strategy';
import { PosCardPaymentStrategy } from './pos-card-payment.strategy';
import { PaymentStrategyRegistry } from './payment-strategy.registry';
import { IPaymentStrategy, PaymentValidationResult } from './payment-strategy.interface';
import { CreateVentaDto } from '../dto/create-venta.dto';

describe('PaymentStrategyRegistry & Strategies (SOLID OCP)', () => {
  let registry: PaymentStrategyRegistry;
  let cashStrategy: CashPaymentStrategy;
  let qrStrategy: QrPaymentStrategy;
  let transferStrategy: TransferPaymentStrategy;
  let cardStrategy: PosCardPaymentStrategy;

  beforeEach(() => {
    cashStrategy = new CashPaymentStrategy();
    qrStrategy = new QrPaymentStrategy();
    transferStrategy = new TransferPaymentStrategy();
    cardStrategy = new PosCardPaymentStrategy();

    registry = new PaymentStrategyRegistry(
      cashStrategy,
      qrStrategy,
      transferStrategy,
      cardStrategy,
    );
  });

  describe('Registry Lookup & Case-Insensitivity', () => {
    it('debe registrar y resolver estrategias existentes correctamente', () => {
      expect(registry.hasStrategy('EFECTIVO')).toBe(true);
      expect(registry.hasStrategy('efectivo')).toBe(true);
      expect(registry.hasStrategy('QR_SIMPLE')).toBe(true);
      expect(registry.hasStrategy('QR_ESTATICO')).toBe(true);
      expect(registry.hasStrategy('TRANSFERENCIA')).toBe(true);
      expect(registry.hasStrategy('TARJETA_POS')).toBe(true);
      expect(registry.hasStrategy('CRIPTO_DESCONOCIDO')).toBe(false);
    });

    it('debe devolver undefined para métodos no registrados', () => {
      expect(registry.getStrategy('METODO_INEXISTENTE')).toBeUndefined();
    });
  });

  describe('impactsCashDrawer Invariant', () => {
    it('debe retornar true solo para pagos en EFECTIVO', () => {
      expect(registry.impactsCashDrawer('EFECTIVO')).toBe(true);
      expect(registry.impactsCashDrawer('efectivo')).toBe(true);
    });

    it('debe retornar false para pagos digitales o no registrados', () => {
      expect(registry.impactsCashDrawer('QR_SIMPLE')).toBe(false);
      expect(registry.impactsCashDrawer('QR_ESTATICO')).toBe(false);
      expect(registry.impactsCashDrawer('TRANSFERENCIA')).toBe(false);
      expect(registry.impactsCashDrawer('TARJETA_POS')).toBe(false);
      expect(registry.impactsCashDrawer('OTRO')).toBe(false);
    });
  });

  describe('Validación de Pagos', () => {
    const baseDto = {
      cliente: { nombreCompleto: 'Test User', telefono: '70012345' },
    } as CreateVentaDto;

    it('CashPaymentStrategy: debe ser válido sin necesidad de comprobante', () => {
      const res = registry.validatePayment('EFECTIVO', {
        ...baseDto,
        metodoPagoCodigo: 'EFECTIVO',
      });
      expect(res.isValid).toBe(true);
      expect(res.errorMessage).toBeUndefined();
    });

    it('QrPaymentStrategy: debe rechazar si falta comprobanteReferencia', () => {
      const res = registry.validatePayment('QR_SIMPLE', {
        ...baseDto,
        metodoPagoCodigo: 'QR_SIMPLE',
        comprobanteReferencia: '   ',
      });
      expect(res.isValid).toBe(false);
      expect(res.errorMessage).toContain('obligatorio registrar el número de comprobante');
    });

    it('QrPaymentStrategy: debe ser válido si contiene comprobanteReferencia', () => {
      const res = registry.validatePayment('QR_SIMPLE', {
        ...baseDto,
        metodoPagoCodigo: 'QR_SIMPLE',
        comprobanteReferencia: 'BCP-98765432',
      });
      expect(res.isValid).toBe(true);
    });

    it('TransferPaymentStrategy: debe rechazar si falta comprobanteReferencia', () => {
      const res = registry.validatePayment('TRANSFERENCIA', {
        ...baseDto,
        metodoPagoCodigo: 'TRANSFERENCIA',
      });
      expect(res.isValid).toBe(false);
    });

    it('PosCardPaymentStrategy: debe ser válido por defecto', () => {
      const res = registry.validatePayment('TARJETA_POS', {
        ...baseDto,
        metodoPagoCodigo: 'TARJETA_POS',
      });
      expect(res.isValid).toBe(true);
    });
  });

  describe('Extensibilidad OCP (Open-Closed Principle)', () => {
    it('debe permitir incorporar una nueva estrategia en tiempo de ejecución sin modificar el código core', () => {
      class CryptoPaymentStrategy implements IPaymentStrategy {
        readonly codes = ['USDT', 'BITCOIN'];
        readonly impactsCashDrawer = false;
        validatePayment(dto: CreateVentaDto): PaymentValidationResult {
          if (!dto.comprobanteReferencia?.startsWith('0x')) {
            return { isValid: false, errorMessage: 'Hash de transacción blockchain inválido.' };
          }
          return { isValid: true };
        }
      }

      const cryptoStrategy = new CryptoPaymentStrategy();
      registry.registerStrategy(cryptoStrategy);

      expect(registry.hasStrategy('USDT')).toBe(true);
      expect(registry.impactsCashDrawer('USDT')).toBe(false);

      const invalidCrypto = registry.validatePayment('USDT', {
        metodoPagoCodigo: 'USDT',
        comprobanteReferencia: 'not-a-hash',
      } as any);
      expect(invalidCrypto.isValid).toBe(false);
      expect(invalidCrypto.errorMessage).toBe('Hash de transacción blockchain inválido.');

      const validCrypto = registry.validatePayment('USDT', {
        metodoPagoCodigo: 'USDT',
        comprobanteReferencia: '0x123abc456def',
      } as any);
      expect(validCrypto.isValid).toBe(true);
    });
  });
});
