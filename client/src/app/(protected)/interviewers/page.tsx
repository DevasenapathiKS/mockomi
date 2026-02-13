"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

import { InterviewerFilters } from '@/components/interviewers/InterviewerFilters';
import { InterviewerCard } from '@/components/interviewers/InterviewerCard';
import { Card } from '@/components/shared/Card';
import { Pagination } from '@/components/shared/Pagination';
import { api } from '@/lib/http';
import type { ApiSuccess, InterviewerListResponse, InterviewerSummary } from '@/types/api';
import { extractErrorMessage } from '@/utils/errors';

export default function InterviewersPage() {
  const router = useRouter();
  const [interviewers, setInterviewers] = useState<InterviewerSummary[]>([]);
  const [sort, setSort] = useState('rating');
  const [tech, setTech] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setLoading] = useState(true);

  const fetchInterviewers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiSuccess<InterviewerListResponse>>('/api/interviewers', {
        params: { page, limit: 6, sort, tech: tech || undefined },
      });
      const { items, pagination } = response.data.data;
      setInterviewers(items);
      setTotalPages(pagination.totalPages || 1);
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [page, sort, tech]);

  useEffect(() => {
    void fetchInterviewers();
  }, [fetchInterviewers]);

  const handleApplyFilters = ({ sort: nextSort, tech: nextTech }: { sort: string; tech: string }) => {
    setSort(nextSort);
    setTech(nextTech);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-saffron-400">Marketplace</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Book a calibrated interviewer</h1>
        <p className="mt-2 text-sm text-slate-400">
          Filter by stack, inspect track records, and secure a slot instantly.
        </p>
      </div>

      <InterviewerFilters initialSort={sort} initialTech={tech} onApply={handleApplyFilters} />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {interviewers.map((interviewer) => (
          <InterviewerCard
            key={interviewer.id}
            interviewer={interviewer}
            onViewSlots={(id) => router.push(`/interviewers/${id}/slots`)}
          />
        ))}
      </div>

      {!isLoading && interviewers.length === 0 && (
        <Card>
          <p className="text-sm text-slate-400">No interviewers match this filter yet.</p>
        </Card>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
}
