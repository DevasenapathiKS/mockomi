import { CalendarClock, CheckCircle2, PlayCircle } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { SessionSummary } from '@/types/api';
import { formatDateTime, timeUntil } from '@/lib/format';

const statusIcon: Record<string, JSX.Element> = {
  scheduled: <CalendarClock className="h-4 w-4 text-saffron-400" />,
  in_progress: <PlayCircle className="h-4 w-4 text-emerald-400" />,
  completed: <CheckCircle2 className="h-4 w-4 text-sky-400" />,
};

export function SessionsSection({
  title,
  sessions,
  emptyState,
}: {
  title: string;
  sessions: SessionSummary[];
  emptyState: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Sessions</p>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        <span className="text-sm text-slate-400">{sessions.length} items</span>
      </div>

      {sessions.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">{emptyState}</p>
      )}

      <div className="mt-6 space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-2xl border border-white/5 bg-slate-900/60 p-4 transition hover:border-saffron-400/60"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                {statusIcon[session.status] ?? statusIcon.scheduled}
                <span className="capitalize">{session.status.replaceAll('_', ' ')}</span>
              </div>
              {session.performanceTier && <StatusBadge label={session.performanceTier} />}
              <span className="text-xs text-slate-500">{timeUntil(session.scheduledAt)}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-4 text-white">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">When</p>
                <p className="text-sm font-medium">{formatDateTime(session.scheduledAt)}</p>
              </div>
              {session.readinessScore > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Readiness</p>
                  <p className="text-sm font-semibold text-saffron-300">
                    {session.readinessScore}
                    <span className="text-xs text-slate-400"> / 100</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
