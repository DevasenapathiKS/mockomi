"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { api } from "@/src/lib/api";

type Slot = {
  id: string;
  startsAt: string | null;
  endsAt: string | null;
  price: number | null;
};

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name?: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", cb: (payload: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
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
    return "Something went wrong.";
  }
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  return "Something went wrong.";
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function toNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function parseSlotsResponse(data: unknown): Slot[] {
  const payload =
    data && typeof data === "object" && "data" in data ? (data as { data?: unknown }).data : data;

  if (!Array.isArray(payload)) return [];

  return payload
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
        toNullableString(obj.endsAt) ??
        toNullableString(obj.endTime) ??
        toNullableString(obj.end) ??
        null;

      const price = toNumber(obj.price);

      return { id, startsAt, endsAt, price };
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

function safeEnvelope<T>(data: unknown): T | null {
  if (!data || typeof data !== "object") return null;
  const maybe = data as { data?: unknown };
  const payload = maybe.data !== undefined ? maybe.data : data;
  return payload as T;
}

type CreateOrderPayload = {
  key: string;
  amount: number;
  currency: string;
  orderId: string;
  name?: string;
  description?: string;
};

function parseCreateOrderResponse(data: unknown): CreateOrderPayload {
  const payload = safeEnvelope<Record<string, unknown>>(data);
  if (!payload) throw new Error("Unexpected create-order response.");

  const key = payload.key ?? payload.razorpayKey ?? payload.publicKey;
  const amount = payload.amount;
  const currency = payload.currency;
  const orderId = payload.orderId ?? payload.order_id ?? payload.razorpayOrderId;

  if (typeof key !== "string" || key.length === 0) {
    throw new Error("Payment configuration missing (Razorpay key).");
  }
  const amountNumber = toNumber(amount);
  if (amountNumber === null) throw new Error("Payment amount missing.");
  if (typeof currency !== "string" || currency.length === 0) throw new Error("Payment currency missing.");
  if (typeof orderId !== "string" || orderId.length === 0) throw new Error("Payment order id missing.");

  const name = typeof payload.name === "string" ? payload.name : undefined;
  const description = typeof payload.description === "string" ? payload.description : undefined;

  return { key, amount: amountNumber, currency, orderId, name, description };
}

type VerifyPayload = {
  slotId: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export default function CandidateInterviewerSlotsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const interviewerId = params.id;

  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingSlotId, setBookingSlotId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSlots = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/interviewers/${encodeURIComponent(interviewerId)}/slots`);
        const parsed = parseSlotsResponse(response.data);
        if (!isMounted) return;
        setSlots(parsed);
      } catch (err: unknown) {
        if (!isMounted) return;
        setError(getErrorMessage(err));
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void loadSlots();
    return () => {
      isMounted = false;
    };
  }, [interviewerId]);

  const sortedSlots = useMemo(() => {
    return [...slots].sort((a, b) => {
      const ta = a.startsAt ? new Date(a.startsAt).getTime() : 0;
      const tb = b.startsAt ? new Date(b.startsAt).getTime() : 0;
      return ta - tb;
    });
  }, [slots]);

  const onBook = async (slotId: string) => {
    if (bookingSlotId) return;

    setBookingSlotId(slotId);
    setError(null);

    try {
      const orderRes = await api.post("/api/payments/create-order", { slotId });
      const order = parseCreateOrderResponse(orderRes.data);

      if (!window.Razorpay) {
        throw new Error("Payment is not available. Please try again later.");
      }

      const options: RazorpayOptions = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        handler: async (rp: RazorpaySuccessResponse) => {
          try {
            const verifyBody: VerifyPayload = {
              slotId,
              razorpay_payment_id: rp.razorpay_payment_id,
              razorpay_order_id: rp.razorpay_order_id,
              razorpay_signature: rp.razorpay_signature,
            };
            await api.post("/api/payments/verify", verifyBody);
            router.replace("/candidate/sessions");
          } catch (verifyErr: unknown) {
            setError(getErrorMessage(verifyErr));
          } finally {
            setBookingSlotId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setBookingSlotId(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setBookingSlotId(null);
      });
      razorpay.open();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setBookingSlotId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Available Slots</h1>
        <p className="text-sm text-[#4B5563]">Pick a slot and complete payment to book.</p>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">Loading slots...</div>
      ) : sortedSlots.length === 0 ? (
        <div className="rounded border border-[#E5E7EB] bg-white p-4 text-sm">No available slots</div>
      ) : (
        <div className="space-y-4">
          {sortedSlots.map((slot) => (
            <div key={slot.id} className="rounded-md border border-[#E5E7EB] bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <div className="text-[#4B5563]">Slot date</div>
                    <div className="font-medium">{formatDate(slot.startsAt)}</div>
                  </div>
                  <div>
                    <div className="text-[#4B5563]">Slot time</div>
                    <div className="font-medium">
                      {formatTime(slot.startsAt)}
                      {slot.endsAt ? ` – ${formatTime(slot.endsAt)}` : ""}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#4B5563]">Price</div>
                    <div className="font-medium">{slot.price === null ? "—" : `₹${slot.price}`}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onBook(slot.id)}
                  disabled={bookingSlotId !== null}
                  className="rounded-md bg-[#FF9F1C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#F48C06] disabled:opacity-60"
                >
                  {bookingSlotId === slot.id ? "Processing..." : "Book Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

