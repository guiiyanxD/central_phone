import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalCrearCategoriaGastoInline } from './modal-crear-categoria-gasto-inline';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    caja: {
      crearCategoriaGasto: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('ModalCrearCategoriaGastoInline Component', () => {
  const onCategoriaCreada = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar inputs cuando isOpen es true', () => {
    render(
      <ModalCrearCategoriaGastoInline
        isOpen={true}
        onClose={onClose}
        onCategoriaCreada={onCategoriaCreada}
      />
    );

    expect(screen.getByText('Nueva Categoría de Egreso')).toBeDefined();
    expect(screen.getByPlaceholderText(/Taxi y Envíos/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Crear Categoría/i })).toBeDefined();
  });

  it('no debe renderizar nada cuando isOpen es false', () => {
    const { container } = render(
      <ModalCrearCategoriaGastoInline
        isOpen={false}
        onClose={onClose}
        onCategoriaCreada={onCategoriaCreada}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('debe crear la categoría y llamar a onCategoriaCreada al enviar el formulario', async () => {
    const mockNuevaCat = { id: 5, nombre: 'Taxi y Envíos' };
    (api.caja.crearCategoriaGasto as any).mockResolvedValue(mockNuevaCat);

    render(
      <ModalCrearCategoriaGastoInline
        isOpen={true}
        onClose={onClose}
        onCategoriaCreada={onCategoriaCreada}
      />
    );

    const input = screen.getByPlaceholderText(/Taxi y Envíos/i);
    fireEvent.change(input, { target: { value: 'Taxi y Envíos' } });

    const submitBtn = screen.getByRole('button', { name: /Crear Categoría/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.caja.crearCategoriaGasto).toHaveBeenCalledWith({
        nombre: 'Taxi y Envíos',
      });
      expect(onCategoriaCreada).toHaveBeenCalledWith(mockNuevaCat);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('debe mostrar error si el nombre tiene menos de 2 caracteres', () => {
    render(
      <ModalCrearCategoriaGastoInline
        isOpen={true}
        onClose={onClose}
        onCategoriaCreada={onCategoriaCreada}
      />
    );

    const input = screen.getByPlaceholderText(/Taxi y Envíos/i);
    fireEvent.change(input, { target: { value: 'A' } });

    const submitBtn = screen.getByRole('button', { name: /Crear Categoría/i });
    expect((submitBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
