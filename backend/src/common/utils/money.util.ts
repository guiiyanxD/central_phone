/**
 * Utilidades de Aritmética Financiera de Alta Precisión.
 * Previene errores de precisión en punto flotante IEEE 754 redondeando consistentemente a 2 decimales.
 * Soporta números, strings y objetos Decimal de Prisma.
 */
export function roundMoney(
  amount: number | string | { toString(): string } | null | undefined
): number {
  if (amount === null || amount === undefined) return 0;
  const num = typeof amount === 'number' ? amount : parseFloat(amount.toString());
  if (isNaN(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatMoney(
  amount: number | string | { toString(): string } | null | undefined
): string {
  return roundMoney(amount).toFixed(2);
}
