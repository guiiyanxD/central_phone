import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecepcionPermutasTable } from './recepcion-permutas-table';

describe('RecepcionPermutasTable Component', () => {
  const mockPermutas = [
    {
      id: 101,
      tipoIngreso: 'PERMUTA',
      numeroComprobante: 'PERM-001',
      fechaIngreso: '2026-11-10T14:30:00.000Z',
      estado: 'REGISTRADA',
      totalCostoBs: 2500,
      proveedor: {
        id: 1,
        nombre: 'Carlos Mamani',
        telefono: '78912345',
      },
      sucursal: {
        id: 1,
        nombre: 'Central La Paz',
      },
      usuario: {
        id: 2,
        nombre: 'Cajero Central',
      },
      dispositivos: [
        {
          id: 50,
          numeroSerie: 'F2LZ9999PERM',
          imei1: '354928110009999',
          imei2: '354928110008888',
          porcentajeBateria: 88,
          detallesFisicos: 'Liberado de fábrica',
          costoBs: 2500,
          precioVentaSugeridoBs: 3200,
          estadoInventario: 'DISPONIBLE',
          variante: {
            id: 1,
            color: 'Azul',
            capacidadGb: 128,
            modelo: {
              nombreModelo: 'iPhone 14',
            },
          },
        },
      ],
    },
  ];

  const defaultProps = {
    filtroSearch: '',
    setFiltroSearch: vi.fn(),
    filtroSucursalId: 'TODAS',
    setFiltroSucursalId: vi.fn(),
    filtroFechaDesde: '',
    setFiltroFechaDesde: vi.fn(),
    filtroFechaHasta: '',
    setFiltroFechaHasta: vi.fn(),
    sucursalesList: [{ id: 1, nombre: 'Central La Paz', ciudad: 'La Paz' }],
    onResetFiltros: vi.fn(),
    permutasList: mockPermutas,
    isLoading: false,
    meta: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
    setMeta: vi.fn(),
    onFetchPermutas: vi.fn(),
    onOpenDetalle: vi.fn(),
    onStartEdit: vi.fn(),
    onOpenAnularModal: vi.fn(),
    isAdmin: true,
  };

  it('debe renderizar los datos del iPhone, batería, IMEI, costos y fecha DD/MM/YYYY', () => {
    render(<RecepcionPermutasTable {...defaultProps} />);

    expect(screen.getByText('#ING-101')).toBeDefined();
    expect(screen.getByText('PERMUTA')).toBeDefined();
    expect(screen.getByText('iPhone 14')).toBeDefined();
    expect(screen.getByText(/Azul • 128GB/)).toBeDefined();
    expect(screen.getByText('354928110009999')).toBeDefined();
    expect(screen.getByText(/Reg: Liberado de fábrica/)).toBeDefined();
    expect(screen.getByText(/88%/)).toBeDefined();
    expect(screen.getByText(/2[.,]500[.,]00/)).toBeDefined();
    expect(screen.getByText(/3[.,]200[.,]00/)).toBeDefined();
    expect(screen.getByText('10/11/2026')).toBeDefined();
  });

  it('debe permitir invocar las acciones de Detalle, Editar y Anular', () => {
    const onOpenDetalle = vi.fn();
    const onStartEdit = vi.fn();
    const onOpenAnularModal = vi.fn();

    render(
      <RecepcionPermutasTable
        {...defaultProps}
        onOpenDetalle={onOpenDetalle}
        onStartEdit={onStartEdit}
        onOpenAnularModal={onOpenAnularModal}
      />
    );

    const btnDetalle = screen.getByRole('button', { name: /Detalle/i });
    fireEvent.click(btnDetalle);
    expect(onOpenDetalle).toHaveBeenCalledWith(101);

    const btnEditar = screen.getByRole('button', { name: /Editar/i });
    fireEvent.click(btnEditar);
    expect(onStartEdit).toHaveBeenCalledWith(101);

    const btnAnular = screen.getByRole('button', { name: /Anular/i });
    fireEvent.click(btnAnular);
    expect(onOpenAnularModal).toHaveBeenCalledWith(mockPermutas[0]);
  });

  it('debe mostrar mensaje vacío cuando no hay permutas registradas', () => {
    render(<RecepcionPermutasTable {...defaultProps} permutasList={[]} meta={{ ...defaultProps.meta, total: 0 }} />);

    expect(screen.getByText('No se encontraron permutas registradas con los filtros seleccionados.')).toBeDefined();
  });
});
