import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus:outline-none focus:ring-2 ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-black text-white dark:bg-white dark:text-black hover:opacity-90',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        outline: 'border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-5'
      }
    },
    defaultVariants: { variant: 'default', size: 'md' }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps){
  return <button className={cn(buttonVariants({variant, size}), className)} {...props} />;
}
