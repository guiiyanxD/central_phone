import { request } from './client';

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  database: {
    status: 'up' | 'down';
    latencyMs?: number;
    error?: string;
  };
}

export const healthApi = {
  check: () => request<HealthCheckResponse>('/health'),
};
