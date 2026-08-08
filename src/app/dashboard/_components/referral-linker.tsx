"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Invisible component that runs once on dashboard mount.
 * If a referral code was stored in localStorage (from /auth?ref=CODE or
 * manually entered on the auth page), it calls /api/referral/link which
 * links the referral and immediately awards credits to both parties.
 * Refreshes the page on success so the updated credit count is shown.
 */
export default function ReferralLinker() {
  const router = useRouter();

  useEffect(() => {
    const code = localStorage.getItem("xv_ref");
    if (!code) return;

    localStorage.removeItem("xv_ref");

    const controller = new AbortController();
    fetch("/api/referral/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          router.refresh();
        }
      })
      .catch(() => {
        // Non-critical — silently ignore
      });
    return () => controller.abort(new DOMException("unmounted", "AbortError"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
