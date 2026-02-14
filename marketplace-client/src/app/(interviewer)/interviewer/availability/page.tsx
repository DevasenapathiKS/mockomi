"use client";

import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@/src/lib/api";

type SlotStatus = "available" | "booked" | "cancelled" | "expired" | (string & {});

type Slot = {
  id: string;
  startsAt: string | null;
  endsAt: string | null;
  status: SlotStatus;
  price: number | null;
};

const SLOTS_ENDPOINT = "/api/interviewer/slots";
const CREATE_SLOT_ENDPOINT = "/api/availability";

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

function parseSlots(data: unknown): Slot[] {
  const payload = safeEnvelope(data);

  const list: unknown =
    Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object"
        ? ((payload as { slots?: unknown }).slots ??
          (payload as { items?: unknown }).items ??
          (payload as { results?: unknown }).results)
        : null;

  if (!Array.isArray(list)) return [];

  return list
    .map((raw): Slot | null => {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;

      const id = typeof obj.id === "string" ? obj.id : typeof obj._id === "string" ? obj._id : "";
      if (!id) return null;

      const startsAt =
        toNullableString(obj.startsAt) ??
        toNullableString(obj.startTime) ??
        toNullableString(obj.start) ??
        null;

      const endsAt =
        toNullableString(obj.endsAt) ?? toNullableString(obj.endTime) ?? toNullableString(obj.end) ?? null;

      const status =
        typeof obj.status === "string" && obj.status.trim().length > 0 ? (obj.status as SlotStatus) : "available";

      const price = toNumber(obj.price);

      return { id, startsAt, endsAt, status, price };
    })
    .filter((s): s is Slot => s !== null);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function formatTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function statusBadgeClass(status: SlotStatus): string {
  const s = status.toLowerCase();
  if (s === "available") return "border-green-200 bg-green-50 text-green-800";
  if (s === "booked") return "border-blue-200 bg-blue-50 text-blue-800";
  if (s === "cancelled") return "border-red-200 bg-red-50 text-red-800";
  return "border-zinc-200 bg-zinc-50 text-zinc-800";
}

export default function InterviewerAvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState<string>("499");

  const [isCreating, setIsCreating] = useState(false);

  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => {
      const ta = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const tb = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      return tb - ta;
    });
  }, [slots]);

  const loadSlots = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(SLOTS_ENDPOINT);
      setSlots(parseSlots(res.data));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const canCreate = useMemo(() => {
    const p = Number(price);
    return date.length > 0 && time.length > 0 && Number.isFinite(p) && p > 0 && !isCreating;
  }, [date, isCreating, price, time]);

  const onCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreate) return;

    setIsCreating(true);
    setError(null);

    try {
      await api.post(CREATE_SLOT_ENDPOINT, {
        date,
        time,
        price: Number(price),
      });

      setDate("");
      setTime("");
      setPrice("499");
      await loadSlots();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Availability</h1>
        <p className="text-sm text-[#4B5563]">Create and manage your interview slots.</p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      <form onSubmit={onCreate} className="rounded-md border border-[#E5E7EB] bg-white p-4 space-y-4">
        <div className="text-sm font-medium">Create a slot</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="date">
              Date
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2"
              disabled={isCreating}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="time">
              Time
            </label>
            <input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2"
              disabled={isCreating}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="price">
              Price (₹)
            </label>
            <input
              id="price"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2"
              disabled={isCreating}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!canCreate}
          className="rounded-md bg-[#FF9F1C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#F48C06] disabled:opacity-60"
        >
          {isCreating ? "Creating..." : "Create slot"}
        </button>
      </form>

      <div className="rounded-md border border-[#E5E7EB] bg-white">
        <div className="border-b border-[#E5E7EB] px-4 py-3">
          <div className="text-sm font-medium">Your slots</div>
        </div>

        {isLoading ? (
          <div className="p-4 text-sm">Loading slots...</div>
        ) : sortedSlots.length === 0 ? (
          <div className="p-4 text-sm">No slots yet.</div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {sortedSlots.map((slot) => (
              <div key={slot.id} className="px-4 py-3">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <div className="text-[#4B5563]">Date</div>
                    <div className="font-medium">{formatDate(slot.startsAt)}</div>
                  </div>
                  <div>
                    <div className="text-[#4B5563]">Time</div>
                    <div className="font-medium">
                      {formatTime(slot.startsAt)}
                      {slot.endsAt ? ` – ${formatTime(slot.endsAt)}` : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#4B5563]">Status</div>
                    <span
                      className={[
                        "inline-flex items-center rounded border px-2 py-1 text-xs font-medium",
                        statusBadgeClass(slot.status),
                      ].join(" ")}
                    >
                      {slot.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-[#4B5563]">Price</div>
                    <div className="font-medium">{slot.price === null ? "—" : `₹${slot.price}`}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

