"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/src/lib/api";

type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | (string & {});

type InterviewerSession = {
  id: string;
  scheduledAt: string | null;
  status: SessionStatus;
  candidateLabel: string;
  finalScore: number | null;
  performanceTier: string | null;
  readinessScore: number | null;
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
    return "Something went wrong.";
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "Something went wrong.";
}

function safeEnvelope(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const maybe = data as { data?: unknown };
  return maybe.data !== undefined ? maybe.data : data;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function formatScheduledTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: SessionStatus): string {
  const s = status.toLowerCase();
  if (s === "scheduled") return "border-yellow-200 bg-yellow-50 text-yellow-900";
  if (s === "in_progress") return "border-blue-200 bg-blue-50 text-blue-800";
  if (s === "completed") return "border-green-200 bg-green-50 text-green-800";
  if (s === "cancelled") return "border-red-200 bg-red-50 text-red-800";
  return "border-zinc-200 bg-zinc-50 text-zinc-800";
}

function candidateLabelFromRaw(raw: Record<string, unknown>): string {
  const candidate = raw.candidate;
  if (candidate && typeof candidate === "object") {
    const c = candidate as Record<string, unknown>;
    const name = toNullableString(c.name) ?? toNullableString(c.fullName);
    const email = toNullableString(c.email);
    if (name && email) return `${name} (${email})`;
    if (name) return name;
    if (email) return email;
    const id = toNullableString(c.id) ?? toNullableString(c._id);
    if (id) return id;
  }

  const id =
    toNullableString(raw.candidateId) ??
    toNullableString(raw.candidate_id) ??
    toNullableString(raw.userId) ??
    toNullableString(raw.user_id);
  if (id) return id;

  return "—";
}

function parseInterviewerSessions(data: unknown): InterviewerSession[] {
  const payload = safeEnvelope(data);

  const list: unknown =
    Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object"
        ? ((payload as { sessions?: unknown }).sessions ??
          (payload as { interviews?: unknown }).interviews ??
          (payload as { items?: unknown }).items)
        : null;

  if (!Array.isArray(list)) return [];

  return list
    .map((raw): InterviewerSession | null => {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;

      const id = typeof obj.id === "string" ? obj.id : typeof obj._id === "string" ? obj._id : "";
      if (!id) return null;

      const scheduledAt =
        toNullableString(obj.scheduledAt) ??
        toNullableString(obj.scheduledTime) ??
        toNullableString(obj.startTime) ??
        toNullableString(obj.startsAt) ??
        null;

      const status =
        typeof obj.status === "string" && obj.status.trim().length > 0
          ? (obj.status as SessionStatus)
          : "scheduled";

      const candidateLabel = candidateLabelFromRaw(obj);

      const finalScore = toNumber(obj.finalScore ?? obj.score ?? obj.totalScore);
      const performanceTier = toNullableString(obj.performanceTier ?? obj.tier);
      const readinessScore = toNumber(obj.readinessScore ?? obj.readiness);

      return { id, scheduledAt, status, candidateLabel, finalScore, performanceTier, readinessScore };
    })
    .filter((s): s is InterviewerSession => s !== null);
}

export default function InterviewerSessionsPage() {
  const router = useRouter();

  const [sessions, setSessions] = useState<InterviewerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/interviews");
      setSessions(parseInterviewerSessions(res.data));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return tb - ta;
    });
  }, [sessions]);

  const onStart = async (sessionId: string) => {
    if (startingId) return;
    setStartingId(sessionId);
    setError(null);

    try {
      await api.post(`/api/sessions/${encodeURIComponent(sessionId)}/start`);
      await load();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setStartingId(null);
    }
  };

  const onSubmitScores = (sessionId: string) => {
    router.push(`/interviewer/sessions/${encodeURIComponent(sessionId)}/score`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">My Sessions</h1>
        <p className="text-sm text-[#4B5563]">Manage upcoming interviews and submit results.</p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">Loading sessions...</div>
      ) : sortedSessions.length === 0 ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">No sessions found.</div>
      ) : (
        <div className="space-y-4">
          {sortedSessions.map((s) => {
            const isScheduled = s.status === "scheduled";
            const isInProgress = s.status === "in_progress";
            const isCompleted = s.status === "completed";

            return (
              <div key={s.id} className="rounded-md border border-[#E5E7EB] bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <div className="text-[#4B5563]">Scheduled time</div>
                        <div className="font-medium">{formatScheduledTime(s.scheduledAt)}</div>
                      </div>
                      <div>
                        <div className="text-[#4B5563]">Candidate</div>
                        <div className="font-medium">{s.candidateLabel}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={[
                          "inline-flex items-center rounded border px-2 py-1 text-xs font-medium",
                          statusBadgeClass(s.status),
                        ].join(" ")}
                      >
                        {s.status}
                      </span>

                      {isCompleted ? (
                        <span className="inline-flex items-center rounded border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium">
                          Score:{" "}
                          <span className="ml-1">
                            {s.finalScore !== null
                              ? s.finalScore
                              : s.readinessScore !== null
                                ? s.readinessScore
                                : "—"}
                          </span>
                        </span>
                      ) : null}

                      {isCompleted && s.performanceTier ? (
                        <span className="inline-flex items-center rounded border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium">
                          Tier: <span className="ml-1">{s.performanceTier}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isScheduled ? (
                      <button
                        type="button"
                        onClick={() => onStart(s.id)}
                        disabled={startingId !== null}
                        className="rounded-md bg-[#FF9F1C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#F48C06] disabled:opacity-60"
                      >
                        {startingId === s.id ? "Starting..." : "Start Session"}
                      </button>
                    ) : null}

                    {isInProgress ? (
                      <button
                        type="button"
                        onClick={() => onSubmitScores(s.id)}
                        className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-[#F3F4F6]"
                      >
                        Submit Scores
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

