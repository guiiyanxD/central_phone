import { ReglaMargenPrecio, CategoriaMargen } from '@/lib/api/configuracion.api';

/**
 * Calcula el precio sugerido de venta en Bolivianos (BOB) aplicando la regla de margen.
 * Utiliza Math.ceil para redondear al entero superior más cercano (sin centavos fraccionarios en mostrador).
 */
export function calcularPrecioSugeridoBs(
  costoBaseBs: number | string | null | undefined,
  regla?: ReglaMargenPrecio | null,
  gastosBs: number | string | null | undefined = 0,
): number {
  const base = Number(costoBaseBs) || 0;
  const gastos = Number(gastosBs) || 0;

  if (base <= 0) {
    return gastos > 0 ? Math.ceil(gastos) : 0;
  }

  if (!regla) {
    return Math.ceil(base * 1.15) + gastos;
  }

  const valor = Number(regla.valorBs) || 0;
  let baseConMargen: number;

  if (regla.tipoAumento === 'ABSOLUTO') {
    baseConMargen = base + valor;
  } else {
    baseConMargen = base * (1 + valor / 100);
  }

  return Math.ceil(baseConMargen) + gastos;
}

/**
 * Mapea la condición del dispositivo a la categoría correspondiente en la tabla de márgenes.
 */
export function mapearCondicionACategoriaMargen(condicion?: string | null): CategoriaMargen {
  if (condicion === 'PERMUTA') {
    return 'PERMUTA';
  }
  if (condicion === 'NUEVO') {
    return 'DISPOSITIVO_NUEVO';
  }
  return 'DISPOSITIVO_USADO';
}
