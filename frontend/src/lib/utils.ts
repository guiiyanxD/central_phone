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
