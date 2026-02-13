"use client";

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

const baseStyles = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

const variants = {
  primary:
    'bg-saffron-500 text-slate-950 hover:bg-saffron-400 focus-visible:outline-saffron-400',
  outline:
    'border border-slate-700 bg-transparent text-slate-100 hover:border-saffron-400 hover:text-saffron-300 focus-visible:outline-saffron-300',
  ghost: 'text-slate-300 hover:text-white hover:bg-slate-800/60 focus-visible:outline-saffron-300',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(baseStyles, variants[variant], className, 'px-4 py-2')}
      {...props}
    />
  );
});
