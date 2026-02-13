"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { SessionsSection } from '@/components/dashboard/SessionsSection';
import { ReadinessSummary } from '@/components/dashboard/ReadinessSummary';
import { ProgressSnapshotCard } from '@/components/dashboard/ProgressSnapshotCard';
import { Card } from '@/components/shared/Card';
import { Pagination } from '@/components/shared/Pagination';
import { RatingModal } from '@/components/shared/RatingModal';
import { Button } from '@/components/shared/Button';
import { api, type HttpError } from '@/lib/http';
import { useAuth } from '@/hooks/useAuth';
import type {
  ApiSuccess,
  InterviewDetail,
  ProgressSnapshot,
  SessionListResponse,
  SessionSummary,
} from '@/types/api';
import { extractErrorMessage } from '@/utils/errors';

const PAGE_LIMIT = 5;

export default function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);
  const [focusSession, setFocusSession] = useState<SessionSummary | null>(null);
  const [ratingSessionId, setRatingSessionId] = useState<string | null>(null);

  const fetchProgress = useCallback(
    async (sessionId: string) => {
      try {
        const detailResponse = await api.get<ApiSuccess<InterviewDetail>>(
          `/api/interviews/${sessionId}`,
        );
        const roleProfileId = detailResponse.data.data.roleProfileId;
        if (!roleProfileId || !user) {
          setProgress(null);
          return;
        }

        const progressResponse = await api.get<ApiSuccess<ProgressSnapshot>>(
          `/api/progress/${user.id}/${roleProfileId}`,
        );
        setProgress(progressResponse.data.data);
      } catch (fetchError) {
        setProgress(null);
        const status = (fetchError as HttpError)?.response?.status;
        if (status !== 404) {
          toast.error(extractErrorMessage(fetchError));
        }
      }
    },
    [user],
  );

  const fetchSessions = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<ApiSuccess<SessionListResponse>>('/api/interviews', {
          params: { page, limit: PAGE_LIMIT },
        });
        const { items, pagination: meta } = response.data.data;
        setSessions(items);
        setPagination({ page: meta.page, totalPages: meta.totalPages || 1 });

        const recentCompleted = items.find((session) => session.status === 'completed') ?? null;
        setFocusSession(recentCompleted);

        if (recentCompleted) {
          void fetchProgress(recentCompleted.id);
          const ratingKey = `rated-${recentCompleted.id}`;
          if (localStorage.getItem(ratingKey) !== 'true') {
            setRatingSessionId(recentCompleted.id);
          }
        } else {
          setProgress(null);
          setRatingSessionId(null);
        }
      } catch (fetchError) {
        const message = extractErrorMessage(fetchError);
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [fetchProgress],
  );

  useEffect(() => {
    void fetchSessions(pagination.page);
  }, [fetchSessions, pagination.page]);

  const upcomingSessions = useMemo(
    () => sessions.filter((session) => session.status === 'scheduled' || session.status === 'in_progress'),
    [sessions],
  );

  const completedSessions = useMemo(
    () => sessions.filter((session) => session.status === 'completed'),
    [sessions],
  );

  const handleRatingComplete = useCallback(() => {
    if (!ratingSessionId) return;
    localStorage.setItem(`rated-${ratingSessionId}`, 'true');
    setRatingSessionId(null);
  }, [ratingSessionId]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <ReadinessSummary
          readinessScore={focusSession?.readinessScore ?? 0}
          performanceTier={focusSession?.performanceTier ?? null}
          readinessGap={focusSession?.readinessGap ?? 0}
        />
        <ProgressSnapshotCard snapshot={progress} />
      </div>

      {error && (
        <Card>
          <p className="text-sm text-rose-300">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => fetchSessions(pagination.page)}
          >
            Retry
          </Button>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <SessionsSection
          title="Upcoming"
          sessions={upcomingSessions}
          emptyState={isLoading ? 'Fetching sessions...' : 'No upcoming mock interviews yet.'}
        />
        <SessionsSection
          title="Completed"
          sessions={completedSessions}
          emptyState={isLoading ? 'Checking history...' : 'Complete a session to unlock analytics.'}
        />
      </div>

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(next) => setPagination((prev) => ({ ...prev, page: next }))}
        isLoading={isLoading}
      />

      <RatingModal
        sessionId={ratingSessionId}
        isOpen={Boolean(ratingSessionId)}
        onClose={() => setRatingSessionId(null)}
        onRated={handleRatingComplete}
      />
    </div>
  );
}
