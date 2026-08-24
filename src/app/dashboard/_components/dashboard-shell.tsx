"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Profile } from "@/lib/supabase";
import TopNav from "./top-nav";
import ImportModal from "./import-modal";

type Theme = "light" | "dark";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

interface Props {
  profile:  Profile | null;
  email:    string;
  isBeta?:  boolean;
  children: React.ReactNode;
}

export default function DashboardShell({ profile, email, isBeta = false, children }: Props) {
  const [theme,      setTheme]      = useState<Theme>("light");
  const [importOpen, setImportOpen] = useState(false);

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
        className={`flex flex-col h-[100dvh] overflow-hidden ${
          theme === "dark" ? "dark bg-[#0E0C1B]" : "bg-[#F5F4F2]"
        }`}
      >
        <TopNav
          profile={profile}
          email={email}
          isBeta={isBeta}
          theme={theme}
          onThemeToggle={toggle}
          onImport={() => setImportOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {importOpen && (
        <ImportModal onClose={() => setImportOpen(false)} />
      )}
    </ThemeCtx.Provider>
  );
}
