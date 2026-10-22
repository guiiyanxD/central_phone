/**
 * Utilidades de formateo para Punto de Venta (POS) - CentralPhone
 * Especializado para trazabilidad serializada (IMEIs de 15 dígitos),
 * números de serie y moneda boliviana (Bs).
 */

/**
 * Agrupa un IMEI de 15 dígitos en bloques legibles de 4-4-4-3 dígitos.
 * Ejemplo: "358492118492013" -> "3584 9211 8492 013"
 */
export function formatImeiChunks(imei?: string | null): string {
  if (!imei) return '';
  const digits = imei.replace(/\D/g, '');
  if (digits.length !== 15) return imei;

  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12)}`;
}

/**
 * Descompone el IMEI para destacar visualmente los últimos 4 dígitos terminales.
 * Permite al cajero verificar ópticamente contra la etiqueta de la caja física en <1 segundo.
 */
export function getImeiTerminalParts(imei?: string | null): { prefix: string; terminal: string } {
  if (!imei) return { prefix: '', terminal: '' };
  const digits = imei.replace(/\D/g, '');
  if (digits.length !== 15) {
    return { prefix: '', terminal: imei };
  }

  const prefix = `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 11)} `;
  const terminal = digits.slice(11); // últimos 4 dígitos
  return { prefix, terminal };
}

/**
 * Formatea importes en Bolivianos con separador de miles y 2 decimales fijos.
 */
export function formatCurrencyBs(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Bs 0.00';
  return `Bs ${amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
