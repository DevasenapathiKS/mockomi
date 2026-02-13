"use client";

import { Shield, LogOut } from 'lucide-react';

import { Button } from '@/components/shared/Button';
import { useAuth } from '@/hooks/useAuth';

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-white/5 bg-slate-950/60 px-6 py-4 text-sm text-slate-300">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Interview readiness</p>
        <h1 className="text-lg font-semibold text-white">Welcome back{user ? `, ${user.email}` : ''}</h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
            <Shield className="h-4 w-4 text-saffron-300" />
            {user.role}
          </span>
        )}
        <Button type="button" variant="outline" className="gap-2" onClick={logout}>
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </div>
    </header>
  );
}
