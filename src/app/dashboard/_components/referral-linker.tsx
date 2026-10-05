"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Invisible component that runs once on dashboard mount.
 * Claims either a referral code stored in localStorage or the secure
 * stored referral code, then links it for the ordinary credit reward.
 * Refreshes the page on success so account data stays current.
 */
export default function ReferralLinker() {
  const router = useRouter();

  useEffect(() => {
    const code = localStorage.getItem("xv_ref");

    const controller = new AbortController();
    fetch("/api/referral/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(code ? { code } : {}),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          if (code) localStorage.removeItem("xv_ref");
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
