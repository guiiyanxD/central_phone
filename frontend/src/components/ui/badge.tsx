import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-slate-900 text-white shadow-sm',
        cobalt:
          'border-transparent bg-[#363EFF] text-white shadow-sm',
        flame:
          'border-orange-200 bg-orange-50 text-orange-700 font-semibold',
        secondary:
          'border-slate-200 bg-slate-100 text-slate-800 font-medium',
        destructive:
          'border-slate-300 bg-white text-rose-700 font-semibold',
        success:
          'border-slate-300 bg-white text-slate-900 font-semibold',
        warning:
          'border-slate-300 bg-white text-slate-800 font-semibold',
        outline:
          'border-slate-300 bg-white text-slate-800',
        mono:
          'font-mono text-[11px] tracking-tight border-slate-200 bg-slate-100 text-slate-800',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
