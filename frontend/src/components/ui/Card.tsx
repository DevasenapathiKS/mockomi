import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ children, className, hover = false, padding = 'md' }) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-soft',
        paddingStyles[padding],
        hover && 'transition-shadow duration-200 hover:shadow-soft-lg',
        className
      )}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => (
  <div className={clsx('mb-4', className)}>{children}</div>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900', className)}>{children}</h3>
);

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const CardDescription: React.FC<CardDescriptionProps> = ({ children, className }) => (
  <p className={clsx('text-sm text-gray-500 mt-1', className)}>{children}</p>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

const CardContent: React.FC<CardContentProps> = ({ children, className }) => (
  <div className={className}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, className }) => (
  <div className={clsx('mt-4 pt-4 border-t border-gray-100', className)}>{children}</div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
