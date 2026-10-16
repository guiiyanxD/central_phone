'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, className, children, ...props }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'pill' | 'line';
}

export function TabsList({ className, variant = 'pill', children, ...props }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        variant === 'pill' &&
          'inline-flex h-9 items-center justify-center rounded-xl bg-slate-100 p-1 text-slate-500 border border-slate-200/60',
        variant === 'line' &&
          'flex gap-4 border-b border-slate-200 pb-0 text-xs font-bold',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  variant?: 'pill' | 'line';
}

export function TabsTrigger({
  value,
  variant = 'pill',
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isSelected = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={() => context.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 disabled:pointer-events-none disabled:opacity-50 select-none',
        variant === 'pill' && [
          'rounded-lg px-3 py-1.5',
          isSelected
            ? 'bg-white text-slate-900 shadow-sm font-bold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50',
        ],
        variant === 'line' && [
          'pb-2 border-b-2 gap-1.5',
          isSelected
            ? 'border-slate-900 text-slate-900 font-bold'
            : 'border-transparent text-slate-500 hover:text-slate-800',
        ],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.value !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('ring-offset-background focus-visible:outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
}
