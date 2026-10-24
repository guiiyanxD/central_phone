export interface ProveedorNotaIngresoSummary {
  id: number;
  fechaIngreso: string;
  numeroComprobante: string | null;
  sucursal?: {
    id: number;
    nombre: string;
  };
}

export interface ProveedorItem {
  id: number;
  nombre: string;
  apellido: string | null;
  empresa: string | null;
  telefono: string | null;
  contactoReferencia: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  _count?: {
    notasIngreso: number;
  };
  notasIngreso?: ProveedorNotaIngresoSummary[];
}

export interface CreateProveedorInput {
  nombre: string;
  apellido?: string;
  empresa?: string;
  telefono?: string;
  contactoReferencia?: string;
}

export interface UpdateProveedorInput {
  nombre?: string;
  apellido?: string;
  empresa?: string;
  telefono?: string;
  contactoReferencia?: string;
  activo?: boolean;
}

export interface QueryProveedoresParams {
  includeInactivos?: boolean;
  search?: string;
}
