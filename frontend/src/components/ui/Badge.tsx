import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'gray' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  dot = false,
  className,
}) => {
  const variants: Record<BadgeVariant, string> = {
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
    info: 'bg-blue-100 text-blue-800',
  };

  const dotColors: Record<BadgeVariant, string> = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    gray: 'bg-gray-500',
    info: 'bg-blue-500',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5', dotColors[variant])} />
      )}
      {children}
    </span>
  );
};

export default Badge;
