import { CategoriaMargen, CondicionDispositivo, TipoAumentoMargen } from '@prisma/client';

export interface ReglaMargenCalculationInput {
  tipoAumento: TipoAumentoMargen;
  valorBs: number | string | any;
  tipoAumentoUsd?: TipoAumentoMargen;
  valorUsd?: number | string | any;
}

/**
 * Mapea la condición del dispositivo a la categoría de margen correspondiente.
 */
export function mapearCondicionACategoriaMargen(
  condicion?: CondicionDispositivo | string | null,
): CategoriaMargen {
  if (condicion === CondicionDispositivo.PERMUTA) {
    return CategoriaMargen.PERMUTA;
  }
  if (condicion === CondicionDispositivo.NUEVO) {
    return CategoriaMargen.DISPOSITIVO_NUEVO;
  }
  return CategoriaMargen.DISPOSITIVO_USADO;
}

/**
 * Calcula el precio sugerido de venta en Bolivianos (BOB).
 * Aplica la regla configurada sobre el costo base de adquisición y suma los gastos de reparación al 100%.
 * Aplica Math.ceil para redondear al entero superior más cercano (sin centavos fraccionarios en mostrador).
 */
export function calcularPrecioSugeridoBs(
  costoBaseBs: number | string | any,
  regla?: ReglaMargenCalculationInput | null,
  gastosBs: number | string | any = 0,
): number {
  const base = Number(costoBaseBs) || 0;
  const gastos = Number(gastosBs) || 0;

  if (base <= 0) {
    return gastos > 0 ? Math.ceil(gastos) : 0;
  }

  if (!regla) {
    // Fallback estándar 15% porcentaje
    return Math.ceil(base * 1.15) + gastos;
  }

  const valor = Number(regla.valorBs) || 0;
  let baseConMargen: number;

  if (regla.tipoAumento === TipoAumentoMargen.ABSOLUTO) {
    baseConMargen = base + valor;
  } else {
    // Default a PORCENTAJE
    baseConMargen = base * (1 + valor / 100);
  }

  return Math.ceil(baseConMargen) + gastos;
}
