import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalEditarPermuta } from './modal-editar-permuta';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    recepcion: {
      updatePermuta: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('ModalEditarPermuta Component', () => {
  const mockPermuta = {
    id: 55,
    proveedor: {
      nombre: 'Juan Perez',
      telefono: '77788899',
    },
    dispositivos: [
      {
        id: 12,
        porcentajeBateria: 85,
        detallesFisicos: 'Bloqueado con AT&T / R-SIM',
        variante: {
          modelo: {
            nombreModelo: 'iPhone 13 Pro',
          },
        },
      },
    ],
    observaciones: 'Equipo en buen estado',
    fechaIngreso: '2026-11-01T10:00:00.000Z',
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    permuta: mockPermuta,
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.recepcion.updatePermuta as any).mockResolvedValue({ id: 55 });
  });

  it('debe renderizar el input de Registro e inicializarlo con la situación de liberación existente', () => {
    render(<ModalEditarPermuta {...defaultProps} />);

    expect(screen.getByText('Editar Permuta #ING-55')).toBeDefined();
    expect(screen.getByLabelText(/Registro/i)).toBeDefined();

    const registroInput = screen.getByLabelText(/Registro/i) as HTMLInputElement;
    expect(registroInput.value).toBe('Bloqueado con AT&T / R-SIM');
  });

  it('debe enviar el nuevo valor de Registro al actualizar la permuta', async () => {
    render(<ModalEditarPermuta {...defaultProps} />);

    const registroInput = screen.getByLabelText(/Registro/i);
    fireEvent.change(registroInput, { target: { value: 'Liberado de fábrica definitivo' } });

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.recepcion.updatePermuta).toHaveBeenCalledWith(
        55,
        expect.objectContaining({
          dispositivo: expect.objectContaining({
            detallesFisicos: 'Liberado de fábrica definitivo',
          }),
        }),
      );
    });

    expect(defaultProps.onSuccess).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
