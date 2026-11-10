import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printReceipt, formatFolioTicket } from './receipt-printer';

describe('receipt-printer Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatFolioTicket helper', () => {
    it('debe formatear números secuenciales a 6 dígitos con prefijo TK-', () => {
      expect(formatFolioTicket(1)).toBe('TK-000001');
      expect(formatFolioTicket(56)).toBe('TK-000056');
      expect(formatFolioTicket(101)).toBe('TK-000101');
      expect(formatFolioTicket(999999)).toBe('TK-999999');
    });

    it('debe manejar entradas numéricas en string y valores nulos', () => {
      expect(formatFolioTicket('56')).toBe('TK-000056');
      expect(formatFolioTicket(null)).toBe('TK-000001');
      expect(formatFolioTicket(undefined)).toBe('TK-000001');
      expect(formatFolioTicket('')).toBe('TK-000001');
    });

    it('debe preservar prefijos si el id ya viniera formateado o como texto', () => {
      expect(formatFolioTicket('TK-000088')).toBe('TK-000088');
      expect(formatFolioTicket('ABC')).toBe('TK-ABC');
    });
  });

  it('debe manejar gracefully ventas nulas o indefinidas sin lanzar excepciones', () => {
    expect(() => printReceipt(null)).not.toThrow();
    expect(() => printReceipt(undefined)).not.toThrow();
  });

  it('debe inyectar el folio correlativo limpio (#TK-000101) y omitir la referencia bancaria del ticket impreso en pago QR', () => {
    const mockSale = {
      id: 101,
      comprobanteReferencia: '213543547657', // Código bancario real que NO debe salir en el ticket de papel
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
      metodoPago: {
        codigo: 'QR_SIMPLE',
        nombre: 'QR Oficial CentralPhone (BCP)',
      },
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
    
    // Folio limpio correlativo
    expect(content).toContain('Ticket: <span class="bold">#TK-000101</span>');
    // Confidencialidad: NO debe imprimir el código de referencia bancaria en el ticket de papel
    expect(content).not.toContain('213543547657');

    // Mención limpia del método de pago QR Oficial
    expect(content).toContain('Método de Pago: </span><span class="bold">QR Oficial CentralPhone</span>');

    expect(content).toContain('Carlos Mesa');
    expect(content).toContain('356987112233445');
    expect(content).toContain('F2LXYZ9988');
    expect(content).toContain('iPhone 15 Pro');
    expect(content).toContain('7500.00');
    expect(content).toContain('GARANTÍA OFICIAL CENTRALPHONE');
    expect(content).toContain('3 Meses en Dispositivos (Válida hasta:');
    expect(content).toContain('15 días en accesorios');
  });

  it('debe reflejar el crédito de permuta (Trade-In) y total cobrado en el ticket térmico con folio limpio', () => {
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
      metodoPago: { codigo: 'EFECTIVO', nombre: 'Efectivo' },
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

    expect(content).toContain('Ticket: <span class="bold">#TK-000102</span>');
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

  it('debe mostrar mención de pago Mixto sin exponer el desglose de referencias en el ticket impreso', () => {
    const mockSaleMixto = {
      id: 103,
      montoEfectivoBs: 4000,
      montoDigitalBs: 2000,
      comprobanteReferencia: 'MIXTO: Ef. Bs 4000.00 + QR Bs 2000.00 [Ref: 99887766]',
      totalVentaBs: 6000,
      metodoPago: { codigo: 'QR_SIMPLE', nombre: 'QR Oficial CentralPhone (BCP)' },
    };

    printReceipt(mockSaleMixto);

    const iframes = document.querySelectorAll('iframe');
    const iframe = iframes[iframes.length - 1];
    const content = iframe.contentDocument?.body.innerHTML || '';

    expect(content).toContain('Ticket: <span class="bold">#TK-000103</span>');
    expect(content).toContain('Método de Pago: </span><span class="bold">Mixto (Efectivo + QR)</span>');
    expect(content).not.toContain('99887766');
  });
});
