"use client";

import { useRouter } from "next/navigation";
import React, { useMemo } from "react";

import { ProtectedRoute } from "@/src/components/ProtectedRoute";
import { useAuth } from "@/src/context/AuthContext";

type UserLike = {
  email?: unknown;
  role?: unknown;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const { email, role } = useMemo(() => {
    const u = (user ?? {}) as UserLike;
    const emailValue = typeof u.email === "string" ? u.email : "unknown";
    const roleValue = typeof u.role === "string" ? u.role : "unknown";
    return { email: emailValue, role: roleValue };
  }, [user]);

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="space-y-1">
            <p className="text-sm">
              Welcome, <span className="font-medium">{email}</span>
            </p>
            <p className="text-sm">
              Role: <span className="font-medium">{role}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded border px-3 py-2 font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}

