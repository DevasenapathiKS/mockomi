import { Briefcase, Star, Users } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import type { InterviewerSummary } from '@/types/api';

export function InterviewerCard({ interviewer, onViewSlots }: {
  interviewer: InterviewerSummary;
  onViewSlots: (id: string) => void;
}) {
  return (
    <Card className="flex h-full flex-col gap-4">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{interviewer.primaryTechStack[0] ?? 'Interviewer'}</h3>
          <button
            type="button"
            onClick={() => onViewSlots(interviewer.id)}
            className="text-sm font-medium text-saffron-300 hover:text-saffron-200"
          >
            View slots →
          </button>
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-slate-400">{interviewer.bio}</p>
      </div>

      <div className="mt-auto grid grid-cols-2 gap-3 text-sm text-slate-300">
        <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
          <Star className="h-4 w-4 text-amber-300" />
          <p className="mt-2 font-semibold text-white">{interviewer.ratingAverage.toFixed(1)}</p>
          <p className="text-xs text-slate-500">{interviewer.totalRatings} reviews</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
          <Users className="h-4 w-4 text-emerald-300" />
          <p className="mt-2 font-semibold text-white">{interviewer.totalInterviews}</p>
          <p className="text-xs text-slate-500">Interviews done</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
          <Briefcase className="h-4 w-4 text-cyan-300" />
          <p className="mt-2 font-semibold text-white">{interviewer.yearsOfExperience} yrs</p>
          <p className="text-xs text-slate-500">Experience</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-950/40 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Stacks</p>
          <p className="mt-1 text-xs text-slate-300">
            {interviewer.primaryTechStack.slice(0, 3).join(' · ') || 'Generalist'}
          </p>
        </div>
      </div>
    </Card>
  );
}
