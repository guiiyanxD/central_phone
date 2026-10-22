// Tipos de dominio para el módulo de Sucursales

export interface SucursalItem {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  telefono: string | null;
  activo: boolean;
  creadoEn?: string;
  _count?: {
    usuarios: number;
    dispositivos: number;
    lotesAccesorio: number;
  };
}

export interface SucursalDetail extends SucursalItem {
  usuarios: Array<{
    id: number;
    nombre: string;
    email: string;
    rol: 'ADMIN' | 'VENDEDOR';
    activo: boolean;
  }>;
}

export const CIUDADES_BOLIVIA = [
  'Santa Cruz',
  'La Paz',
  'Cochabamba',
  'El Alto',
  'Tarija',
  'Sucre',
  'Oruro',
  'Potosí',
  'Beni',
  'Pando',
];
