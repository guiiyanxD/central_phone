export type RolUsuario = 'ADMIN' | 'VENDEDOR';

export interface UsuarioSucursal {
  id: number;
  nombre: string;
  ciudad: string;
}

export interface UsuarioItem {
  id: number;
  sucursalId: number | null;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  sucursal?: UsuarioSucursal | null;
}

export interface CreateUsuarioInput {
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
  password: string;
  sucursalId?: number;
  rol?: RolUsuario;
}

export interface UpdateUsuarioInput {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  sucursalId?: number | null;
  rol?: RolUsuario;
}

export interface QueryUsuariosParams {
  sucursalId?: number;
  rol?: RolUsuario;
  activo?: boolean;
  search?: string;
}
