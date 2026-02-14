"use client";

import React from "react";

import { Reveal } from "@/src/components/Reveal";

type Testimonial = {
  name: string;
  role: string;
  content: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Arun S.",
    role: "Frontend Developer",
    content:
      "Mockomi changed how I face interviews. I stopped fearing questions and started understanding my gaps clearly.",
  },
  {
    name: "Priya K.",
    role: "Java Backend Developer",
    content:
      "Three different real-time HR perspectives helped me see patterns in my mistakes. I improved from 62% to 88% in two sessions.",
  },
  {
    name: "Rahul M.",
    role: "Full Stack Developer",
    content:
      "This platform made me realize interviews are a skill, not luck. The scoring and feedback system is incredibly practical.",
  },
];

export function Testimonials() {
  return (
    <section aria-label="Testimonials" className="bg-[#FF9F1C]/5 py-20">
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="text-center">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
              Real Growth Stories
            </h2>
          </Reveal>
          <Reveal delayMs={80}>
            <p className="mt-3 text-sm leading-6 text-[#4B5563]">
              Professionals who stopped letting fear decide their careers.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <Reveal key={t.name} delayMs={120 + idx * 70}>
              <article className="relative h-full rounded-2xl border border-[#E5E7EB] bg-white p-6 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl">
                <div
                  aria-hidden="true"
                  className="absolute left-5 top-4 text-5xl font-black leading-none text-[#FF9F1C]"
                >
                  “
                </div>

                <div className="pt-10">
                  <p className="text-sm leading-7 text-[#111827]">{t.content}</p>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-[#111827]">{t.name}</div>
                      <div className="text-sm text-[#4B5563]">{t.role}</div>
                    </div>

                    <div
                      className="h-9 w-9 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA]"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

