import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoriasGastoCrud } from './categorias-gasto-crud';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    caja: {
      getCategoriasGasto: vi.fn(),
      crearCategoriaGasto: vi.fn(),
      actualizarCategoriaGasto: vi.fn(),
      eliminarCategoriaGasto: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('CategoriasGastoCrud Component', () => {
  const mockCategorias = [
    {
      id: 1,
      nombre: 'Limpieza y Aseo',
      _count: { gastosOperativos: 4 },
    },
    {
      id: 2,
      nombre: 'Categoría Sin Uso',
      _count: { gastosOperativos: 0 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.caja.getCategoriasGasto as any).mockResolvedValue(mockCategorias);
  });

  it('debe listar las categorías con sus respectivos conteos de egresos', async () => {
    render(<CategoriasGastoCrud />);

    await waitFor(() => {
      expect(screen.getByText('Limpieza y Aseo')).toBeDefined();
      expect(screen.getByText('Categoría Sin Uso')).toBeDefined();
    });

    expect(screen.getByText(/4 egresos registrados/i)).toBeDefined();
    expect(screen.getByText(/0 egresos \(Sin uso\)/i)).toBeDefined();
  });

  it('debe deshabilitar la eliminación si la categoría tiene egresos asociados', async () => {
    render(<CategoriasGastoCrud />);

    await waitFor(() => {
      expect(screen.getByText('Limpieza y Aseo')).toBeDefined();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar/i });
    // El primer botón (Limpieza y Aseo con 4 egresos) debe estar disabled
    expect((deleteButtons[0] as HTMLButtonElement).disabled).toBe(true);

    // El segundo botón (Categoría Sin Uso con 0 egresos) debe estar habilitado
    expect((deleteButtons[1] as HTMLButtonElement).disabled).toBe(false);
  });

  it('debe abrir modal de edición y permitir actualizar el nombre', async () => {
    (api.caja.actualizarCategoriaGasto as any).mockResolvedValue({
      id: 1,
      nombre: 'Limpieza y Desinfección',
      _count: { gastosOperativos: 4 },
    });

    render(<CategoriasGastoCrud />);

    await waitFor(() => {
      expect(screen.getByText('Limpieza y Aseo')).toBeDefined();
    });

    const editButtons = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Editar Categoría de Egreso')).toBeDefined();
    const input = screen.getByDisplayValue('Limpieza y Aseo');
    fireEvent.change(input, { target: { value: 'Limpieza y Desinfección' } });

    const saveBtn = screen.getByRole('button', { name: /Guardar Cambios/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.caja.actualizarCategoriaGasto).toHaveBeenCalledWith(1, {
        nombre: 'Limpieza y Desinfección',
      });
    });
  });

  it('debe abrir modal de confirmación y eliminar categoría con 0 egresos', async () => {
    (api.caja.eliminarCategoriaGasto as any).mockResolvedValue({ success: true });

    render(<CategoriasGastoCrud />);

    await waitFor(() => {
      expect(screen.getByText('Categoría Sin Uso')).toBeDefined();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar/i });
    fireEvent.click(deleteButtons[1]);

    expect(screen.getByText(/¿Estás seguro de que deseas eliminar la categoría/i)).toBeDefined();

    const confirmDeleteBtn = screen.getByRole('button', { name: /Eliminar Categoría/i });
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(api.caja.eliminarCategoriaGasto).toHaveBeenCalledWith(2);
    });
  });

  it('debe permitir crear una nueva categoría desde el botón "+ Nueva Categoría"', async () => {
    (api.caja.crearCategoriaGasto as any).mockResolvedValue({
      id: 3,
      nombre: 'Cafetería y Agua',
      _count: { gastosOperativos: 0 },
    });

    render(<CategoriasGastoCrud />);

    const newBtn = screen.getByRole('button', { name: /Nueva Categoría/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Nueva Categoría de Egreso')).toBeDefined();
    const input = screen.getByPlaceholderText(/Servicios Básicos, Alquiler Tienda/i);
    fireEvent.change(input, { target: { value: 'Cafetería y Agua' } });

    const createSubmitBtn = screen.getByRole('button', { name: /Crear Categoría/i });
    fireEvent.click(createSubmitBtn);

    await waitFor(() => {
      expect(api.caja.crearCategoriaGasto).toHaveBeenCalledWith({
        nombre: 'Cafetería y Agua',
      });
    });
  });
});
