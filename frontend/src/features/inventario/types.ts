// Tipos de dominio para el módulo de Inventario y Catálogo
import {
  LoteAccesorioItem as LoteApiItem,
  LotesMeta as LotesApiMeta,
  LotesPaginatedResponse,
} from '@/lib/api/accesorios.api';

export interface DispositivoItem {
  id: number;
  numeroSerie: string;
  imei1: string;
  imei2?: string | null;
  estado: 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'DEFECTUOSO' | 'EN_GARANTIA';
  condicion: 'NUEVO' | 'USADO' | 'OPEN_BOX';
  costoBs: number | string;
  costoUsd: number | string;
  precioVentaSugeridoBs?: number | string | null;
  sucursalId: number;
  sucursal?: {
    id: number;
    nombre: string;
    ciudad?: string;
  };
  variante?: {
    id: number;
    color: string;
    capacidadGb: number;
    tipoSim?: string | null;
    modelo?: {
      id: number;
      nombre: string;
      marca: string;
      tipo: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO';
    };
  };
  recepcionDetalle?: {
    notaIngreso?: {
      id: number;
      numeroComprobante?: string | null;
      fechaIngreso?: string;
      proveedor?: {
        id: number;
        nombre: string;
      };
    };
  };
}

export interface DispositivosMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type LoteAccesorioItem = LoteApiItem;
export type LotesMeta = LotesApiMeta;
export type { LotesPaginatedResponse };

export interface AccesorioItem {
  id: number;
  nombre: string;
  categoria?: {
    id: number;
    nombre: string;
  };
  lotes: LoteAccesorioItem[];
}

export interface VarianteItem {
  id: number;
  color: string;
  capacidadGb: number;
  tipoSim?: string | null;
  _count?: {
    dispositivos: number;
  };
}

export interface ModeloItem {
  id: number;
  nombre: string;
  marca: string;
  tipo: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO';
  activo: boolean;
  variantes: VarianteItem[];
}
