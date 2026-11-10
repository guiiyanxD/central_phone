import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;
    return (
      <div className="w-full">
        <input
          id={id}
          type={type}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={cn(
            'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:border-slate-900 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
            error && 'border-rose-500 focus-visible:ring-rose-500 focus-visible:border-rose-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
