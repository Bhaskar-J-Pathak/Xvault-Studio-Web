"use client";

import { useEffect } from "react";

/**
 * Invisible component that runs once on dashboard mount.
 * If a referral code was stored in localStorage (from /auth?ref=CODE),
 * it calls /api/referral/link and clears the stored value.
 */
export default function ReferralLinker() {
  useEffect(() => {
    const code = localStorage.getItem("xv_ref");
    if (!code) return;

    localStorage.removeItem("xv_ref");

    fetch("/api/referral/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {
      // Silently ignore — non-critical path
    });
  }, []);

  return null;
}
