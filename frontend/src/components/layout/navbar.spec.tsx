import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Navbar } from './navbar';

// Mock de usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

const mockSetActiveSucursal = vi.fn();

// Mock de useAuth
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      nombre: 'Administrador Central',
      email: 'admin@centralphone.com',
      rol: 'ADMIN',
      sucursal: { id: 1, nombre: 'Sucursal Central', ciudad: 'Santa Cruz' },
    },
    activeSucursal: { id: 1, nombre: 'Sucursal Central', ciudad: 'Santa Cruz' },
    setActiveSucursal: mockSetActiveSucursal,
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
    sucursales: {
      getAll: vi.fn().mockResolvedValue([
        { id: 1, nombre: 'Sucursal Central', ciudad: 'Santa Cruz', activo: true },
        { id: 2, nombre: 'Sucursal Norte', ciudad: 'Cochabamba', activo: true },
      ]),
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

  it('permite a un Administrador conmutar de sucursal desde el dropdown de usuario', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(<Navbar />);

    // Verificar que la sucursal activa se proyecta en el chip
    await waitFor(() => {
      expect(screen.getAllByText('Sucursal Central').length).toBeGreaterThanOrEqual(1);
    });

    // Abrir dropdown de usuario
    const userButton = screen.getByText('Administrador Central').closest('button');
    expect(userButton).toBeInTheDocument();
    fireEvent.click(userButton!);

    // Verificar que se listan las sucursales disponibles
    await waitFor(() => {
      expect(screen.getByText(/Sucursal Activa/i)).toBeInTheDocument();
      expect(screen.getByText(/Sucursal Norte \(Cochabamba\)/i)).toBeInTheDocument();
    });

    // Clic en Sucursal Norte
    const sucursalNorteBtn = screen.getByText(/Sucursal Norte \(Cochabamba\)/i);
    fireEvent.click(sucursalNorteBtn);

    // Debe invocar setActiveSucursal con la información de la nueva sucursal
    expect(mockSetActiveSucursal).toHaveBeenCalledWith({
      id: 2,
      nombre: 'Sucursal Norte',
      ciudad: 'Cochabamba',
    });
  });
});
