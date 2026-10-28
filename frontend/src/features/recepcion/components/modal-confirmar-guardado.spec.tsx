import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalConfirmarGuardado } from './modal-confirmar-guardado';

describe('ModalConfirmarGuardado - Resumen Ejecutivo y Prevención de Guardado Accidental', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isSubmitting: false,
    proveedorNombre: 'Apple Mayorista Oficial',
    sucursalNombre: 'Sucursal Central - La Paz',
    numeroComprobante: 'FAC-9912',
    observaciones: 'Lote prioritario',
    totalTelefonos: 3,
    totalAccesorios: 0,
    totalCostoBs: 15750,
    totalCostoUsd: 2250,
  };

  it('debe renderizar correctamente los datos ejecutivos de la nota de ingreso', () => {
    render(<ModalConfirmarGuardado {...defaultProps} />);

    expect(screen.getByText('Confirmar Recepción de Mercadería')).toBeDefined();
    expect(screen.getByText('Apple Mayorista Oficial')).toBeDefined();
    expect(screen.getByText('Sucursal Central - La Paz')).toBeDefined();
    expect(screen.getByText('FAC-9912')).toBeDefined();
    expect(screen.getByText(/Lote prioritario/)).toBeDefined();
    expect(screen.getByText('3')).toBeDefined(); // teléfonos
    expect(screen.getByText('0')).toBeDefined(); // accesorios
    expect(screen.getByText(/15.750,00/)).toBeDefined(); // Bs
    expect(screen.getByText(/\$ 2250.00 USD/)).toBeDefined(); // USD
  });

  it('debe llamar a onClose cuando se pulsa "Revisar y Corregir"', () => {
    const onClose = vi.fn();
    render(<ModalConfirmarGuardado {...defaultProps} onClose={onClose} />);

    const revisarBtn = screen.getByRole('button', { name: /Revisar y Corregir/i });
    fireEvent.click(revisarBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('debe llamar a onConfirm cuando se pulsa "Confirmar y Guardar Recepción"', () => {
    const onConfirm = vi.fn();
    render(<ModalConfirmarGuardado {...defaultProps} onConfirm={onConfirm} />);

    const confirmarBtn = screen.getByRole('button', { name: /Confirmar y Guardar Recepción/i });
    fireEvent.click(confirmarBtn);

    expect(onConfirm).toHaveBeenCalled();
  });

  it('debe deshabilitar botones y mostrar estado de carga cuando isSubmitting es true', () => {
    render(<ModalConfirmarGuardado {...defaultProps} isSubmitting={true} />);

    const revisarBtn = screen.getByRole('button', { name: /Revisar y Corregir/i });
    expect(revisarBtn).toBeDisabled();

    expect(screen.getByText('Registrando en Inventario...')).toBeDefined();
  });
});
