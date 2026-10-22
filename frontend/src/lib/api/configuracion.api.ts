import { request } from './client';

export interface ConfiguracionResponse {
  id: number;
  nombreEmpresa: string;
  nit?: string | null;
  telefonoPrincipal?: string;
  qrOficialUrl?: string | null;
  qrOficialImagenUrl?: string | null;
  logoUrl?: string | null;
  bancoOficial?: string;
  titularCuenta?: string;
  numeroCuenta?: string;
  tipoCuenta?: string;
  datosBancarios?: {
    banco: string;
    titular: string;
    numeroCuenta: string;
    tipoCuenta: string;
    moneda?: string;
  };
}

export const configuracionApi = {
  get: () => request<ConfiguracionResponse>('/configuracion'),
  update: (data: any) =>
    request<{ success: boolean; configuracion: any }>('/configuracion', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
