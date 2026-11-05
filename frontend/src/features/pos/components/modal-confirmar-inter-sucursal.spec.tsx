import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalConfirmarInterSucursal } from './modal-confirmar-inter-sucursal';

describe('ModalConfirmarInterSucursal', () => {
  const pendingPhone = {
    tipo: 'DISPOSITIVO' as const,
    disp: {
      id: 50,
      sucursalId: 2,
      sucursal: { id: 2, nombre: 'Sucursal Cochabamba', ciudad: 'Cochabamba' },
      numeroSerie: 'SN-TEST-999',
      imei1: '356987112233445',
      variante: {
        modelo: { nombreModelo: 'iPhone 15 Pro' },
        color: 'Titanio Azul',
        capacidadGb: 256,
      },
    },
  };

  it('permite elegir entre vender como inter-sucursal o conmutar a la sucursal de origen', () => {
    const mockOnConfirm = vi.fn();
    const mockOnSwitch = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <ModalConfirmarInterSucursal
        isOpen={true}
        onClose={mockOnClose}
        pendingItem={pendingPhone}
        currentSucursalNombre="Sucursal Central (Santa Cruz)"
        onConfirm={mockOnConfirm}
        onSwitchSucursalAndAdd={mockOnSwitch}
      />
    );

    expect(screen.getByText(/Confirmar Venta Inter-Sucursal/i)).toBeInTheDocument();
    expect(screen.getAllByText('Sucursal Cochabamba').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sucursal Central (Santa Cruz)').length).toBeGreaterThanOrEqual(1);

    // Probar botón de conmutar a sucursal de origen
    const switchBtn = screen.getByText(/Cambiar a Sucursal Cochabamba y Vender Local/i);
    expect(switchBtn).toBeInTheDocument();
    fireEvent.click(switchBtn);

    expect(mockOnSwitch).toHaveBeenCalledWith({
      id: 2,
      nombre: 'Sucursal Cochabamba',
      ciudad: 'Cochabamba',
    });

    // Probar botón de vender como inter-sucursal
    const confirmBtn = screen.getByText(/Vender como Inter-Sucursal/i);
    expect(confirmBtn).toBeInTheDocument();
    fireEvent.click(confirmBtn);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('permite cancelar la acción y cerrar el modal', () => {
    const mockOnConfirm = vi.fn();
    const mockOnSwitch = vi.fn();
    const mockOnClose = vi.fn();

    render(
      <ModalConfirmarInterSucursal
        isOpen={true}
        onClose={mockOnClose}
        pendingItem={pendingPhone}
        currentSucursalNombre="Sucursal Central (Santa Cruz)"
        onConfirm={mockOnConfirm}
        onSwitchSucursalAndAdd={mockOnSwitch}
      />
    );

    const cancelBtn = screen.getByText('Cancelar');
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
