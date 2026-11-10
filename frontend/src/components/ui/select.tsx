import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, id, children, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <div className="relative w-full">
        <select
          id={id}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={cn(
            'flex h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:border-slate-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
            error && 'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
