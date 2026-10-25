import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNombreCaja(
  fechaApertura: string | Date | undefined,
  nombreSucursal?: string,
  variant: 'full' | 'compact' | 'badge' = 'full'
): string {
  if (!fechaApertura) return 'Caja Diaria';
  const fecha = new Date(fechaApertura).toLocaleDateString('es-BO');
  const sucursal = nombreSucursal || 'Sucursal';
  const sucursalAbrev = sucursal.replace(/^Sucursal\s+/i, 'Suc. ');

  if (variant === 'badge') {
    return `Caja ${fecha} • ${sucursalAbrev}`;
  }
  if (variant === 'compact') {
    return `Caja ${fecha} (${sucursalAbrev})`;
  }
  return `Caja del ${fecha} en ${sucursal}`;
}

/**
 * Agrupa un IMEI de 15 dígitos en bloques legibles de 4-4-4-3 dígitos (Ley de Miller).
 */
export function formatImeiChunks(imei?: string | null): string {
  if (!imei) return '';
  const digits = imei.replace(/\D/g, '');
  if (digits.length !== 15) return imei;
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)} ${digits.slice(12)}`;
}

/**
 * Descompone el IMEI para destacar visualmente los 4 dígitos terminales.
 */
export function getImeiTerminalParts(imei?: string | null): { prefix: string; terminal: string } {
  if (!imei) return { prefix: '', terminal: '' };
  const digits = imei.replace(/\D/g, '');
  if (digits.length !== 15) {
    return { prefix: '', terminal: imei };
  }
  const prefix = `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 11)} `;
  const terminal = digits.slice(11);
  return { prefix, terminal };
}
