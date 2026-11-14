// Centralized HTTP Client & Error Handling for CentralPhone

/**
 * Obtiene la URL base de la API adaptándose dinámicamente al protocolo y hostname del cliente.
 * 1. En producción (HTTPS): Si la página se carga sobre HTTPS, garantiza que la API use HTTPS
 *    (usando la variable o infiriendo api.<dominio>) previniendo 'blocked:mixed-content'.
 * 2. En red local (HTTP / LAN): Si el usuario accede desde una tablet en red local (ej: 192.168.x.x:3000),
 *    conmuta automáticamente el host hacia dicha IP para evitar 'Load failed'.
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== 'undefined') {
    // Escenario 1: Navegador en entorno HTTPS (Producción con SSL)
    if (window.location.protocol === 'https:') {
      // Si la variable de entorno está definida explícitamente con HTTPS, usarla
      if (envUrl && envUrl.startsWith('https://')) {
        return envUrl.replace(/\/$/, '');
      }

      // Si no fue inyectada en build-time o cayó en fallback de localhost/http,
      // deducir la API segura en el subdominio 'api.' del dominio actual
      const hostname = window.location.hostname;
      const apiHost = hostname.startsWith('app.')
        ? hostname.replace(/^app\./, 'api.')
        : `api.${hostname}`;
      return `https://${apiHost}/api/v1`;
    }

    // Escenario 2: Navegador en entorno HTTP (Desarrollo local o LAN en tienda)
    try {
      const fallbackUrl = envUrl || 'http://localhost:4000/api/v1';
      const parsed = new URL(fallbackUrl);
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

      return fallbackUrl.replace(/\/$/, '');
    } catch {
      // Retornar fallback seguro
    }
  }

  return envUrl || 'http://localhost:4000/api/v1';
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

export function getStoredToken(): string | null {
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

export async function request<T>(
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
