import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PosCartPanel } from './pos-cart-panel';
import { CartItem } from '@/app/pos/page';

describe('PosCartPanel Component', () => {
  const dummyCart: CartItem[] = [
    {
      cartId: 'item-1',
      tipo: 'ACCESORIO',
      loteAccesorioId: 10,
      nombre: 'Funda Silicona MagSafe',
      diferenciador: 'Azul Tormenta',
      cantidad: 1,
      precioUnitarioBs: 100,
      stockMaximo: 5,
    },
  ];

  const defaultProps = {
    cart: dummyCart,
    onUpdateQuantity: vi.fn(),
    onRemoveItem: vi.fn(),
    onClearCart: vi.fn(),
    totalBs: 100,
    clienteNombre: 'Carlos Gomez',
    setClienteNombre: vi.fn(),
    clienteTelefono: '70012345',
    setClienteTelefono: vi.fn(),
    clienteCiNit: '',
    setClienteCiNit: vi.fn(),
    metodoPagoCodigo: 'EFECTIVO',
    setMetodoPagoCodigo: vi.fn(),
    montoRecibidoBs: '' as any,
    setMontoRecibidoBs: vi.fn(),
    comprobanteRef: '',
    setComprobanteRef: vi.fn(),
    onOpenModalQr: vi.fn(),
    saleError: null,
    isSubmittingSale: false,
    onProcessCheckout: vi.fn(),
  };

  it('debe deshabilitar el botón de finalizar venta si montoRecibidoBs está vacío en efectivo (ID-POS-002)', () => {
    render(<PosCartPanel {...defaultProps} montoRecibidoBs="" />);

    const finalizeButton = screen.getByRole('button', { name: /Finalizar Venta e Imprimir/i });
    expect(finalizeButton).toBeDisabled();
  });

  it('debe deshabilitar el botón de finalizar venta si montoRecibidoBs es menor al total en efectivo (ID-POS-002)', () => {
    render(<PosCartPanel {...defaultProps} montoRecibidoBs={50} />);

    const finalizeButton = screen.getByRole('button', { name: /Finalizar Venta e Imprimir/i });
    expect(finalizeButton).toBeDisabled();
    expect(screen.getByText(/Faltan Bs 50.00/i)).toBeInTheDocument();
  });

  it('debe habilitar el botón y mostrar el vuelto en caja esmeralda de alto contraste cuando montoRecibidoBs >= total (ID-POS-002, ID-POS-005)', () => {
    render(<PosCartPanel {...defaultProps} montoRecibidoBs={120} />);

    const finalizeButton = screen.getByRole('button', { name: /Finalizar Venta e Imprimir/i });
    expect(finalizeButton).not.toBeDisabled();

    // Vuelto de Bs 20.00
    expect(screen.getByText(/Vuelto a Entregar:/i)).toBeInTheDocument();
    expect(screen.getByText('Bs 20.00')).toBeInTheDocument();
  });

  it('debe mostrar el atajo (Ctrl+↵) en el botón en lugar de F12 (ID-POS-003)', () => {
    render(<PosCartPanel {...defaultProps} montoRecibidoBs={100} />);

    expect(screen.getByText(/Finalizar Venta e Imprimir \(Ctrl\+↵\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/F12/i)).toBeNull();
  });

  it('debe autocompletar Comprador casual al pulsar el botón correspondiente', () => {
    const setNombreMock = vi.fn();
    const setTelefonoMock = vi.fn();

    render(
      <PosCartPanel
        {...defaultProps}
        setClienteNombre={setNombreMock}
        setClienteTelefono={setTelefonoMock}
      />
    );

    const casualBtn = screen.getByText(/\+ Comprador casual/i);
    fireEvent.click(casualBtn);

    expect(setNombreMock).toHaveBeenCalledWith('Comprador casual');
    expect(setTelefonoMock).toHaveBeenCalledWith('71000000');
  });
});
