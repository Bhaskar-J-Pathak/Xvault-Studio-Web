"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ── Init ──────────────────────────────────────────────────────────────────────

if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    capture_pageview: false,      // we fire manually so we get the right URL
    capture_pageleave: true,      // track when users close/navigate away
    capture_dead_clicks: false,   // disable — avoids "failed to load script" error
    session_recording: { maskAllInputs: false }, // enable session recordings
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") ph.debug();
    },
  });
}

// ── Page-view tracker ─────────────────────────────────────────────────────────
// Fires on every client-side route change.

function PageViewTracker() {
  const pathname   = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph) return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PageViewTracker />
      {children}
    </PHProvider>
  );
}
