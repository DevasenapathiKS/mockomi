"use client";

import { useState } from 'react';

import { Button } from '@/components/shared/Button';

const sortOptions = [
  { value: 'rating', label: 'Top rated' },
  { value: 'experience', label: 'Experience' },
  { value: 'interviews', label: 'Most interviews' },
];

type InterviewerFiltersProps = {
  initialSort: string;
  initialTech: string;
  onApply: (filters: { sort: string; tech: string }) => void;
};

export function InterviewerFilters({ initialSort, initialTech, onApply }: InterviewerFiltersProps) {
  const [sort, setSort] = useState(initialSort);
  const [tech, setTech] = useState(initialTech);

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-slate-950/40 p-4 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({ sort, tech });
      }}
    >
      <label className="flex w-full flex-col text-sm text-slate-400">
        Sort by
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white focus:border-saffron-400 focus:outline-none"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-900">
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex w-full flex-col text-sm text-slate-400">
        Filter by tech
        <input
          type="text"
          value={tech}
          onChange={(event) => setTech(event.target.value)}
          placeholder="e.g. React"
          className="mt-1 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white placeholder:text-slate-500 focus:border-saffron-400 focus:outline-none"
        />
      </label>
      <div className="flex items-end">
        <Button type="submit" className="w-full">
          Apply
        </Button>
      </div>
    </form>
  );
}
