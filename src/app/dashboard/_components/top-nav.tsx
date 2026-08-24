"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, LogOut, User, Crown, Upload } from "lucide-react";
import { createClient, PLAN_LABELS } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";

interface Props {
  profile:        Profile | null;
  email:          string;
  isBeta:         boolean;
  theme:          "light" | "dark";
  onThemeToggle:  () => void;
  onImport:       () => void;
}

export default function TopNav({ profile, email, isBeta, theme, onThemeToggle, onImport }: Props) {
  const router   = useRouter();
  const dropRef  = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const planLabel = profile ? PLAN_LABELS[profile.plan] : "Free";
  const isFounder = profile?.is_lifetime === true;
  const isFree    = !profile || profile.plan === "free";
  const initial   = email ? email[0].toUpperCase() : "?";

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (!dropRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  async function signOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 shrink-0 h-[52px] flex items-center px-6 sm:px-10 border-b border-black/[0.06] dark:border-white/[0.05] bg-[#F5F4F2]/90 dark:bg-[#0E0C1B]/90 backdrop-blur-md">

      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 mr-auto select-none">
        <Image src="/XVault.svg" alt="" width={17} height={17} />
        <span className="font-semibold text-[13px] tracking-tight text-[#0F0F0F] dark:text-white/80">
          Xvault Studio
        </span>
      </Link>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5">

        {/* Upgrade — free users only, desktop */}
        {isFree && (
          <Link
            href="/pricing"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
          >
            <Crown size={11} />
            Upgrade
          </Link>
        )}

        {/* Import — desktop, not beta */}
        {!isBeta && (
          <button
            onClick={onImport}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-[#71717A] dark:text-white/35 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:text-[#0F0F0F] dark:hover:text-white/70 transition-colors"
          >
            <Upload size={12} />
            Import
          </button>
        )}

        {/* User button */}
        <div ref={dropRef} className="relative ml-1">
          <button
            onClick={() => setOpen(v => !v)}
            className={`w-[30px] h-[30px] flex items-center justify-center rounded-full text-[12px] font-semibold tracking-tight transition-all select-none ${
              open
                ? "bg-[#0F0F0F] dark:bg-white/90 text-white dark:text-[#0E0C1B]"
                : "bg-black/[0.09] dark:bg-white/[0.10] text-[#0F0F0F] dark:text-white/70 hover:bg-black/[0.14] dark:hover:bg-white/[0.16]"
            }`}
          >
            {initial}
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-[42px] w-[220px] bg-white dark:bg-[#17142C] rounded-2xl shadow-xl shadow-black/[0.13] dark:shadow-black/50 border border-black/[0.06] dark:border-white/[0.07] overflow-hidden z-50">

              {/* User info */}
              <div className="px-4 py-3.5 border-b border-black/[0.05] dark:border-white/[0.06]">
                <p className="text-[13px] font-medium text-[#0F0F0F] dark:text-white/80 truncate">{email}</p>
                {isFounder ? (
                  <p className="text-[11px] text-violet-500 dark:text-violet-400 font-medium mt-0.5">
                    Lifetime · ∞
                  </p>
                ) : (
                  <p className="text-[11px] text-[#A1A1AA] dark:text-white/30 mt-0.5">
                    {planLabel} plan
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="py-1.5">
                {/* Upgrade — shown in dropdown for mobile users */}
                {isFree && (
                  <Link
                    href="/pricing"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  >
                    <Crown size={13} strokeWidth={1.75} />
                    Upgrade plan
                  </Link>
                )}

                {/* Import — shown in dropdown for mobile users */}
                {!isBeta && (
                  <button
                    onClick={() => { onImport(); setOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#71717A] dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#0F0F0F] dark:hover:text-white/80 transition-colors"
                  >
                    <Upload size={13} strokeWidth={1.75} />
                    Import manuscript
                  </button>
                )}

                <button
                  onClick={() => { onThemeToggle(); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#71717A] dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#0F0F0F] dark:hover:text-white/80 transition-colors"
                >
                  {theme === "dark"
                    ? <Sun size={13} strokeWidth={1.75} />
                    : <Moon size={13} strokeWidth={1.75} />
                  }
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>

                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#71717A] dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] hover:text-[#0F0F0F] dark:hover:text-white/80 transition-colors"
                >
                  <User size={13} strokeWidth={1.75} />
                  Account
                </Link>
              </div>

              <div className="border-t border-black/[0.05] dark:border-white/[0.06] py-1.5">
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-[#EF4444] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={13} strokeWidth={1.75} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
