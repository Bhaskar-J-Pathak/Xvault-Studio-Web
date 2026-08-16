"use client";

import { createContext, useContext, useEffect, useState } from "react";
import AppSidebar from "./app-sidebar";
import type { Profile } from "@/lib/supabase";

type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

interface Props {
  profile: Profile | null;
  email: string;
  children: React.ReactNode;
}

export default function DashboardShell({ profile, email, children }: Props) {
  const [theme, setTheme] = useState<Theme>("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("xv-theme") as Theme | null;
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("xv-theme", next);
  };

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <div
        suppressHydrationWarning
        className={`flex h-[100dvh] overflow-hidden ${
          theme === "dark" ? "dark bg-[#0E0C1B]" : "bg-[#F5F4F2]"
        }`}
      >
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <AppSidebar
          profile={profile}
          email={email}
          isMobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center gap-3 px-4 h-12 shrink-0 border-b border-black/[0.06] dark:border-white/[0.06] bg-white dark:bg-[#100E1D]">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1 rounded-lg text-[#71717A] dark:text-white/40 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
              aria-label="Open menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="text-[13px] font-semibold text-[#0F0F0F] dark:text-[#EDEBF0] tracking-tight">
              Xvault Studio
            </span>
          </div>

          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
