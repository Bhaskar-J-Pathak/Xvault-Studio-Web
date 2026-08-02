import Link from "next/link";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const status = searchParams.status as string | undefined;
  const orderId = searchParams.orderId as string | undefined;
  const paymentId = searchParams.payment_id as string | undefined;

  const isSuccess = status === "succeeded" || status === "success";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F5FF]">
      <div className="text-center max-w-md px-6">
        <h1 className="text-3xl font-light text-[#1A0A3C] mb-4">
          {isSuccess ? "Payment successful!" : "Payment status"}
        </h1>

        <p className="text-violet-700/70 mb-6">
          {isSuccess
            ? "Thank you! Your account is being updated."
            : "Something may have gone wrong. Please check your dashboard."}
        </p>

        <div className="text-xs text-violet-500 mb-8 space-y-1">
          {orderId && <p>Order: {orderId}</p>}
          {paymentId && <p>Payment: {paymentId}</p>}
        </div>

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