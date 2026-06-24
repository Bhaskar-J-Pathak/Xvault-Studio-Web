"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

const LINKS = {
  Product: [
    { label: "Features",     href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "FAQ",          href: "#faq" },
  ],
  Writers: [
    { label: "Sign up",    href: "/auth?mode=signup" },
    { label: "Sign in",    href: "/auth" },
    { label: "Dashboard",  href: "/dashboard" },
  ],
  Legal: [
    { label: "Privacy Policy",   href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

const SOCIAL = [
  {
    label: "Twitter / X",
    href: "REPLACE_X_URL",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M12.6 1h2.5L9.6 6.9 16 15h-4.9l-3.9-5.1L2.5 15H0l5.8-6.6L0 1h5l3.5 4.6L12.6 1zm-.9 12.6h1.4L4.4 2.3H2.9l8.8 11.3z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "REPLACE_LINKEDIN_URL",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M3.6 5.2H1.1v8.5h2.5V5.2zM2.35 4.1a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9zm11.4 4.6c0-2.3-1.2-3.6-3.1-3.6-1 0-1.9.5-2.3 1.3V5.2H5.8v8.5h2.5v-4.6c0-1.1.6-1.8 1.6-1.8s1.5.6 1.5 1.8v4.6h2.5V8.7z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "REPLACE_INSTAGRAM_URL",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 1.4c2.1 0 2.4 0 3.2.05.8.04 1.2.17 1.5.28.37.14.64.32.92.6.28.28.46.55.6.92.11.3.24.7.28 1.5.04.8.05 1.1.05 3.2s0 2.4-.05 3.2c-.04.8-.17 1.2-.28 1.5-.14.37-.32.64-.6.92-.28.28-.55.46-.92.6-.3.11-.7.24-1.5.28-.8.04-1.1.05-3.2.05s-2.4 0-3.2-.05c-.8-.04-1.2-.17-1.5-.28a2.6 2.6 0 0 1-.92-.6 2.6 2.6 0 0 1-.6-.92c-.11-.3-.24-.7-.28-1.5C1.4 10.4 1.4 10.1 1.4 8s0-2.4.05-3.2c.04-.8.17-1.2.28-1.5.14-.37.32-.64.6-.92.28-.28.55-.46.92-.6.3-.11.7-.24 1.5-.28.8-.04 1.1-.05 3.2-.05ZM8 0C5.87 0 5.6.01 4.75.05c-.86.04-1.44.18-1.95.38a3.94 3.94 0 0 0-1.42.93c-.44.44-.72.9-.93 1.42C.25 3.3.11 3.89.07 4.75.01 5.6 0 5.87 0 8s.01 2.4.05 3.25c.04.86.18 1.44.38 1.95.2.52.48.98.93 1.42.44.44.9.72 1.42.93.51.2 1.1.34 1.95.38C5.6 15.99 5.87 16 8 16s2.4-.01 3.25-.05c.86-.04 1.44-.18 1.95-.38a3.94 3.94 0 0 0 1.42-.93c.44-.44.72-.9.93-1.42.2-.51.34-1.1.38-1.95.04-.85.05-1.12.05-3.25s-.01-2.4-.05-3.25c-.04-.86-.18-1.44-.38-1.95a3.94 3.94 0 0 0-.93-1.42 3.94 3.94 0 0 0-1.42-.93c-.51-.2-1.1-.34-1.95-.38C10.4.01 10.13 0 8 0Zm0 3.9a4.1 4.1 0 1 0 0 8.2A4.1 4.1 0 0 0 8 3.9Zm0 6.76a2.66 2.66 0 1 1 0-5.32 2.66 2.66 0 0 1 0 5.32Zm4.26-6.92a.96.96 0 1 1-1.92 0 .96.96 0 0 1 1.92 0Z" />
      </svg>
    ),
  },
];

export default function Footer() {
  const year  = new Date().getFullYear();
  const ref   = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <footer className="bg-white">

      {/* ── Main footer content ── */}
      <div ref={ref} className="mx-auto max-w-[1380px] px-6 pb-12 pt-20 lg:px-10">

        {/* Brand statement */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, ease }}
          className="mb-14 border-b border-black/[0.06] pb-14"
        >
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/XVault.svg" alt="Xvault Studio" width={32} height={32} className="shrink-0" />
            <span className="font-display text-[1.05rem] tracking-tight text-stone-900">
              Xvault<span className="ml-1 text-stone-400">Studio</span>
            </span>
          </Link>
          <p
            className="mt-5 font-display font-bold italic leading-[1.1] tracking-[-0.035em] text-stone-200"
            style={{ fontSize: "clamp(1.6rem,3.5vw,3rem)" }}
          >
            An AI co-author that reads
            <br className="hidden sm:block" /> your novel before it says a word.
          </p>
        </motion.div>

        {/* Columns */}
        <div className="grid gap-12 lg:grid-cols-[1.8fr_1fr_1fr_1fr] lg:gap-10">

          {/* Brand column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease }}
          >
            {/* Trust badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-stone-50 px-3.5 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[0.65rem] font-medium text-stone-500">
                Cloud-saved &middot; Your words, always safe
              </span>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.07] bg-stone-50 text-stone-400 transition-colors hover:border-black/12 hover:bg-stone-100 hover:text-stone-700"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </motion.div>

          {/* Link columns */}
          {(Object.entries(LINKS) as [string, { label: string; href: string }[]][]).map(
            ([group, links], gi) => (
              <motion.div
                key={group}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + gi * 0.07, duration: 0.65, ease }}
              >
                <h3 className="mb-5 text-[0.67rem] font-semibold uppercase tracking-[0.22em] text-stone-400">
                  {group}
                </h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.875rem] text-stone-500 transition-colors hover:text-stone-900"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          )}
        </div>

        {/* ── Bottom bar ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4, duration: 0.65 }}
          className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-black/[0.06] pt-8 sm:flex-row"
        >
          <div className="flex items-center gap-4 text-[0.75rem] text-stone-400">
            <span>&copy; {year} Xvault Studio</span>
            <span className="hidden sm:block">&middot;</span>
            <span className="hidden sm:block">Made by writers, for writers.</span>
          </div>
          <div className="flex items-center gap-1.5 text-[0.72rem] text-stone-400">
            <span>Built with</span>
            <span className="rounded-md border border-black/[0.07] bg-stone-50 px-2 py-0.5 font-mono text-[0.62rem] font-medium text-stone-500">
              Next.js
            </span>
            <span>+</span>
            <span className="rounded-md border border-black/[0.07] bg-stone-50 px-2 py-0.5 font-mono text-[0.62rem] font-medium text-stone-500">
              Supabase
            </span>
          </div>
        </motion.div>

      </div>
    </footer>
  );
}
