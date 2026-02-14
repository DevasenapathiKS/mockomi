"use client";

import axios from "axios";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/lib/api";

type UserLike = {
  email?: unknown;
  role?: unknown;
};

type Profile = {
  totalInterviews: number;
  earningsTotal: number;
  ratingAverage: number;
  totalRatings: number;
  currency: string;
};

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

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount}`;
  }
}

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

function parseProfile(data: unknown): Profile {
  const payload = safeEnvelope(data);
  if (!payload || typeof payload !== "object") {
    return { totalInterviews: 0, earningsTotal: 0, ratingAverage: 0, totalRatings: 0, currency: "INR" };
  }
  const obj = payload as Record<string, unknown>;
  return {
    totalInterviews: toNumber(obj.totalInterviews),
    earningsTotal: toNumber(obj.earningsTotal),
    ratingAverage: toNumber(obj.ratingAverage),
    totalRatings: toNumber(obj.totalRatings),
    currency: toCurrency(obj.currency),
  };
}

export default function InterviewerDashboardPage() {
  const { user } = useAuth();

  const { email, role } = useMemo(() => {
    const u = (user ?? {}) as UserLike;
    const emailValue = typeof u.email === "string" ? u.email : "—";
    const roleValue = typeof u.role === "string" ? u.role : "—";
    return { email: emailValue, role: roleValue };
  }, [user]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get("/api/interviewer/profile");
        const parsed = parseProfile(res.data);
        if (!mounted) return;
        setProfile(parsed);
      } catch (err: unknown) {
        if (!mounted) return;
        setError(getErrorMessage(err));
        setProfile(null);
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Interviewer Dashboard</h1>
        <p className="text-sm text-[#4B5563]">Manage slots, sessions, and performance.</p>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded border border-[#E5E7EB] bg-white p-4 lg:col-span-1">
          <div className="text-sm text-[#4B5563]">Signed in as</div>
          <div className="mt-1 font-semibold">{email}</div>
          <div className="mt-2 text-sm text-[#4B5563]">
            Role: <span className="font-medium text-[#111827]">{role}</span>
          </div>
        </div>

        <div className="rounded border border-[#E5E7EB] bg-white p-4 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold">Today’s focus</div>
              <div className="mt-1 text-sm text-[#4B5563]">
                Keep slots open, start on time, and submit scores quickly to improve match quality.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/interviewer/availability"
                className="rounded-md bg-[#FF9F1C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#F48C06]"
              >
                Manage slots
              </Link>
              <Link
                href="/interviewer/sessions"
                className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#111827] transition hover:bg-[#F3F4F6]"
              >
                View sessions
              </Link>
              <Link
                href="/interviewer/earnings"
                className="rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#111827] transition hover:bg-[#F3F4F6]"
              >
                Earnings
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded border border-[#E5E7EB] bg-white p-4">
          <div className="text-sm text-[#4B5563]">Earnings Total</div>
          <div className="mt-1 text-2xl font-semibold">
            {isLoading ? "—" : profile ? formatCurrency(profile.earningsTotal, profile.currency) : "—"}
          </div>
        </div>
        <div className="rounded border border-[#E5E7EB] bg-white p-4">
          <div className="text-sm text-[#4B5563]">Rating</div>
          <div className="mt-1 text-2xl font-semibold">
            {isLoading ? "—" : profile ? profile.ratingAverage.toFixed(1) : "—"}
          </div>
          <div className="mt-1 text-sm text-[#4B5563]">
            {isLoading ? " " : profile ? `${profile.totalRatings} ratings · ${profile.totalInterviews} interviews` : " "}
          </div>
        </div>
      </div>
    </div>
  );
}

