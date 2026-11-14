import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getApiBaseUrl } from './client';

describe('getApiBaseUrl', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  it('debe inferir https://api.centralphone1.cloud/api/v1 cuando se ejecuta en HTTPS sin variable de entorno', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'https:',
        hostname: 'centralphone1.cloud',
        host: 'centralphone1.cloud',
      },
      writable: true,
    });

    const url = getApiBaseUrl();
    expect(url).toBe('https://api.centralphone1.cloud/api/v1');
  });

  it('debe inferir https://api.centralphone1.cloud/api/v1 cuando se ejecuta en https://app.centralphone1.cloud', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'https:',
        hostname: 'app.centralphone1.cloud',
        host: 'app.centralphone1.cloud',
      },
      writable: true,
    });

    const url = getApiBaseUrl();
    expect(url).toBe('https://api.centralphone1.cloud/api/v1');
  });

  it('debe respetar la variable explícita si comienza con https://', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://custom-api.centralphone1.cloud/api/v1';
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'https:',
        hostname: 'centralphone1.cloud',
        host: 'centralphone1.cloud',
      },
      writable: true,
    });

    const url = getApiBaseUrl();
    expect(url).toBe('https://custom-api.centralphone1.cloud/api/v1');
  });

  it('debe retornar localhost:4000/api/v1 cuando se ejecuta en entorno de desarrollo local HTTP', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'http:',
        hostname: 'localhost',
        host: 'localhost:3000',
      },
      writable: true,
    });

    const url = getApiBaseUrl();
    expect(url).toBe('http://localhost:4000/api/v1');
  });

  it('debe conmutar el host al IP local de LAN cuando se accede desde una tablet en HTTP', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:4000/api/v1';
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'http:',
        hostname: '192.168.1.100',
        host: '192.168.1.100:3000',
      },
      writable: true,
    });

    const url = getApiBaseUrl();
    expect(url).toBe('http://192.168.1.100:4000/api/v1');
  });
});
