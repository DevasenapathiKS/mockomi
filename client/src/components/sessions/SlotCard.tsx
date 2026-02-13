import { Clock, IndianRupee } from 'lucide-react';

import { Card } from '@/components/shared/Card';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { AvailabilitySlotSummary } from '@/types/api';
import { Button } from '@/components/shared/Button';

export function SlotCard({ slot, onBook }: { slot: AvailabilitySlotSummary; onBook: (slotId: string) => void }) {
  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Start time</p>
        <p className="mt-1 text-lg font-semibold text-white">{formatDateTime(slot.startTime)}</p>
        <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
          <Clock className="h-4 w-4 text-saffron-300" />
          <span>30 min</span>
          <IndianRupee className="h-4 w-4 text-emerald-300" />
          <span>{formatCurrency(slot.price)}</span>
        </div>
      </div>
      <Button type="button" onClick={() => onBook(slot.id)} className="w-full sm:w-auto">
        Book now
      </Button>
    </Card>
  );
}
