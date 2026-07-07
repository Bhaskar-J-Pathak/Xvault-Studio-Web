"use client";

import Link from "next/link";
import Image from "next/image";

const NAV = [
  { label: "Features",     href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing",      href: "#pricing" },
  { label: "FAQ",          href: "#faq" },
  { label: "Sign up",      href: "/auth?mode=signup" },
  { label: "Privacy",      href: "/privacy" },
  { label: "Terms",        href: "/terms" },
];

const SOCIAL = [
  {
    label: "Twitter / X",
    href: "REPLACE_X_URL",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M12.6 1h2.5L9.6 6.9 16 15h-4.9l-3.9-5.1L2.5 15H0l5.8-6.6L0 1h5l3.5 4.6L12.6 1zm-.9 12.6h1.4L4.4 2.3H2.9l8.8 11.3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "REPLACE_INSTAGRAM_URL",
    icon: (
      <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1.4c2.1 0 2.4 0 3.2.05.8.04 1.2.17 1.5.28.37.14.64.32.92.6.28.28.46.55.6.92.11.3.24.7.28 1.5.04.8.05 1.1.05 3.2s0 2.4-.05 3.2c-.04.8-.17 1.2-.28 1.5-.14.37-.32.64-.6.92-.28.28-.55.46-.92.6-.3.11-.7.24-1.5.28-.8.04-1.1.05-3.2.05s-2.4 0-3.2-.05c-.8-.04-1.2-.17-1.5-.28a2.6 2.6 0 0 1-.92-.6 2.6 2.6 0 0 1-.6-.92c-.11-.3-.24-.7-.28-1.5C1.4 10.4 1.4 10.1 1.4 8s0-2.4.05-3.2c.04-.8.17-1.2.28-1.5.14-.37.32-.64.6-.92.28-.28.55-.46.92-.6.3-.11.7-.24 1.5-.28.8-.04 1.1-.05 3.2-.05ZM8 0C5.87 0 5.6.01 4.75.05c-.86.04-1.44.18-1.95.38a3.94 3.94 0 0 0-1.42.93c-.44.44-.72.9-.93 1.42C.25 3.3.11 3.89.07 4.75.01 5.6 0 5.87 0 8s.01 2.4.05 3.25c.04.86.18 1.44.38 1.95.2.52.48.98.93 1.42.44.44.9.72 1.42.93.51.2 1.1.34 1.95.38C5.6 15.99 5.87 16 8 16s2.4-.01 3.25-.05c.86-.04 1.44-.18 1.95-.38a3.94 3.94 0 0 0 1.42-.93c.44-.44.72-.9.93-1.42.2-.51.34-1.1.38-1.95.04-.85.05-1.12.05-3.25s-.01-2.4-.05-3.25c-.04-.86-.18-1.44-.38-1.95a3.94 3.94 0 0 0-.93-1.42 3.94 3.94 0 0 0-1.42-.93c-.51-.2-1.1-.34-1.95-.38C10.4.01 10.13 0 8 0Zm0 3.9a4.1 4.1 0 1 0 0 8.2A4.1 4.1 0 0 0 8 3.9Zm0 6.76a2.66 2.66 0 1 1 0-5.32 2.66 2.66 0 0 1 0 5.32Zm4.26-6.92a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0Z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#EDE8FF]">
      <div className="mx-auto max-w-[1080px] px-6 lg:px-10">

        {/* Top divider */}
        <div className="h-px bg-violet-300/30" />

        {/* Main row */}
        <div className="flex flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between">

          {/* Logo */}
          <Link href="/" className="inline-flex shrink-0 items-center gap-2">
            <Image src="/XVault.svg" alt="Xvault Studio" width={22} height={22} />
            <span className="font-display text-[0.9rem] tracking-tight text-[#1A0A3C]/60">
              Xvault<span className="ml-1 text-[#1A0A3C]/25">Studio</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-[0.78rem] text-violet-900/35 transition-colors duration-150 hover:text-violet-900/70"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Social */}
          <div className="flex shrink-0 items-center gap-2">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-300/40 text-violet-900/30 transition-all duration-150 hover:border-violet-400/60 hover:text-violet-900/65"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between border-t border-violet-200/30 py-4 text-[0.68rem] text-violet-900/25">
          <span>&copy; {year} Xvault Studio</span>
          <span>Made for writers.</span>
        </div>

      </div>
    </footer>
  );
}
