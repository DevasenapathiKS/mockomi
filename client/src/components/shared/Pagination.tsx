"use client";

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/shared/Button';

export function Pagination({
  page,
  totalPages,
  onPageChange,
  isLoading,
}: {
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  isLoading?: boolean;
}) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-between text-sm text-slate-300">
      <Button
        type="button"
        variant="ghost"
        className="gap-2"
        disabled={!canPrev || isLoading}
        onClick={() => canPrev && onPageChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" /> Prev
      </Button>
      <span>
        Page {page} of {totalPages || 1}
      </span>
      <Button
        type="button"
        variant="ghost"
        className="gap-2"
        disabled={!canNext || isLoading}
        onClick={() => canNext && onPageChange(page + 1)}
      >
        Next <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
