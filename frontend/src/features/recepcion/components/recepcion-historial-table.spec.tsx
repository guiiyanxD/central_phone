import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecepcionHistorialTable } from './recepcion-historial-table';

describe('RecepcionHistorialTable Component', () => {
  const mockRecepciones = [
    {
      id: 201,
      tipoIngreso: 'MAYORISTA',
      numeroComprobante: 'FAC-8899',
      fechaIngreso: '2026-11-10T16:00:00.000Z',
      estado: 'REGISTRADA',
      totalCostoBs: 15400,
      proveedor: {
        id: 1,
        nombre: 'Apple Distribuidor Miami',
        tipo: 'MAYORISTA',
      },
      sucursal: {
        id: 1,
        nombre: 'Central La Paz',
      },
      usuario: {
        id: 2,
        nombre: 'Admin Central',
      },
      _count: {
        dispositivos: 4,
        lotesAccesorio: 2,
      },
    },
  ];

  const defaultProps = {
    filtroRecSearch: '',
    setFiltroRecSearch: vi.fn(),
    filtroRecSucursalId: 'TODAS',
    setFiltroRecSucursalId: vi.fn(),
    filtroRecProveedorId: 'TODOS',
    setFiltroRecProveedorId: vi.fn(),
    filtroRecFechaDesde: '',
    setFiltroRecFechaDesde: vi.fn(),
    filtroRecFechaHasta: '',
    setFiltroRecFechaHasta: vi.fn(),
    sucursalesList: [{ id: 1, nombre: 'Central La Paz' }],
    proveedoresList: [{ id: 1, nombre: 'Apple Distribuidor Miami', tipo: 'MAYORISTA' }],
    onResetFiltrosRecepcion: vi.fn(),
    recepcionesList: mockRecepciones,
    isLoadingRecepciones: false,
    recepcionesMeta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    setRecepcionesMeta: vi.fn(),
    onFetchRecepciones: vi.fn(),
    onOpenRecDetalle: vi.fn(),
    onStartEdit: vi.fn(),
    onOpenAnularModal: vi.fn(),
    isAdmin: true,
  };

  it('debe renderizar las columnas optimizadas con Nro Comprobante restaurado y sin badge redundante Mayorista', () => {
    render(<RecepcionHistorialTable {...defaultProps} />);

    // Columna 1: Código
    expect(screen.getByText('#ING-201')).toBeDefined();
    expect(screen.getByText('REGISTRADA')).toBeDefined();

    // Columna 2: Fecha DD/MM/YYYY
    expect(screen.getByText('10/11/2026')).toBeDefined();

    // Columna 3: Proveedor Mayorista
    expect(screen.getByText('Apple Distribuidor Miami')).toBeDefined();

    // Columna 4: Nro Comprobante
    expect(screen.getByText('FAC-8899')).toBeDefined();

    // Columna 5: Ítems ingresados
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('tel.')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('lotes')).toBeDefined();

    // Columna 6: Inversión Total Bs
    expect(screen.getByText(/15[.,]400[.,]00/)).toBeDefined();
  });

  it('debe llamar a las acciones de Detalle, Editar y Anular', () => {
    const onOpenRecDetalle = vi.fn();
    const onStartEdit = vi.fn();
    const onOpenAnularModal = vi.fn();

    render(
      <RecepcionHistorialTable
        {...defaultProps}
        onOpenRecDetalle={onOpenRecDetalle}
        onStartEdit={onStartEdit}
        onOpenAnularModal={onOpenAnularModal}
      />
    );

    const btnDetalle = screen.getByRole('button', { name: /Detalle/i });
    fireEvent.click(btnDetalle);
    expect(onOpenRecDetalle).toHaveBeenCalledWith(201);

    const btnEditar = screen.getByRole('button', { name: /Editar/i });
    fireEvent.click(btnEditar);
    expect(onStartEdit).toHaveBeenCalledWith(201);

    const btnAnular = screen.getByRole('button', { name: /Anular/i });
    fireEvent.click(btnAnular);
    expect(onOpenAnularModal).toHaveBeenCalledWith(mockRecepciones[0]);
  });
});
