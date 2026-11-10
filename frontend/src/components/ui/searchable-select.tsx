'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchableSelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  group?: string;
  badge?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  id?: string;
  options: SearchableSelectOption[];
  value: string | number | null | undefined;
  onChange: (value: any) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  isClearable?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = '-- Seleccionar opción --',
  searchPlaceholder = 'Buscar...',
  disabled = false,
  className,
  error = false,
  isClearable = false,
  emptyMessage = 'No se encontraron resultados',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionsListRef = useRef<HTMLDivElement>(null);

  // Normalizador de búsqueda insensible a acentos y mayúsculas
  const normalize = (text: string) =>
    (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  // Filtrar opciones por coincidencia múltiple de términos
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;

    const terms = normalize(search).split(/\s+/).filter(Boolean);

    return options.filter((opt) => {
      const fullText = normalize(
        `${opt.label} ${opt.sublabel || ''} ${opt.group || ''} ${opt.badge || ''}`
      );
      return terms.every((term) => fullText.includes(term));
    });
  }, [options, search]);

  // Opción actualmente seleccionada
  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value]
  );

  // Manejar apertura y autoenfoque
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setHighlightedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Ajustar highlightedIndex al navegar con flechas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
      scrollHighlightedIntoView(
        highlightedIndex < filteredOptions.length - 1 ? highlightedIndex + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
      scrollHighlightedIntoView(
        highlightedIndex > 0 ? highlightedIndex - 1 : filteredOptions.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions.length > 0 && filteredOptions[highlightedIndex]) {
        const item = filteredOptions[highlightedIndex];
        if (!item.disabled) {
          onChange(item.value);
          setIsOpen(false);
        }
      }
    }
  };

  const scrollHighlightedIntoView = (index: number) => {
    if (!optionsListRef.current) return;
    const items = optionsListRef.current.querySelectorAll('[data-option-item]');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelectOption = (opt: SearchableSelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Botón Disparador (Trigger) */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'w-full flex items-center justify-between text-left h-9 px-3 py-1.5 rounded-lg border bg-white text-xs transition-colors',
          isClearable && selectedOption && !disabled ? 'pr-14' : 'pr-3',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1',
          error
            ? 'border-rose-400 bg-rose-50/20'
            : 'border-slate-300 hover:border-slate-400',
          disabled && 'opacity-60 cursor-not-allowed bg-slate-100',
          isOpen && 'ring-2 ring-slate-900 border-transparent'
        )}
      >
        <span className="truncate flex-1 pr-1">
          {selectedOption ? (
            <span className="font-semibold text-slate-900">
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                  {selectedOption.sublabel}
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>

        <span className="flex items-center shrink-0 text-slate-400">
          <ChevronDown
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-200 pointer-events-none',
              isOpen && 'rotate-180 text-slate-900'
            )}
          />
        </span>
      </button>

      {/* Botón de limpiar desacoplado como hermano independiente (ID-A11Y-001) */}
      {isClearable && selectedOption && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar selección"
          className="absolute right-7 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
          title="Limpiar selección"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Popover Desplegable */}
      {isOpen && (
        <div
          className={cn(
            'absolute left-0 top-full mt-1 w-full min-w-[280px] max-w-md z-50',
            'bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden',
            'animate-in fade-in-80 zoom-in-95 duration-150'
          )}
        >
          {/* Barra de búsqueda integrada */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-xs bg-transparent border-0 focus:outline-none placeholder:text-slate-400 text-slate-900"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Borrar texto de búsqueda"
                title="Borrar texto de búsqueda"
                className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Lista de resultados */}
          <div
            ref={optionsListRef}
            className="max-h-60 overflow-y-auto divide-y divide-slate-50 py-1"
            role="listbox"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-400">
                {emptyMessage}
              </div>
            ) : (
              (() => {
                let currentGroup = '';
                return filteredOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isHighlighted = idx === highlightedIndex;
                  const showGroupHeader = opt.group && opt.group !== currentGroup;
                  if (opt.group) currentGroup = opt.group;

                  return (
                    <React.Fragment key={`${opt.value}-${idx}`}>
                      {showGroupHeader && (
                        <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-y border-slate-100">
                          {opt.group}
                        </div>
                      )}
                      <div
                        data-option-item="true"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectOption(opt)}
                        onMouseEnter={() => setHighlightedIndex(idx)}
                        className={cn(
                          'px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors',
                          isHighlighted && 'bg-slate-100/90 text-slate-900',
                          isSelected && 'bg-slate-900 text-white font-medium',
                          opt.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                        )}
                      >
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                'font-medium',
                                isSelected ? 'text-white' : 'text-slate-900'
                              )}
                            >
                              {opt.label}
                            </span>
                            {opt.badge && (
                              <span
                                className={cn(
                                  'text-[9px] px-1.5 py-0.2 rounded font-mono',
                                  isSelected
                                    ? 'bg-slate-800 text-slate-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                )}
                              >
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          {opt.sublabel && (
                            <p
                              className={cn(
                                'text-[10px] mt-0.5',
                                isSelected ? 'text-slate-300' : 'text-slate-500'
                              )}
                            >
                              {opt.sublabel}
                            </p>
                          )}
                        </div>

                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-white shrink-0" />
                        )}
                      </div>
                    </React.Fragment>
                  );
                });
              })()
            )}
          </div>

          {/* Pie de cantidad */}
          <div className="px-3 py-1 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 flex justify-between">
            <span>{filteredOptions.length} opción(es)</span>
            <span className="italic">Navega con ↑ ↓ Enter</span>
          </div>
        </div>
      )}
    </div>
  );
}
