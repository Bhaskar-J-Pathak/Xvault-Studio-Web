import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProfile, getUser } from "@/lib/auth";
import CreditStore from "./_components/credit-store";

export default async function CreditsPage() {
  const user = await getUser();
  if (!user) redirect("/auth?next=/credits");
  const profile = await getProfile(user.id);
  if (!profile) redirect("/auth?next=/credits");

  return (
    <main className="min-h-screen bg-[#F5F4F2] px-6 py-10 dark:bg-[#0E0C1B] sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link href="/account" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#71717A] hover:text-violet-600 dark:text-white/45 dark:hover:text-violet-400">
          <ArrowLeft size={13} /> Back to account
        </Link>
        <div className="mb-8 mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Credit store</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1A1A1A] dark:text-white/90">Top up when you need more room</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#71717A] dark:text-white/45">
            Pay once for extra AI credits. Keep your current plan and features exactly as they are.
          </p>
        </div>
        <CreditStore balance={profile.topup_credits ?? 0} />
      </div>
    </main>
  );
}
