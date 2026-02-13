"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MonitorPlay, UsersRound } from 'lucide-react';
import clsx from 'clsx';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/interviewers', label: 'Interviewers', icon: UsersRound },
  { href: '/sessions', label: 'Sessions', icon: MonitorPlay },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r border-white/5 bg-slate-950/70 px-5 py-8 text-sm text-slate-400 lg:flex">
      <div className="flex items-center gap-2 text-lg font-semibold text-white">
        <div className="h-10 w-10 rounded-2xl bg-saffron-500/20 text-saffron-300">•</div>
        Mockomi
      </div>
      <nav className="mt-10 space-y-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition-colors',
                active
                  ? 'bg-saffron-500/10 text-white'
                  : 'hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className={clsx('h-4 w-4', active ? 'text-saffron-300' : 'text-slate-500')} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/5 bg-slate-900/50 p-4 text-xs text-slate-400">
        <p className="font-semibold text-white">ChamCall Sessions</p>
        <p className="mt-1">Join via secure iframe with one-click tokens.</p>
      </div>
    </aside>
  );
}
