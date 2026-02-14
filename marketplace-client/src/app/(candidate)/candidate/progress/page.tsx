"use client";

import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/lib/api";

type SessionForProgress = {
  scheduledAt: string | null;
  roleProfileId: string | null;
};

type ProgressSnapshot = {
  averageScore: number | null;
  latestScore: number | null;
  previousScore: number | null;
  improvementDelta: number | null;
  growthTrend: string | null;
  growthMessage: string | null;
};

type TrendLevel = "improving" | "baseline" | "declining";

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

function getCandidateIdFromUser(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const u = user as Record<string, unknown>;
  const id = u.id ?? u._id ?? u.userId ?? u.candidateId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function parseSessionsForProgress(data: unknown): SessionForProgress[] {
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
    .map((raw): SessionForProgress | null => {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;

      const scheduledAt =
        toNullableString(obj.scheduledAt) ??
        toNullableString(obj.scheduledTime) ??
        toNullableString(obj.startTime) ??
        toNullableString(obj.startsAt) ??
        toNullableString(obj.createdAt) ??
        null;

      const roleProfileId =
        toNullableString(obj.roleProfileId) ??
        toNullableString(obj.role_profile_id) ??
        toNullableString(obj.roleProfile?.id) ??
        toNullableString(obj.roleProfile?._id) ??
        null;

      return { scheduledAt, roleProfileId };
    })
    .filter((s): s is SessionForProgress => s !== null);
}

function parseProgressSnapshot(data: unknown): ProgressSnapshot {
  const payload = safeEnvelope(data);
  if (!payload || typeof payload !== "object") {
    return {
      averageScore: null,
      latestScore: null,
      previousScore: null,
      improvementDelta: null,
      growthTrend: null,
      growthMessage: null,
    };
  }

  const obj = payload as Record<string, unknown>;

  const averageScore = toNumber(obj.averageScore ?? obj.avgScore ?? obj.average);
  const latestScore = toNumber(obj.latestScore ?? obj.currentScore ?? obj.latest);
  const previousScore = toNumber(obj.previousScore ?? obj.prevScore ?? obj.previous);

  const improvementDelta =
    toNumber(obj.improvementDelta ?? obj.delta) ??
    (latestScore !== null && previousScore !== null ? latestScore - previousScore : null);

  const growthTrend = toNullableString(obj.growthTrend ?? obj.trend);
  const growthMessage = toNullableString(obj.growthMessage ?? obj.message);

  return { averageScore, latestScore, previousScore, improvementDelta, growthTrend, growthMessage };
}

function trendLevelFromDelta(delta: number | null): TrendLevel {
  if (delta === null) return "baseline";
  if (delta > 0) return "improving";
  if (delta < 0) return "declining";
  return "baseline";
}

function trendStyles(level: TrendLevel): { badge: string; title: string } {
  if (level === "improving") {
    return {
      badge: "border-green-200 bg-green-50 text-green-800",
      title: "Improving",
    };
  }
  if (level === "declining") {
    return {
      badge: "border-red-200 bg-red-50 text-red-800",
      title: "Declining",
    };
  }
  return {
    badge: "border-yellow-200 bg-yellow-50 text-yellow-900",
    title: "Baseline",
  };
}

function formatScore(value: number | null): string {
  if (value === null) return "—";
  const rounded = Math.round(value * 10) / 10;
  return String(rounded);
}

export default function CandidateProgressPage() {
  const { user } = useAuth();
  const candidateId = useMemo(() => getCandidateIdFromUser(user), [user]);

  const [snapshot, setSnapshot] = useState<ProgressSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!candidateId) {
          throw new Error("Missing candidate id. Please log in again.");
        }

        const sessionsRes = await api.get("/api/interviews");
        const sessions = parseSessionsForProgress(sessionsRes.data);

        const mostRecentRoleProfileId = [...sessions]
          .filter((s) => s.roleProfileId)
          .sort((a, b) => {
            const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
            const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
            return tb - ta;
          })[0]?.roleProfileId;

        if (!mostRecentRoleProfileId) {
          throw new Error("No role profile found yet. Complete a session to see progress.");
        }

        const progressRes = await api.get(
          `/api/progress/${encodeURIComponent(candidateId)}/${encodeURIComponent(
            mostRecentRoleProfileId,
          )}`,
        );
        const parsed = parseProgressSnapshot(progressRes.data);

        if (!isMounted) return;
        setSnapshot(parsed);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(getErrorMessage(err));
        setSnapshot(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [candidateId]);

  const level = useMemo(() => trendLevelFromDelta(snapshot?.improvementDelta ?? null), [snapshot]);
  const styles = useMemo(() => trendStyles(level), [level]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Your Progress</h1>
        <p className="text-sm text-[#4B5563]">Track momentum over time. Small wins compound—keep going.</p>
      </div>

      {isLoading ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">Loading progress...</div>
      ) : error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : !snapshot ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">No progress data available.</div>
      ) : (
        <div className="space-y-4">
          <div className="rounded border border-[#E5E7EB] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm text-[#4B5563]">Growth indicator</div>
                <div className="text-lg font-semibold">{styles.title}</div>
              </div>
              <div
                className={[
                  "inline-flex items-center rounded border px-3 py-1 text-sm font-medium",
                  styles.badge,
                ].join(" ")}
              >
                {snapshot.growthTrend ?? "trend"}
              </div>
            </div>

            {snapshot.growthMessage ? (
              <p className="mt-3 text-sm text-[#4B5563]">{snapshot.growthMessage}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded border border-[#E5E7EB] bg-white p-4">
              <div className="text-sm text-[#4B5563]">Average score</div>
              <div className="mt-1 text-2xl font-semibold">{formatScore(snapshot.averageScore)}</div>
            </div>
            <div className="rounded border border-[#E5E7EB] bg-white p-4">
              <div className="text-sm text-[#4B5563]">Latest score</div>
              <div className="mt-1 text-2xl font-semibold">{formatScore(snapshot.latestScore)}</div>
            </div>
            <div className="rounded border border-[#E5E7EB] bg-white p-4">
              <div className="text-sm text-[#4B5563]">Previous score</div>
              <div className="mt-1 text-2xl font-semibold">{formatScore(snapshot.previousScore)}</div>
            </div>
            <div className="rounded border border-[#E5E7EB] bg-white p-4">
              <div className="text-sm text-[#4B5563]">Improvement delta</div>
              <div className="mt-1 text-2xl font-semibold">
                {snapshot.improvementDelta === null
                  ? "—"
                  : snapshot.improvementDelta > 0
                    ? `+${formatScore(snapshot.improvementDelta)}`
                    : formatScore(snapshot.improvementDelta)}
              </div>
            </div>
          </div>

          <div className="rounded border border-[#E5E7EB] bg-white p-4">
            <div className="text-sm text-[#4B5563]">What to do next</div>
            <p className="mt-2 text-sm text-[#4B5563]">
              Book sessions consistently and focus on one improvement area per week. Your trend will
              stabilize and then accelerate.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

