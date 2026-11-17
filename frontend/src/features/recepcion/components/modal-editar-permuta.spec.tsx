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
        costoBs: 3000,
        porcentajeBateria: 85,
        detallesFisicos: 'Bloqueado con AT&T / R-SIM',
        numeroSerie: 'SN-001',
        imei1: '351111111111111',
        estadoInventario: 'DISPONIBLE',
        variante: {
          modelo: {
            nombreModelo: 'iPhone 13 Pro',
          },
        },
      },
      {
        id: 13,
        costoBs: 4500,
        porcentajeBateria: 92,
        detallesFisicos: 'Liberado de fábrica',
        numeroSerie: 'SN-002',
        imei1: '352222222222222',
        estadoInventario: 'DISPONIBLE',
        variante: {
          modelo: {
            nombreModelo: 'iPhone 14 Pro Max',
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
    isAdmin: true,
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
          dispositivos: expect.arrayContaining([
            expect.objectContaining({
              id: 12,
              detallesFisicos: 'Liberado de fábrica definitivo',
            }),
          ]),
        }),
      );
    });

    expect(defaultProps.onSuccess).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('debe permitir cambiar de pestaña y editar el segundo iPhone del lote', async () => {
    render(<ModalEditarPermuta {...defaultProps} />);

    // Buscar pestaña del segundo equipo
    const tab2 = screen.getByRole('button', { name: /2\. iPhone 14 Pro Max/i });
    fireEvent.click(tab2);

    const registroInput = screen.getByLabelText(/Registro/i) as HTMLInputElement;
    expect(registroInput.value).toBe('Liberado de fábrica');

    // Cambiar batería del equipo #2
    const bateriaInput = screen.getByLabelText(/Salud de Batería/i);
    fireEvent.change(bateriaInput, { target: { value: '95' } });

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.recepcion.updatePermuta).toHaveBeenCalledWith(
        55,
        expect.objectContaining({
          dispositivos: expect.arrayContaining([
            expect.objectContaining({
              id: 13,
              porcentajeBateria: 95,
            }),
          ]),
        }),
      );
    });
  });

  it('debe bloquear la edición del Costo de Toma si el usuario NO es ADMIN', () => {
    render(<ModalEditarPermuta {...defaultProps} isAdmin={false} />);

    const costoInput = screen.getByLabelText(/Costo de Toma/i) as HTMLInputElement;
    expect(costoInput.disabled).toBe(true);
    expect(screen.getByText(/Solo Admin/i)).toBeDefined();
  });

  it('debe habilitar la edición del Costo de Toma si el usuario SI es ADMIN', () => {
    render(<ModalEditarPermuta {...defaultProps} isAdmin={true} />);

    const costoInput = screen.getByLabelText(/Costo de Toma/i) as HTMLInputElement;
    expect(costoInput.disabled).toBe(false);
  });

  it('debe permitir interactuar con los chips de auditoría rápida', () => {
    render(<ModalEditarPermuta {...defaultProps} />);

    const chipBateria = screen.getByRole('button', { name: /\+ Batería Cambiada/i });
    fireEvent.click(chipBateria);

    const registroInput = screen.getByLabelText(/Registro/i) as HTMLInputElement;
    expect(registroInput.value).toContain('Batería Cambiada');
  });
});
