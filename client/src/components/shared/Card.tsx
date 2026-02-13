import clsx from 'clsx';

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('rounded-2xl border border-white/5 bg-slate-900/50 p-6 shadow-lg shadow-black/30 backdrop-blur', className)}>
      {children}
    </div>
  );
}
