import Link from "next/link";
import { Coins, Crown } from "lucide-react";

export default function BillingNav({ active }: { active: "plans" | "credits" }) {
  return (
    <nav aria-label="Plans and credits" className="grid grid-cols-2 rounded-2xl border border-black/[0.07] bg-white p-1 dark:border-white/[0.08] dark:bg-[#161329]">
      <Link
        href="/pricing"
        aria-current={active === "plans" ? "page" : undefined}
        className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
          active === "plans"
            ? "bg-[#0F0F0F] text-white dark:bg-white dark:text-[#0E0C1B]"
            : "text-[#71717A] hover:bg-black/[0.04] hover:text-[#0F0F0F] dark:text-white/45 dark:hover:bg-white/[0.05] dark:hover:text-white/80"
        }`}
      >
        <Crown size={14} /> Plans
      </Link>
      <Link
        href="/credits"
        aria-current={active === "credits" ? "page" : undefined}
        className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors ${
          active === "credits"
            ? "bg-[#0F0F0F] text-white dark:bg-white dark:text-[#0E0C1B]"
            : "text-[#71717A] hover:bg-black/[0.04] hover:text-[#0F0F0F] dark:text-white/45 dark:hover:bg-white/[0.05] dark:hover:text-white/80"
        }`}
      >
        <Coins size={14} /> Credit store
      </Link>
    </nav>
  );
}
