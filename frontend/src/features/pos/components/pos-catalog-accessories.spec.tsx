import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PosCatalogAccessories } from './pos-catalog-accessories';

describe('PosCatalogAccessories Component', () => {
  const dummyAccItem = {
    acc: { id: 1, nombre: 'Cargador Rápido 20W' },
    lote: {
      id: 5,
      nombreDiferenciador: 'Original Apple 20W USB-C',
      stockActual: 10,
      precioVentaBs: 150,
      sucursalId: 1,
    },
  };

  const defaultProps = {
    searchAccessory: '',
    setSearchAccessory: vi.fn(),
    filteredAccessories: [dummyAccItem],
    onAddAccessory: vi.fn(),
    currentSucursalId: 1,
  };

  it('llama a onAddAccessory exactamente 1 sola vez al hacer clic en "+ Agregar" (evita doble inserción por bubbling)', () => {
    const onAddAccessoryMock = vi.fn();
    render(
      <PosCatalogAccessories
        {...defaultProps}
        onAddAccessory={onAddAccessoryMock}
      />
    );

    const addButton = screen.getByRole('button', { name: /\+ Agregar/i });
    fireEvent.click(addButton);

    // Debe llamarse EXACTAMENTE 1 vez, nunca 2 veces
    expect(onAddAccessoryMock).toHaveBeenCalledTimes(1);
    expect(onAddAccessoryMock).toHaveBeenCalledWith(dummyAccItem.acc, dummyAccItem.lote);
  });

  it('llama a onAddAccessory exactamente 1 vez al pulsar la tarjeta', () => {
    const onAddAccessoryMock = vi.fn();
    render(
      <PosCatalogAccessories
        {...defaultProps}
        onAddAccessory={onAddAccessoryMock}
      />
    );

    const card = screen.getByText('Cargador Rápido 20W').closest('div[class*="rounded-xl"]');
    expect(card).not.toBeNull();
    fireEvent.click(card!);

    expect(onAddAccessoryMock).toHaveBeenCalledTimes(1);
  });

  it('no llama a onAddAccessory si el lote no tiene stock disponible', () => {
    const onAddAccessoryMock = vi.fn();
    const noStockItem = {
      acc: { id: 2, nombre: 'Funda Cuero' },
      lote: { id: 6, nombreDiferenciador: 'Negro', stockActual: 0, precioVentaBs: 200, sucursalId: 1 },
    };

    render(
      <PosCatalogAccessories
        {...defaultProps}
        filteredAccessories={[noStockItem]}
        onAddAccessory={onAddAccessoryMock}
      />
    );

    const button = screen.getByRole('button', { name: /\+ Agregar/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(onAddAccessoryMock).not.toHaveBeenCalled();
  });
});
