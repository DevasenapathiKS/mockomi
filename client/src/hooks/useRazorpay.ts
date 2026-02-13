"use client";

import { useEffect, useState } from 'react';

export function useRazorpay() {
  const [isReady, setReady] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return Boolean(window.Razorpay);
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || isReady) {
      return;
    }

    let script: HTMLScriptElement | null = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setReady(true);
    };
    script.onerror = () => setError('Unable to load Razorpay. Please retry.');

    document.body.appendChild(script);

    return () => {
      if (script && document.body.contains(script)) {
        document.body.removeChild(script);
      }
      script = null;
    };
  }, [isReady]);

  return { isReady, error };
}
