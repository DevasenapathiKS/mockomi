"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { Testimonials } from "@/src/components/Testimonials";

type RevealOptions = {
  rootMargin?: string;
  threshold?: number | number[];
};

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function useStickyNavShadow(): boolean {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        setIsScrolled(window.scrollY > 8);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // Set initial state in a callback to avoid sync setState in effect body.
    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      setIsScrolled(window.scrollY > 8);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return isScrolled;
}

function useScrollReveal(options: RevealOptions = {}) {
  const { rootMargin = "0px 0px -10% 0px", threshold = 0.15 } = options;

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (elements.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.remove("opacity-0", "translate-y-2");
          el.classList.add("opacity-100", "translate-y-0");
          io.unobserve(el);
        }
      },
      { rootMargin, threshold },
    );

    for (const el of elements) io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold]);
}

function useInViewOnce<T extends Element>(
  options: IntersectionObserverInit = { threshold: 0.35 },
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isInView) return;

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        setIsInView(true);
        io.disconnect();
        break;
      }
    }, options);

    io.observe(el);
    return () => io.disconnect();
  }, [isInView, options]);

  return [ref, isInView];
}

function formatCompactNumber(value: number): string {
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  return String(Math.round(value));
}

function TrustCounter({
  label,
  target,
  suffix,
  decimals = 0,
}: {
  label: string;
  target: number;
  suffix?: string;
  decimals?: number;
}) {
  const [ref, isInView] = useInViewOnce<HTMLDivElement>({ threshold: 0.4 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const durationMs = 900;
    const start = performance.now();

    let rafId: number | null = null;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = target * eased;
      setValue(next);
      if (t < 1) rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [isInView, target]);

  const display = useMemo(() => {
    if (decimals > 0) return value.toFixed(decimals);
    return formatCompactNumber(value);
  }, [decimals, value]);

  return (
    <div
      ref={ref}
      className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="text-sm text-[#4B5563]">{label}</div>
      <div className="mt-2 text-3xl font-semibold tabular-nums">
        <span className="inline-block min-w-[6ch]">{display}</span>
        {suffix ? <span className="ml-0.5">{suffix}</span> : null}
      </div>
    </div>
  );
}

export default function Home() {
  const isScrolled = useStickyNavShadow();
  useScrollReveal();

  return (
    <div className="min-h-screen w-full bg-[#FAFAFA] text-[#111827]">
      <header
        className={cx(
          "sticky top-0 z-50 bg-white/75 backdrop-blur supports-[backdrop-filter]:bg-white/65 transition-shadow",
          isScrolled ? "shadow-sm" : "shadow-none",
        )}
      >
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="grid h-8 w-8 place-items-center rounded-lg bg-[#FF9F1C] shadow-sm"
                aria-hidden="true"
              >
                <span className="text-sm font-black text-white">M</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">Mockomi</div>
                <div className="text-[11px] text-[#4B5563] -mt-0.5">Premium mock interviews</div>
              </div>
            </div>

            <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
              <a
                href="#how-it-works"
                className="text-sm font-medium text-[#4B5563] transition-colors hover:text-[#111827]"
              >
                How it works
              </a>
              <a
                href="#outcomes"
                className="text-sm font-medium text-[#4B5563] transition-colors hover:text-[#111827]"
              >
                Outcomes
              </a>
              <a
                href="#differentiators"
                className="text-sm font-medium text-[#4B5563] transition-colors hover:text-[#111827]"
              >
                Differentiators
              </a>
              <a
                href="#trust"
                className="text-sm font-medium text-[#4B5563] transition-colors hover:text-[#111827]"
              >
                Trust
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#111827] transition-all hover:-translate-y-[1px] hover:bg-[#F3F4F6] hover:shadow-sm active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]/30"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-[#FF9F1C] px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-[1px] hover:bg-[#F48C06] hover:shadow-sm active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]/30"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
        <div className="border-b border-[#E5E7EB]" />
      </header>

      <main>
        {/* Hero */}
        <section aria-label="Hero" className="py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-xs font-medium text-[#4B5563]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF9F1C]" aria-hidden="true" />
                  Structured scoring • Progress tracking • Marketplace quality
                </div>

                <h1
                  data-reveal
                  className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl opacity-0 translate-y-2 transition-all duration-700"
                >
                  A premium mock interview platform that turns practice into{" "}
                  <span className="text-[#FF9F1C]">measurable progress</span>.
                </h1>
                <p
                  data-reveal
                  style={{ transitionDelay: "80ms" }}
                  className="mt-4 max-w-2xl text-base leading-7 text-[#4B5563] opacity-0 translate-y-2 transition-all duration-700"
                >
                  Book vetted interviewers, get section-level scores (0–10), and see exactly what to
                  fix next. Built for candidates, interviewers, and admins—cleanly and securely.
                </p>

                <div
                  data-reveal
                  style={{ transitionDelay: "140ms" }}
                  className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center opacity-0 translate-y-2 transition-all duration-700"
                >
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-md bg-[#FF9F1C] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-[1px] hover:bg-[#F48C06] hover:shadow-sm active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]/30"
                  >
                    Create your account
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition-all hover:-translate-y-[1px] hover:bg-[#F3F4F6] hover:shadow-sm active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]/30"
                  >
                    Sign in
                  </Link>
                </div>

                <div
                  data-reveal
                  style={{ transitionDelay: "200ms" }}
                  className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 opacity-0 translate-y-2 transition-all duration-700"
                >
                  {[
                    { k: "Section scores", v: "0–10" },
                    { k: "Progress trend", v: "Delta" },
                    { k: "Booking flow", v: "Fast" },
                  ].map((m) => (
                    <div key={m.k} className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-3">
                      <div className="text-xs text-[#4B5563]">{m.k}</div>
                      <div className="mt-0.5 text-sm font-semibold">{m.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5">
                <div
                  data-reveal
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-6 opacity-0 translate-y-2 transition-all duration-700 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">Executive-ready insights</div>
                      <p className="text-sm text-[#4B5563]">
                        Clear scores, clear next steps—no guesswork.
                      </p>
                    </div>
                    <div className="rounded-full bg-[#FFF3E0] px-3 py-1 text-xs font-medium text-[#111827]">
                      Improving
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {[
                      { k: "Average", v: "7.6" },
                      { k: "Latest", v: "8.4" },
                      { k: "Previous", v: "7.9" },
                      { k: "Delta", v: "+0.5" },
                    ].map((m) => (
                      <div key={m.k} className="rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                        <div className="text-xs text-[#4B5563]">{m.k}</div>
                        <div className="mt-1 text-xl font-semibold tabular-nums">{m.v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                    <div className="text-xs text-[#4B5563]">Next focus</div>
                    <div className="mt-1 text-sm font-medium">
                      Clarify constraints early, then communicate trade-offs with confidence.
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      { k: "Communication", v: 8.2 },
                      { k: "Problem-solving", v: 8.0 },
                      { k: "System design", v: 7.1 },
                    ].map((m) => (
                      <div key={m.k} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
                        <div className="text-[11px] text-[#4B5563]">{m.k}</div>
                        <div className="mt-1 text-sm font-semibold tabular-nums">{m.v.toFixed(1)}</div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-[#E5E7EB]">
                          <div
                            className="h-1.5 rounded-full bg-[#FF9F1C]"
                            style={{ width: `${Math.min(100, Math.max(0, (m.v / 10) * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
              <div data-reveal className="opacity-0 translate-y-2 transition-all duration-700">
                <div className="text-xs font-medium text-[#4B5563]">Designed for teams and individuals</div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-6">
                  {["Product", "Engineering", "Analytics", "Ops", "Talent", "Security"].map((name) => (
                    <div
                      key={name}
                      className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-center text-xs font-semibold text-[#4B5563]"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section aria-label="Problem" className="py-16">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h2
                  data-reveal
                  className="text-2xl font-semibold tracking-tight opacity-0 translate-y-2 transition-all duration-700"
                >
                  Turn “practice” into a system.
                </h2>
                <p
                  data-reveal
                  style={{ transitionDelay: "80ms" }}
                  className="mt-3 text-[#4B5563] leading-7 opacity-0 translate-y-2 transition-all duration-700"
                >
                  Most prep fails because it’s unmeasured and inconsistent. Mockomi introduces a
                  baseline, structured scoring, and an improvement loop that compounds over time.
                </p>
              </div>

              <div className="lg:col-span-7">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: "Before Mockomi",
                      items: [
                        "Unclear baseline and random practice",
                        "Feedback that’s hard to apply",
                        "No progress visibility across sessions",
                      ],
                      accent: "border-[#E5E7EB]",
                    },
                    {
                      title: "With Mockomi",
                      items: [
                        "Section scores (0–10) and a clear baseline",
                        "Actionable next-step focus after every session",
                        "Trends and deltas to verify improvement",
                      ],
                      accent: "border-[#FF9F1C]/30",
                    },
                  ].map((card) => (
                    <div
                      key={card.title}
                      data-reveal
                      className={cx(
                        "rounded-2xl border bg-white p-6 opacity-0 translate-y-2 transition-all duration-700 hover:-translate-y-0.5 hover:shadow-md",
                        card.accent,
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#FF9F1C]" aria-hidden="true" />
                        <div className="text-sm font-semibold">{card.title}</div>
                      </div>
                      <ul className="mt-4 space-y-2 text-sm text-[#4B5563]">
                        {card.items.map((t) => (
                          <li key={t} className="flex gap-2">
                            <span className="mt-2 h-1 w-1 rounded-full bg-[#4B5563]/40" aria-hidden="true" />
                            <span className="leading-6">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Outcomes */}
        <section id="outcomes" aria-label="Outcomes" className="py-16">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-6">
                <h2
                  data-reveal
                  className="text-2xl font-semibold tracking-tight opacity-0 translate-y-2 transition-all duration-700"
                >
                  Professional feedback, delivered like a product.
                </h2>
                <p
                  data-reveal
                  style={{ transitionDelay: "80ms" }}
                  className="mt-3 text-[#4B5563] leading-7 opacity-0 translate-y-2 transition-all duration-700"
                >
                  Every session results in a clear summary: tier, readiness score, and section-level
                  breakdown. Candidates know what to do next. Interviewers stay consistent. Admins
                  get platform health.
                </p>
              </div>
              <div className="lg:col-span-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: "Candidate",
                      body: "Discover interviewers, book slots, join sessions, track progress.",
                    },
                    {
                      title: "Interviewer",
                      body: "Manage availability, start sessions, submit scores with sections.",
                    },
                    {
                      title: "Admin",
                      body: "Monitor metrics, revenue, and flagged quality signals.",
                    },
                    {
                      title: "Trust layer",
                      body: "Ratings and totals keep quality visible and measurable.",
                    },
                  ].map((f) => (
                    <div
                      key={f.title}
                      data-reveal
                      className="rounded-2xl border border-[#E5E7EB] bg-white p-6 opacity-0 translate-y-2 transition-all duration-700 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{f.title}</div>
                        <div className="h-8 w-8 rounded-xl bg-[#FFF3E0]" aria-hidden="true" />
                      </div>
                      <p className="mt-2 text-sm text-[#4B5563] leading-6">{f.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" aria-label="How it works" className="py-16">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="flex flex-col gap-3">
              <h2 data-reveal className="text-2xl font-semibold tracking-tight opacity-0 translate-y-2 transition-all duration-700">
                How it works
              </h2>
              <p data-reveal style={{ transitionDelay: "80ms" }} className="text-[#4B5563] max-w-2xl opacity-0 translate-y-2 transition-all duration-700">
                A simple loop: practice, score, improve—repeat.
              </p>
            </div>

            <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Book a mock session",
                  body: "Choose an interviewer and a slot that matches your target role.",
                },
                {
                  step: "02",
                  title: "Get structured scoring",
                  body: "Sections scored 0–10 with clear strengths and gaps.",
                },
                {
                  step: "03",
                  title: "Track progress over time",
                  body: "See trends, deltas, and the next best action to focus on.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  data-reveal
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-6 opacity-0 translate-y-2 transition-all duration-700 hover:-translate-y-0.5 hover:bg-[#F3F4F6] hover:shadow-md"
                >
                  <div className="text-xs font-semibold text-[#FF9F1C]">{item.step}</div>
                  <div className="mt-2 text-sm font-semibold">{item.title}</div>
                  <p className="mt-2 text-sm text-[#4B5563] leading-6">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Differentiators */}
        <section id="differentiators" aria-label="Differentiators" className="py-16">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="flex flex-col gap-3">
              <h2 data-reveal className="text-2xl font-semibold tracking-tight opacity-0 translate-y-2 transition-all duration-700">
                Why Mockomi
              </h2>
              <p data-reveal style={{ transitionDelay: "80ms" }} className="text-[#4B5563] max-w-2xl opacity-0 translate-y-2 transition-all duration-700">
                Built like a product, not a spreadsheet—so everyone wins.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Role-based dashboards",
                  body: "Candidate, interviewer, and admin views—cleanly separated and focused.",
                },
                {
                  title: "Measurable progress",
                  body: "Average, latest, previous, delta, and growth trend in one place.",
                },
                {
                  title: "Quality controls",
                  body: "Flagging and metrics help keep the marketplace trusted.",
                },
                {
                  title: "Fast booking flow",
                  body: "Discover interviewers, view slots, and book with a streamlined checkout.",
                },
                {
                  title: "Structured scoring",
                  body: "Section-level scores (0–10) that turn feedback into action.",
                },
                {
                  title: "Modern SaaS UX",
                  body: "Light theme, subtle accents, and responsive layout—no clutter.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  data-reveal
                  className="rounded-2xl border border-[#E5E7EB] bg-white p-6 opacity-0 translate-y-2 transition-all duration-700 hover:-translate-y-0.5 hover:bg-[#F3F4F6] hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-9 w-9 rounded-xl bg-[#FFF3E0] border border-[#FF9F1C]/20" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-semibold">{item.title}</div>
                      <p className="mt-2 text-sm text-[#4B5563] leading-6">{item.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Testimonials />

        {/* Trust stats */}
        <section id="trust" aria-label="Trust stats" className="py-16">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div data-reveal className="rounded-2xl border border-[#E5E7EB] bg-white p-8 opacity-0 translate-y-2 transition-all duration-700 hover:shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight">Built for reliability</h2>
                  <p className="text-[#4B5563]">
                    Trust signals that matter for a marketplace.
                  </p>
                </div>
                <div className="text-sm font-medium text-[#4B5563]">
                  Subtle saffron accents. No heavy gradients.
                </div>
              </div>

              <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <dt className="sr-only">Avg rating</dt>
                  <dd>
                    <TrustCounter label="Avg rating" target={4.7} decimals={1} />
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Sessions completed</dt>
                  <dd>
                    <TrustCounter label="Sessions completed" target={10_000} suffix="+" />
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Response time</dt>
                  <dd>
                    <TrustCounter label="Response time (hours)" target={24} suffix="h" />
                  </dd>
                </div>
              </dl>

              <div className="mt-8 border-t border-[#E5E7EB] pt-6">
                <div className="text-xs font-medium text-[#4B5563]">Trusted by modern teams</div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {["Northstar", "Kite", "Relay", "Arc", "Field"].map((name) => (
                    <div
                      key={name}
                      className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-center text-xs font-semibold text-[#4B5563] transition-colors hover:bg-[#F3F4F6]"
                    >
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section aria-label="Final CTA" className="py-16">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div data-reveal className="rounded-2xl border border-[#E5E7EB] bg-white p-8 opacity-0 translate-y-2 transition-all duration-700 hover:shadow-md">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">Ready to get interview-ready?</h2>
                  <p className="text-[#4B5563] max-w-2xl">
                    Start with a baseline session, get structured feedback, and watch your readiness
                    climb.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-md bg-[#FF9F1C] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-[1px] hover:bg-[#F48C06] hover:shadow-sm active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]/30"
                  >
                    Get started
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-[#111827] transition-all hover:-translate-y-[1px] hover:bg-[#F3F4F6] hover:shadow-sm active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF9F1C]/30"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
              <div className="mt-8 border-t border-[#E5E7EB] pt-6 text-sm text-[#4B5563]">
                <span className="font-semibold text-[#111827]">Mockomi</span> — premium mock interviews for measurable
                outcomes.
              </div>
            </div>
          </div>
        </section>

        <footer className="py-10">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="flex flex-col gap-6 border-t border-[#E5E7EB] pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#4B5563]">
                © Mockomi. All rights reserved.
              </div>
              <div className="flex items-center gap-4 text-sm">
                <a href="#how-it-works" className="text-[#4B5563] transition-colors hover:text-[#111827]">
                  How it works
                </a>
                <a href="#differentiators" className="text-[#4B5563] transition-colors hover:text-[#111827]">
                  Differentiators
                </a>
                <a href="#trust" className="text-[#4B5563] transition-colors hover:text-[#111827]">
                  Trust
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
