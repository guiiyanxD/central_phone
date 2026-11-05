import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBarcodeScanner } from './use-barcode-scanner';

// Mock playScanBeep
vi.mock('@/lib/sound', () => ({
  playScanBeep: vi.fn(),
}));

describe('useBarcodeScanner Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const simulateFastTyping = (text: string, intervalMs = 20) => {
    for (const char of text) {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: char, bubbles: true, cancelable: true })
      );
      vi.advanceTimersByTime(intervalMs);
    }
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    );
  };

  it('debe detectar una lectura rápida de código de barras / IMEI y disparar onScan', () => {
    const onScan = vi.fn();
    renderHook(() =>
      useBarcodeScanner({
        onScan,
        minLength: 6,
        maxIntervalMs: 50,
      })
    );

    simulateFastTyping('356987112233445', 15);

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith('356987112233445');
  });

  it('debe ignorar entradas que sean más cortas que minLength', () => {
    const onScan = vi.fn();
    renderHook(() =>
      useBarcodeScanner({
        onScan,
        minLength: 8,
        maxIntervalMs: 50,
      })
    );

    simulateFastTyping('12345', 10);

    expect(onScan).not.toHaveBeenCalled();
  });

  it('debe descartar el buffer si el intervalo entre teclas supera maxIntervalMs (escritura humana)', () => {
    const onScan = vi.fn();
    renderHook(() =>
      useBarcodeScanner({
        onScan,
        minLength: 6,
        maxIntervalMs: 40,
      })
    );

    // Escribir 3 caracteres rápido
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'A', bubbles: true }));
    vi.advanceTimersByTime(10);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'B', bubbles: true }));
    vi.advanceTimersByTime(10);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'C', bubbles: true }));

    // Pausa humana de 150ms (> 40ms)
    vi.advanceTimersByTime(150);

    // Escribir resto
    simulateFastTyping('123456', 10);

    // Solo se debe capturar '123456' porque el buffer anterior se reinició
    expect(onScan).toHaveBeenCalledWith('123456');
  });

  it('debe ignorar teclas modificadoras (Shift, Control, Alt, CapsLock)', () => {
    const onScan = vi.fn();
    renderHook(() =>
      useBarcodeScanner({
        onScan,
        minLength: 4,
        maxIntervalMs: 50,
      })
    );

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift', bubbles: true }));
    vi.advanceTimersByTime(5);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'X', bubbles: true }));
    vi.advanceTimersByTime(5);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', bubbles: true }));
    vi.advanceTimersByTime(5);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Y', bubbles: true }));
    vi.advanceTimersByTime(5);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Z', bubbles: true }));
    vi.advanceTimersByTime(5);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    vi.advanceTimersByTime(5);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(onScan).toHaveBeenCalledWith('XYZ1');
  });

  it('no debe procesar nada si enabled es false', () => {
    const onScan = vi.fn();
    renderHook(() =>
      useBarcodeScanner({
        onScan,
        enabled: false,
      })
    );

    simulateFastTyping('356987112233445', 10);

    expect(onScan).not.toHaveBeenCalled();
  });

  it('debe manejar eventos keydown con key indefinido o nulo sin lanzar TypeError', () => {
    const onScan = vi.fn();
    renderHook(() =>
      useBarcodeScanner({
        onScan,
        minLength: 6,
      })
    );

    expect(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: undefined as any, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '' as any, bubbles: true }));
      window.dispatchEvent(new Event('keydown', { bubbles: true }) as any);
    }).not.toThrow();

    expect(onScan).not.toHaveBeenCalled();
  });

  it('debe prevenir la contaminación en inputs de texto cuando se dispara el escáner (ID-POS-001)', () => {
    const onScan = vi.fn();
    renderHook(() =>
      useBarcodeScanner({
        onScan,
        minLength: 6,
        maxIntervalMs: 50,
      })
    );

    const input = document.createElement('input');
    input.type = 'text';
    input.value = 'Juan Perez ';
    document.body.appendChild(input);
    input.focus();

    // Simular que el primer carácter ('3') alcanza a escribirse antes de detectar el intervalo del escáner
    input.value += '3';

    // Disparar ráfaga rápida a través del escáner (intervalo 10ms)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true, cancelable: true }));
    vi.advanceTimersByTime(10);

    // Segundo carácter '5': el hook detecta intervalo <= 50ms, previene el default y limpia el '3' que entró al input
    const secondEvent = new KeyboardEvent('keydown', { key: '5', bubbles: true, cancelable: true });
    window.dispatchEvent(secondEvent);
    vi.advanceTimersByTime(10);

    expect(secondEvent.defaultPrevented).toBe(true);
    expect(input.value).toBe('Juan Perez ');

    // Caracteres restantes de la ráfaga
    for (const char of '6987112233445') {
      const ev = new KeyboardEvent('keydown', { key: char, bubbles: true, cancelable: true });
      window.dispatchEvent(ev);
      expect(ev.defaultPrevented).toBe(true);
      vi.advanceTimersByTime(10);
    }

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    window.dispatchEvent(enterEvent);

    expect(enterEvent.defaultPrevented).toBe(true);
    expect(onScan).toHaveBeenCalledWith('356987112233445');
    // El input original conservó su contenido limpio sin contaminación
    expect(input.value).toBe('Juan Perez ');

    document.body.removeChild(input);
  });

  it('debe suprimir rebotes accidentales de gatillo para el mismo código dentro de 1200ms (ID-POS-008)', () => {
    const onScan = vi.fn();
    renderHook(() =>
      useBarcodeScanner({
        onScan,
        minLength: 6,
        maxIntervalMs: 50,
        debounceMs: 1200,
      })
    );

    // Primer escaneo exitoso
    simulateFastTyping('356987112233445', 10);
    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith('356987112233445');

    // Doble pulsación accidental 300ms después con el mismo código
    vi.advanceTimersByTime(300);
    simulateFastTyping('356987112233445', 10);
    // Debe haber ignorado el duplicado dentro de la ventana de debounce
    expect(onScan).toHaveBeenCalledTimes(1);

    // Escaneo de un código DIFERENTE 200ms después (debe permitirse inmediatamente)
    vi.advanceTimersByTime(200);
    simulateFastTyping('998877665544332', 10);
    expect(onScan).toHaveBeenCalledTimes(2);
    expect(onScan).toHaveBeenCalledWith('998877665544332');

    // Mismo código original pero después de vencer los 1200ms (debe permitirse de nuevo)
    vi.advanceTimersByTime(1300);
    simulateFastTyping('356987112233445', 10);
    expect(onScan).toHaveBeenCalledTimes(3);
  });
});
