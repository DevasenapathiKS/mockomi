"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { api } from "@/src/lib/api";

type RoleProfileSection = {
  id: string;
  label: string;
};

type SessionDetails = {
  id: string;
  sections: RoleProfileSection[];
};

type SectionScoreInput = {
  sectionId: string;
  rawScore: number;
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

function parseSectionsFromUnknown(value: unknown): RoleProfileSection[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((raw): RoleProfileSection | null => {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;

      const id =
        (typeof obj.id === "string" && obj.id) ||
        (typeof obj._id === "string" && obj._id) ||
        (typeof obj.sectionId === "string" && obj.sectionId) ||
        "";
      if (!id) return null;

      const label =
        toNullableString(obj.label) ?? toNullableString(obj.name) ?? toNullableString(obj.title) ?? "Section";

      return { id, label };
    })
    .filter((s): s is RoleProfileSection => s !== null);
}

function parseSessionDetails(data: unknown, sessionId: string): SessionDetails {
  const payload = safeEnvelope(data);
  if (!payload || typeof payload !== "object") {
    throw new Error("Unexpected session response.");
  }

  const obj = payload as Record<string, unknown>;

  const roleProfile = obj.roleProfile;
  const sections =
    (roleProfile && typeof roleProfile === "object"
      ? parseSectionsFromUnknown((roleProfile as { sections?: unknown }).sections)
      : []) || [];

  const fallbackSections =
    sections.length > 0
      ? sections
      : [
          ...parseSectionsFromUnknown(obj.roleProfileSections),
          ...parseSectionsFromUnknown(obj.sections),
        ];

  const unique = new Map<string, RoleProfileSection>();
  for (const s of fallbackSections) unique.set(s.id, s);

  const finalSections = [...unique.values()];
  if (finalSections.length === 0) {
    throw new Error("No role profile sections found for this session.");
  }

  return { id: sessionId, sections: finalSections };
}

function validateScore(raw: string): { ok: true; value: number } | { ok: false; message: string } {
  if (raw.trim().length === 0) return { ok: false, message: "Required" };
  const n = Number(raw);
  if (!Number.isFinite(n)) return { ok: false, message: "Must be a number" };
  if (n < 0 || n > 10) return { ok: false, message: "Must be between 0 and 10" };
  return { ok: true, value: n };
}

export default function InterviewerScorePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const sessionId = params.id;

  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/interviews/${encodeURIComponent(sessionId)}`);
        const parsed = parseSessionDetails(res.data, sessionId);
        if (!isMounted) return;
        setDetails(parsed);
        setScores((prev) => {
          const next: Record<string, string> = { ...prev };
          for (const s of parsed.sections) {
            if (next[s.id] === undefined) next[s.id] = "";
          }
          return next;
        });
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(getErrorMessage(err));
        setDetails(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  const sections = details?.sections ?? [];

  const canSubmit = useMemo(() => {
    if (!details) return false;
    if (isSubmitting) return false;
    return true;
  }, [details, isSubmitting]);

  const onChangeScore = (sectionId: string, value: string) => {
    setScores((s) => ({ ...s, [sectionId]: value }));
    setFieldErrors((e) => {
      if (!e[sectionId]) return e;
      const copy = { ...e };
      delete copy[sectionId];
      return copy;
    });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!details) return;
    if (!canSubmit) return;

    setError(null);

    const nextFieldErrors: Record<string, string> = {};
    const sectionScores: SectionScoreInput[] = [];

    for (const section of sections) {
      const raw = scores[section.id] ?? "";
      const validated = validateScore(raw);
      if (!validated.ok) {
        nextFieldErrors[section.id] = validated.message;
        continue;
      }
      sectionScores.push({ sectionId: section.id, rawScore: validated.value });
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      await api.post(`/api/sessions/${encodeURIComponent(sessionId)}/submit-score`, {
        sectionScores,
      });
      router.replace("/interviewer/sessions");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Submit Scores</h1>
        <p className="text-sm text-[#4B5563]">Score each section from 0 to 10.</p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">Loading session...</div>
      ) : !details ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">Session not found.</div>
      ) : (
        <form onSubmit={onSubmit} className="rounded-md border border-[#E5E7EB] bg-white p-4 space-y-4">
          <div className="space-y-3">
            {sections.map((section) => {
              const value = scores[section.id] ?? "";
              const fieldError = fieldErrors[section.id];
              const hasError = Boolean(fieldError);

              return (
                <div key={section.id} className="rounded-md border border-[#E5E7EB] p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">{section.label}</div>
                      <div className="text-xs text-[#4B5563]">Score 0–10</div>
                    </div>

                    <div className="w-full sm:w-40">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={1}
                        value={value}
                        onChange={(e) => onChangeScore(section.id, e.target.value)}
                        disabled={isSubmitting}
                        className={[
                          "w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm",
                          hasError ? "border-red-300" : "",
                        ].join(" ")}
                        aria-invalid={hasError}
                        required
                      />
                      {hasError ? <div className="mt-1 text-xs text-red-700">{fieldError}</div> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-[#FF9F1C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#F48C06] disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit scores"}
          </button>
        </form>
      )}
    </div>
  );
}

