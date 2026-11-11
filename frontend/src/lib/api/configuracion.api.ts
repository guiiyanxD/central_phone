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
  tcOficial?: number;
  tcParalelo?: number;
  tcActualizadoEn?: string | null;
  datosBancarios?: {
    banco: string;
    titular: string;
    numeroCuenta: string;
    tipoCuenta: string;
    moneda?: string;
  };
}

export type CategoriaMargen =
  | 'DISPOSITIVO_NUEVO'
  | 'DISPOSITIVO_USADO'
  | 'ACCESORIO'
  | 'PERMUTA';

export type TipoAumentoMargen = 'PORCENTAJE' | 'ABSOLUTO';

export interface ReglaMargenPrecio {
  id: number;
  categoria: CategoriaMargen;
  tipoAumento: TipoAumentoMargen;
  valorBs: number;
  tipoAumentoUsd: TipoAumentoMargen;
  valorUsd: number;
  actualizadoEn?: string;
}

export interface ActualizarReglasMargenPayload {
  reglas: {
    categoria: CategoriaMargen;
    tipoAumento: TipoAumentoMargen;
    valorBs: number;
    tipoAumentoUsd?: TipoAumentoMargen;
    valorUsd?: number;
  }[];
}

export const configuracionApi = {
  get: () => request<ConfiguracionResponse>('/configuracion'),
  update: (data: any) =>
    request<{ success: boolean; configuracion: any }>('/configuracion', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  sincronizarTipoCambio: () =>
    request<ConfiguracionResponse>('/configuracion/tipo-cambio/sincronizar', {
      method: 'POST',
    }),
  getMargenes: () => request<ReglaMargenPrecio[]>('/configuracion/margenes'),
  updateMargenes: (data: ActualizarReglasMargenPayload) =>
    request<ReglaMargenPrecio[]>('/configuracion/margenes', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
