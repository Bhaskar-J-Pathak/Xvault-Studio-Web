"use client";

import { SmoothScroll } from "@/components/SmoothScroll";

export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      {children}
    </SmoothScroll>
  );
}
