import { useEffect, useRef } from 'react';
import { playScanBeep } from '@/lib/sound';

export interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  maxIntervalMs?: number;
  playSound?: boolean;
  enabled?: boolean;
  debounceMs?: number;
}

export function useBarcodeScanner({
  onScan,
  minLength = 6,
  maxIntervalMs = 50,
  playSound = true,
  enabled = true,
  debounceMs = 1200,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  const firstCharCleanedRef = useRef<boolean>(false);
  const lastScannedBarcodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Validar que el evento y la tecla existan y sean un string válido
      if (!event || typeof event.key !== 'string') {
        return;
      }

      // Ignorar teclas modificadoras
      if (
        event.key === 'Shift' ||
        event.key === 'Control' ||
        event.key === 'Alt' ||
        event.key === 'Meta' ||
        event.key === 'CapsLock' ||
        event.key === 'Tab'
      ) {
        return;
      }

      const currentTime = Date.now();
      const interval = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      if (event.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        bufferRef.current = '';
        firstCharCleanedRef.current = false;

        if (barcode.length >= minLength) {
          event.preventDefault();
          event.stopPropagation();

          // Blindaje anti-rebote de gatillo de pistola (ID-POS-008)
          if (
            debounceMs > 0 &&
            lastScannedBarcodeRef.current.code === barcode &&
            currentTime - lastScannedBarcodeRef.current.time < debounceMs
          ) {
            return;
          }

          lastScannedBarcodeRef.current = { code: barcode, time: currentTime };

          if (playSound) {
            playScanBeep();
          }
          onScanRef.current(barcode);
        }
        return;
      }

      // Si el tiempo entre caracteres fue mayor al umbral de escáner óptico, resetear buffer
      if (interval > maxIntervalMs) {
        bufferRef.current = '';
        firstCharCleanedRef.current = false;
      } else if (bufferRef.current.length > 0) {
        // Intervalo ultrarrápido (ráfaga de escáner láser HID)
        // 1. Prevenir que los caracteres se escriban en inputs enfocados (ID-POS-001)
        event.preventDefault();

        // 2. Si es el segundo carácter de la ráfaga, remover el primer carácter que alcanzó a escribirse
        if (!firstCharCleanedRef.current && bufferRef.current.length === 1) {
          const target = (
            event.target instanceof HTMLElement ? event.target : document.activeElement
          ) as HTMLElement | null;

          if (
            target &&
            (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
            !['checkbox', 'radio', 'file', 'button', 'submit', 'reset'].includes((target as HTMLInputElement).type)
          ) {
            const inputTarget = target as HTMLInputElement | HTMLTextAreaElement;
            const firstChar = bufferRef.current;
            if (inputTarget.value && inputTarget.value.endsWith(firstChar)) {
              inputTarget.value = inputTarget.value.slice(0, -firstChar.length);
              inputTarget.dispatchEvent(new Event('input', { bubbles: true }));
            }
          }
          firstCharCleanedRef.current = true;
        }
      }

      // Solo acumular caracteres imprimibles de 1 carácter
      if (event.key && event.key.length === 1) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minLength, maxIntervalMs, playSound, debounceMs]);
}
