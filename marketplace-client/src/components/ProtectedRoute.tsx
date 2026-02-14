"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useSyncExternalStore } from "react";

import { useAuth } from "@/src/context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, isInitialized } = useAuth();
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!hasMounted) return;
    if (!isInitialized) return;
    if (token) return;

    router.replace("/login");
  }, [hasMounted, isInitialized, router, token]);

  if (!hasMounted) return null;
  if (!isInitialized) return null;
  if (!token) return null;

  return <>{children}</>;
}

