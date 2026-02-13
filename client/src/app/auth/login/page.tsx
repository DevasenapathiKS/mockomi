"use client";

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/shared/Button';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, isAuthenticating } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(email, password);
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.4em] text-saffron-400">Access</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">Sign in to Mockomi</h1>
      <p className="mt-2 text-sm text-slate-400">
        Continue mastering interview readiness with guided sessions.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm text-slate-300">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white focus:border-saffron-400 focus:outline-none"
          />
        </label>
        <label className="block text-sm text-slate-300">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white focus:border-saffron-400 focus:outline-none"
          />
        </label>
        <Button type="submit" className="w-full" disabled={isAuthenticating}>
          {isAuthenticating ? 'Signing you in…' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-400">
        New here?{' '}
        <Link className="text-saffron-300" href="/auth/register">
          Create an account
        </Link>
      </p>
    </div>
  );
}
