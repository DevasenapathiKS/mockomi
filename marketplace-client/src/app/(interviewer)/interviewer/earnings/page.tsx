"use client";

import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";

import { api } from "@/src/lib/api";

type EarningsProfile = {
  totalInterviews: number;
  earningsTotal: number;
  ratingAverage: number;
  totalRatings: number;
  currency: string;
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
    return "Failed to load earnings.";
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "Failed to load earnings.";
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

function toCurrency(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value : "INR";
}

function parseProfile(data: unknown): EarningsProfile {
  const payload = safeEnvelope(data);
  if (!payload || typeof payload !== "object") {
    return {
      totalInterviews: 0,
      earningsTotal: 0,
      ratingAverage: 0,
      totalRatings: 0,
      currency: "INR",
    };
  }

  const obj = payload as Record<string, unknown>;

  const totalInterviews = toNumber(
    obj.totalInterviews ?? obj.total_interviews ?? obj.interviewsCount ?? obj.totalSessions,
  );
  const earningsTotal = toNumber(
    obj.earningsTotal ?? obj.earnings_total ?? obj.totalEarnings ?? obj.earnings,
  );
  const ratingAverage = toNumber(obj.ratingAverage ?? obj.rating_average ?? obj.avgRating ?? obj.averageRating);
  const totalRatings = toNumber(obj.totalRatings ?? obj.total_ratings ?? obj.ratingsCount);
  const currency = toCurrency(obj.currency);

  return { totalInterviews, earningsTotal, ratingAverage, totalRatings, currency };
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

export default function InterviewerEarningsPage() {
  const [profile, setProfile] = useState<EarningsProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get("/api/interviewer/profile");
        const parsed = parseProfile(res.data);
        if (!isMounted) return;
        setProfile(parsed);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(getErrorMessage(err));
        setProfile(null);
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

  const cards = useMemo(() => {
    if (!profile) return [];
    return [
      { label: "Total Interviews", value: String(profile.totalInterviews) },
      { label: "Earnings Total", value: formatCurrency(profile.earningsTotal, profile.currency) },
      { label: "Rating Average", value: profile.ratingAverage.toFixed(1) },
      { label: "Total Ratings", value: String(profile.totalRatings) },
    ];
  }, [profile]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Earnings</h1>
        <p className="text-sm text-[#4B5563]">A quick snapshot of your performance and payouts.</p>
      </div>

      {isLoading ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">Loading earnings...</div>
      ) : error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : !profile ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">No profile data available.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.label} className="rounded-md border border-[#E5E7EB] bg-white p-4">
              <div className="text-sm text-[#4B5563]">{c.label}</div>
              <div className="mt-1 text-2xl font-semibold">{c.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

