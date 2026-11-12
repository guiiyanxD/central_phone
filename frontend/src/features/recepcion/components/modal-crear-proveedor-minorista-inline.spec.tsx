import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalCrearProveedorMinoristaInline } from './modal-crear-proveedor-minorista-inline';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    proveedores: {
      create: vi.fn(),
    },
  },
  ApiError: class ApiError extends Error {},
}));

describe('ModalCrearProveedorMinoristaInline', () => {
  const onCloseMock = vi.fn();
  const onCreadoMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no debe renderizar nada si isOpen es false', () => {
    render(
      <ModalCrearProveedorMinoristaInline
        isOpen={false}
        onClose={onCloseMock}
        onProveedorCreado={onCreadoMock}
      />
    );

    expect(screen.queryByText('Nuevo Proveedor Minorista')).not.toBeInTheDocument();
  });

  it('debe renderizar inputs cuando isOpen es true', () => {
    render(
      <ModalCrearProveedorMinoristaInline
        isOpen={true}
        onClose={onCloseMock}
        onProveedorCreado={onCreadoMock}
      />
    );

    expect(screen.getByText('Nuevo Proveedor Minorista')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del Cliente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono de Contacto/i)).toBeInTheDocument();
  });

  it('debe crear un proveedor minorista con tipo MINORISTA y llamar a onProveedorCreado', async () => {
    const mockNuevoProv = {
      id: 99,
      nombre: 'Carlos',
      apellido: 'Mendoza',
      telefono: '78899001',
      empresa: 'Cliente Permuta',
      contactoReferencia: 'Proveedor Minorista (Permuta)',
      tipo: 'MINORISTA',
      activo: true,
      creadoEn: new Date().toISOString(),
      actualizadoEn: new Date().toISOString(),
    };

    (api.proveedores.create as any).mockResolvedValue(mockNuevoProv);

    render(
      <ModalCrearProveedorMinoristaInline
        isOpen={true}
        onClose={onCloseMock}
        onProveedorCreado={onCreadoMock}
      />
    );

    fireEvent.change(screen.getByLabelText(/Nombre del Cliente/i), {
      target: { value: 'Carlos' },
    });
    fireEvent.change(screen.getByLabelText(/Apellido/i), {
      target: { value: 'Mendoza' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono de Contacto/i), {
      target: { value: '78899001' },
    });

    const submitBtn = screen.getByRole('button', { name: /Crear y Seleccionar/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.proveedores.create).toHaveBeenCalledWith({
        nombre: 'Carlos',
        apellido: 'Mendoza',
        telefono: '78899001',
        empresa: 'Cliente Permuta',
        contactoReferencia: 'Proveedor Minorista (Permuta)',
        tipo: 'MINORISTA',
      });
      expect(onCreadoMock).toHaveBeenCalledWith(mockNuevoProv);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
