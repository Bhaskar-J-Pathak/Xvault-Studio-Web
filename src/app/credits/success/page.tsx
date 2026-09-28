"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

export default function CreditSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get("orderId");
  const paymentId = params.get("payment_id");
  const [state, setState] = useState<"checking" | "paid" | "pending">(() => orderId ? "checking" : "pending");
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let attempts = 0;
    async function check() {
      attempts += 1;
      try {
        const response = await fetch("/api/credits/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paymentId }),
        });
        const data = await response.json();
        if (cancelled) return;
        if (data.status === "paid") {
          setCredits(Number(data.credits ?? 0));
          setState("paid");
        } else if (attempts < 8) {
          window.setTimeout(check, 2000);
        } else setState("pending");
      } catch {
        if (attempts < 8) window.setTimeout(check, 2000);
        else if (!cancelled) setState("pending");
      }
    }
    check();
    return () => { cancelled = true; };
  }, [orderId, paymentId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F5FF] px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          {state === "paid" ? <Check size={30} /> : <Loader2 size={28} className={state === "checking" ? "animate-spin" : ""} />}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1A0A3C]">
          {state === "paid" ? `${credits} credits added` : state === "checking" ? "Adding your credits" : "Payment received"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-violet-700/70">
          {state === "paid"
            ? "Your top-up balance is ready and will be used after your included credits."
            : state === "checking"
              ? "We are confirming the payment now. This usually takes only a few seconds."
              : "Confirmation is taking longer than expected. Your order is safe and will appear in your account after the payment webhook arrives."}
        </p>
        <Link href="/credits" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-violet-600 px-6 text-sm font-semibold text-white hover:bg-violet-700">
          View credit balance
        </Link>
      </div>
    </main>
  );
}
