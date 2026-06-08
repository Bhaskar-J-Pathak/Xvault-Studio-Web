"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, User, LogOut, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { isInTrial, trialDaysLeft, PLAN_LABELS } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";

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

  const inTrial    = profile ? isInTrial(profile as Parameters<typeof isInTrial>[0]) : false;
  const daysLeft   = profile ? trialDaysLeft(profile as Parameters<typeof trialDaysLeft>[0]) : 0;
  const planLabel  = profile ? PLAN_LABELS[profile.plan] : "Free";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-screen bg-white border-r border-black/[0.06]">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/XVault.svg" alt="" width={24} height={24} />
          <span className="font-semibold text-sm tracking-tight text-[#1A1A1A]">
            XVault Studio
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-[#1A1A1A] text-white"
                  : "text-[#1A1A1A]/60 hover:bg-black/[0.04] hover:text-[#1A1A1A]"
              }`}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Trial badge */}
      {inTrial && (
        <div className="mx-3 mb-3 px-3 py-2.5 rounded-xl bg-violet-50 border border-violet-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap size={12} className="text-violet-600" fill="currentColor" />
            <span className="text-xs font-semibold text-violet-700">Trial active</span>
          </div>
          <p className="text-[11px] text-violet-600/80">
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining · Full access
          </p>
        </div>
      )}

      {/* User + sign out */}
      <div className="px-3 pb-4 pt-2 border-t border-black/[0.06]">
        <div className="px-3 py-2.5 rounded-lg">
          <p className="text-xs font-medium text-[#1A1A1A] truncate">{email}</p>
          <p className="text-[11px] text-[#1A1A1A]/45 mt-0.5">{planLabel} plan</p>
        </div>
        <button
          onClick={signOut}
          className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#1A1A1A]/50 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={14} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
