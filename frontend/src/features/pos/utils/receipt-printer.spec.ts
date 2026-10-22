import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printReceipt } from './receipt-printer';

describe('receipt-printer Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe manejar gracefully ventas nulas o indefinidas sin lanzar excepciones', () => {
    expect(() => printReceipt(null)).not.toThrow();
    expect(() => printReceipt(undefined)).not.toThrow();
  });

  it('debe crear un iframe invisible e inyectar el HTML del ticket térmico con datos de seriales y garantía', () => {
    const mockSale = {
      id: 101,
      comprobanteReferencia: 'TK-101-ABCD',
      fechaHora: '2026-10-22T14:30:00Z',
      totalVentaBs: 7500,
      usuario: { nombre: 'Javier Vendedor' },
      caja: {
        sucursal: {
          nombre: 'Sucursal Central Equipetrol',
          ciudad: 'Santa Cruz, Bolivia',
        },
      },
      cliente: {
        nombreCompleto: 'Carlos Mesa',
        telefono: '77334455',
        ciNit: '8877665 SC',
      },
      metodoPago: { nombre: 'QR Oficial CentralPhone (BCP)' },
      detalles: [
        {
          tipoItem: 'DISPOSITIVO',
          precioUnitarioBs: 7200,
          subtotalBs: 7200,
          cantidad: 1,
          dispositivo: {
            numeroSerie: 'F2LXYZ9988',
            imei1: '356987112233445',
            imei2: '356987112233446',
            variante: {
              color: 'Titanio Natural',
              capacidadGb: 256,
              modelo: { nombreModelo: 'iPhone 15 Pro' },
            },
          },
        },
        {
          tipoItem: 'ACCESORIO',
          precioUnitarioBs: 300,
          subtotalBs: 300,
          cantidad: 1,
          loteAccesorio: {
            nombreDiferenciador: 'MagSafe Silicone Case',
            accesorio: { nombre: 'Funda Apple Original' },
          },
        },
      ],
    };

    printReceipt(mockSale);

    const iframes = document.querySelectorAll('iframe');
    expect(iframes.length).toBe(1);

    const iframe = iframes[0];
    expect(iframe.style.position).toBe('fixed');
    expect(iframe.style.width).toBe('0px');
    expect(iframe.style.height).toBe('0px');

    // Comprobar contenido inyectado en el documento del iframe
    const content = iframe.contentDocument?.body.innerHTML || '';
    expect(content).toContain('CENTRALPHONE');
    expect(content).toContain('Sucursal Central Equipetrol');
    expect(content).toContain('TK-101-ABCD');
    expect(content).toContain('Carlos Mesa');
    expect(content).toContain('356987112233445');
    expect(content).toContain('F2LXYZ9988');
    expect(content).toContain('iPhone 15 Pro');
    expect(content).toContain('7500.00');
    expect(content).toContain('GARANTÍA OFICIAL CENTRALPHONE');
  });
});
