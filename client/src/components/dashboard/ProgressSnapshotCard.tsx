import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import type { ProgressSnapshot } from '@/types/api';

const trendIcon: Record<string, JSX.Element> = {
  improving: <ArrowUpRight className="h-5 w-5 text-emerald-300" />,
  declining: <ArrowDownRight className="h-5 w-5 text-rose-300" />,
  stable: <ArrowRight className="h-5 w-5 text-saffron-300" />,
  baseline: <Sparkles className="h-5 w-5 text-cyan-300" />,
};

export function ProgressSnapshotCard({ snapshot }: { snapshot: ProgressSnapshot | null }) {
  return (
    <Card className="h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Progress</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Consistency monitor</h3>
        </div>
        {snapshot && trendIcon[snapshot.growthSignal.trend]}
      </div>

      {!snapshot && (
        <p className="mt-6 text-sm text-slate-400">
          Complete at least one mock interview to unlock your progress timeline.
        </p>
      )}

      {snapshot && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Latest score</p>
            <p className="text-3xl font-semibold text-white">{snapshot.latestScore}</p>
            <p className="text-xs text-slate-500">
              vs previous {snapshot.previousScore} ({snapshot.improvementDelta >= 0 ? '+' : ''}
              {snapshot.improvementDelta})
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Average</p>
            <p className="text-2xl font-semibold text-white">{snapshot.averageScore}</p>
            <p className="text-xs text-slate-500">Across {snapshot.totalSessions} sessions</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Signal</p>
            <p className="text-sm text-slate-300">{snapshot.growthSignal.message}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
