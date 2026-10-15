import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <select
          ref={ref}
          className={cn(
            'flex h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-8 text-sm text-slate-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-rose-500 focus-visible:ring-rose-500',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
        {error && (
          <p className="mt-1 text-[11px] text-rose-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
