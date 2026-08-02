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
      {/* suppressHydrationWarning prevents hydration mismatch when stored theme
          differs from the server-rendered "light" default */}
      <div
        suppressHydrationWarning
        className={`flex h-screen overflow-hidden ${
          theme === "dark" ? "dark bg-[#0E0C1B]" : "bg-[#F5F4F2]"
        }`}
      >
        <AppSidebar profile={profile} email={email} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </ThemeCtx.Provider>
  );
}
