import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
  dataTestId?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  dataTestId,
}: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElement = React.useRef<HTMLElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  // Mantener la referencia actualizada de onClose sin provocar re-ejecuciones de efectos
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    if (!isOpen) return;

    // 1. Guardar el elemento previamente enfocado antes de abrir el modal
    previousActiveElement.current = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';

    // 2. Enfocar adecuadamente al montar de forma inteligente (respetando inputs y autoFocus)
    const timer = setTimeout(() => {
      if (!modalRef.current) return;

      // Si el foco ya está dentro del modal (por ejemplo, gracias al autoFocus nativo de React), preservarlo
      if (
        document.activeElement &&
        modalRef.current.contains(document.activeElement) &&
        document.activeElement !== modalRef.current
      ) {
        return;
      }

      // Buscar si existe un elemento con atributo autofocus explícito
      const autofocusEl = modalRef.current.querySelector<HTMLElement>('[autofocus]');
      if (autofocusEl) {
        autofocusEl.focus();
        return;
      }

      // Buscar el primer campo de formulario activo (input, select, textarea) dentro del contenido
      const firstFormField = modalRef.current.querySelector<HTMLElement>(
        'form input:not([disabled]):not([type="hidden"]), form select:not([disabled]), form textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
      );
      if (firstFormField) {
        firstFormField.focus();
        return;
      }

      // Fallback: buscar cualquier elemento interactivo en el contenido que no sea el botón cerrar
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (el) =>
          !el.hasAttribute('disabled') &&
          el.getAttribute('aria-hidden') !== 'true' &&
          (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)
      );

      if (focusable.length > 0) {
        const contentEl = focusable.find((el) => !el.hasAttribute('data-modal-close-button'));
        (contentEl || focusable[0]).focus();
      }
    }, 50);

    // 3. Manejador de teclado para Escape y trampa de foco (Tab / Shift+Tab)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) {
        // En modales anidados, solo el diálogo superior en el DOM debe responder a Escape
        const dialogs = document.querySelectorAll('[role="dialog"]');
        if (dialogs.length > 0 && dialogs[dialogs.length - 1] !== modalRef.current) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) =>
            !el.hasAttribute('disabled') &&
            el.getAttribute('aria-hidden') !== 'true' &&
            (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)
        );

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        // Si el foco se perdió o está en el contenedor estático, reencauzar
        if (!modalRef.current.contains(document.activeElement)) {
          e.preventDefault();
          firstElement.focus();
          return;
        }

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      if (document.querySelectorAll('[role="dialog"]').length <= 1) {
        document.body.style.overflow = 'unset';
      }
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen]); // Depende estrictamente de isOpen para no re-ejecutarse por renders del padre

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => onCloseRef.current()}
      />

      {/* Modal Surface */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        data-testid={dataTestId}
        className={cn(
          'relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-elevated z-10 animate-in fade-in zoom-in-95 duration-200',
          className
        )}
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 id={titleId} className="text-base font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            {description && (
              <p id={descId} className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            data-modal-close-button="true"
            onClick={() => onCloseRef.current()}
            aria-label="Cerrar diálogo emergente"
            className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors -mr-1 -mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
