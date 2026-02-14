"use client";

import axios from "axios";
import React, { useMemo, useState } from "react";

import { api } from "@/src/lib/api";

type ApplyState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string };

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
    return "Failed to submit application.";
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "Failed to submit application.";
}

function parseTechStack(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function CandidateApplyInterviewerPage() {
  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<string>("2");
  const [primaryTechStack, setPrimaryTechStack] = useState("React, Node.js, TypeScript");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [state, setState] = useState<ApplyState>({ status: "idle" });

  const canSubmit = useMemo(() => {
    if (state.status === "submitting") return false;
    const years = Number(yearsOfExperience);
    if (!Number.isFinite(years) || years < 0) return false;
    if (bio.trim().length < 20) return false;
    if (parseTechStack(primaryTechStack).length === 0) return false;
    if (linkedinUrl.trim().length === 0) return false;
    return true;
  }, [bio, linkedinUrl, primaryTechStack, state.status, yearsOfExperience]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setState({ status: "submitting" });
    try {
      await api.post("/api/interviewer/apply", {
        bio: bio.trim(),
        yearsOfExperience: Number(yearsOfExperience),
        primaryTechStack: parseTechStack(primaryTechStack),
        linkedinUrl: linkedinUrl.trim(),
      });
      setState({ status: "success" });
    } catch (err: unknown) {
      setState({ status: "error", message: getErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Apply to become an interviewer</h1>
        <p className="text-sm text-[#4B5563]">
          Share a quick profile. Once verified, you’ll be able to create slots and get booked by candidates.
        </p>
      </div>

      {state.status === "error" ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{state.message}</div>
      ) : null}

      {state.status === "success" ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Application submitted. We’ll review it soon.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 space-y-5">
        <div className="space-y-2">
          <label htmlFor="bio" className="block text-sm font-medium">
            Short bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-28 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF9F1C] focus:ring-4 focus:ring-[#FF9F1C]/15"
            placeholder="Tell us what you interview for, what you optimize for, and how you help candidates improve."
            disabled={state.status === "submitting"}
            required
          />
          <div className="text-xs text-[#4B5563]">Aim for 2–4 sentences (min 20 characters).</div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="yoe" className="block text-sm font-medium">
              Years of experience
            </label>
            <input
              id="yoe"
              type="number"
              min={0}
              step={1}
              value={yearsOfExperience}
              onChange={(e) => setYearsOfExperience(e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF9F1C] focus:ring-4 focus:ring-[#FF9F1C]/15"
              disabled={state.status === "submitting"}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="linkedin" className="block text-sm font-medium">
              LinkedIn URL
            </label>
            <input
              id="linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF9F1C] focus:ring-4 focus:ring-[#FF9F1C]/15"
              placeholder="https://www.linkedin.com/in/your-handle"
              disabled={state.status === "submitting"}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="stack" className="block text-sm font-medium">
            Primary tech stack
          </label>
          <input
            id="stack"
            value={primaryTechStack}
            onChange={(e) => setPrimaryTechStack(e.target.value)}
            className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#FF9F1C] focus:ring-4 focus:ring-[#FF9F1C]/15"
            placeholder="React, Node.js, TypeScript"
            disabled={state.status === "submitting"}
            required
          />
          <div className="text-xs text-[#4B5563]">Comma-separated. Example: React, Node.js, TypeScript</div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center justify-center rounded-md bg-[#FF9F1C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#F48C06] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.status === "submitting" ? "Submitting..." : "Submit application"}
        </button>
      </form>
    </div>
  );
}

