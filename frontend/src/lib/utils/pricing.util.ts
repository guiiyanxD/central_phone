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
 * Calcula el precio sugerido de venta en Dólares (USD) aplicando la regla de margen en USD.
 * Si tipoAumentoUsd no está definido, se usa PORCENTAJE. Si valorUsd no está definido, se usa valorBs.
 * Utiliza Math.ceil para redondear al entero superior más cercano (sin centavos fraccionarios).
 * Si el costo base en USD es <= 0, retorna 0 (o gastos si los hay).
 */
export function calcularPrecioSugeridoUsd(
  costoBaseUsd: number | string | null | undefined,
  regla?: ReglaMargenPrecio | null,
  gastosUsd: number | string | null | undefined = 0,
): number {
  const base = Number(costoBaseUsd) || 0;
  const gastos = Number(gastosUsd) || 0;

  if (base <= 0) {
    return gastos > 0 ? Math.ceil(gastos) : 0;
  }

  if (!regla) {
    return Math.ceil(base * 1.15) + gastos;
  }

  const tipoAumento = regla.tipoAumentoUsd ?? 'PORCENTAJE';
  const valor = Number(
    regla.valorUsd !== undefined && regla.valorUsd !== null ? regla.valorUsd : regla.valorBs,
  ) || 0;
  let baseConMargen: number;

  if (tipoAumento === 'ABSOLUTO') {
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
