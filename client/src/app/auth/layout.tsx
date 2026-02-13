export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
        {children}
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.4em] text-slate-600">
        Interview readiness platform
      </p>
    </div>
  );
}
