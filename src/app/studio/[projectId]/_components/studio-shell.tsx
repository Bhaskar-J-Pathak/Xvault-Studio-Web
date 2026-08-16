"use client";

import { useState } from "react";
import StudioSidebar from "./studio-sidebar";

interface Chapter {
  id: string;
  title: string;
  word_count: number;
  position: number;
}

interface Props {
  projectId: string;
  projectTitle: string;
  initialChapters: Chapter[];
  children: React.ReactNode;
}

export default function StudioShell({
  projectId,
  projectTitle,
  initialChapters,
  children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-white">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <StudioSidebar
        projectId={projectId}
        projectTitle={projectTitle}
        initialChapters={initialChapters}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-12 shrink-0 border-b border-black/[0.06] bg-[#F7F6F4]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1 rounded-lg text-[#1A1A1A]/50 hover:bg-black/[0.05] transition-colors"
            aria-label="Open chapters"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="18" y2="18" />
            </svg>
          </button>
          <span className="text-[13px] font-semibold text-[#1A1A1A] truncate tracking-tight">
            {projectTitle}
          </span>
        </div>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
