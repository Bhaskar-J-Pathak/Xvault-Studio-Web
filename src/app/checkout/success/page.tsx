"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const ph = usePostHog();

  const status    = searchParams.get("status") ?? undefined;
  const orderId   = searchParams.get("orderId") ?? undefined;
  const paymentId = searchParams.get("payment_id") ?? undefined;

  const isSuccess = !status || status === "succeeded" || status === "success";

  useEffect(() => {
    if (isSuccess) {
      ph?.capture("upgrade_completed", { orderId, paymentId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {isSuccess ? "Payment successful!" : "Payment status"}
        </h1>

        <p className="text-violet-700/70 mb-6">
          {isSuccess
            ? "Thank you! Your account is being updated. It may take a moment to reflect."
            : "Something may have gone wrong. Please check your dashboard or contact support."}
        </p>

        {(orderId || paymentId) && (
          <div className="text-xs text-violet-400 mb-8 space-y-1 bg-violet-50 rounded-xl px-4 py-3">
            {orderId && <p>Order ID: {orderId}</p>}
            {paymentId && <p>Payment ID: {paymentId}</p>}
          </div>
        )}

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center bg-violet-600 text-white px-6 py-3 rounded-full font-medium hover:bg-violet-700 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
