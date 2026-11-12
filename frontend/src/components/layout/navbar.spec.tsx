import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
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

  it('omite el botón de texto Operaciones en desktop pero mantiene el Logo a / e Inicio en móvil', async () => {
    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByTitle('CentralPhone - Inicio / Operaciones')).toBeInTheDocument();
    });

    // El logo apunta a /
    const logoLink = screen.getByTitle('CentralPhone - Inicio / Operaciones');
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');

    // El navbar desktop no debe tener un enlace de texto llamado 'Operaciones'
    const desktopNav = document.querySelector('nav.hidden.lg\\:flex');
    expect(desktopNav).toBeInTheDocument();
    expect(desktopNav?.textContent).not.toContain('Operaciones');
    expect(desktopNav?.textContent).toContain('Punto de Venta');

    // La barra móvil contiene 'Inicio'
    const mobileNav = screen.getByLabelText('Navegación móvil y tablet');
    expect(mobileNav).toBeInTheDocument();
    expect(mobileNav.textContent).toContain('Inicio');
  });

  it('permite a un Administrador conmutar de sucursal desde el selector dedicado', async () => {
    render(<Navbar />);

    // Verificar que la sucursal activa se proyecta en el selector
    await waitFor(() => {
      expect(screen.getAllByText('Sucursal Central').length).toBeGreaterThanOrEqual(1);
    });

    // Abrir dropdown dedicado de sucursal
    const sucursalButton = screen.getAllByText('Sucursal Central')[0].closest('button');
    expect(sucursalButton).toBeInTheDocument();
    fireEvent.click(sucursalButton!);

    // Verificar que se listan las sucursales disponibles
    await waitFor(() => {
      expect(screen.getByText(/Sucursales/i)).toBeInTheDocument();
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

  it('debe solicitar confirmación antes de conmutar sucursal si el carrito de POS contiene productos (ID-UX-001)', async () => {
    const nextNav = await import('next/navigation');
    vi.spyOn(nextNav, 'usePathname').mockReturnValue('/pos');

    window.sessionStorage.setItem('pos_cart_has_items', 'true');
    const confirmSpy = vi.spyOn(window, 'confirm');

    // 1. Caso cancelado por el usuario
    confirmSpy.mockReturnValueOnce(false);
    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getAllByText('Sucursal Central').length).toBeGreaterThanOrEqual(1);
    });

    const sucursalButton = screen.getAllByText('Sucursal Central')[0].closest('button');
    fireEvent.click(sucursalButton!);

    await waitFor(() => {
      expect(screen.getByText(/Sucursal Norte \(Cochabamba\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Sucursal Norte \(Cochabamba\)/i));
    expect(confirmSpy).toHaveBeenCalled();
    expect(mockSetActiveSucursal).not.toHaveBeenCalled();

    // 2. Caso confirmado por el usuario
    confirmSpy.mockReturnValueOnce(true);
    fireEvent.click(sucursalButton!);
    fireEvent.click(screen.getByText(/Sucursal Norte \(Cochabamba\)/i));
    expect(mockSetActiveSucursal).toHaveBeenCalledWith({
      id: 2,
      nombre: 'Sucursal Norte',
      ciudad: 'Cochabamba',
    });

    window.sessionStorage.removeItem('pos_cart_has_items');
  });
});
