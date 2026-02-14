"use client";

import axios from "axios";
import Link from "next/link";
import React, { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/lib/api";

type UserLike = {
  email?: unknown;
  role?: unknown;
};

type MotivationTier = "foundation" | "approaching_readiness" | "ready" | (string & {});

type CandidateDashboard = {
  motivation: { tier: MotivationTier; message: string };
  performance: {
    readinessScore: number;
    improvementDelta: number;
    totalSessions: number;
    averageScore: number;
    latestScore: number;
  };
  trend: Array<{ date: string; score: number }>;
  weakestSection:
    | null
    | {
        sectionId: string;
        label: string;
        rawScore: number;
        weightedScore: number;
      };
  recentSessions: Array<{
    id: string;
    scheduledAt: string | null;
    interviewerId: string | null;
    overallScore: number;
    status: string;
  }>;
};

type DashboardState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; dashboard: CandidateDashboard };

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function useHasMounted(): boolean {
  return useSyncExternalStore(mountedStore.subscribe, mountedStore.getSnapshot, mountedStore.getSnapshot);
}

const mountedStore = (() => {
  let mounted = false;
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return mounted;
    },
    setMounted(next: boolean) {
      if (mounted === next) return;
      mounted = next;
      for (const l of listeners) l();
    },
  };
})();

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

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as unknown;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const msg = (data as { message?: unknown }).message;
      if (typeof msg === "string" && msg.trim().length > 0) return msg;
    }
    if (typeof error.message === "string" && error.message.trim().length > 0) return error.message;
    return "Something went wrong.";
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "Something went wrong.";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "scheduled") return "border-yellow-200 bg-yellow-50 text-yellow-900";
  if (s === "in_progress") return "border-blue-200 bg-blue-50 text-blue-800";
  if (s === "completed") return "border-green-200 bg-green-50 text-green-800";
  if (s === "cancelled") return "border-red-200 bg-red-50 text-red-800";
  return "border-[#E5E7EB] bg-white text-[#4B5563]";
}

function parseDashboard(data: unknown): CandidateDashboard {
  const payload = safeEnvelope(data);
  const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

  const motivationRaw =
    obj.motivation && typeof obj.motivation === "object" ? (obj.motivation as Record<string, unknown>) : {};
  const performanceRaw =
    obj.performance && typeof obj.performance === "object" ? (obj.performance as Record<string, unknown>) : {};

  const motivation = {
    tier: (toNullableString(motivationRaw.tier) ?? "foundation") as MotivationTier,
    message: toNullableString(motivationRaw.message) ?? "Keep going. Consistency wins.",
  };

  const performance = {
    readinessScore: toNumber(performanceRaw.readinessScore) ?? 0,
    improvementDelta: toNumber(performanceRaw.improvementDelta) ?? 0,
    totalSessions: toNumber(performanceRaw.totalSessions) ?? 0,
    averageScore: toNumber(performanceRaw.averageScore) ?? 0,
    latestScore: toNumber(performanceRaw.latestScore) ?? 0,
  };

  const trendRaw = obj.trend;
  const trend: Array<{ date: string; score: number }> = Array.isArray(trendRaw)
    ? trendRaw
        .map((p): { date: string; score: number } | null => {
          if (!p || typeof p !== "object") return null;
          const r = p as Record<string, unknown>;
          const date = toNullableString(r.date);
          const score = toNumber(r.score);
          if (!date || score === null) return null;
          return { date, score };
        })
        .filter((x): x is { date: string; score: number } => x !== null)
    : [];

  const weakestSection = (() => {
    const raw = obj.weakestSection;
    if (!raw || typeof raw !== "object") return null;
    const r = raw as Record<string, unknown>;
    const sectionId = toNullableString(r.sectionId);
    const label = toNullableString(r.label);
    const rawScore = toNumber(r.rawScore);
    const weightedScore = toNumber(r.weightedScore);
    if (!sectionId || !label || rawScore === null || weightedScore === null) return null;
    return { sectionId, label, rawScore, weightedScore };
  })();

  const recentRaw = obj.recentSessions;
  const recentSessions: CandidateDashboard["recentSessions"] = Array.isArray(recentRaw)
    ? recentRaw
        .map((s): CandidateDashboard["recentSessions"][number] | null => {
          if (!s || typeof s !== "object") return null;
          const r = s as Record<string, unknown>;
          const id = toNullableString(r.id) ?? toNullableString(r._id);
          if (!id) return null;
          return {
            id,
            scheduledAt: toNullableString(r.scheduledAt),
            interviewerId: toNullableString(r.interviewerId),
            overallScore: toNumber(r.overallScore) ?? 0,
            status: toNullableString(r.status) ?? "scheduled",
          };
        })
        .filter((x): x is CandidateDashboard["recentSessions"][number] => x !== null)
    : [];

  return { motivation, performance, trend, weakestSection, recentSessions };
}

