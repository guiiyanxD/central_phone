import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AutocompleteInput, AutocompleteOption } from './autocomplete-input';

describe('AutocompleteInput (Input directo con sugerencias flotantes)', () => {
  const options: AutocompleteOption[] = [
    { value: 1, label: 'Distribuidora Miami', sublabel: 'Mayorista USA - Tel: 70012345', badge: 'Mayorista' },
    { value: 2, label: 'Juan Perez', sublabel: 'Cliente Permuta - Tel: 71122334', badge: 'Minorista' },
    { value: 3, label: 'Apple Global Corp', sublabel: 'Importador Central', badge: 'Mayorista' },
  ];

  it('debe renderizar el input con su placeholder inicial', () => {
    render(
      <AutocompleteInput
        id="test-autocomplete"
        options={options}
        value={null}
        onChange={vi.fn()}
        placeholder="Buscar proveedor..."
      />
    );

    expect(screen.getByPlaceholderText('Buscar proveedor...')).toBeInTheDocument();
  });

  it('debe mostrar el nombre de la opción seleccionada inicialmente', () => {
    render(
      <AutocompleteInput
        id="test-autocomplete"
        options={options}
        value={1}
        onChange={vi.fn()}
      />
    );

    const input = screen.getByRole('combobox') as HTMLInputElement;
    expect(input.value).toBe('Distribuidora Miami');
  });

  it('debe filtrar en tiempo real al escribir en el input', () => {
    render(
      <AutocompleteInput
        id="test-autocomplete"
        options={options}
        value={null}
        onChange={vi.fn()}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Juan' } });

    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.queryByText('Distribuidora Miami')).not.toBeInTheDocument();
  });

  it('debe seleccionar una opción al hacer clic y llamar a onChange', () => {
    const handleChange = vi.fn();
    render(
      <AutocompleteInput
        id="test-autocomplete"
        options={options}
        value={null}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);

    const optionItem = screen.getByText('Distribuidora Miami');
    fireEvent.click(optionItem);

    expect(handleChange).toHaveBeenCalledWith(1, expect.objectContaining({ label: 'Distribuidora Miami' }));
  });

  it('debe permitir seleccionar mediante teclado (Flecha Abajo y Enter)', () => {
    const handleChange = vi.fn();
    render(
      <AutocompleteInput
        id="test-autocomplete"
        options={options}
        value={null}
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith(2, expect.objectContaining({ value: 2 }));
  });

  it('debe limpiar el valor seleccionado al pulsar el botón de limpiar', () => {
    const handleChange = vi.fn();
    render(
      <AutocompleteInput
        id="test-autocomplete"
        options={options}
        value={1}
        onChange={handleChange}
      />
    );

    const clearButton = screen.getByLabelText('Limpiar campo');
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith(null, null);
  });
});
