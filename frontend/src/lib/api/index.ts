import { authApi } from './auth.api';
import { sucursalesApi } from './sucursales.api';
import { configuracionApi } from './configuracion.api';
import { modelosApi } from './modelos.api';
import { accesoriosApi } from './accesorios.api';
import { proveedoresApi } from './proveedores.api';
import { recepcionApi } from './recepcion.api';
import { cajaApi } from './caja.api';
import { ventasApi } from './ventas.api';
import { usuariosApi } from './usuarios.api';
import { healthApi } from './health.api';

export * from './client';
export * from './auth.api';
export * from './sucursales.api';
export * from './configuracion.api';
export * from './modelos.api';
export * from './accesorios.api';
export * from './proveedores.api';
export * from './recepcion.api';
export * from './caja.api';
export * from './ventas.api';
export * from './usuarios.api';
export * from './health.api';

export const api = {
  auth: authApi,
  usuarios: usuariosApi,
  sucursales: sucursalesApi,
  configuracion: configuracionApi,
  modelos: modelosApi,
  accesorios: accesoriosApi,
  proveedores: proveedoresApi,
  recepcion: recepcionApi,
  caja: cajaApi,
  ventas: ventasApi,
  health: healthApi,
};

export default api;
