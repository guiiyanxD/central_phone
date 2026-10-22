import { useEffect, useRef } from 'react';
import { playScanBeep } from '@/lib/sound';

export interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minLength?: number;
  maxIntervalMs?: number;
  playSound?: boolean;
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minLength = 6,
  maxIntervalMs = 50,
  playSound = true,
  enabled = true,
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
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

        if (barcode.length >= minLength) {
          event.preventDefault();
          event.stopPropagation();
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
      }

      // Solo acumular caracteres imprimibles de 1 carácter
      if (event.key.length === 1) {
        bufferRef.current += event.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minLength, maxIntervalMs, playSound]);
}
