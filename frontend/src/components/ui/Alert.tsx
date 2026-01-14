import React from 'react';
import { clsx } from 'clsx';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className,
  onClose,
}) => {
  const variants: Record<AlertVariant, { bg: string; text: string; icon: React.ElementType }> = {
    info: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
      icon: InformationCircleIcon,
    },
    success: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
      icon: CheckCircleIcon,
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-800',
      icon: ExclamationTriangleIcon,
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      icon: XCircleIcon,
    },
  };

  const { bg, text, icon: Icon } = variants[variant];

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        bg,
        className
      )}
    >
      <div className="flex">
        <Icon className={clsx('h-5 w-5 flex-shrink-0', text)} />
        <div className="ml-3 flex-1">
          {title && <h3 className={clsx('text-sm font-medium', text)}>{title}</h3>}
          <div className={clsx('text-sm', text, title && 'mt-1')}>{children}</div>
        </div>
        {onClose && (
          <button
            type="button"
            className={clsx('ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-black/5', text)}
            onClick={onClose}
          >
            <span className="sr-only">Dismiss</span>
            <XCircleIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
