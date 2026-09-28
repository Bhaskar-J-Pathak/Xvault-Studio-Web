"use client";

import { useEffect } from "react";

/**
 * Invisible component that runs once on auth page mount.
 * If a referral code was stored in localStorage (from ?ref=CODE URL param),
 * it calls /api/referral/link and clears the stored value.
 */
export default function AuthLinker() {
  useEffect(() => {
    const code = localStorage.getItem("xv_ref");
    if (!code) return;

    const controller = new AbortController();
    fetch("/api/referral/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    }).then((response) => {
      if (response.ok) localStorage.removeItem("xv_ref");
    }).catch(() => {
      // Silently ignore — non-critical path
    });
    return () => controller.abort(new DOMException("unmounted", "AbortError"));
  }, []);

  return null;
}
