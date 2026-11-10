import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventarioTelefonosTab } from './inventario-telefonos-tab';

describe('InventarioTelefonosTab Component', () => {
  const mockDispositivo = {
    id: 10,
    numeroSerie: 'F2LXYZ9988',
    imei1: '356987112233445',
    imei2: '356987112233446',
    condicion: 'NUEVO',
    estadoInventario: 'DISPONIBLE',
    costoBs: 7000,
    costoUsd: 1000,
    precioVentaSugeridoBs: 8400,
    gastosInvertidosBs: 0,
    variante: {
      color: 'Titanio Natural',
      capacidadGb: 256,
      tipoSim: 'Físico',
      modelo: {
        nombreModelo: 'iPhone 15 Pro',
        tipo: 'IPHONE',
      },
    },
    sucursal: { nombre: 'Central Equipetrol' },
    notaIngreso: {
      proveedor: { nombre: 'Mayorista USA' },
      fechaIngreso: '2026-10-01T10:00:00.000Z',
    },
  };

  const defaultProps = {
    dispositivos: [mockDispositivo],
    dispositivosMeta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    setDispositivosMeta: vi.fn(),
    isLoadingDispositivos: false,
    isAdmin: true,
    searchQuery: '',
    setSearchQuery: vi.fn(),
    tipoFilter: 'TODOS',
    setTipoFilter: vi.fn(),
    estadoFilter: 'TODOS',
    setEstadoFilter: vi.fn(),
    condicionFilter: 'TODAS',
    setCondicionFilter: vi.fn(),
    sucursalFilter: 'TODAS',
    setSucursalFilter: vi.fn(),
    proveedorFilter: 'TODOS',
    setProveedorFilter: vi.fn(),
    fechaDesdeFilter: '',
    setFechaDesdeFilter: vi.fn(),
    fechaHastaFilter: '',
    setFechaHastaFilter: vi.fn(),
    sucursalesList: [],
    proveedoresList: [],
    tipoCambio: 10,
    onResetFiltros: vi.fn(),
    onFetchDispositivos: vi.fn(),
    onSelectImeiForLifeline: vi.fn(),
  };

  it('debe renderizar exactamente las 7 columnas requeridas y no saturar con columnas secundarias', () => {
    render(<InventarioTelefonosTab {...defaultProps} />);

    // Verificar las 7 columnas solicitadas
    expect(screen.getByText('Modelo & Variante')).toBeDefined();
    expect(screen.getByText('IMEI 1 / Serie')).toBeDefined();
    expect(screen.getByText('Condición')).toBeDefined();
    expect(screen.getByText('Costo / P. Sugerido (Bs.)')).toBeDefined();
    expect(screen.getByText('Costo / P. Sugerido ($)')).toBeDefined();
    expect(screen.getByText('Estado')).toBeDefined();
    expect(screen.getByText('Acciones')).toBeDefined();

    // Las columnas desaturadas (Proveedor y Sucursal en tabla) NO deben estar como encabezados principales
    expect(screen.queryByText('Proveedor / Recepción')).toBeNull();
    expect(screen.queryByText('Sucursal')).toBeNull();
  });

  it('debe mostrar los precios duales en Bs y USD calculados con el tipo de cambio', () => {
    render(<InventarioTelefonosTab {...defaultProps} tipoCambio={10} />);

    // Valores en Bolivianos
    expect(screen.getByText(/Bs 7000\.00/i)).toBeDefined();
    expect(screen.getByText(/Sug: Bs 8400\.00/i)).toBeDefined();

    // Valores en Dólares ($ 1000 directo de costoUsd o 7000/10, y 8400/10 = $ 840.00)
    expect(screen.getByText(/\$ 1000\.00/i)).toBeDefined();
    expect(screen.getByText(/Sug: \$ 840\.00/i)).toBeDefined();
  });

  it('debe invocar onSelectImeiForLifeline al hacer clic en el botón DETALLE', () => {
    const onSelectImei = vi.fn();
    render(<InventarioTelefonosTab {...defaultProps} onSelectImeiForLifeline={onSelectImei} />);

    const detalleBtn = screen.getByRole('button', { name: /detalle/i });
    expect(detalleBtn).toBeDefined();

    fireEvent.click(detalleBtn);
    expect(onSelectImei).toHaveBeenCalledWith('356987112233445');
  });

  it('debe ocultar el costo de adquisición cuando isAdmin es false y rotular "Precio Sugerido"', () => {
    render(<InventarioTelefonosTab {...defaultProps} isAdmin={false} tipoCambio={10} />);

    expect(screen.getByText('Precio Sugerido (Bs.)')).toBeDefined();
    expect(screen.getByText('Precio Sugerido ($)')).toBeDefined();

    // No debe mostrar el costo de Bs 7000 ni $ 1000
    expect(screen.queryByText(/Bs 7000\.00/i)).toBeNull();
    expect(screen.queryByText(/\$ 1000\.00/i)).toBeNull();

    // Solo debe mostrar el precio sugerido
    expect(screen.getByText(/Bs 8400\.00/i)).toBeDefined();
    expect(screen.getByText(/\$ 840\.00/i)).toBeDefined();
  });
});
