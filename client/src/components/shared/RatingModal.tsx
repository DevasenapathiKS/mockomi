"use client";

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import clsx from 'clsx';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/shared/Button';
import { api } from '@/lib/http';
import type { SessionRatingPayload } from '@/types/api';
import { extractErrorMessage } from '@/utils/errors';

export function RatingModal({
  sessionId,
  isOpen,
  onClose,
  onRated,
}: {
  sessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRated: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setComment('');
    }
  }, [isOpen]);

  if (!isOpen || !sessionId) return null;

  const stars = [1, 2, 3, 4, 5];

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const payload: SessionRatingPayload = {
        rating,
        comment: comment.trim() || undefined,
      };
      await api.post(`/api/sessions/${sessionId}/rate`, payload);
      toast.success('Thanks for rating your session.');
      onRated();
      onClose();
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-white">Rate your last session</h3>
        <p className="mt-2 text-sm text-slate-400">
          Your feedback helps us calibrate interviewer quality.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2">
          {stars.map((value) => (
            <button
              type="button"
              key={value}
              onClick={() => setRating(value)}
              className="rounded-full p-1"
            >
              <Star
                className={clsx('h-8 w-8 transition-colors', value <= rating ? 'fill-saffron-400 text-saffron-400' : 'text-slate-600')}
              />
            </button>
          ))}
        </div>

        <textarea
          className="mt-6 w-full rounded-xl border border-white/5 bg-slate-950/40 p-3 text-sm text-white placeholder:text-slate-500 focus:border-saffron-400 focus:outline-none"
          rows={3}
          placeholder="Tell us anything that stood out (optional)"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Skip
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
