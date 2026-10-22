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
});
