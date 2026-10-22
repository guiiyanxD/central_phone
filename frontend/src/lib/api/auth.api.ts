import { request } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'VENDEDOR';
  sucursal: { id: number; nombre: string; ciudad: string };
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  me: () => request<AuthUser>('/auth/me'),
};
