import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PosCatalogPhones } from './pos-catalog-phones';

describe('PosCatalogPhones Component', () => {
  const dummyPhone = {
    id: 10,
    numeroSerie: 'F2LZ998X1234',
    imei1: '354928112345678',
    imei2: null,
    condicion: 'NUEVO',
    porcentajeBateria: 100,
    costoBs: 4000,
    costoUsd: 580,
    precioVentaSugeridoBs: 4600,
    precioVentaSugeridoUsd: 667,
    sucursalId: 1,
    variante: {
      color: 'Azul Titanio',
      capacidadGb: 256,
      tipoSim: 'eSIM',
      modelo: {
        nombreModelo: 'iPhone 15 Pro',
        tipo: 'IPHONE',
      },
    },
  };

  const defaultProps = {
    searchPhone: '',
    setSearchPhone: vi.fn(),
    filteredPhones: [dummyPhone],
    cart: [],
    scanFeedback: null,
    inputSearchRef: { current: null },
    onSearchKeyDown: vi.fn(),
    onAddPhone: vi.fn(),
    getPhoneDisplayPrice: vi.fn().mockReturnValue(4600),
    currentSucursalId: 1,
  };

  it('llama a onAddPhone exactamente 1 sola vez al hacer clic en el botón "+ Agregar" (evita doble inserción por bubbling)', () => {
    const onAddPhoneMock = vi.fn();
    render(<PosCatalogPhones {...defaultProps} onAddPhone={onAddPhoneMock} />);

    const addButton = screen.getByRole('button', { name: /\+ Agregar/i });
    fireEvent.click(addButton);

    // Debe llamarse EXACTAMENTE 1 vez, nunca 2 veces
    expect(onAddPhoneMock).toHaveBeenCalledTimes(1);
    expect(onAddPhoneMock).toHaveBeenCalledWith(dummyPhone);
  });

  it('llama a onAddPhone exactamente 1 vez al hacer clic en el cuerpo de la tarjeta', () => {
    const onAddPhoneMock = vi.fn();
    render(<PosCatalogPhones {...defaultProps} onAddPhone={onAddPhoneMock} />);

    const card = screen.getByText('iPhone 15 Pro').closest('div[class*="rounded-xl"]');
    expect(card).not.toBeNull();
    fireEvent.click(card!);

    expect(onAddPhoneMock).toHaveBeenCalledTimes(1);
  });

  it('deshabilita el botón y no permite agregar si el equipo ya está en el carrito', () => {
    const onAddPhoneMock = vi.fn();
    const cartWithPhone = [{ cartId: 'tel-10', dispositivoId: 10, tipo: 'DISPOSITIVO' as const, nombre: 'iPhone 15 Pro', subtitulo: '', cantidad: 1, precioUnitarioBs: 4600 }];
    render(
      <PosCatalogPhones
        {...defaultProps}
        cart={cartWithPhone}
        onAddPhone={onAddPhoneMock}
      />
    );

    const inCartButton = screen.getByRole('button', { name: /En Carrito/i });
    expect(inCartButton).toBeDisabled();

    fireEvent.click(inCartButton);
    expect(onAddPhoneMock).not.toHaveBeenCalled();
  });

  it('muestra el precio dual en Bolivianos y USD con formato correcto', () => {
    render(<PosCatalogPhones {...defaultProps} />);

    expect(screen.getByText(/Bs\.\s*4600\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/USD\.\s*667\.00/i)).toBeInTheDocument();
  });
});
