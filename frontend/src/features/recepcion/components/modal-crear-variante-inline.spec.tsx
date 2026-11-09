import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalCrearVarianteInline } from './modal-crear-variante-inline';
import { api, ApiError } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    modelos: {
      addVariante: vi.fn(),
      create: vi.fn(),
      createTipo: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
      this.name = 'ApiError';
    }
  },
}));

describe('ModalCrearVarianteInline Component', () => {
  const mockModelos = [
    {
      id: 1,
      nombreModelo: 'iPhone 15 Pro',
      tipo: 'IPHONE',
      variantes: [
        { id: 10, color: 'Titanio Natural', capacidadGb: 128, tipoSim: 'SIM Físico' },
      ],
    },
    {
      id: 2,
      nombreModelo: 'MacBook Air M3',
      tipo: 'MAC',
      variantes: [],
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    modelos: mockModelos,
    tipos: [
      { id: 1, nombre: 'IPHONE', descripcion: null },
      { id: 2, nombre: 'MAC', descripcion: null },
    ],
    nuevaVarModeloId: 1,
    setNuevaVarModeloId: vi.fn(),
    nuevaVarColor: '',
    setNuevaVarColor: vi.fn(),
    nuevaVarCapacidad: 256,
    setNuevaVarCapacidad: vi.fn(),
    nuevaVarSim: 'SIM Físico',
    setNuevaVarSim: vi.fn(),
    onConfirm: vi.fn(),
    onVarianteCreada: vi.fn(),
    onModeloCreado: vi.fn(),
    onTipoCreado: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe persistir inmediatamente la variante en el backend al confirmar para modelo existente', async () => {
    const mockCreatedVariante = {
      id: 99,
      modeloId: 1,
      color: 'Titanio Blanco',
      capacidadGb: 256,
      tipoSim: 'SIM Físico',
    };
    (api.modelos.addVariante as any).mockResolvedValueOnce(mockCreatedVariante);

    render(<ModalCrearVarianteInline {...defaultProps} nuevaVarColor="Titanio Blanco" />);

    const confirmButton = screen.getByRole('button', { name: /Confirmar e Inyectar/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.modelos.addVariante).toHaveBeenCalledWith(1, {
        color: 'Titanio Blanco',
        capacidadGb: 256,
        tipoSim: 'SIM Físico',
      });
      expect(defaultProps.onVarianteCreada).toHaveBeenCalledWith(mockCreatedVariante, 1);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('debe reutilizar la variante existente si el backend responde con conflicto 409', async () => {
    const conflictError = new ApiError('La variante ya existe para este modelo.', 409);
    (api.modelos.addVariante as any).mockRejectedValueOnce(conflictError);

    render(
      <ModalCrearVarianteInline
        {...defaultProps}
        nuevaVarModeloId={1}
        nuevaVarColor="Titanio Natural"
        nuevaVarCapacidad={128}
        nuevaVarSim="SIM Físico"
      />
    );

    const confirmButton = screen.getByRole('button', { name: /Confirmar e Inyectar/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(defaultProps.onVarianteCreada).toHaveBeenCalledWith(
        mockModelos[0].variantes[0],
        1
      );
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('debe mostrar error inline si la API falla', async () => {
    const networkError = new ApiError('Error de conexión con el catálogo', 500);
    (api.modelos.addVariante as any).mockRejectedValueOnce(networkError);

    render(<ModalCrearVarianteInline {...defaultProps} nuevaVarColor="Rojo" />);

    const confirmButton = screen.getByRole('button', { name: /Confirmar e Inyectar/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Error de conexión con el catálogo')).toBeInTheDocument();
      expect(defaultProps.onVarianteCreada).not.toHaveBeenCalled();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  it('debe soportar la creación de modelo nuevo al vuelo con persistencia atómica', async () => {
    const mockNuevoModelo = {
      id: 50,
      nombreModelo: 'iPhone 17 Pro',
      tipo: 'IPHONE',
      variantes: [
        { id: 501, color: 'Titanium Blue', capacidadGb: 256, tipoSim: 'eSIM Exclusivo' },
      ],
    };
    (api.modelos.create as any).mockResolvedValueOnce(mockNuevoModelo);

    render(
      <ModalCrearVarianteInline
        {...defaultProps}
        nuevaVarColor="Titanium Blue"
        nuevaVarCapacidad={256}
        nuevaVarSim="eSIM Exclusivo"
      />
    );

    // Abrir sub-panel de nuevo modelo
    const btnNuevoModelo = screen.getByRole('button', { name: /Nuevo Modelo/i });
    fireEvent.click(btnNuevoModelo);

    const inputNombreModelo = screen.getByPlaceholderText(/Ej: iPhone 17 Pro/i);
    fireEvent.change(inputNombreModelo, { target: { value: 'iPhone 17 Pro' } });

    const confirmButton = screen.getByRole('button', { name: /Confirmar e Inyectar/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(api.modelos.create).toHaveBeenCalledWith(
        expect.objectContaining({
          nombreModelo: 'iPhone 17 Pro',
          variantes: [
            {
              color: 'Titanium Blue',
              capacidadGb: 256,
              tipoSim: 'eSIM Exclusivo',
            },
          ],
        })
      );
      expect(defaultProps.onModeloCreado).toHaveBeenCalledWith(
        mockNuevoModelo,
        mockNuevoModelo.variantes[0]
      );
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
