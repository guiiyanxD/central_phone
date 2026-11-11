import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecepcionPermutaForm } from './recepcion-permuta-form';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    configuracion: {
      getMargenes: vi.fn(),
    },
    recepcion: {
      createPermuta: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('RecepcionPermutaForm Component', () => {
  const mockModelos = [
    {
      id: 1,
      nombreModelo: 'iPhone 13',
      tipo: 'IPHONE',
      variantes: [
        {
          id: 10,
          color: 'Negro',
          capacidadGb: 128,
          tipoSim: 'SIM Físico',
        },
      ],
    },
  ];

  const mockSucursales = [
    { id: 1, nombre: 'Sucursal Central', ciudad: 'Santa Cruz' },
  ];

  const defaultProps = {
    modelos: mockModelos,
    sucursales: mockSucursales,
    currentSucursalId: 1,
    isAdmin: true,
    onSuccess: vi.fn(),
    onOpenInlineVarianteModal: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.configuracion.getMargenes as any).mockResolvedValue([
      { categoria: 'PERMUTA', tipoAumento: 'PORCENTAJE', valorBs: 15 },
    ]);
    (api.recepcion.createPermuta as any).mockResolvedValue({ id: 101 });
  });

  it('debe renderizar el input de texto "Registro" en la sección de especificaciones del iPhone', async () => {
    render(<RecepcionPermutaForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('2. Especificaciones del Teléfono iPhone')).toBeDefined();
    });

    expect(screen.getByLabelText(/Registro/i)).toBeDefined();
    expect(
      screen.getByPlaceholderText(/Liberado de fábrica \/ Bloqueado AT&T \/ R-SIM/i),
    ).toBeDefined();
  });

  it('debe enviar el valor de "Registro" como detallesFisicos al registrar la permuta', async () => {
    render(<RecepcionPermutaForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Mateo' } });
    fireEvent.change(screen.getByLabelText(/Teléfono de Contacto/i), { target: { value: '71234567' } });
    fireEvent.change(screen.getByLabelText(/Número de Serie/i), { target: { value: 'F2LXYZ123' } });
    fireEvent.change(screen.getByLabelText(/IMEI 1/i), { target: { value: '354928110009999' } });
    fireEvent.change(screen.getByLabelText(/Registro/i), {
      target: { value: 'Liberado de fábrica (Comprobado con chip Entel)' },
    });
    fireEvent.change(screen.getByLabelText(/Costo de Toma \/ Compra/i), { target: { value: '2500' } });

    const submitBtn = screen.getByRole('button', { name: /Registrar Permuta/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.recepcion.createPermuta).toHaveBeenCalledWith(
        expect.objectContaining({
          dispositivo: expect.objectContaining({
            detallesFisicos: 'Liberado de fábrica (Comprobado con chip Entel)',
            numeroSerie: 'F2LXYZ123',
            imei1: '354928110009999',
            costoBs: 2500,
          }),
        }),
      );
    });

    expect(defaultProps.onSuccess).toHaveBeenCalledWith({ id: 101 });
  });
});
