"use client";

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { SlotCard } from '@/components/sessions/SlotCard';
import { Card } from '@/components/shared/Card';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/shared/Button';
import { useRazorpay } from '@/hooks/useRazorpay';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/http';
import type { ApiSuccess, RazorpayOrderPayload, SlotListResponse } from '@/types/api';
import { extractErrorMessage } from '@/utils/errors';

export default function InterviewerSlotsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isReady: razorpayReady, error: razorpayError } = useRazorpay();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [slots, setSlots] = useState<SlotListResponse['items']>([]);
  const [isLoading, setLoading] = useState(true);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiSuccess<SlotListResponse>>(
        `/api/interviewers/${id}/slots`,
        {
          params: { page, limit: 6 },
        },
      );
      const payload = response.data.data;
      setSlots(payload.items);
      setTotalPages(payload.pagination.totalPages || 1);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => {
    if (id) {
      void fetchSlots();
    }
  }, [fetchSlots, id]);

  const handlePayment = useCallback(
    async (slotId: string) => {
      if (!razorpayReady || !window.Razorpay) {
        toast.error(razorpayError ?? 'Razorpay not ready yet.');
        return;
      }

      try {
        const response = await api.post<ApiSuccess<RazorpayOrderPayload>>(
          '/api/payments/create-order',
          { slotId },
        );
        const payload = response.data.data;

        const checkout = new window.Razorpay({
          key: payload.keyId,
          amount: payload.order.amount,
          currency: payload.order.currency,
          name: 'Mockomi',
          description: 'Interview readiness session',
          order_id: payload.order.id,
          prefill: { email: user?.email },
          theme: { color: '#f4a261' },
          handler: async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
            try {
              await api.post('/api/payments/verify', {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                slotId,
              });
              toast.success('Slot booked successfully.');
              router.push('/dashboard');
            } catch (verifyError) {
              toast.error(extractErrorMessage(verifyError));
            }
          },
        });

        checkout.on('payment.failed', () => {
          toast.error('Payment failed. Please retry.');
        });

        checkout.open();
      } catch (error) {
        toast.error(extractErrorMessage(error));
      }
    },
    [razorpayError, razorpayReady, router, user?.email],
  );

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-saffron-400">Availability</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Select a slot</h1>
        <p className="mt-2 text-sm text-slate-400">
          Slots are reserved for 10 minutes once you initiate checkout.
        </p>
      </div>

      {!razorpayReady && (
        <Card>
          <p className="text-sm text-slate-400">Loading Razorpay checkout…</p>
        </Card>
      )}

      <div className="space-y-4">
        {slots.map((slot) => (
          <SlotCard key={slot.id} slot={slot} onBook={handlePayment} />
        ))}
      </div>

      {!isLoading && slots.length === 0 && (
        <Card>
          <p className="text-sm text-slate-400">No available slots. Try another interviewer.</p>
        </Card>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={isLoading} />

      <Button type="button" variant="ghost" onClick={() => router.back()}>
        ← Back
      </Button>
    </div>
  );
}
