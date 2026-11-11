import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventarioAccesoriosTab } from './inventario-accesorios-tab';

describe('InventarioAccesoriosTab Component', () => {
  const mockLote = {
    id: 1,
    accesorioId: 10,
    sucursalId: 2,
    nombreDiferenciador: 'MagSafe Silicone Case Azul',
    costoUnitarioBs: 60,
    precioVentaBs: 120,
    cantidadInicial: 15,
    stockActual: 10,
    fechaIngreso: '2026-10-15T10:00:00.000Z',
    accesorio: {
      id: 10,
      nombre: 'Funda Apple Original',
      categoria: { id: 1, nombre: 'Fundas' },
    },
    sucursal: {
      id: 2,
      nombre: 'Sucursal Central',
      ciudad: 'Santa Cruz',
    },
    notaIngreso: {
      id: 5,
      numeroComprobante: 'FAC-100',
      proveedor: { id: 1, nombre: 'Mayorista USA' },
    },
  };

  const defaultProps = {
    lotes: [mockLote],
    lotesMeta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    setLotesMeta: vi.fn(),
    isLoadingLotes: false,
    isAdmin: true,
    searchQuery: '',
    setSearchQuery: vi.fn(),
    categoriaFilter: 'TODAS',
    setCategoriaFilter: vi.fn(),
    sucursalFilter: 'TODAS',
    setSucursalFilter: vi.fn(),
    stockFilter: 'TODOS',
    setStockFilter: vi.fn(),
    categoriasList: [],
    sucursalesList: [],
    tipoCambio: 10,
    onResetFiltros: vi.fn(),
    onFetchLotes: vi.fn(),
  };

  it('debe renderizar exactamente las 5 columnas requeridas y mantener comentada la columna de USD', () => {
    render(<InventarioAccesoriosTab {...defaultProps} />);

    expect(screen.getByText('Accesorio Base')).toBeDefined();
    expect(screen.getByText('Lote Diferenciador')).toBeDefined();
    expect(screen.getByText('Costo / P. Sugerido (Bs.)')).toBeDefined();
    // La columna USD está comentada para accesorios (no manejan precios en USD por el momento)
    expect(screen.queryByText('Costo / P. Sugerido ($)')).toBeNull();
    expect(screen.getByText('Stock Actual')).toBeDefined();
    expect(screen.getByText('Acciones')).toBeDefined();

    // Las columnas desaturadas (Sucursal y Fecha Ingreso en la tabla principal) NO deben ser encabezados
    expect(screen.queryByText('Sucursal')).toBeNull();
    expect(screen.queryByText('Fecha Ingreso')).toBeNull();
  });

  it('debe mostrar los precios en Bolivianos en la tabla y mantener comentados los precios en USD', () => {
    render(<InventarioAccesoriosTab {...defaultProps} tipoCambio={10} />);

    // En Bolivianos: Costo 60, Sugerido 120
    expect(screen.getByText(/Bs 60\.00/i)).toBeDefined();
    expect(screen.getByText(/Sug: Bs 120\.00/i)).toBeDefined();

    // En Dólares: la columna en la tabla principal de accesorios está comentada
    expect(screen.queryByText(/\$ 6\.00/i)).toBeNull();
    expect(screen.queryByText(/Sug: \$ 12\.00/i)).toBeNull();
  });

  it('debe abrir el modal de detalle al hacer clic en el botón DETALLE', () => {
    render(<InventarioAccesoriosTab {...defaultProps} />);

    const detalleBtn = screen.getByRole('button', { name: /detalle/i });
    expect(detalleBtn).toBeDefined();

    fireEvent.click(detalleBtn);

    // Debe abrir ModalDetalleLoteAccesorio mostrando los datos del modal
    expect(screen.getByText('Detalle Completo de Lote de Accesorio')).toBeDefined();
    expect(screen.getAllByText('MagSafe Silicone Case Azul').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Mayorista USA')).toBeDefined();
  });

  it('debe ocultar costos de adquisición cuando isAdmin es false y rotular "Precio Sugerido (Bs.)" con USD comentado', () => {
    render(<InventarioAccesoriosTab {...defaultProps} isAdmin={false} tipoCambio={10} />);

    expect(screen.getByText('Precio Sugerido (Bs.)')).toBeDefined();
    expect(screen.queryByText('Precio Sugerido ($)')).toBeNull();

    // No debe mostrar el costo de 60 Bs
    expect(screen.queryByText(/Bs 60\.00/i)).toBeNull();

    // Solo debe mostrar el precio sugerido en Bs
    expect(screen.getByText(/Bs 120\.00/i)).toBeDefined();
  });
});
