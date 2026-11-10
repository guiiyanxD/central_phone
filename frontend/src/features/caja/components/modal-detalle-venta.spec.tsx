import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalDetalleVenta } from './modal-detalle-venta';
import * as receiptPrinter from '@/features/pos/utils/receipt-printer';

vi.mock('@/features/pos/utils/receipt-printer', () => ({
  printReceipt: vi.fn(),
}));

describe('ModalDetalleVenta', () => {
  const mockVentaNormal = {
    id: 101,
    comprobanteReferencia: 'TK-101',
    fechaHora: '2026-11-04T14:30:00.000Z',
    estado: 'COMPLETADA',
    totalVentaBs: 6500,
    montoPermutaBs: 0,
    costoTotalBs: 5000,
    gananciaNetaBs: 1500,
    usuario: { id: 1, nombre: 'Carlos Vendedor' },
    cliente: {
      id: 5,
      nombreCompleto: 'Maria Gomez',
      telefono: '77889900',
      ciNit: '6543210',
    },
    caja: {
      sucursal: {
        nombre: 'Sucursal Central',
        ciudad: 'Cochabamba',
      },
    },
    metodoPago: {
      codigo: 'EFECTIVO',
      nombre: 'Efectivo en Caja',
    },
    detalles: [
      {
        id: 1,
        tipoItem: 'DISPOSITIVO',
        cantidad: 1,
        precioUnitarioBs: 6300,
        subtotalBs: 6300,
        costoUnitarioBs: 4900,
        dispositivo: {
          id: 50,
          imei1: '356987112233445',
          imei2: '356987112233446',
          numeroSerie: 'F17L900X',
          variante: {
            color: 'Azul Titanio',
            capacidadGb: 256,
            modelo: { nombreModelo: 'iPhone 15 Pro' },
          },
        },
      },
      {
        id: 2,
        tipoItem: 'ACCESORIO',
        cantidad: 2,
        precioUnitarioBs: 100,
        subtotalBs: 200,
        costoUnitarioBs: 50,
        loteAccesorio: {
          id: 20,
          nombreDiferenciador: 'MagSafe Original',
          accesorio: { nombre: 'Funda Silicona' },
        },
      },
    ],
  };

  const mockVentaConPermuta = {
    ...mockVentaNormal,
    id: 102,
    comprobanteReferencia: 'TK-102',
    totalVentaBs: 8000,
    montoPermutaBs: 2500,
    costoTotalBs: 6000,
    gananciaNetaBs: 2000,
    permutaDispositivo: {
      id: 88,
      imei1: '358899001122334',
      porcentajeBateria: 87,
      variante: {
        color: 'Negro',
        capacidadGb: 128,
        modelo: { nombreModelo: 'iPhone 13' },
      },
    },
  };

  it('no debe renderizar nada si isOpen es false o venta es null', () => {
    const { container: c1 } = render(
      <ModalDetalleVenta isOpen={false} onClose={vi.fn()} venta={mockVentaNormal} />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <ModalDetalleVenta isOpen={true} onClose={vi.fn()} venta={null} />
    );
    expect(c2.firstChild).toBeNull();
  });

  it('debe renderizar el encabezado, productos, IMEIs y datos del cliente', () => {
    render(
      <ModalDetalleVenta
        isOpen={true}
        onClose={vi.fn()}
        venta={mockVentaNormal}
        isAdmin={false}
      />
    );

    // Titulo y Estado
    expect(screen.getByText(/Ticket de Venta #TK-000101/i)).toBeDefined();
    expect(screen.getByText('COMPLETADA')).toBeDefined();
    expect(screen.getByText(/Ref: TK-101/i)).toBeDefined();

    // Vendedor y Cliente
    expect(screen.getByText('Carlos Vendedor')).toBeDefined();
    expect(screen.getByText('Maria Gomez')).toBeDefined();
    expect(screen.getByText(/77889900/)).toBeDefined();

    // Articulos
    expect(screen.getByText(/iPhone 15 Pro/)).toBeDefined();
    expect(screen.getByText(/IMEI 1: 356987112233445/)).toBeDefined();
    expect(screen.getByText(/Funda Silicona/)).toBeDefined();

    // Totales
    expect(screen.getAllByText(/6500\.00/).length).toBeGreaterThanOrEqual(1);
  });

  it('debe proteger la confidencialidad de costos y margen cuando isAdmin es false', () => {
    render(
      <ModalDetalleVenta
        isOpen={true}
        onClose={vi.fn()}
        venta={mockVentaNormal}
        isAdmin={false}
      />
    );

    // No debe mostrar Margen (3FN) ni CMV ni Ganancia Neta Real
    expect(screen.queryByText(/Margen \(3FN\)/i)).toBeNull();
    expect(screen.queryByText(/Costo Mercadería \(CMV\)/i)).toBeNull();
    expect(screen.queryByText(/Ganancia Neta Real/i)).toBeNull();
  });

  it('debe mostrar CMV y ganancia neta cuando isAdmin es true', () => {
    render(
      <ModalDetalleVenta
        isOpen={true}
        onClose={vi.fn()}
        venta={mockVentaNormal}
        isAdmin={true}
      />
    );

    expect(screen.getByText(/Margen \(3FN\)/i)).toBeDefined();
    expect(screen.getByText(/Costo Mercadería \(CMV\)/i)).toBeDefined();
    expect(screen.getByText(/5000\.00/)).toBeDefined();
    expect(screen.getByText(/Ganancia Neta Real: \+Bs 1500\.00/i)).toBeDefined();
  });

  it('debe visualizar la tarjeta esmeralda de permuta cuando la venta incluye trade-in', () => {
    render(
      <ModalDetalleVenta
        isOpen={true}
        onClose={vi.fn()}
        venta={mockVentaConPermuta}
        isAdmin={false}
      />
    );

    expect(screen.getAllByText(/Trade-In/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Teléfono Recibido en Permuta/i)).toBeDefined();
    expect(screen.getByText(/Crédito: - Bs 2500\.00/i)).toBeDefined();
    expect(screen.getByText(/iPhone 13/i)).toBeDefined();
    expect(screen.getByText(/Negro/i)).toBeDefined();
    expect(screen.getByText('358899001122334')).toBeDefined();
    expect(screen.getByText(/87% Batería/i)).toBeDefined();

    // Neto cobrado: 8000 - 2500 = 5500
    expect(screen.getByText(/5500\.00/)).toBeDefined();
  });

  it('debe invocar printReceipt al hacer click en Imprimir Ticket Térmico', () => {
    render(
      <ModalDetalleVenta
        isOpen={true}
        onClose={vi.fn()}
        venta={mockVentaNormal}
      />
    );

    const printBtn = screen.getByRole('button', { name: /Imprimir Ticket Térmico/i });
    fireEvent.click(printBtn);

    expect(receiptPrinter.printReceipt).toHaveBeenCalledWith(mockVentaNormal);
  });

  it('debe llamar a onClose al hacer click en Cerrar', () => {
    const onCloseMock = vi.fn();
    render(
      <ModalDetalleVenta
        isOpen={true}
        onClose={onCloseMock}
        venta={mockVentaNormal}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /^Cerrar$/i });
    fireEvent.click(closeBtn);

    expect(onCloseMock).toHaveBeenCalled();
  });
});
