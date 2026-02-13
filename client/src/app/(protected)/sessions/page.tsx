"use client";

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { Card } from '@/components/shared/Card';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/shared/Button';
import { api } from '@/lib/http';
import type { ApiSuccess, SessionListResponse, SessionSummary } from '@/types/api';
import { formatDateTime } from '@/lib/format';
import { extractErrorMessage } from '@/utils/errors';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiSuccess<SessionListResponse>>('/api/interviews', {
        params: { page, limit: 10 },
      });
      const payload = response.data.data;
      setSessions(payload.items);
      setTotalPages(payload.pagination.totalPages || 1);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-saffron-400">Sessions</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">All interviews</h1>
        <p className="mt-2 text-sm text-slate-400">Monitor each booking and hop in when it is time.</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3">Status</th>
                <th>Date</th>
                <th>Readiness</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-t border-white/5">
                  <td className="py-3 capitalize text-white">{session.status.replaceAll('_', ' ')}</td>
                  <td>{formatDateTime(session.scheduledAt)}</td>
                  <td>
                    {session.readinessScore > 0 ? (
                      <span className="font-semibold text-saffron-300">{session.readinessScore}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="space-x-3 py-3">
                    <Link
                      className="text-sm font-medium text-saffron-300 hover:text-saffron-200"
                      href={`/sessions/${session.id}/join`}
                    >
                      Join
                    </Link>
                    {session.status === 'completed' && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="px-0 text-sm"
                        onClick={() => toast('Ratings live on dashboard')}
                      >
                        Rate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} isLoading={isLoading} />
    </div>
  );
}
