"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const ph = usePostHog();

  const status    = searchParams.get("status") ?? undefined;
  const orderId   = searchParams.get("orderId") ?? undefined;
  const paymentId = searchParams.get("payment_id") ?? undefined;

  const isSuccess = !status || status === "succeeded" || status === "success";
  const [activation, setActivation] = useState<"checking" | "active" | "pending" | "failed">(
    isSuccess && orderId ? "checking" : isSuccess ? "active" : "failed"
  );

  useEffect(() => {
    if (isSuccess) {
      ph?.capture("upgrade_completed", { orderId, paymentId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isSuccess || !orderId) return;
    let cancelled = false;
    let attempts = 0;

    async function checkActivation() {
      attempts += 1;
      try {
        const response = await fetch("/api/checkout/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paymentId }),
        });
        const data = await response.json() as { status?: string };
        if (cancelled) return;
        if (data.status === "paid") {
          setActivation("active");
          return;
        }
        if (attempts < 8) {
          window.setTimeout(checkActivation, 2000);
        } else {
          setActivation("pending");
        }
      } catch {
        if (!cancelled) setActivation(attempts < 8 ? "checking" : "pending");
        if (!cancelled && attempts < 8) window.setTimeout(checkActivation, 2000);
      }
    }

    checkActivation();
    return () => { cancelled = true; };
  }, [isSuccess, orderId, paymentId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F5FF]">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-6">
          {isSuccess ? (
            <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          )}
        </div>

        <h1 className="text-3xl font-light text-[#1A0A3C] mb-4">
          {activation === "active" ? "Your plan is active!" : isSuccess ? "Payment received" : "Payment status"}
        </h1>

        <p className="text-violet-700/70 mb-6">
          {activation === "active"
            ? "Your credits have been refreshed and the upgrade is now active on your account."
            : activation === "checking"
            ? "Payment succeeded. We are activating your account now."
            : isSuccess
            ? "Payment succeeded, but activation is taking longer than expected. Your order is safe; contact support if it does not appear shortly."
            : "Something may have gone wrong. Please check your dashboard or contact support."}
        </p>

        {(orderId || paymentId) && (
          <div className="text-xs text-violet-400 mb-8 space-y-1 bg-violet-50 rounded-xl px-4 py-3">
            {orderId && <p>Order ID: {orderId}</p>}
            {paymentId && <p>Payment ID: {paymentId}</p>}
          </div>
        )}

        <Link
          href={activation === "active" ? "/dashboard" : "/account"}
          className="inline-flex items-center justify-center bg-violet-600 text-white px-6 py-3 rounded-full font-medium hover:bg-violet-700 transition"
        >
          {activation === "active" ? "Go to Dashboard" : "Check account"}
        </Link>
      </div>
    </div>
  );
}
