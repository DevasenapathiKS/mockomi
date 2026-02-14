"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

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
    if (typeof error.message === "string" && error.message.trim().length > 0) return error.message;
    return "Failed to submit rating. Please try again.";
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "Failed to submit rating. Please try again.";
}

function clampRating(value: number): 1 | 2 | 3 | 4 | 5 | 0 {
  if (value <= 0) return 0;
  if (value >= 5) return 5;
  return value as 1 | 2 | 3 | 4;
}

export default function SessionRatePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const sessionId = params.id;

  const [rating, setRating] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => rating > 0 && !isSubmitting, [isSubmitting, rating]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.post(`/api/sessions/${encodeURIComponent(sessionId)}/rate`, {
        rating,
        comment: comment.trim(),
      });
      router.replace("/candidate/sessions");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Rate Interview</h1>
        <p className="text-sm text-[#4B5563]">Share feedback about your interview session.</p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      <form onSubmit={onSubmit} className="rounded-md border border-[#E5E7EB] bg-white p-4 space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Rating</div>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as const).map((n) => {
              const selected = rating >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(clampRating(n))}
                  disabled={isSubmitting}
                  aria-label={`${n} star`}
                  className={[
                    "h-10 w-10 rounded-md border border-[#E5E7EB] text-lg leading-none transition-colors disabled:opacity-60",
                    selected
                      ? "bg-[#111827] text-white"
                      : "bg-white text-[#111827] hover:bg-[#F3F4F6]",
                  ].join(" ")}
                >
                  ★
                </button>
              );
            })}
          </div>
          {rating === 0 ? (
            <p className="text-xs text-[#4B5563]">Select a rating to enable submission.</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="comment">
            Comment (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2"
            disabled={isSubmitting}
            placeholder="Add any notes you'd like to share..."
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-[#FF9F1C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#F48C06] disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit rating"}
        </button>
      </form>
    </div>
  );
}

