"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { api } from '@/lib/http';
import type { ApiSuccess, InterviewDetail, JoinTokenResponse } from '@/types/api';
import { formatDateTime } from '@/lib/format';
import { extractErrorMessage } from '@/utils/errors';

export default function JoinSessionPage() {
  const { id } = useParams<{ id: string }>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [joinData, setJoinData] = useState<JoinTokenResponse | null>(null);
  const [session, setSession] = useState<InterviewDetail | null>(null);
  const [countdown, setCountdown] = useState('');
  const [isLoading, setLoading] = useState(true);

  const fetchSessionDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [joinTokenResponse, sessionResponse] = await Promise.all([
        api.post<ApiSuccess<JoinTokenResponse>>(`/api/sessions/${id}/join-token`),
        api.get<ApiSuccess<InterviewDetail>>(`/api/interviews/${id}`),
      ]);
      setJoinData(joinTokenResponse.data.data);
      setSession(sessionResponse.data.data);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchSessionDetails();
  }, [fetchSessionDetails]);

  useEffect(() => {
    if (!session?.scheduledAt) return;
    const updateCountdown = () => {
      const target = new Date(session.scheduledAt).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setCountdown('Live');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, '0');
      setCountdown(`${minutes}m ${seconds}s`);
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [session?.scheduledAt]);

  useEffect(() => {
    if (!joinData) return;
    const chamcallUrl = process.env.NEXT_PUBLIC_CHAMCALL_URL ?? joinData.signalingUrl;
    let origin = '*';
    try {
      origin = new URL(chamcallUrl).origin;
    } catch {
      origin = '*';
    }

    const sendToken = () => {
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'CHAMCALL_AUTH',
          token: joinData.token,
        },
        origin,
      );
    };

    const timer = setInterval(sendToken, 2000);
    return () => clearInterval(timer);
  }, [joinData]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-saffron-400">Join</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">ChamCall session</h1>
        <p className="mt-2 text-sm text-slate-400">
          Tokenized access ensures only scheduled participants can enter the room.
        </p>
      </div>

      <Card>
        {session ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Scheduled for</p>
              <p className="text-lg font-semibold text-white">{formatDateTime(session.scheduledAt ?? null)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Countdown</p>
              <p className="text-lg font-semibold text-saffron-300">{countdown || '—'}</p>
            </div>
            <Button type="button" variant="outline" onClick={() => fetchSessionDetails()} disabled={isLoading}>
              Refresh token
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Fetching session details…</p>
        )}
      </Card>

      <div className="aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
        {joinData ? (
          <iframe
            ref={iframeRef}
            title="ChamCall Session"
            src={(process.env.NEXT_PUBLIC_CHAMCALL_URL ?? joinData.signalingUrl) + '?embed=1'}
            className="h-full w-full"
            allow="camera; microphone; fullscreen"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Preparing ChamCall iframe…
          </div>
        )}
      </div>
    </div>
  );
}
