import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecepcionHeader } from './recepcion-header';

describe('RecepcionHeader - Tabs & Access Control', () => {
  const defaultProps = {
    isAdmin: false,
    activeTab: 'nuevo' as const,
    setActiveTab: vi.fn(),
    modoRecepcion: 'MAYORISTA' as const,
    setModoRecepcion: vi.fn(),
    proveedores: [{ id: 1, nombre: 'Proveedor Test' }],
    sucursales: [{ id: 1, nombre: 'Sucursal Central', ciudad: 'La Paz' }],
    proveedorId: 1,
    setProveedorId: vi.fn(),
    sucursalId: 1,
    setSucursalId: vi.fn(),
    numeroComprobante: 'FAC-001',
    setNumeroComprobante: vi.fn(),
    observaciones: '',
    setObservaciones: vi.fn(),
  };

  it('debe renderizar siempre la pestaña "Nueva Recepción"', () => {
    render(<RecepcionHeader {...defaultProps} />);
    expect(screen.getByText('Nueva Recepción')).toBeDefined();
  });

  it('NO debe mostrar las pestañas de historial si el usuario no es ADMIN', () => {
    render(<RecepcionHeader {...defaultProps} isAdmin={false} />);
    expect(screen.queryByText('Historial Mayorista')).toBeNull();
    expect(screen.queryByText('Historial de Permutas')).toBeNull();
  });

  it('debe mostrar las pestañas "Historial Mayorista" y "Historial de Permutas" si el usuario es ADMIN', () => {
    render(<RecepcionHeader {...defaultProps} isAdmin={true} />);
    expect(screen.getByText('Historial Mayorista')).toBeDefined();
    expect(screen.getByText('Historial de Permutas')).toBeDefined();
  });

  it('debe cambiar de pestaña cuando se hace click en Historial Mayorista o Historial de Permutas', () => {
    const setActiveTab = vi.fn();
    render(<RecepcionHeader {...defaultProps} isAdmin={true} setActiveTab={setActiveTab} />);
    
    const mayoristaTab = screen.getByText('Historial Mayorista');
    fireEvent.click(mayoristaTab);
    expect(setActiveTab).toHaveBeenCalledWith('historial-mayorista');

    const permutasTab = screen.getByText('Historial de Permutas');
    fireEvent.click(permutasTab);
    expect(setActiveTab).toHaveBeenCalledWith('historial-permutas');
  });

  it('debe mostrar el formulario de datos de origen solo cuando activeTab es "nuevo"', () => {
    const { rerender } = render(<RecepcionHeader {...defaultProps} activeTab="nuevo" modoRecepcion="MAYORISTA" />);
    expect(screen.getByText('1. Datos de Origen y Comprobante Mayorista')).toBeDefined();

    rerender(<RecepcionHeader {...defaultProps} activeTab="historial-mayorista" />);
    expect(screen.queryByText('1. Datos de Origen y Comprobante Mayorista')).toBeNull();

    rerender(<RecepcionHeader {...defaultProps} activeTab="historial-permutas" />);
    expect(screen.queryByText('1. Datos de Origen y Comprobante Mayorista')).toBeNull();
  });

  it('debe mostrar el selector de fecha y el badge de ingreso histórico cuando la fecha es pasada', () => {
    const setFechaIngreso = vi.fn();
    const { rerender } = render(
      <RecepcionHeader
        {...defaultProps}
        fechaIngreso="2025-01-01T10:00"
        setFechaIngreso={setFechaIngreso}
      />
    );

    expect(screen.getByText('Fecha de Recepción')).toBeDefined();
    expect(screen.getByText('Ingreso Histórico')).toBeDefined();

    const btnAhora = screen.getByText('Ahora');
    fireEvent.click(btnAhora);
    expect(setFechaIngreso).toHaveBeenCalled();
  });
});
