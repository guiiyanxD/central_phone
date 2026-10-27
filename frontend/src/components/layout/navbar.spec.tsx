import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Navbar } from './navbar';

// Mock de usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock de useAuth
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      nombre: 'Administrador Central',
      email: 'admin@centralphone.com',
      rol: 'ADMIN',
      sucursal: { id: 1, nombre: 'Sucursal Central' },
    },
    logout: vi.fn(),
    isLoading: false,
    isAuthenticated: true,
  }),
}));

// Mock de api
vi.mock('@/lib/api', () => ({
  api: {
    configuracion: {
      get: vi.fn().mockResolvedValue({
        id: 1,
        tcOficial: 12.05,
        tcParalelo: 13.18,
        tcActualizadoEn: '2026-10-27T10:00:00.000Z',
      }),
    },
  },
}));

describe('Navbar - Tipo de Cambio WaveSoft Widget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra las cotizaciones Oficial y Paralelo cargadas desde la configuración', async () => {
    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByText('12.05')).toBeInTheDocument();
      expect(screen.getByText('13.18')).toBeInTheDocument();
    });

    expect(screen.getByText(/Oficial:/i)).toBeInTheDocument();
    expect(screen.getByText(/Paralelo:/i)).toBeInTheDocument();
  });

  it('actualiza inmediatamente las cotizaciones en el Navbar cuando se despacha el evento configuracion-updated', async () => {
    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByText('12.05')).toBeInTheDocument();
    });

    // Simular que el Administrador sincronizó el TC desde el Centro de Administración
    act(() => {
      window.dispatchEvent(
        new CustomEvent('configuracion-updated', {
          detail: {
            tcOficial: 12.10,
            tcParalelo: 13.50,
            tcActualizadoEn: new Date().toISOString(),
          },
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('12.10')).toBeInTheDocument();
      expect(screen.getByText('13.50')).toBeInTheDocument();
    });
  });
});
