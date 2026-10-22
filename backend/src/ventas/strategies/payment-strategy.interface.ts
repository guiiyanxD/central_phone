import { CreateVentaDto } from '../dto/create-venta.dto';

export interface PaymentValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface IPaymentStrategy {
  /**
   * Códigos de método de pago soportados por la estrategia (ej. ['EFECTIVO'], ['QR_SIMPLE', 'QR_ESTATICO']).
   */
  readonly codes: string[];

  /**
   * Determina si este método de pago impacta el arqueo físico de efectivo en caja.
   */
  readonly impactsCashDrawer: boolean;

  /**
   * Valida invariantes y requisitos específicos del método de pago.
   */
  validatePayment(dto: CreateVentaDto): PaymentValidationResult;
}
