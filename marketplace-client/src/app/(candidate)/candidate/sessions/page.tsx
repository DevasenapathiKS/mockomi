"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { api } from "@/src/lib/api";

type SessionStatus = "scheduled" | "completed" | "cancelled" | "in_progress" | (string & {});

type InterviewSession = {
  id: string;
  scheduledAt: string | null;
  status: SessionStatus;
  performanceTier: string | null;
  readinessScore: number | null;
};

type JoinTokenResponse = {
  token: string;
  signalingUrl: string;
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

function safeEnvelope(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const maybe = data as { data?: unknown };
  return maybe.data !== undefined ? maybe.data : data;
}

function parseSessionsResponse(data: unknown): InterviewSession[] {
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
    .map((raw): InterviewSession | null => {
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

      const performanceTier =
        toNullableString(obj.performanceTier) ??
        toNullableString(obj.tier) ??
        toNullableString(obj.performance) ??
        null;

      const readinessScore = toNumber(obj.readinessScore ?? obj.score ?? obj.readiness);

      return { id, scheduledAt, status, performanceTier, readinessScore };
    })
    .filter((s): s is InterviewSession => s !== null);
}

function parseJoinTokenResponse(data: unknown): JoinTokenResponse {
  const payload = safeEnvelope(data);
  if (!payload || typeof payload !== "object") {
    throw new Error("Unexpected join-token response.");
  }

  const obj = payload as Record<string, unknown>;
  const token = obj.token;
  const signalingUrl = obj.signalingUrl ?? obj.signaling_url ?? obj.url;

  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Join token missing.");
  }
  if (typeof signalingUrl !== "string" || signalingUrl.length === 0) {
    throw new Error("Signaling URL missing.");
  }

  return { token, signalingUrl };
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

function statusLabel(status: SessionStatus): string {
  if (status === "scheduled") return "Scheduled";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  if (status === "in_progress") return "In progress";
  return status;
}

export default function CandidateSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const page = 1;
  const limit = 10;

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/interviews?page=${page}&limit=${limit}`);
        const parsed = parseSessionsResponse(res.data);
        if (!isMounted) return;
        setSessions(parsed);
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
  }, [limit, page]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return tb - ta;
    });
  }, [sessions]);

  const onJoin = async (sessionId: string) => {
    if (joiningId) return;
    setJoiningId(sessionId);
    setError(null);

    try {
      const res = await api.post(`/api/sessions/${encodeURIComponent(sessionId)}/join-token`);
      const { token, signalingUrl } = parseJoinTokenResponse(res.data);
      const url = `${signalingUrl}?token=${encodeURIComponent(token)}`;
      window.location.href = url;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setJoiningId(null);
    }
  };

  const onRate = (sessionId: string) => {
    router.push(`/candidate/sessions/${encodeURIComponent(sessionId)}/rate`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">My Sessions</h1>
        <p className="text-sm text-[#4B5563]">View upcoming and past interviews.</p>
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
            const isCompleted = s.status === "completed";
            const isScheduled = s.status === "scheduled";

            return (
              <div key={s.id} className="rounded-md border border-[#E5E7EB] bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-[#4B5563]">Scheduled time</span>
                      <div className="font-medium">{formatScheduledTime(s.scheduledAt)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium">
                        {statusLabel(s.status)}
                      </span>
                      {isCompleted ? (
                        <>
                          <span className="inline-flex items-center rounded border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium">
                            Tier: {s.performanceTier ?? "—"}
                          </span>
                          <span className="inline-flex items-center rounded border border-[#E5E7EB] bg-white px-2 py-1 text-xs font-medium">
                            Readiness: {s.readinessScore === null ? "—" : s.readinessScore}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isScheduled ? (
                      <button
                        type="button"
                        onClick={() => onJoin(s.id)}
                        disabled={joiningId !== null}
                        className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-[#F3F4F6] disabled:opacity-60"
                      >
                        {joiningId === s.id ? "Joining..." : "Join"}
                      </button>
                    ) : null}

                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={() => onRate(s.id)}
                        className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-[#F3F4F6]"
                      >
                        Rate Interview
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

