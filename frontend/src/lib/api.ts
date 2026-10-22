// Centralized API Client for CentralPhone

/**
 * Obtiene la URL base de la API adaptándose dinámicamente al hostname del cliente.
 * Si el usuario accede desde un móvil en la red local (ej: 192.168.x.x:3000),
 * se conmuta automáticamente el host de localhost hacia dicha IP para evitar 'Load failed'.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  if (typeof window !== 'undefined') {
    try {
      const parsed = new URL(envUrl);
      const clientHostname = window.location.hostname;

      if (
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
        clientHostname &&
        clientHostname !== 'localhost' &&
        clientHostname !== '127.0.0.1'
      ) {
        parsed.hostname = clientHostname;
        return parsed.toString().replace(/\/$/, '');
      }
    } catch {
      // Retornar envUrl de fallback si falla el parsing
    }
  }

  return envUrl;
}

export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('centralphone_token');
}

export function setStoredToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('centralphone_token', token);
    // Persistencia en cookie para Next.js Edge Middleware y SSR
    document.cookie = `centralphone_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  }
}

export function removeStoredToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('centralphone_token');
    localStorage.removeItem('centralphone_user');
    // Invalida la cookie eliminándola en el cliente
    document.cookie = 'centralphone_token=; path=/; max-age=0; SameSite=Lax';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const apiBase = getApiBaseUrl();
  const url = `${apiBase}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message = Array.isArray(data?.message)
        ? data.message.join(' • ')
        : data?.message || 'Error en la solicitud al servidor';
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error?.message || 'Error de conexión con el backend',
      0
    );
  }
}

// ------------------------------------------
// API CLIENT MODULES
// ------------------------------------------

export const api = {
  // 1. Auth & Usuarios
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{
        accessToken: string;
        user: {
          id: number;
          nombre: string;
          email: string;
          rol: 'ADMIN' | 'VENDEDOR';
          sucursal: { id: number; nombre: string; ciudad: string };
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () =>
      request<{
        id: number;
        nombre: string;
        email: string;
        rol: 'ADMIN' | 'VENDEDOR';
        sucursal: { id: number; nombre: string; ciudad: string };
      }>('/auth/me'),
  },

  // 2. Sucursales
  sucursales: {
    getAll: (includeInactivas = false) =>
      request<
        Array<{
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
        }>
      >(`/sucursales${includeInactivas ? '?includeInactivas=true' : ''}`),
    getById: (id: number) =>
      request<{
        id: number;
        nombre: string;
        ciudad: string;
        direccion: string;
        telefono: string | null;
        activo: boolean;
        creadoEn: string;
        usuarios: Array<{
          id: number;
          nombre: string;
          email: string;
          rol: 'ADMIN' | 'VENDEDOR';
          activo: boolean;
        }>;
      }>(`/sucursales/${id}`),
    create: (data: {
      nombre: string;
      direccion: string;
      telefono?: string;
      ciudad?: string;
    }) =>
      request<{
        id: number;
        nombre: string;
        ciudad: string;
        direccion: string;
        telefono: string | null;
        activo: boolean;
      }>('/sucursales', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (
      id: number,
      data: {
        nombre?: string;
        direccion?: string;
        telefono?: string;
        ciudad?: string;
        activo?: boolean;
      }
    ) =>
      request<{
        id: number;
        nombre: string;
        ciudad: string;
        direccion: string;
        telefono: string | null;
        activo: boolean;
      }>(`/sucursales/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // 3. Configuración Corporativa & QR
  configuracion: {
    get: () =>
      request<{
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
      }>('/configuracion'),
    update: (data: any) =>
      request<{ success: boolean; configuracion: any }>('/configuracion', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // 4. Modelos e Inventario de Dispositivos
  modelos: {
    getAll: () =>
      request<
        Array<{
          id: number;
          marca: string;
          nombreModelo: string;
          tipo: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO';
          descripcion: string | null;
          variantes: Array<{
            id: number;
            color: string;
            capacidadGb: number;
            tipoSim: string;
            _count?: { dispositivos: number };
          }>;
          _count?: { variantes: number };
        }>
      >('/modelos'),
    getOne: (id: number) => request<any>(`/modelos/${id}`),
    create: (data: {
      nombreModelo: string;
      tipo?: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO';
      marca?: string;
      variantes: Array<{ color: string; capacidadGb: number; tipoSim?: string }>;
    }) =>
      request<any>('/modelos', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addVariante: (
      modeloId: number,
      data: { color: string; capacidadGb: number; tipoSim?: string }
    ) =>
      request<any>(`/modelos/${modeloId}/variantes`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateVariante: (
      varianteId: number,
      data: { color?: string; capacidadGb?: number; tipoSim?: string }
    ) =>
      request<any>(`/modelos/variantes/${varianteId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    deleteVariante: (varianteId: number) =>
      request<{ success: boolean; message: string; varianteId: number }>(
        `/modelos/variantes/${varianteId}`,
        {
          method: 'DELETE',
        }
      ),
    getDispositivos: (params?: {
      page?: number;
      limit?: number;
      sucursalId?: number;
      tipo?: string;
      estado?: string;
      condicion?: string;
      proveedorId?: number;
      busqueda?: string;
      imei?: string;
      nombreProducto?: string;
      fechaDesde?: string;
      fechaHasta?: string;
    }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.sucursalId) q.set('sucursalId', String(params.sucursalId));
      if (params?.tipo) q.set('tipo', params.tipo);
      if (params?.estado) q.set('estado', params.estado);
      if (params?.condicion) q.set('condicion', params.condicion);
      if (params?.proveedorId) q.set('proveedorId', String(params.proveedorId));
      if (params?.busqueda) q.set('busqueda', params.busqueda);
      if (params?.imei) q.set('imei', params.imei);
      if (params?.nombreProducto) q.set('nombreProducto', params.nombreProducto);
      if (params?.fechaDesde) q.set('fechaDesde', params.fechaDesde);
      if (params?.fechaHasta) q.set('fechaHasta', params.fechaHasta);

      return request<
        | {
            data: Array<{
              id: number;
              varianteId: number;
              sucursalId: number;
              notaIngresoId: number;
              numeroSerie: string;
              imei1: string | null;
              imei2: string | null;
              condicion: 'NUEVO' | 'USADO' | 'OPEN_BOX';
              costoBs?: string | number;
              costoUsd?: string | number;
              precioVentaSugeridoBs?: string | number;
              estadoInventario: 'DISPONIBLE' | 'VENDIDO' | 'RESERVADO' | 'EN_GARANTIA' | 'DEFECTUOSO';
              variante: {
                id: number;
                color: string;
                capacidadGb: number;
                tipoSim: string;
                modelo: { id: number; nombreModelo: string; marca: string; tipo?: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO' };
              };
              sucursal: { id: number; nombre: string; ciudad: string };
              notaIngreso: {
                id: number;
                fechaIngreso: string;
                numeroComprobante: string | null;
                proveedor?: { id: number; nombre: string };
              };
            }>;
            meta: {
              total: number;
              page: number;
              limit: number;
              totalPages: number;
              hasNextPage: boolean;
              hasPrevPage: boolean;
            };
          }
        | Array<{
            id: number;
            varianteId: number;
            sucursalId: number;
            notaIngresoId: number;
            numeroSerie: string;
            imei1: string | null;
            imei2: string | null;
            condicion: 'NUEVO' | 'USADO' | 'OPEN_BOX';
            costoBs?: string | number;
            costoUsd?: string | number;
            precioVentaSugeridoBs?: string | number;
            estadoInventario: 'DISPONIBLE' | 'VENDIDO' | 'RESERVADO' | 'EN_GARANTIA' | 'DEFECTUOSO';
            variante: {
              id: number;
              color: string;
              capacidadGb: number;
              tipoSim: string;
              modelo: { id: number; nombreModelo: string; marca: string; tipo?: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO' };
            };
            sucursal: { id: number; nombre: string; ciudad: string };
            notaIngreso: {
              id: number;
              fechaIngreso: string;
              numeroComprobante: string | null;
              proveedor?: { id: number; nombre: string };
            };
          }>
      >(`/modelos/dispositivos?${q.toString()}`);
    },
    getLineaVida: (imei: string) =>
      request<{
        dispositivo: {
          id: number;
          imei1: string;
          imei2: string | null;
          numeroSerie: string;
          condicion: string;
          estadoInventario: string;
          precioVentaSugeridoBs: number;
          costoBs?: number;
          costoUsd?: number;
          modelo: string;
          marca: string;
          color: string;
          capacidadGb: number;
          tipoSim: string;
          sucursalActual: { id: number; nombre: string; ciudad: string };
        };
        origen: {
          notaIngresoId: number;
          proveedor: string;
          proveedorTelefono: string | null;
          fechaIngreso: string;
          numeroComprobante: string | null;
          sucursalIngreso: string;
          usuarioReceptor: string;
          costoUnitarioBs?: number;
          costoUnitarioUsd?: number;
        };
        venta: {
          id: number;
          ticketReferencia: string;
          fechaVenta: string;
          estadoVenta: 'COMPLETADA' | 'ANULADA';
          motivoAnulacion: string | null;
          fechaAnulacion: string | null;
          anuladoPor: string | null;
          vendedor: string;
          cliente: {
            id: number;
            nombre: string;
            telefono: string;
            ciNit: string | null;
          } | null;
          metodoPago: string;
          precioVentaCobradoBs: number;
          costoUnitarioBs?: number;
          gananciaBs?: number;
          sucursalVenta: string;
        } | null;
        garantia: {
          estadoInventario: string;
          diasDesdeVenta: number | null;
          garantiaVigente: boolean | null;
          periodoMeses: number;
        };
      }>(`/modelos/dispositivos/${encodeURIComponent(imei)}/linea-vida`),
  },

  // 5. Catálogo y Lotes de Accesorios
  accesorios: {
    getCategorias: () =>
      request<
        Array<{
          id: number;
          nombre: string;
          descripcion: string | null;
          _count?: { accesorios: number };
        }>
      >('/accesorios/categorias'),
    getAll: (categoriaId?: number, sucursalId?: number) => {
      const q = new URLSearchParams();
      if (categoriaId) q.set('categoriaId', String(categoriaId));
      if (sucursalId) q.set('sucursalId', String(sucursalId));
      return request<
        Array<{
          id: number;
          categoriaId: number;
          nombre: string;
          categoria: { id: number; nombre: string };
          lotes: Array<{
            id: number;
            nombreDiferenciador: string;
            costoUnitarioBs: string | number;
            precioVentaBs: string | number;
            cantidadInicial: number;
            stockActual: number;
            sucursal: { id: number; nombre: string };
          }>;
        }>
      >(`/accesorios?${q.toString()}`);
    },
    create: (data: { categoriaId: number; nombre: string }) =>
      request<any>('/accesorios', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // 6. Proveedores
  proveedores: {
    getAll: () =>
      request<
        Array<{
          id: number;
          nombre: string;
          telefono: string | null;
          contactoReferencia: string | null;
        }>
      >('/proveedores'),
  },

  // 7. Recepción Unificada (Notas de Ingreso)
  recepcion: {
    createNotaIngreso: (data: {
      proveedorId: number;
      sucursalId: number;
      numeroComprobante?: string;
      observaciones?: string;
      dispositivos?: Array<{
        varianteId?: number;
        nuevaVariante?: {
          modeloId: number;
          color: string;
          capacidadGb: number;
          tipoSim?: string;
        };
        numeroSerie: string;
        imei1?: string | null;
        imei2?: string | null;
        condicion?: 'NUEVO' | 'USADO' | 'OPEN_BOX';
        costoBs: number;
        costoUsd: number;
        precioVentaSugeridoBs?: number;
      }>;
      accesorios?: Array<{
        accesorioId: number;
        nombreDiferenciador: string;
        cantidad: number;
        costoUnitarioBs: number;
        precioVentaBs: number;
      }>;
    }) =>
      request<any>('/recepcion/notas-ingreso', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getNotasIngreso: (params?: {
      page?: number;
      limit?: number;
      sucursalId?: number;
      proveedorId?: number;
      fechaDesde?: string;
      fechaHasta?: string;
      search?: string;
    }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.sucursalId) q.set('sucursalId', String(params.sucursalId));
      if (params?.proveedorId) q.set('proveedorId', String(params.proveedorId));
      if (params?.fechaDesde) q.set('fechaDesde', params.fechaDesde);
      if (params?.fechaHasta) q.set('fechaHasta', params.fechaHasta);
      if (params?.search) q.set('search', params.search);

      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request<{
        data: Array<{
          id: number;
          proveedorId: number;
          sucursalId: number;
          usuarioId: number;
          numeroComprobante: string | null;
          fechaIngreso: string;
          totalCostoBs?: number | string;
          observaciones: string | null;
          proveedor: { id: number; nombre: string };
          sucursal: { id: number; nombre: string };
          usuario: { id: number; nombre: string };
          _count: {
            dispositivos: number;
            lotesAccesorio: number;
          };
        }>;
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
          hasNextPage: boolean;
          hasPrevPage: boolean;
        };
      }>(`/recepcion/notas-ingreso${queryStr}`);
    },
    getNotaIngresoById: (id: number) =>
      request<{
        id: number;
        proveedorId: number;
        sucursalId: number;
        usuarioId: number;
        numeroComprobante: string | null;
        fechaIngreso: string;
        totalCostoBs?: number | string;
        observaciones: string | null;
        proveedor: { id: number; nombre: string; telefono?: string | null; nit?: string | null };
        sucursal: { id: number; nombre: string; direccion?: string | null; ciudad?: string };
        usuario: { id: number; nombre: string; email: string };
        dispositivos: Array<{
          id: number;
          varianteId: number;
          sucursalId: number;
          numeroSerie: string;
          imei1: string | null;
          imei2: string | null;
          condicion: 'NUEVO' | 'USADO' | 'OPEN_BOX';
          costoBs?: number | string;
          costoUsd?: number | string;
          precioVentaSugeridoBs: number | string;
          estadoInventario: 'DISPONIBLE' | 'VENDIDO' | 'RESERVADO' | 'EN_GARANTIA' | 'DEFECTUOSO';
          variante: {
            id: number;
            color: string;
            capacidadGb: number;
            tipoSim: string;
            modelo: { id: number; nombreModelo: string; marca: string; tipo?: 'IPHONE' | 'IPAD' | 'MAC' | 'WATCH' | 'AIRPODS' | 'OTRO' };
          };
          detalleVentas?: Array<{
            id: number;
            precioUnitarioBs: number | string;
            costoUnitarioBs: number | string;
            subtotalBs: number | string;
            venta: {
              id: number;
              fechaHora: string;
              comprobanteReferencia: string | null;
            };
          }>;
        }>;
        lotesAccesorio: Array<{
          id: number;
          accesorioId: number;
          sucursalId: number;
          nombreDiferenciador: string;
          costoUnitarioBs?: number | string;
          precioVentaBs: number | string;
          cantidadInicial: number;
          stockActual: number;
          activo: boolean;
          fechaIngreso: string;
          accesorio: {
            id: number;
            nombre: string;
            categoria?: { id: number; nombre: string };
          };
          detalleVentas?: Array<{
            id: number;
            cantidad: number;
            precioUnitarioBs: number | string;
            costoUnitarioBs: number | string;
            subtotalBs: number | string;
            venta: {
              id: number;
              fechaHora: string;
              comprobanteReferencia: string | null;
            };
          }>;
        }>;
        resumenFinanciero: {
          totalCostoBs?: number;
          totalCostoUsd?: number;
          totalDispositivos: number;
          totalAccesorios: number;
          totalUnidadesIngresadas: number;
          totalUnidadesVendidas: number;
          porcentajeUnidadesVendidas: number;
          totalVentaProyectadaBs: number;
          margenProyectadoBs?: number;
          porcentajeMargenProyectado?: number;
          totalVentaRealizadaBs: number;
          porcentajeVentaRealizada: number;
          margenRealizadoBs?: number;
        };
      }>(`/recepcion/notas-ingreso/${id}`),
  },

  // 8. Caja Diaria & Gastos (US12, US13)
  caja: {
    getActiva: (sucursalId?: number) => {
      const q = sucursalId ? `?sucursalId=${sucursalId}` : '';
      return request<{
        caja: any;
        resumenFinanciero: {
          montoInicialEfectivo: number;
          totalVentasEfectivo: number;
          totalVentasDigitales: number;
          totalRecaudadoTotal: number;
          totalGastosEfectivo: number;
          totalGastosOtros: number;
          saldoEfectivoEnCaja: number;
          cantidadVentas: number;
          cantidadGastos: number;
        };
      } | null>(`/caja/activa${q}`);
    },
    abrir: (data: { sucursalId: number; montoInicialEfectivo: number; observaciones?: string }) =>
      request<any>('/caja/abrir', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    cerrar: (
      cajaId: number,
      data: { montoFinalEfectivo: number; justificacion?: string; observaciones?: string }
    ) =>
      request<any>(`/caja/${cajaId}/cerrar`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    registrarGasto: (
      cajaId: number,
      data: { categoriaId: number; montoBs: number; concepto: string; metodoPagoId?: number }
    ) =>
      request<any>(`/caja/${cajaId}/gastos`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getCategoriasGasto: () =>
      request<Array<{ id: number; nombre: string }>>('/caja/categorias-gasto'),
    getUsuarios: (sucursalId?: number) => {
      const q = sucursalId ? `?sucursalId=${sucursalId}` : '';
      return request<
        Array<{
          id: number;
          nombre: string;
          email: string;
          rol: string;
          sucursalId: number;
          sucursal?: { id: number; nombre: string };
        }>
      >(`/caja/usuarios${q}`);
    },
    getHistorial: (
      paramsOrSucursalId?:
        | number
        | {
            page?: number;
            limit?: number;
            sucursalId?: number;
            usuarioId?: number;
            fechaDesde?: string;
            fechaHasta?: string;
            search?: string;
          }
    ) => {
      const q = new URLSearchParams();
      if (typeof paramsOrSucursalId === 'number') {
        q.set('sucursalId', String(paramsOrSucursalId));
      } else if (paramsOrSucursalId && typeof paramsOrSucursalId === 'object') {
        if (paramsOrSucursalId.page) q.set('page', String(paramsOrSucursalId.page));
        if (paramsOrSucursalId.limit) q.set('limit', String(paramsOrSucursalId.limit));
        if (paramsOrSucursalId.sucursalId)
          q.set('sucursalId', String(paramsOrSucursalId.sucursalId));
        if (paramsOrSucursalId.usuarioId)
          q.set('usuarioId', String(paramsOrSucursalId.usuarioId));
        if (paramsOrSucursalId.fechaDesde)
          q.set('fechaDesde', paramsOrSucursalId.fechaDesde);
        if (paramsOrSucursalId.fechaHasta)
          q.set('fechaHasta', paramsOrSucursalId.fechaHasta);
        if (paramsOrSucursalId.search)
          q.set('search', paramsOrSucursalId.search);
      }
      const queryStr = q.toString() ? `?${q.toString()}` : '';
      return request<
        | {
            data: Array<any>;
            meta: {
              total: number;
              page: number;
              limit: number;
              totalPages: number;
              hasNextPage: boolean;
              hasPrevPage: boolean;
            };
          }
        | Array<any>
      >(`/caja/historial${queryStr}`);
    },
    getDetalle: (cajaId: number) =>
      request<{
        caja: any;
        resumenFinanciero: {
          montoInicialEfectivo: number;
          totalVentasEfectivo: number;
          totalVentasDigitales: number;
          totalVentasTotal: number;
          totalGastosEfectivo: number;
          totalGastosOtros: number;
          totalGastosTotal: number;
          saldoTeoricoEfectivo: number;
          montoFinalEfectivo: number | null;
          diferenciaEfectivo: number | null;
          cantidadVentas: number;
          cantidadVentasCompletadas: number;
          cantidadVentasAnuladas: number;
          cantidadGastos: number;
          totalCostoMercaderia?: number;
          gananciaNetaVentas?: number;
          gananciaNetaOperativa?: number;
        };
      }>(`/caja/${cajaId}/detalle`),
  },

  // 9. Ventas & POS (US14, US15)
  ventas: {
    getMetodosPago: () =>
      request<
        Array<{ id: number; codigo: string; nombre: string; tipoEstrategia: string }>
      >('/ventas/metodos-pago'),
    create: (data: {
      metodoPagoCodigo: string;
      comprobanteReferencia?: string;
      comprobanteImagenUrl?: string;
      cajaId?: number;
      sucursalId?: number;
      cliente?: { nombreCompleto: string; telefono: string; ciNit?: string };
      dispositivos?: Array<{ dispositivoId: number; precioVentaBs: number }>;
      accesorios?: Array<{
        loteAccesorioId: number;
        cantidad: number;
        precioVentaBs: number;
      }>;
    }) =>
      request<any>('/ventas', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAll: (cajaId?: number, sucursalId?: number) => {
      const q = new URLSearchParams();
      if (cajaId) q.set('cajaId', String(cajaId));
      if (sucursalId) q.set('sucursalId', String(sucursalId));
      return request<any[]>(`/ventas?${q.toString()}`);
    },
    getOne: (id: number) => request<any>(`/ventas/${id}`),
    anular: (id: number, motivo: string) =>
      request<any>(`/ventas/${id}/anular`, {
        method: 'PATCH',
        body: JSON.stringify({ motivo }),
      }),
    getReporteRentabilidad: (params?: {
      fechaInicio?: string;
      fechaFin?: string;
      sucursalId?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.fechaInicio) q.set('fechaInicio', params.fechaInicio);
      if (params?.fechaFin) q.set('fechaFin', params.fechaFin);
      if (params?.sucursalId) q.set('sucursalId', String(params.sucursalId));
      return request<{
        resumen: {
          totalIngresosBs: number;
          totalCostoMercaderiaBs: number;
          gananciaBrutaBs: number;
          totalGastosOperativosBs: number;
          gananciaNetaRealBs: number;
          margenNetoPorcentaje: number;
          cantidadVentasCompletadas: number;
          cantidadVentasAnuladas: number;
          totalDispositivosVendidos: number;
          totalAccesoriosVendidos: number;
          totalGastosCount: number;
        };
        desgloseMetodosPago: Record<string, number>;
        desgloseGastosPorCategoria: Record<string, number>;
        transacciones: Array<{
          id: number;
          fechaHora: string;
          estado: 'COMPLETADA' | 'ANULADA';
          motivoAnulacion: string | null;
          fechaAnulacion: string | null;
          anuladoPor: string | null;
          comprobanteReferencia: string;
          vendedor: string;
          cliente: string;
          clienteTelefono: string | null;
          sucursal: string;
          metodoPago: string;
          totalVentaBs: number;
          costoTotalBs: number;
          gananciaBs: number;
          itemsCount: number;
          detalles: Array<{
            id: number;
            tipoItem: 'DISPOSITIVO' | 'ACCESORIO';
            cantidad: number;
            nombreItem: string;
            imei: string | null;
            costoUnitarioBs: number;
            precioUnitarioBs: number;
            subtotalBs: number;
          }>;
        }>;
      }>(`/ventas/reporte-rentabilidad?${q.toString()}`);
    },
  },

  // 10. Salud del Sistema y Conectividad a Base de Datos
  health: {
    check: () =>
      request<{
        status: 'ok' | 'error';
        timestamp: string;
        uptime: number;
        environment: string;
        database: {
          status: 'up' | 'down';
          latencyMs?: number;
          error?: string;
        };
      }>('/health'),
  },
};
