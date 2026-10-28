import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModalAnularRecepcion } from './modal-anular-recepcion';

describe('ModalAnularRecepcion - Anulación Protegida con Motivo Obligatorio', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isSubmitting: false,
    notaId: 42,
    numeroComprobante: 'FAC-7788',
    proveedorNombre: 'Importadora Beby SRL',
    totalDispositivos: 5,
    totalAccesorios: 20,
  };

  it('debe renderizar el título con el código de nota y los datos de advertencia', () => {
    render(<ModalAnularRecepcion {...defaultProps} />);

    expect(screen.getByText('Anular Nota de Recepción #42')).toBeDefined();
    expect(screen.getByText('Importadora Beby SRL')).toBeDefined();
    expect(screen.getByText('FAC-7788')).toBeDefined();
    expect(screen.getByText(/5/)).toBeDefined();
    expect(screen.getByText(/20/)).toBeDefined();
  });

  it('el botón de confirmar anulación debe estar deshabilitado si el motivo tiene menos de 5 caracteres', () => {
    render(<ModalAnularRecepcion {...defaultProps} />);

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Anulación/i });
    expect(confirmBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/Describa detalladamente el motivo/i);
    fireEvent.change(textarea, { target: { value: 'Err' } });
    expect(confirmBtn).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'Error en remisión de carga' } });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('debe enviar el motivo correctamente al confirmar', () => {
    const onConfirm = vi.fn();
    render(<ModalAnularRecepcion {...defaultProps} onConfirm={onConfirm} />);

    const textarea = screen.getByPlaceholderText(/Describa detalladamente el motivo/i);
    fireEvent.change(textarea, { target: { value: 'Duplicado de factura del proveedor mayorista' } });

    const confirmBtn = screen.getByRole('button', { name: /Confirmar Anulación/i });
    fireEvent.click(confirmBtn);

    expect(onConfirm).toHaveBeenCalledWith('Duplicado de factura del proveedor mayorista');
  });

  it('debe llamar a onClose cuando se presiona Cancelar', () => {
    const onClose = vi.fn();
    render(<ModalAnularRecepcion {...defaultProps} onClose={onClose} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('debe mostrar estado de carga cuando isSubmitting es true', () => {
    render(<ModalAnularRecepcion {...defaultProps} isSubmitting={true} />);

    expect(screen.getByText('Anulando...')).toBeDefined();
  });
});
