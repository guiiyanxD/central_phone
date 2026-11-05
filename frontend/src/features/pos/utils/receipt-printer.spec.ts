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
    expect(content).toContain('3 Meses en Dispositivos Apple (Válida hasta:');
    expect(content).toContain('15 días en accesorios');
  });

  it('debe reflejar el crédito de permuta (Trade-In) y total cobrado en el ticket térmico', () => {
    const mockSaleWithTradeIn = {
      id: 102,
      comprobanteReferencia: 'TK-102-PERM',
      fechaHora: '2026-10-22T15:00:00Z',
      totalVentaBs: 6000,
      montoPermutaBs: 2000,
      permutaDispositivo: {
        imei1: '358999887766554',
        porcentajeBateria: 87,
        variante: {
          color: 'Negro',
          capacidadGb: 128,
          modelo: { nombreModelo: 'iPhone 11' },
        },
      },
      usuario: { nombre: 'Vendedor Pos' },
      caja: { sucursal: { nombre: 'Central' } },
      cliente: { nombreCompleto: 'Ana Belen', telefono: '71122334' },
      metodoPago: { nombre: 'Efectivo' },
      detalles: [
        {
          tipoItem: 'DISPOSITIVO',
          precioUnitarioBs: 6000,
          subtotalBs: 6000,
          cantidad: 1,
          dispositivo: {
            numeroSerie: 'SERIE123',
            imei1: '123456789012345',
            variante: {
              color: 'Azul',
              capacidadGb: 128,
              modelo: { nombreModelo: 'iPhone 14' },
            },
          },
        },
      ],
    };

    printReceipt(mockSaleWithTradeIn);

    const iframes = document.querySelectorAll('iframe');
    const iframe = iframes[iframes.length - 1];
    const content = iframe.contentDocument?.body.innerHTML || '';

    expect(content).toContain('*** RETOMA / PERMUTA DE CLIENTE ***');
    expect(content).toContain('iPhone 11 (Negro 128GB)');
    expect(content).toContain('358999887766554');
    expect(content).toContain('87%');
    expect(content).toContain('SUBTOTAL:');
    expect(content).toContain('6000.00');
    expect(content).toContain('CRÉDITO PERMUTA (TRADE-IN):');
    expect(content).toContain('- Bs 2000.00');
    expect(content).toContain('TOTAL COBRADO:');
    expect(content).toContain('4000.00');
  });
});
