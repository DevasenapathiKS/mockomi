"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { api } from "@/src/lib/api";

type Interviewer = {
  id: string;
  ratingAverage: number;
  totalRatings: number;
  yearsOfExperience: number;
  primaryTechStack: string;
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as unknown;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const maybeMessage = (data as { message?: unknown }).message;
      if (typeof maybeMessage === "string") return maybeMessage;
      const maybeError = (data as { error?: unknown }).error;
      if (typeof maybeError === "string") return maybeError;
    }
    if (typeof error.message === "string" && error.message.trim().length > 0) return error.message;
    return "Failed to load interviewers.";
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "Failed to load interviewers.";
}

function normalizeTechStack(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").join(", ");
  return "";
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function parseInterviewersResponse(data: unknown): Interviewer[] {
  const payload =
    data && typeof data === "object" && "data" in data ? (data as { data?: unknown }).data : data;

  if (!Array.isArray(payload)) return [];

  return payload
    .map((raw): Interviewer | null => {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;

      const id = typeof obj.id === "string" ? obj.id : typeof obj._id === "string" ? obj._id : "";
      if (!id) return null;

      return {
        id,
        ratingAverage: toNumber(obj.ratingAverage, 0),
        totalRatings: toNumber(obj.totalRatings, 0),
        yearsOfExperience: toNumber(obj.yearsOfExperience, 0),
        primaryTechStack: normalizeTechStack(obj.primaryTechStack),
      };
    })
    .filter((v): v is Interviewer => v !== null);
}

export default function CandidateDiscoverPage() {
  const router = useRouter();
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [techFilter, setTechFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pageSize = 9;

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get("/api/interviewers");
        const parsed = parseInterviewersResponse(response.data);
        if (!isMounted) return;
        setInterviewers(parsed);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = techFilter.trim().toLowerCase();
    if (!q) return interviewers;
    return interviewers.filter((i) => i.primaryTechStack.toLowerCase().includes(q));
  }, [interviewers, techFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / pageSize)), [filtered]);

  useEffect(() => {
    setPage(1);
  }, [techFilter]);

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Discover Interviewers</h1>
          <p className="text-sm text-[#4B5563]">Browse and pick an interviewer to view details.</p>
        </div>

        <div className="w-full max-w-sm space-y-2">
          <label className="block text-sm font-medium" htmlFor="tech">
            Tech filter
          </label>
          <input
            id="tech"
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            placeholder="e.g. React, Node, Java"
            className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2"
            disabled={isLoading}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">Loading interviewers...</div>
      ) : error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">No interviewers found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => router.push(`/candidate/interviewer/${i.id}`)}
                className="text-left rounded-md border border-[#E5E7EB] bg-white p-4 transition-colors hover:bg-[#F3F4F6]"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Rating</div>
                  <div className="text-sm">
                    <span className="font-semibold">{i.ratingAverage.toFixed(1)}</span>
                    <span className="text-[#4B5563]"> / 5</span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[#4B5563]">Total ratings</div>
                    <div className="font-medium">{i.totalRatings}</div>
                  </div>
                  <div>
                    <div className="text-[#4B5563]">Experience</div>
                    <div className="font-medium">{i.yearsOfExperience} yrs</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#4B5563]">Primary tech</div>
                    <div className="font-medium">{i.primaryTechStack || "—"}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <div className="text-sm text-[#4B5563]">
              Page <span className="font-medium text-[#111827]">{page}</span> of{" "}
              <span className="font-medium text-[#111827]">{totalPages}</span>
            </div>
            <button
              type="button"
              className="rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

