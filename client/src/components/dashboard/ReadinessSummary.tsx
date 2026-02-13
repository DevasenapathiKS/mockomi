import { Gauge, Trophy, TrendingUp } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { StatusBadge } from '@/components/shared/StatusBadge';

export function ReadinessSummary({
  readinessScore,
  performanceTier,
  readinessGap,
}: {
  readinessScore: number;
  performanceTier: string | null;
  readinessGap: number;
}) {
  return (
    <Card className="h-full">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Readiness</p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div className="flex items-end gap-2 text-5xl font-semibold text-white">
          {readinessScore || 0}
          <span className="text-lg text-slate-500">/ 100</span>
        </div>
        {performanceTier && <StatusBadge label={performanceTier} />}
      </div>
      <p className="mt-4 text-sm text-slate-400">
        Based on your latest completed interview session.
      </p>

      <div className="mt-6 grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
          <Gauge className="h-5 w-5 text-saffron-300" />
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Confidence gap</p>
          <p className="text-lg font-semibold text-white">{Math.max(readinessGap, 0).toFixed(1)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
          <TrendingUp className="h-5 w-5 text-emerald-300" />
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Momentum</p>
          <p className="text-lg font-semibold text-white">
            {readinessGap <= 0 ? 'Ready' : 'Keep pushing'}
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
          <Trophy className="h-5 w-5 text-amber-300" />
          <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Tier</p>
          <p className="text-lg font-semibold capitalize text-white">
            {performanceTier?.replaceAll('_', ' ') ?? 'N/A'}
          </p>
        </div>
      </div>
    </Card>
  );
}
