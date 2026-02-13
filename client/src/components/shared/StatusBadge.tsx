import clsx from 'clsx';

const tierColors: Record<string, string> = {
  elite: 'from-emerald-400 to-lime-300 text-slate-900',
  strong_candidate: 'from-cyan-400 to-blue-300 text-slate-900',
  interview_ready: 'from-saffron-400 to-amber-300 text-slate-900',
  approaching_readiness: 'from-orange-400 to-amber-300 text-slate-900',
  developing: 'from-rose-400 to-pink-300 text-slate-900',
};

export function StatusBadge({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold uppercase tracking-wide',
        tierColors[normalized] ?? tierColors.developing,
      )}
    >
      {label.replaceAll('_', ' ')}
    </span>
  );
}
