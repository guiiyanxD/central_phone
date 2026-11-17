import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { printPermutaReceipt } from './receipt-printer';

describe('printPermutaReceipt Utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe manejar gracefully notas nulas o indefinidas sin lanzar excepciones', () => {
    expect(() => printPermutaReceipt(null)).not.toThrow();
    expect(() => printPermutaReceipt(undefined)).not.toThrow();
  });

  it('debe generar el documento de impresión con todos los iPhones recibidos y firmas de conformidad', () => {
    const mockNota = {
      id: 88,
      numeroComprobante: 'REC-001',
      fechaIngreso: '2026-11-17T12:00:00.000Z',
      totalCostoBs: 8000,
      sucursal: { nombre: 'Sucursal Equipetrol' },
      proveedor: {
        nombre: 'Mario',
        apellido: 'Bross',
        telefono: '76543210',
      },
      dispositivos: [
        {
          id: 1,
          numeroSerie: 'SN-001',
          imei1: '351111111111111',
          porcentajeBateria: 88,
          costoBs: 3500,
          detallesFisicos: 'Pantalla original intacta',
          variante: {
            color: 'Azul',
            capacidadGb: 128,
            modelo: { nombreModelo: 'iPhone 13' },
          },
        },
        {
          id: 2,
          numeroSerie: 'SN-002',
          imei1: '352222222222222',
          porcentajeBateria: 95,
          costoBs: 4500,
          detallesFisicos: 'Sin rayones',
          variante: {
            color: 'Titanio',
            capacidadGb: 256,
            modelo: { nombreModelo: 'iPhone 15 Pro' },
          },
        },
      ],
      observaciones: 'Lote verificado',
    };

    let docHtml = '';
    const mockDoc = {
      open: vi.fn(),
      write: vi.fn((content: string) => {
        docHtml = content;
      }),
      close: vi.fn(),
    };

    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName);
      if (tagName.toLowerCase() === 'iframe') {
        Object.defineProperty(el, 'contentWindow', {
          value: {
            document: mockDoc,
            focus: vi.fn(),
            print: vi.fn(),
          },
          writable: true,
        });
      }
      return el;
    });

    printPermutaReceipt(mockNota);

    expect(mockDoc.open).toHaveBeenCalled();
    expect(mockDoc.write).toHaveBeenCalled();
    expect(mockDoc.close).toHaveBeenCalled();

    // Validar contenido del comprobante
    expect(docHtml).toContain('CENTRALPHONE');
    expect(docHtml).toContain('COMPROBANTE DE RECEPCIÓN / PERMUTA');
    expect(docHtml).toContain('#ING-88');
    expect(docHtml).toContain('REC-001');
    expect(docHtml).toContain('Mario Bross');
    expect(docHtml).toContain('76543210');
    expect(docHtml).toContain('iPhone 13 Azul 128GB');
    expect(docHtml).toContain('351111111111111');
    expect(docHtml).toContain('Bs 3500.00');
    expect(docHtml).toContain('iPhone 15 Pro Titanio 256GB');
    expect(docHtml).toContain('352222222222222');
    expect(docHtml).toContain('Bs 4500.00');
    expect(docHtml).toContain('Bs 8000.00');
    expect(docHtml).toContain('Firma del Cliente');
    expect(docHtml).toContain('Receptor CentralPhone');
  });
});
