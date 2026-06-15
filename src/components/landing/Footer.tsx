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
    href: "#",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M12.6 1h2.5L9.6 6.9 16 15h-4.9l-3.9-5.1L2.5 15H0l5.8-6.6L0 1h5l3.5 4.6L12.6 1zm-.9 12.6h1.4L4.4 2.3H2.9l8.8 11.3z" />
      </svg>
    ),
  },
  {
    label: "Discord",
    href: "#",
    icon: (
      <svg width="17" height="13" viewBox="0 0 17 13" fill="currentColor" aria-hidden="true">
        <path d="M14.4 1C13.3.5 12.1.1 10.9 0c-.2.3-.4.7-.5 1-1.3-.2-2.6-.2-3.9 0C6.4.7 6.2.3 6 0 4.8.1 3.6.5 2.5 1 .4 4.2-.2 7.3.1 10.3c1.5 1 2.9 1.6 4.3 2 .4-.5.7-1 1-1.6-.5-.2-1-.4-1.5-.7l.4-.3c2.8 1.3 5.9 1.3 8.7 0 .1.1.3.2.4.3-.5.3-1 .5-1.5.7.3.6.6 1.1 1 1.6 1.4-.4 2.8-1 4.3-2 .4-3.5-.6-6.6-2.8-9.3zM5.7 8.5c-.8 0-1.5-.7-1.5-1.6s.7-1.6 1.5-1.6 1.5.7 1.5 1.6-.7 1.6-1.5 1.6zm5.5 0c-.8 0-1.5-.7-1.5-1.6s.7-1.6 1.5-1.6 1.5.7 1.5 1.6-.7 1.6-1.5 1.6z" />
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
            The AI Story OS for novelists,
            <br className="hidden sm:block" /> screenwriters &amp; long-form fiction authors.
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