function motivationFor(score: number | null): { title: string; body: string } {
  if (score === null) {
    return {
      title: "Don’t let fear decide your career.",
      body: "Start with a baseline session. Mockomi will highlight what to improve next—clearly and calmly.",
    };
  }

  if (score < 60) {
    return {
      title: "Build your foundation with confidence.",
      body: "Focus on fundamentals and repeat consistent sessions. Small wins compound fast when you measure them.",
    };
  }

  if (score <= 75) {
    return {
      title: "You’re gaining momentum—keep going.",
      body: "You’re past the baseline. Refine one weakness per week and let the trend do the rest.",
    };
  }

  return {
    title: "You’re interview-ready—polish the edge.",
    body: "Your readiness is strong. Now optimize communication and trade-offs to stand out under pressure.",
  };
}

function ArrowIcon({ direction }: { direction: "up" | "down" | "flat" }) {
  const rotation = direction === "up" ? "-rotate-45" : direction === "down" ? "rotate-45" : "rotate-0";
  return (
    <span className={cx("inline-flex h-5 w-5 items-center justify-center", rotation)} aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
        <path
          d="M4 10h10M11 5l5 5-5 5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const hasMounted = useHasMounted();

  const { email, role } = useMemo(() => {
    const u = (user ?? {}) as UserLike;
    const emailValue = typeof u.email === "string" ? u.email : "—";
    const roleValue = typeof u.role === "string" ? u.role : "—";
    return { email: emailValue, role: roleValue };
  }, [user]);

  const [state, setState] = React.useState<DashboardState>({ status: "loading" });
  const [animatedScore, setAnimatedScore] = React.useState(0);

  const readinessScore = state.status === "ready" ? state.dashboard.performance.readinessScore : null;
  const motivation = useMemo(() => motivationFor(readinessScore), [readinessScore]);

  const trendDirection = useMemo<"up" | "down" | "flat">(() => {
    if (state.status !== "ready") return "flat";
    const d = state.dashboard.performance.improvementDelta;
    if (d > 0) return "up";
    if (d < 0) return "down";
    return "flat";
  }, [state]);

  useEffect(() => {
    mountedStore.setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await api.get("/api/candidate/dashboard");
        const dashboard = parseDashboard(res.data);
        if (cancelled) return;
        setState({ status: "ready", dashboard });
      } catch (err: unknown) {
        if (cancelled) return;
        setState({ status: "error", message: getErrorMessage(err) });
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!hasMounted) return;
    if (state.status !== "ready") return;

    const target = state.dashboard.performance.latestScore ?? 0;
    if (!Number.isFinite(target)) return;

    let rafId: number | null = null;
    const durationMs = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = target * eased;
      setAnimatedScore(next);
      if (t < 1) rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [hasMounted, state]);

  const chartData = useMemo(() => {
    if (state.status !== "ready") return [];
    return [...state.dashboard.trend]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((p) => ({ label: formatDate(p.date), score: p.score }));
  }, [state]);

  const recentSessions = useMemo(() => {
    if (state.status !== "ready") return [];
    return [...state.dashboard.recentSessions].sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return tb - ta;
    });
  }, [state]);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Candidate Dashboard</h1>
        <p className="text-sm text-[#4B5563]">
          Don’t let fear decide your career. Build momentum with measurable practice.
        </p>
      </div>

      {state.status === "loading" ? (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 text-sm">Loading dashboard…</div>
      ) : state.status === "error" ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          {state.message}
        </div>
      ) : (
        <>
          {/* Motivation banner */}
          <section
            className={cx(
              "rounded-3xl border border-[#FF9F1C]/15 bg-[#FF9F1C]/5 p-8 transition-opacity duration-700",
              hasMounted ? "opacity-100" : "opacity-0",
            )}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="text-sm font-semibold text-[#111827]">{motivation.title}</div>
                <p className="max-w-2xl text-sm leading-6 text-[#4B5563]">{motivation.body}</p>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4">
                <div className="text-xs text-[#4B5563]">Signed in as</div>
                <div className="mt-1 text-sm font-semibold">{email}</div>
                <div className="mt-1 text-xs text-[#4B5563]">
                  Role: <span className="font-medium text-[#111827]">{role}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Performance overview grid */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <div className="text-sm text-[#4B5563]">Readiness score</div>
              <div className="mt-2 flex items-end gap-3">
                <div className="text-4xl font-semibold tabular-nums">{Math.round(animatedScore)}</div>
                <div className="pb-1 text-sm text-[#4B5563]">/ 100</div>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-[#E5E7EB]">
                <div
                  className="h-2 rounded-full bg-[#FF9F1C] transition-[width] duration-700"
                  style={{
                    width: `${Math.min(100, Math.max(0, Math.round(animatedScore)))}%`,
                  }}
                />
              </div>
              <div className="mt-4 text-xs text-[#4B5563]">
                This is your current momentum indicator, based on recent session outcomes.
              </div>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-[#4B5563]">Tier</div>
                <span className="rounded-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-1 text-xs font-semibold text-[#111827]">
                  {state.dashboard.motivation.tier}
                </span>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-[#4B5563]">Growth delta</div>
                <div
                  className={cx(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                    trendDirection === "up"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : trendDirection === "down"
                        ? "border-red-200 bg-red-50 text-red-800"
                        : "border-yellow-200 bg-yellow-50 text-yellow-900",
                  )}
                >
                  <ArrowIcon direction={trendDirection} />
                  {`${state.dashboard.performance.improvementDelta > 0 ? "+" : ""}${state.dashboard.performance.improvementDelta.toFixed(1)}`}
                </div>
              </div>
              <div className="mt-4 text-sm text-[#4B5563]">{state.dashboard.motivation.message}</div>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <div className="text-sm text-[#4B5563]">Performance overview</div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                  <div className="text-xs text-[#4B5563]">Sessions</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">
                    {state.dashboard.performance.totalSessions}
                  </div>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                  <div className="text-xs text-[#4B5563]">Average</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">
                    {state.dashboard.performance.averageScore.toFixed(1)}
                  </div>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                  <div className="text-xs text-[#4B5563]">Latest</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">
                    {state.dashboard.performance.latestScore.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/candidate/discover"
                  className="rounded-md bg-[#FF9F1C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#F48C06]"
                >
                  Book your next session
                </Link>
                <Link
                  href="/candidate/progress"
                  className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#111827] transition-colors hover:bg-[#F3F4F6]"
                >
                  View full progress
                </Link>
              </div>
            </div>
          </section>

          {/* Score trend chart */}
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold">Score trend</h2>
                <p className="mt-1 text-sm text-[#4B5563]">Last 5 completed sessions.</p>
              </div>
              <div className="text-xs text-[#4B5563]">Saffron trend line</div>
            </div>

            <div className="mt-6 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#4B5563", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#4B5563", fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      borderColor: "#E5E7EB",
                      boxShadow: "0 10px 25px rgba(17,24,39,0.08)",
                    }}
                    labelStyle={{ color: "#111827", fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#FF9F1C"
                    strokeWidth={3}
                    dot={false}
                    isAnimationActive={hasMounted}
                    animationDuration={800}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Weakest section panel + Recent sessions */}
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 lg:col-span-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Weakest section</h2>
                  <p className="mt-1 text-sm text-[#4B5563]">Your highest-impact improvement lever.</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#FFF3E0]" aria-hidden="true" />
              </div>

              <div className="mt-5 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <div className="text-sm font-semibold">
                  {state.dashboard.weakestSection?.label ?? "—"}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-[#4B5563]">Current</div>
                    <div className="mt-1 font-semibold tabular-nums text-[#111827]">
                      {state.dashboard.weakestSection ? state.dashboard.weakestSection.rawScore : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#4B5563]">Weighted</div>
                    <div className="mt-1 font-semibold tabular-nums text-[#111827]">
                      {state.dashboard.weakestSection ? state.dashboard.weakestSection.weightedScore.toFixed(1) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#4B5563]">Tier</div>
                    <div className="mt-1 font-semibold text-[#111827]">
                      {state.dashboard.motivation.tier}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="mt-5 w-full rounded-md bg-[#FF9F1C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#F48C06]"
              >
                Improve this section
              </button>
              <p className="mt-3 text-xs text-[#4B5563]">
                Focus on one lever at a time. Consistency beats intensity.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 lg:col-span-2">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold">Recent sessions</h2>
                  <p className="mt-1 text-sm text-[#4B5563]">Your last 10 sessions and outcomes.</p>
                </div>
                <Link
                  href="/candidate/sessions"
                  className="text-sm font-medium text-[#FF9F1C] transition-colors hover:text-[#F48C06]"
                >
                  View all
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3">
                {recentSessions.length === 0 ? (
                  <div className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4 text-sm text-[#4B5563]">
                    No sessions yet. Book your first mock interview to get a baseline.
                  </div>
                ) : (
                  recentSessions.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl border border-[#E5E7EB] bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">{formatDate(s.scheduledAt)}</div>
                          <div className="text-sm text-[#4B5563]">
                            Interviewer: {s.interviewerId ? s.interviewerId.slice(0, 8) : "—"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-semibold tabular-nums">
                            {Number.isFinite(s.overallScore) ? `${Math.round(s.overallScore)}` : "—"}
                          </div>
                          <span
                            className={cx(
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                              statusBadgeClass(s.status),
                            )}
                          >
                            {s.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

