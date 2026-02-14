"use client";

import React, { useEffect, useState } from "react";

import { api } from "@/src/lib/api";

type TestState =
  | { status: "loading" }
  | { status: "connected"; payload: unknown }
  | { status: "failed"; message: string };

export default function TestBackendConnectionPage() {
  const [state, setState] = useState<TestState>({ status: "loading" });

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await api.get("/health");
        setState({ status: "connected", payload: response.data });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Request failed";
        setState({ status: "failed", message });
      }
    };

    void testConnection();
  }, []);

  return (
    <div className="p-4">
      {state.status === "loading" ? (
        <div>Testing backend connection...</div>
      ) : state.status === "connected" ? (
        <div>Connected. Check response in Network tab.</div>
      ) : (
        <div>Connection failed: {state.message}</div>
      )}
    </div>
  );
}

