"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { api } from "@/src/lib/api";

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
    return "Registration failed. Please try again.";
  }

  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "Registration failed. Please try again.";
}

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [intent, setIntent] = useState<"practice" | "apply_interviewer">("practice");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await api.post("/api/auth/register", { email, password });
      router.replace(intent === "apply_interviewer" ? "/candidate/apply-interviewer" : "/login");
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
              <div className="text-xs text-[#4B5563]">Create your account</div>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Get started</h1>
            <p className="text-sm text-[#4B5563]">Choose your intent and create your account.</p>
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
          <label className="block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 outline-none transition-shadow focus:ring-2 focus:ring-[#FF9F1C]/25"
            disabled={isLoading}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Intent</legend>
          <div className="space-y-2">
            <label
              className={[
                "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition-colors",
                intent === "practice"
                  ? "border-[#FF9F1C]/40 bg-[#FF9F1C]/5"
                  : "border-[#E5E7EB] bg-white hover:bg-[#F3F4F6]",
              ].join(" ")}
            >
              <input
                type="radio"
                name="intent"
                value="practice"
                checked={intent === "practice"}
                onChange={() => setIntent("practice")}
                disabled={isLoading}
                className="mt-1 h-4 w-4 accent-[#FF9F1C]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Practice interviews</span>
                <span className="block text-sm text-[#4B5563]">
                  Book mock interviews and improve your readiness score.
                </span>
              </span>
            </label>

            <label
              className={[
                "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition-colors",
                intent === "apply_interviewer"
                  ? "border-[#FF9F1C]/40 bg-[#FF9F1C]/5"
                  : "border-[#E5E7EB] bg-white hover:bg-[#F3F4F6]",
              ].join(" ")}
            >
              <input
                type="radio"
                name="intent"
                value="apply_interviewer"
                checked={intent === "apply_interviewer"}
                onChange={() => setIntent("apply_interviewer")}
                disabled={isLoading}
                className="mt-1 h-4 w-4 accent-[#FF9F1C]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Apply as interviewer</span>
                <span className="block text-sm text-[#4B5563]">
                  Submit your profile after sign-up (you’ll still register as a candidate).
                </span>
              </span>
            </label>
          </div>
        </fieldset>

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
          {isLoading ? "Creating account..." : "Create account"}
        </button>

        <div className="text-center text-sm text-[#4B5563]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#111827] hover:underline">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

