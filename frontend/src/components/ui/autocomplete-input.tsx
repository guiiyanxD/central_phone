'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface AutocompleteOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'purple' | 'blue';
  disabled?: boolean;
}

export interface AutocompleteInputProps {
  id?: string;
  options: AutocompleteOption[];
  value: string | number | null | undefined;
  onChange: (value: any, option?: AutocompleteOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  error?: boolean;
  isClearable?: boolean;
  emptyMessage?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export function AutocompleteInput({
  id,
  options,
  value,
  onChange,
  placeholder = 'Escribe para buscar...',
  disabled = false,
  className,
  inputClassName,
  error = false,
  isClearable = true,
  emptyMessage = 'Sin coincidencias encontradas',
  required = false,
  autoFocus = false,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Encontrar opción seleccionada actual
  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  // Sincronizar el texto del input cuando cambia la opción seleccionada externamente
  useEffect(() => {
    if (selectedOption) {
      setInputValue(selectedOption.label);
    } else if (value === null || value === undefined || value === '') {
      setInputValue('');
    }
  }, [selectedOption, value]);

  // Normalizador de búsqueda insensible a mayúsculas y acentos
  const normalize = (text: string) =>
    (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  // Filtrar opciones por coincidencia múltiple de términos
  const filteredOptions = useMemo(() => {
    if (!inputValue.trim()) return options;

    // Si el texto en pantalla coincide exactamente con la opción ya seleccionada, mostramos todas o las relevantes
    if (selectedOption && inputValue.trim() === selectedOption.label.trim()) {
      return options;
    }

    const terms = normalize(inputValue).split(/\s+/).filter(Boolean);
    return options.filter((opt) => {
      const fullText = normalize(
        `${opt.label} ${opt.sublabel || ''} ${opt.badge || ''}`
      );
      return terms.every((t) => fullText.includes(t));
    });
  }, [options, inputValue, selectedOption]);

  // Asegurar que el highlightedIndex no exceda las opciones disponibles
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions.length]);

  // Click outside para cerrar el dropdown y restaurar texto si no se seleccionó nada nuevo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Si no coincide con ninguna opción y hay una seleccionada previa, restaurar texto
        if (selectedOption) {
          setInputValue(selectedOption.label);
        } else if (!value) {
          setInputValue('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedOption, value]);

  // Manejo de teclado (accesibilidad y velocidad para POS/mostrador)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        scrollHighlightedIntoView(
          highlightedIndex < filteredOptions.length - 1
            ? highlightedIndex + 1
            : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        scrollHighlightedIntoView(
          prevIndex(highlightedIndex, filteredOptions.length)
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (isOpen && filteredOptions[highlightedIndex]) {
          handleSelectOption(filteredOptions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        if (selectedOption) {
          setInputValue(selectedOption.label);
        }
        break;

      case 'Tab':
        setIsOpen(false);
        if (selectedOption) {
          setInputValue(selectedOption.label);
        }
        break;
    }
  };

  const prevIndex = (current: number, total: number) => {
    return current > 0 ? current - 1 : total - 1;
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('li');
    if (items[index] && typeof items[index].scrollIntoView === 'function') {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelectOption = (opt: AutocompleteOption) => {
    if (opt.disabled) return;
    onChange(opt.value, opt);
    setInputValue(opt.label);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* Contenedor del Input */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />

        <input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={id ? `${id}-listbox` : undefined}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required && !value}
          placeholder={placeholder}
          value={inputValue}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (!isOpen) setIsOpen(true);
            // Si el usuario borra todo, emitir null
            if (e.target.value.trim() === '' && value) {
              onChange(null, null);
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full h-9 pl-9 pr-14 text-xs font-medium rounded-lg border bg-white transition-all',
            'focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent',
            error
              ? 'border-rose-400 bg-rose-50/20 text-rose-950 focus:ring-rose-500'
              : 'border-slate-300 hover:border-slate-400 text-slate-900',
            disabled && 'opacity-60 cursor-not-allowed bg-slate-100',
            inputClassName
          )}
        />

        {/* Acciones derecha: Botón limpiar y flecha indicadora */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isClearable && Boolean(value || inputValue) && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar campo"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 pointer-events-none',
                isOpen && 'rotate-180 text-slate-900'
              )}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Flotante en tiempo real */}
      {isOpen && !disabled && (
        <div
          className={cn(
            'absolute left-0 top-full mt-1 w-full min-w-[260px] max-w-lg z-50',
            'bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden',
            'animate-in fade-in-80 zoom-in-95 duration-100'
          )}
        >
          <ul
            id={id ? `${id}-listbox` : undefined}
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1 divide-y divide-slate-50"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      'px-3 py-2 text-xs rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors',
                      opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
                      isHighlighted && !opt.disabled && 'bg-slate-100 text-slate-900 font-medium',
                      isSelected && 'bg-slate-900 text-white hover:bg-slate-800 font-semibold'
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <Badge
                            variant={
                              opt.badgeVariant === 'purple'
                                ? 'outline'
                                : opt.badgeVariant === 'blue'
                                ? 'outline'
                                : 'secondary'
                            }
                            className={cn(
                              'text-[10px] px-1.5 py-0 shrink-0 font-normal',
                              isSelected && 'bg-white/20 text-white border-white/30',
                              !isSelected &&
                                opt.badgeVariant === 'purple' &&
                                'border-purple-200 bg-purple-50 text-purple-700',
                              !isSelected &&
                                opt.badgeVariant === 'blue' &&
                                'border-blue-200 bg-blue-50 text-blue-700'
                            )}
                          >
                            {opt.badge}
                          </Badge>
                        )}
                      </div>
                      {opt.sublabel && (
                        <span
                          className={cn(
                            'text-[11px] truncate',
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          )}
                        >
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-white" />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-3 text-center text-xs text-slate-500">
                {emptyMessage}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
