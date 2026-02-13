"use client";

export function FullScreenLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-200">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-700 border-t-saffron-400" />
      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">{label}</p>
    </div>
  );
}
