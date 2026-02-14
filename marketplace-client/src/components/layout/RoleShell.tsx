"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";

import { ProtectedRoute } from "@/src/components/ProtectedRoute";
import { useAuth, type AuthUser } from "@/src/context/AuthContext";

type NavItem = {
  href: string;
  label: string;
};

type RoleShellProps = {
  roleLabel: string;
  requiredRole?: "candidate" | "interviewer" | "admin";
  navItems: NavItem[];
  children: React.ReactNode;
};

type UserLike = {
  email?: unknown;
  role?: unknown;
};

function getUserEmail(user: AuthUser): string {
  if (!user || typeof user !== "object") return "—";
  const u = user as UserLike;
  return typeof u.email === "string" && u.email.trim().length > 0 ? u.email : "—";
}

function getUserRole(user: AuthUser): string | null {
  if (!user || typeof user !== "object") return null;
  const u = user as UserLike;
  return typeof u.role === "string" ? u.role : null;
}

function isActivePath(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

export function RoleShell({ roleLabel, requiredRole, navItems, children }: RoleShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, isInitialized, logout } = useAuth();

  const email = useMemo(() => getUserEmail(user), [user]);
  const role = useMemo(() => getUserRole(user), [user]);
  const roleMismatch =
    Boolean(requiredRole) && isInitialized && Boolean(token) && Boolean(role) && role !== requiredRole;

  useEffect(() => {
    if (!isInitialized) return;
    if (!token) return; // ProtectedRoute handles unauth redirect
    if (!requiredRole) return;

    if (role !== requiredRole) {
      router.replace("/login");
    }
  }, [isInitialized, requiredRole, role, router, token]);

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  if (roleMismatch) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-[#FAFAFA] text-[#111827]">
        <div className="flex min-h-screen">
          <aside className="w-60 shrink-0 bg-[#FFFFFF] border-r border-[#E5E7EB]">
            <div className="h-16 px-4 flex items-center border-b border-[#E5E7EB]">
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-tight">Mockomi</span>
                <span className="text-xs text-[#4B5563]">{roleLabel}</span>
              </div>
            </div>

            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#FFF3E0] text-[#111827]"
                        : "text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#111827]",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="h-16 bg-[#FFFFFF] border-b border-[#E5E7EB]">
              <div className="h-full mx-auto w-full max-w-6xl px-6 flex items-center justify-end gap-3">
                <div className="text-sm text-[#4B5563] truncate max-w-[50vw]">{email}</div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-md bg-[#FF9F1C] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#F48C06]"
                >
                  Logout
                </button>
              </div>
            </header>

            <main className="flex-1">
              <div className="mx-auto w-full max-w-6xl p-6">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

