import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalEditarDispositivoInline } from './modal-editar-dispositivo-inline';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    modelos: {
      updateDispositivo: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('ModalEditarDispositivoInline', () => {
  const onCloseMock = vi.fn();
  const onSuccessMock = vi.fn();

  const mockDispositivo = {
    id: 50,
    modelo: 'iPhone 13',
    color: 'Midnight',
    capacidadGb: 128,
    numeroSerie: 'F2LZX001',
    imei1: '358900112233445',
    imei2: '358900112233446',
    porcentajeBateria: 85,
    detallesFisicos: 'Batería original',
    costoBs: 3500,
    estadoInventario: 'DISPONIBLE',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no debe renderizar nada si isOpen es false', () => {
    render(
      <ModalEditarDispositivoInline
        isOpen={false}
        onClose={onCloseMock}
        dispositivo={mockDispositivo}
        onSuccess={onSuccessMock}
      />
    );

    expect(screen.queryByText('Editar Información del Dispositivo')).not.toBeInTheDocument();
  });

  it('debe renderizar inputs inicializados con los datos del equipo cuando isOpen es true', () => {
    render(
      <ModalEditarDispositivoInline
        isOpen={true}
        onClose={onCloseMock}
        dispositivo={mockDispositivo}
        onSuccess={onSuccessMock}
      />
    );

    expect(screen.getByText('Editar Información del Dispositivo')).toBeInTheDocument();
    expect(screen.getByText('iPhone 13')).toBeInTheDocument();
    expect(screen.getByLabelText(/Número de Serie/i)).toHaveValue('F2LZX001');
    expect(screen.getByLabelText(/Condición Batería/i)).toHaveValue(85);
    expect(screen.getByLabelText(/Costo de Compra/i)).toHaveValue(3500);
  });

  it('debe enviar la actualización a api.modelos.updateDispositivo y llamar a onSuccess', async () => {
    (api.modelos.updateDispositivo as any).mockResolvedValue({ id: 50 });

    render(
      <ModalEditarDispositivoInline
        isOpen={true}
        onClose={onCloseMock}
        dispositivo={mockDispositivo}
        onSuccess={onSuccessMock}
      />
    );

    fireEvent.change(screen.getByLabelText(/Condición Batería/i), {
      target: { value: '90' },
    });
    fireEvent.change(screen.getByLabelText(/Costo de Compra/i), {
      target: { value: '3600' },
    });
    fireEvent.change(screen.getByLabelText(/Registro \/ Situación Física/i), {
      target: { value: 'Batería cambiada original' },
    });

    const submitBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.modelos.updateDispositivo).toHaveBeenCalledWith(50, {
        numeroSerie: 'F2LZX001',
        imei1: '358900112233445',
        imei2: '358900112233446',
        porcentajeBateria: 90,
        costoBs: 3600,
        detallesFisicos: 'Batería cambiada original',
      });
      expect(onSuccessMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
