"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HomepageSectionLink, HomepageSectionScrollRestorer } from "./HomepageSectionLink";

const navLinks = [
  { label: "Product", targetId: "story-scan" },
  { label: "How it works", targetId: "how-it-works" },
  { label: "Pricing", targetId: "pricing" },
  { label: "Guides", href: "/guides" },
  { label: "Blog", href: "/blog" },
  { label: "Free check", href: "/continuity-check" },
] as const;

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <Image src="/XVault.svg" alt="" width={30} height={30} className="shrink-0" />
      <span className="font-display text-[1.05rem] tracking-[-0.02em] text-[#191714]">
        Xvault <span className="text-[#191714]/62">Studio</span>
      </span>
    </span>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <HomepageSectionScrollRestorer />
      <header className="fixed inset-x-0 top-0 z-40 border-b border-[#191714]/15 bg-[#F4F0E8]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 lg:px-0">
          <Link href="/" aria-label="Xvault Studio home">
            <Logo />
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              "targetId" in link ? (
                <HomepageSectionLink
                  key={link.label}
                  targetId={link.targetId}
                  className="text-[12px] font-medium text-[#191714]/70 transition-colors hover:text-[#191714] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A6402D]"
                >
                  {link.label}
                </HomepageSectionLink>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[12px] font-medium text-[#191714]/70 transition-colors hover:text-[#191714] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A6402D]"
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <Link
              href="/auth"
              className="text-[13px] font-semibold text-[#191714]/75 transition-colors hover:text-[#191714] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A6402D]"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup&next=%2Fdashboard%3Fscan%3D1"
              className="inline-flex min-h-10 items-center justify-center rounded-[2px] bg-[#A6402D] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#7F2F22] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A6402D]"
            >
              Start free
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex size-10 items-center justify-center border border-[#191714]/20 text-[#191714] transition-colors hover:border-[#191714]/50 lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div id="mobile-navigation" className="fixed inset-0 z-50 bg-[#F4F0E8] lg:hidden">
          <div className="flex h-[72px] items-center justify-between border-b border-[#191714]/15 px-6">
            <Link href="/" aria-label="Xvault Studio home" onClick={closeMenu}>
              <Logo />
            </Link>
            <button
              type="button"
              onClick={closeMenu}
              className="flex size-10 items-center justify-center border border-[#191714]/20 text-[#191714] transition-colors hover:border-[#191714]/50"
              aria-label="Close menu"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Mobile navigation" className="flex h-[calc(100%_-_72px)] flex-col px-6 pb-8 pt-10">
            <div className="border-t border-[#191714]/15">
              {navLinks.map((link, index) => (
                "targetId" in link ? (
                  <HomepageSectionLink
                    key={link.label}
                    targetId={link.targetId}
                    onNavigate={closeMenu}
                    className="grid grid-cols-[32px_1fr] items-center border-b border-[#191714]/15 py-5 font-display text-[2rem] leading-none tracking-[-0.035em] text-[#191714] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A6402D]"
                  >
                    <span className="font-mono text-[10px] text-[#A6402D]">0{index + 1}</span>
                    {link.label}
                  </HomepageSectionLink>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="grid grid-cols-[32px_1fr] items-center border-b border-[#191714]/15 py-5 font-display text-[2rem] leading-none tracking-[-0.035em] text-[#191714] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#A6402D]"
                  >
                    <span className="font-mono text-[10px] text-[#A6402D]">0{index + 1}</span>
                    {link.label}
                  </Link>
                )
              ))}
            </div>

            <div className="mt-auto grid gap-3 pt-10 sm:grid-cols-2">
              <Link
                href="/auth"
                onClick={closeMenu}
                className="inline-flex min-h-12 items-center justify-center border border-[#191714]/20 text-sm font-semibold text-[#191714]"
              >
                Sign in
              </Link>
              <Link
                href="/auth?mode=signup&next=%2Fdashboard%3Fscan%3D1"
                onClick={closeMenu}
                className="inline-flex min-h-12 items-center justify-center bg-[#A6402D] text-sm font-semibold text-white"
              >
                Start free
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
