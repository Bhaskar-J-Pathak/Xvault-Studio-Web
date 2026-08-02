"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, User, LogOut, Zap, Crown, Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { isInTrial, trialDaysLeft, PLAN_LABELS } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import { useTheme } from "./dashboard-shell";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account",   label: "Account",   icon: User },
];

interface Props {
  profile: Profile | null;
  email: string;
}

export default function AppSidebar({ profile, email }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const { theme, toggle } = useTheme();

  const inTrial   = profile ? isInTrial(profile as Parameters<typeof isInTrial>[0]) : false;
  const daysLeft  = profile ? trialDaysLeft(profile as Parameters<typeof trialDaysLeft>[0]) : 0;
  const planLabel = profile ? PLAN_LABELS[profile.plan] : "Free";
  const isFree    = !profile || profile.plan === "free";
  const isFounder = profile?.is_lifetime === true;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside className="w-[216px] shrink-0 flex flex-col h-screen bg-white dark:bg-[#100E1D] border-r border-black/[0.06] dark:border-white/[0.06]">

      {/* Logo */}
      <div className="h-[52px] flex items-center px-4 border-b border-black/[0.04] dark:border-white/[0.04] shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/XVault.svg" alt="" width={20} height={20} />
          <span className="font-semibold text-[13px] tracking-tight text-[#0F0F0F] dark:text-[#EDEBF0]">
            Xvault Studio
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-colors ${
                active
                  ? "bg-[#0F0F0F] dark:bg-white/[0.09] text-white"
                  : "text-[#71717A] dark:text-white/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#0F0F0F] dark:hover:text-white/80"
              }`}
            >
              <Icon size={14} strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Founder's Circle card */}
      {isFounder && (
        <div className="px-2 mb-2">
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl px-3 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Crown size={11} fill="currentColor" className="text-yellow-300" />
              <span className="text-[10px] font-bold tracking-widest text-white/90 uppercase">
                Founder&apos;s Circle
              </span>
            </div>
            <p className="text-[11px] text-white/70 leading-snug">
              ✓ Lifetime member · Never expires
            </p>
          </div>
        </div>
      )}

      {/* Upgrade (free users only) */}
      {isFree && (
        <div className="px-2 mb-2">
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-[13px] font-medium py-2 rounded-xl transition-all"
          >
            <Crown size={13} />
            Upgrade
          </Link>
        </div>
      )}

      {/* Trial badge */}
      {inTrial && (
        <div className="px-2 mb-2">
          <div className="px-3 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/25 border border-violet-100 dark:border-violet-700/25">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap size={11} className="text-violet-600 dark:text-violet-400" fill="currentColor" />
              <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300">Trial active</span>
            </div>
            <p className="text-[11px] text-violet-600/70 dark:text-violet-400/70">
              {daysLeft}d left · Full access
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-black/[0.06] dark:border-white/[0.06] p-2 space-y-0.5 shrink-0">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] text-[#71717A] dark:text-white/40 hover:text-[#0F0F0F] dark:hover:text-white/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors"
        >
          {theme === "dark"
            ? <Sun size={14} strokeWidth={1.75} />
            : <Moon size={14} strokeWidth={1.75} />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {/* User row */}
        <div className="flex items-center gap-2 px-3 py-[7px]">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-[#0F0F0F] dark:text-[#EDEBF0] truncate leading-tight">
              {email}
            </p>
            {isFounder ? (
              <p className="text-[11px] text-violet-500 dark:text-violet-400 font-medium leading-tight mt-0.5">
                Lifetime · ∞
              </p>
            ) : (
              <p className="text-[11px] text-[#A1A1AA] dark:text-white/30 leading-tight mt-0.5">
                {planLabel} plan
              </p>
            )}
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="shrink-0 p-1.5 rounded-lg text-[#A1A1AA] dark:text-white/25 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={13} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </aside>
  );
}
