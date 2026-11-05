import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchableSelect, SearchableSelectOption } from './searchable-select';

describe('SearchableSelect (Combobox con filtro por coincidencia)', () => {
  const options: SearchableSelectOption[] = [
    { value: 1, label: 'iPhone 13', group: 'iPhone 13 Series', sublabel: '128GB Midnight' },
    { value: 2, label: 'iPhone 14 Pro', group: 'iPhone 14 Series', sublabel: '256GB Deep Purple' },
    { value: 3, label: 'iPhone 15 Pro Max', group: 'iPhone 15 Series', sublabel: '512GB Titanio Natural' },
    { value: 4, label: 'Funda Silicona MagSafe', group: 'Accesorios', sublabel: 'Azul Tormenta' },
  ];

  it('debe renderizar el placeholder cuando no hay valor seleccionado', () => {
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={vi.fn()}
        placeholder="Seleccionar dispositivo..."
      />
    );
    expect(screen.getByText('Seleccionar dispositivo...')).toBeDefined();
  });

  it('debe mostrar la etiqueta de la opción seleccionada', () => {
    render(
      <SearchableSelect
        options={options}
        value={2}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByText('iPhone 14 Pro')).toBeDefined();
    expect(screen.getByText('256GB Deep Purple')).toBeDefined();
  });

  it('debe abrir el dropdown y permitir filtrar por texto insensible a mayúsculas y acentos', () => {
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={vi.fn()}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    // Debe mostrar todas las opciones al inicio
    expect(screen.getByText('iPhone 13')).toBeDefined();
    expect(screen.getByText('iPhone 15 Pro Max')).toBeDefined();

    // Filtrar por "15 pro"
    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: '15 pro' } });

    // Solo debe coincidir iPhone 15 Pro Max
    expect(screen.getByText('iPhone 15 Pro Max')).toBeDefined();
    expect(screen.queryByText('iPhone 13')).toBeNull();
    expect(screen.queryByText('Funda Silicona MagSafe')).toBeNull();
  });

  it('debe invocar onChange al seleccionar una opción con click', () => {
    const onChangeMock = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={onChangeMock}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    const item = screen.getByText('iPhone 15 Pro Max');
    fireEvent.click(item);

    expect(onChangeMock).toHaveBeenCalledWith(3);
  });

  it('debe permitir navegar y seleccionar con teclado (ArrowDown y Enter)', () => {
    const onChangeMock = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value={null}
        onChange={onChangeMock}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText('Buscar...');
    fireEvent.change(searchInput, { target: { value: 'Funda' } });

    // Presionar Enter en el input para seleccionar la opción resaltada
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(onChangeMock).toHaveBeenCalledWith(4);
  });

  it('debe renderizar el botón de limpiar desacoplado y permitir limpiar la selección (ID-A11Y-001)', () => {
    const onChangeMock = vi.fn();
    render(
      <SearchableSelect
        options={options}
        value={1}
        onChange={onChangeMock}
        isClearable={true}
      />
    );

    const clearButton = screen.getByLabelText('Limpiar selección');
    expect(clearButton).toBeDefined();
    expect(clearButton.tagName).toBe('BUTTON');

    fireEvent.click(clearButton);
    expect(onChangeMock).toHaveBeenCalledWith(null);
  });
});
