"use client";

import { useEffect, useState } from 'react';

import { subscribeToLoading } from '@/lib/http';

export function GlobalLoadingBar() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToLoading(setIsActive);
    return unsubscribe;
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1">
      <div
        className={`h-full origin-left bg-gradient-to-r from-saffron-500 to-orange-400 transition-[transform,opacity] duration-300 ${isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}
      />
    </div>
  );
}
