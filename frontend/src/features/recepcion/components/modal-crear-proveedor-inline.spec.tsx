import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModalCrearProveedorInline } from './modal-crear-proveedor-inline';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    proveedores: {
      create: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('ModalCrearProveedorInline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no debe renderizar nada si isOpen es false', () => {
    const { container } = render(
      <ModalCrearProveedorInline
        isOpen={false}
        onClose={vi.fn()}
        onProveedorCreado={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('debe renderizar inputs cuando isOpen es true', () => {
    render(
      <ModalCrearProveedorInline
        isOpen={true}
        onClose={vi.fn()}
        onProveedorCreado={vi.fn()}
      />
    );

    expect(screen.getByText('Registrar Nuevo Proveedor al Vuelo')).toBeDefined();
    expect(screen.getByLabelText(/^Nombre/i)).toBeDefined();
    expect(screen.getByLabelText(/Empresa/i)).toBeDefined();
    expect(screen.getByLabelText(/Teléfono/i)).toBeDefined();
  });

  it('debe crear un proveedor y llamar a onProveedorCreado al enviar formulario', async () => {
    const onCreadoMock = vi.fn();
    const onCloseMock = vi.fn();

    const mockNuevoProv = {
      id: 99,
      nombre: 'Mayorista Miami Corp',
      empresa: 'Miami Wholesale',
      telefono: '77112233',
      contactoReferencia: 'WhatsApp',
      activo: true,
    };

    (api.proveedores.create as any).mockResolvedValue(mockNuevoProv);

    render(
      <ModalCrearProveedorInline
        isOpen={true}
        onClose={onCloseMock}
        onProveedorCreado={onCreadoMock}
      />
    );

    fireEvent.change(screen.getByLabelText(/^Nombre/i), {
      target: { value: 'Mayorista Miami Corp' },
    });
    fireEvent.change(screen.getByLabelText(/Empresa/i), {
      target: { value: 'Miami Wholesale' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono/i), {
      target: { value: '77112233' },
    });

    const submitBtn = screen.getByRole('button', { name: /Crear Proveedor/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.proveedores.create).toHaveBeenCalledWith({
        nombre: 'Mayorista Miami Corp',
        apellido: undefined,
        empresa: 'Miami Wholesale',
        telefono: '77112233',
        contactoReferencia: undefined,
      });
      expect(onCreadoMock).toHaveBeenCalledWith(mockNuevoProv);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
