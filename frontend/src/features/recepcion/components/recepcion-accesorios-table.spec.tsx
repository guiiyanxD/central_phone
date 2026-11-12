import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecepcionAccesoriosTable } from './recepcion-accesorios-table';
import { AccesorioRow } from '../types';

describe('RecepcionAccesoriosTable - Flexibilidad de Recepción', () => {
  const mockAccesoriosCatalogo = [
    {
      id: 1,
      nombre: 'Funda Silicona iPhone 15',
      descripcion: 'Funda flexible',
      categoria: { id: 1, nombre: 'Fundas' },
    },
    {
      id: 2,
      nombre: 'Cargador 20W USB-C',
      descripcion: 'Cargador rápido',
      categoria: { id: 2, nombre: 'Cargadores' },
    },
  ];

  const defaultRow: AccesorioRow = {
    id: 'acc-1',
    accesorioId: 1,
    accesorioDisplay: 'Funda Silicona iPhone 15',
    nombreDiferenciador: 'Silicona Simple Azul',
    cantidad: 10,
    costoUnitarioBs: 25,
    precioVentaBs: 50,
  };

  let mockOnAddAccesorio: ReturnType<typeof vi.fn>;
  let mockOnRemoveAccesorio: ReturnType<typeof vi.fn>;
  let mockOnUpdateAccesorio: ReturnType<typeof vi.fn>;
  let mockOnOpenInlineAccesorioModal: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnAddAccesorio = vi.fn();
    mockOnRemoveAccesorio = vi.fn();
    mockOnUpdateAccesorio = vi.fn();
    mockOnOpenInlineAccesorioModal = vi.fn();
  });

  it('no contiene el atributo HTML required en los inputs de precios para permitir recepciones solo de telefonos', () => {
    render(
      <RecepcionAccesoriosTable
        accesorios={[defaultRow]}
        accesoriosCatalogo={mockAccesoriosCatalogo}
        onAddAccesorio={mockOnAddAccesorio}
        onRemoveAccesorio={mockOnRemoveAccesorio}
        onUpdateAccesorio={mockOnUpdateAccesorio}
        onOpenInlineAccesorioModal={mockOnOpenInlineAccesorioModal}
      />
    );

    const costoInput = screen.getByLabelText(/Costo Unitario \(Bs\)/i);
    expect(costoInput).not.toHaveAttribute('required');

    const precioInput = screen.getByLabelText(/Precio Venta Sugerido \(Bs\)/i);
    expect(precioInput).not.toHaveAttribute('required');
  });

  it('permite eliminar la fila de accesorio incluso si es la única fila presente', () => {
    render(
      <RecepcionAccesoriosTable
        accesorios={[defaultRow]}
        accesoriosCatalogo={mockAccesoriosCatalogo}
        onAddAccesorio={mockOnAddAccesorio}
        onRemoveAccesorio={mockOnRemoveAccesorio}
        onUpdateAccesorio={mockOnUpdateAccesorio}
        onOpenInlineAccesorioModal={mockOnOpenInlineAccesorioModal}
      />
    );

    const removeBtn = screen.getByTitle('Eliminar fila');
    expect(removeBtn).toBeInTheDocument();
    fireEvent.click(removeBtn);
    expect(mockOnRemoveAccesorio).toHaveBeenCalledWith('acc-1');
  });

  it('renderiza un estado vacío limpio cuando no hay accesorios y permite agregar uno nuevo', () => {
    render(
      <RecepcionAccesoriosTable
        accesorios={[]}
        accesoriosCatalogo={mockAccesoriosCatalogo}
        onAddAccesorio={mockOnAddAccesorio}
        onRemoveAccesorio={mockOnRemoveAccesorio}
        onUpdateAccesorio={mockOnUpdateAccesorio}
        onOpenInlineAccesorioModal={mockOnOpenInlineAccesorioModal}
      />
    );

    expect(screen.getByText('Sin lotes de accesorios')).toBeInTheDocument();
    expect(
      screen.getByText(/Esta nota de ingreso no incluirá accesorios/i)
    ).toBeInTheDocument();

    const addBtn = screen.getAllByRole('button', { name: /Agregar Lote Accesorio/i })[0];
    fireEvent.click(addBtn);
    expect(mockOnAddAccesorio).toHaveBeenCalled();
  });
});
