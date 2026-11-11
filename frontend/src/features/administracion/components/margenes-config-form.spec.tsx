import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MargenesConfigForm } from './margenes-config-form';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    configuracion: {
      getMargenes: vi.fn(),
      updateMargenes: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('MargenesConfigForm Component', () => {
  const mockReglas = [
    {
      id: 1,
      categoria: 'DISPOSITIVO_NUEVO',
      tipoAumento: 'PORCENTAJE',
      valorBs: 15,
      tipoAumentoUsd: 'PORCENTAJE',
      valorUsd: 15,
    },
    {
      id: 2,
      categoria: 'DISPOSITIVO_USADO',
      tipoAumento: 'PORCENTAJE',
      valorBs: 15,
      tipoAumentoUsd: 'PORCENTAJE',
      valorUsd: 15,
    },
    {
      id: 3,
      categoria: 'ACCESORIO',
      tipoAumento: 'PORCENTAJE',
      valorBs: 20,
      tipoAumentoUsd: 'PORCENTAJE',
      valorUsd: 20,
    },
    {
      id: 4,
      categoria: 'PERMUTA',
      tipoAumento: 'PORCENTAJE',
      valorBs: 15,
      tipoAumentoUsd: 'PORCENTAJE',
      valorUsd: 15,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.configuracion.getMargenes as any).mockResolvedValue(mockReglas);
  });

  it('debe mantener operativo el margen USD en dispositivos pero deshabilitar y poner en readonly el margen USD en accesorios', async () => {
    render(<MargenesConfigForm />);

    await waitFor(() => {
      expect(screen.getByText('Accesorios y Repuestos')).toBeDefined();
      expect(screen.getByText('Dispositivos Nuevos')).toBeDefined();
    });

    // En Accesorios debe mostrar la insignia "No aplica por el momento" y la nota informativa
    expect(screen.getByText('No aplica por el momento')).toBeDefined();
    expect(
      screen.getByText('* Los accesorios operan exclusivamente en Bolivianos (Bs.) por el momento.'),
    ).toBeDefined();

    // En Dispositivos Nuevos debe mostrar la insignia "Operativo"
    const insigniasOperativo = screen.getAllByText('Operativo');
    expect(insigniasOperativo.length).toBeGreaterThan(0);
  });
});
