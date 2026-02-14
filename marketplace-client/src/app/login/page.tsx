"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";

import { api } from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";

type LoginResponse = {
  token: string;
  user: Record<string, unknown> | null;
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
    if (typeof error.message === "string" && error.message.trim().length > 0) {
      return error.message;
    }
    return "Login failed. Please try again.";
  }

  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "Login failed. Please try again.";
}

function parseLoginResponse(data: unknown): LoginResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Unexpected login response.");
  }

  const maybeEnvelope = data as { data?: unknown; token?: unknown; user?: unknown };
  const payload =
    maybeEnvelope.data && typeof maybeEnvelope.data === "object" ? maybeEnvelope.data : data;

  const token = (payload as { token?: unknown }).token;
  const user = (payload as { user?: unknown }).user;

  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Login succeeded but token is missing.");
  }

  if (user === null || user === undefined) {
    return { token, user: null };
  }

  if (typeof user === "object") {
    return { token, user: user as Record<string, unknown> };
  }

  return { token, user: null };
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const nextParam = searchParams.get("next");
  const safeNext = useMemo(() => {
    if (!nextParam) return null;
    if (nextParam.startsWith("/")) return nextParam;
    return null;
  }, [nextParam]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/api/auth/login", { email, password });
      const parsed = parseLoginResponse(response.data);
      login(parsed.token, parsed.user);
      const role =
        parsed.user && typeof parsed.user === "object"
          ? (parsed.user as { role?: unknown }).role
          : undefined;

      const roleRoute =
        role === "candidate"
          ? "/candidate"
          : role === "interviewer"
            ? "/interviewer"
            : role === "admin"
              ? "/admin"
              : "/dashboard";

      const next =
        safeNext && (safeNext === roleRoute || safeNext.startsWith(`${roleRoute}/`))
          ? safeNext
          : null;

      router.replace(next ?? roleRoute);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA] p-6 text-[#111827]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#FF9F1C] shadow-sm" aria-hidden="true">
              <span className="text-sm font-black text-white">M</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight text-[#111827]">Mockomi</div>
              <div className="text-xs text-[#4B5563]">Welcome back</div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="text-sm text-[#4B5563]">Continue to your dashboard.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 outline-none transition-shadow focus:ring-2 focus:ring-[#FF9F1C]/25"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-xs font-medium text-[#4B5563] transition-colors hover:text-[#111827]"
              disabled={isLoading}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 outline-none transition-shadow focus:ring-2 focus:ring-[#FF9F1C]/25"
            disabled={isLoading}
          />
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-[#FF9F1C] px-3 py-2 font-semibold text-white transition-all hover:-translate-y-[1px] hover:bg-[#F48C06] hover:shadow-sm active:translate-y-0 disabled:opacity-60"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>

        <div className="text-center text-sm text-[#4B5563]">
          New to Mockomi?{" "}
          <Link href="/register" className="font-semibold text-[#111827] hover:underline">
            Create an account
          </Link>
        </div>
      </form>
    </div>
  );
}

