"use client";

import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";

import { api } from "@/src/lib/api";

type Metrics = {
  totalUsers: number;
  totalInterviewers: number;
  verifiedInterviewers: number;
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
};

type Revenue = {
  platformRevenueTotal: number;
  interviewerPayoutTotal: number;
  averageRating: number;
  currency: string;
};

type FlaggedInterviewer = {
  userId: string;
  ratingAverage: number;
  totalRatings: number;
  totalInterviews: number;
};

type AdminDashboardData = {
  metrics: Metrics;
  revenue: Revenue;
  flaggedInterviewers: FlaggedInterviewer[];
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
    return "Failed to load dashboard.";
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "Failed to load dashboard.";
}

function safeEnvelope(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const maybe = data as { data?: unknown };
  return maybe.data !== undefined ? maybe.data : data;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toStringId(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value : "—";
}

function toCurrency(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value : "INR";
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount}`;
  }
}

function parseDashboard(data: unknown): AdminDashboardData {
  const payload = safeEnvelope(data);
  if (!payload || typeof payload !== "object") {
    return {
      metrics: {
        totalUsers: 0,
        totalInterviewers: 0,
        verifiedInterviewers: 0,
        totalSessions: 0,
        completedSessions: 0,
        scheduledSessions: 0,
      },
      revenue: {
        platformRevenueTotal: 0,
        interviewerPayoutTotal: 0,
        averageRating: 0,
        currency: "INR",
      },
      flaggedInterviewers: [],
    };
  }

  const obj = payload as Record<string, unknown>;

  const metricsRaw =
    obj.metrics && typeof obj.metrics === "object" ? (obj.metrics as Record<string, unknown>) : obj;
  const revenueRaw =
    obj.revenue && typeof obj.revenue === "object" ? (obj.revenue as Record<string, unknown>) : obj;

  const metrics: Metrics = {
    totalUsers: toNumber(metricsRaw.totalUsers ?? metricsRaw.usersTotal ?? metricsRaw.total_users),
    totalInterviewers: toNumber(
      metricsRaw.totalInterviewers ?? metricsRaw.interviewersTotal ?? metricsRaw.total_interviewers,
    ),
    verifiedInterviewers: toNumber(
      metricsRaw.verifiedInterviewers ??
        metricsRaw.verifiedInterviewersTotal ??
        metricsRaw.verified_interviewers,
    ),
    totalSessions: toNumber(metricsRaw.totalSessions ?? metricsRaw.sessionsTotal ?? metricsRaw.total_sessions),
    completedSessions: toNumber(
      metricsRaw.completedSessions ?? metricsRaw.sessionsCompleted ?? metricsRaw.completed_sessions,
    ),
    scheduledSessions: toNumber(
      metricsRaw.scheduledSessions ?? metricsRaw.sessionsScheduled ?? metricsRaw.scheduled_sessions,
    ),
  };

  const currency = toCurrency(revenueRaw.currency);
  const revenue: Revenue = {
    platformRevenueTotal: toNumber(
      revenueRaw.platformRevenueTotal ?? revenueRaw.platformRevenue ?? revenueRaw.platform_revenue_total,
    ),
    interviewerPayoutTotal: toNumber(
      revenueRaw.interviewerPayoutTotal ?? revenueRaw.payoutTotal ?? revenueRaw.interviewer_payout_total,
    ),
    averageRating: toNumber(revenueRaw.averageRating ?? revenueRaw.avgRating ?? revenueRaw.average_rating),
    currency,
  };

  const flaggedRaw =
    obj.flaggedInterviewers ??
    obj.flagged_interviewers ??
    (obj.tables && typeof obj.tables === "object"
      ? (obj.tables as { flaggedInterviewers?: unknown }).flaggedInterviewers
      : undefined);

  const flaggedInterviewers: FlaggedInterviewer[] = Array.isArray(flaggedRaw)
    ? flaggedRaw
        .map((row): FlaggedInterviewer | null => {
          if (!row || typeof row !== "object") return null;
          const r = row as Record<string, unknown>;
          const userId = toStringId(r.userId ?? r.user_id ?? r.id ?? r._id);
          return {
            userId,
            ratingAverage: toNumber(r.ratingAverage ?? r.rating_average ?? r.avgRating),
            totalRatings: toNumber(r.totalRatings ?? r.total_ratings ?? r.ratingsCount),
            totalInterviews: toNumber(r.totalInterviews ?? r.total_interviews ?? r.interviewsCount),
          };
        })
        .filter((v): v is FlaggedInterviewer => v !== null)
    : [];

  return { metrics, revenue, flaggedInterviewers };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get("/api/admin/dashboard");
        const parsed = parseDashboard(res.data);
        if (!isMounted) return;
        setData(parsed);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(getErrorMessage(err));
        setData(null);
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

  const metricsCards = useMemo(() => {
    const m = data?.metrics;
    if (!m) return [];
    return [
      { label: "Total Users", value: m.totalUsers },
      { label: "Total Interviewers", value: m.totalInterviewers },
      { label: "Verified Interviewers", value: m.verifiedInterviewers },
      { label: "Total Sessions", value: m.totalSessions },
      { label: "Completed Sessions", value: m.completedSessions },
      { label: "Scheduled Sessions", value: m.scheduledSessions },
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-[#4B5563]">Platform health, revenue, and quality signals.</p>
      </div>

      {isLoading ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">Loading dashboard...</div>
      ) : error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : !data ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">No dashboard data available.</div>
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-[#4B5563]">Metrics</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {metricsCards.map((c) => (
                <div key={c.label} className="rounded-md border border-[#E5E7EB] bg-white p-4">
                  <div className="text-sm text-[#4B5563]">{c.label}</div>
                  <div className="mt-1 text-2xl font-semibold">{c.value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-[#4B5563]">Revenue</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-[#E5E7EB] bg-white p-4">
                <div className="text-sm text-[#4B5563]">Platform Revenue Total</div>
                <div className="mt-1 text-2xl font-semibold">
                  {formatCurrency(data.revenue.platformRevenueTotal, data.revenue.currency)}
                </div>
              </div>
              <div className="rounded-md border border-[#E5E7EB] bg-white p-4">
                <div className="text-sm text-[#4B5563]">Interviewer Payout Total</div>
                <div className="mt-1 text-2xl font-semibold">
                  {formatCurrency(data.revenue.interviewerPayoutTotal, data.revenue.currency)}
                </div>
              </div>
              <div className="rounded-md border border-[#E5E7EB] bg-white p-4">
                <div className="text-sm text-[#4B5563]">Average Rating</div>
                <div className="mt-1 text-2xl font-semibold">{data.revenue.averageRating.toFixed(1)}</div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold tracking-wide text-[#4B5563]">Flagged Interviewers</h2>

            {data.flaggedInterviewers.length === 0 ? (
              <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">No flagged interviewers.</div>
            ) : (
              <div className="rounded-md border border-[#E5E7EB] bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#FAFAFA]">
                      <tr className="text-left">
                        <th className="px-4 py-3 font-medium text-[#4B5563]">User ID</th>
                        <th className="px-4 py-3 font-medium text-[#4B5563]">Rating Avg</th>
                        <th className="px-4 py-3 font-medium text-[#4B5563]">Total Ratings</th>
                        <th className="px-4 py-3 font-medium text-[#4B5563]">Total Interviews</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {data.flaggedInterviewers.map((row) => {
                        const lowRating = row.ratingAverage < 3;
                        return (
                          <tr key={row.userId}>
                            <td className="px-4 py-3 font-medium">{row.userId}</td>
                            <td
                              className={[
                                "px-4 py-3",
                                lowRating ? "text-red-700 font-semibold" : "",
                              ].join(" ")}
                            >
                              {row.ratingAverage.toFixed(1)}
                            </td>
                            <td className="px-4 py-3">{row.totalRatings}</td>
                            <td className="px-4 py-3">{row.totalInterviews}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

