"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <Image src="/XVault.svg" alt="Xvault Studio" width={32} height={32} className="shrink-0" />
      <span className="font-display text-[1.05rem] tracking-tight text-stone-900">
        Xvault<span className="ml-1 text-stone-400">Studio</span>
      </span>
    </div>
  );
}

const navLinks = [
  { label: "Features",     href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ",          href: "#faq" },
];

const BEZ = [0.16, 1, 0.3, 1] as [number, number, number, number];

const desktopContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
};
const desktopItem = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: BEZ } },
};
const overlayContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const overlayItem = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: BEZ } },
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled ? "px-3 pt-3" : "px-4 pt-4 lg:px-6 lg:pt-5"
        }`}
      >
        <div
          className={`mx-auto flex max-w-[1380px] items-center justify-between rounded-full px-5 py-3 transition-all duration-300 lg:px-7 ${
            scrolled
              ? "border border-black/[0.08] bg-white/88 shadow-[0_4px_24px_rgba(0,0,0,0.07)] backdrop-blur-xl"
              : "border border-black/[0.06] bg-white/52 backdrop-blur-sm"
          }`}
        >
          {/* Logo */}
          <Link href="/"><Logo /></Link>

          {/* Desktop nav links */}
          <motion.div
            variants={desktopContainer}
            initial="hidden"
            animate="visible"
            className="hidden items-center gap-8 md:flex"
          >
            {navLinks.map((link) => (
              <motion.div key={link.href} variants={desktopItem}>
                <Link
                  href={link.href}
                  className="text-sm text-stone-500 transition-colors hover:text-stone-900"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Desktop right CTAs */}
          <motion.div
            variants={desktopContainer}
            initial="hidden"
            animate="visible"
            className="hidden items-center gap-3 md:flex"
          >
            <motion.div variants={desktopItem}>
              <Link
                href="/auth"
                className="text-sm text-stone-500 transition-colors hover:text-stone-900"
              >
                Sign in
              </Link>
            </motion.div>
            <motion.div variants={desktopItem}>
              <Link
                href="/auth?mode=signup"
                className="btn-shimmer inline-flex items-center rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
              >
                Start writing
              </Link>
            </motion.div>
          </motion.div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-stone-100 text-stone-600 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </nav>

      {/* Mobile fullscreen overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-[#FAFAF8]"
          >
            <div className="flex items-center justify-between px-6 pt-6">
              <Link href="/" onClick={() => setMenuOpen(false)}><Logo /></Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.08] bg-stone-100 text-stone-600"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <motion.nav
              variants={overlayContainer}
              initial="hidden"
              animate="visible"
              className="mt-16 flex flex-col gap-2 px-6"
            >
              {navLinks.map((link) => (
                <motion.div key={link.href} variants={overlayItem}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="menu-overlay-link block transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div variants={overlayItem} className="mt-6 border-t border-black/[0.08] pt-8">
                <div className="flex flex-col gap-5">
                  <Link
                    href="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="text-xl font-semibold text-stone-600 transition-colors hover:text-stone-900"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    onClick={() => setMenuOpen(false)}
                    className="btn-shimmer inline-flex w-fit items-center rounded-full bg-stone-900 px-6 py-3 text-base font-semibold text-white"
                  >
                    Start writing — free
                  </Link>
                </div>
              </motion.div>
            </motion.nav>

            <div className="absolute bottom-8 left-6 text-sm text-stone-400">
              The AI Story OS for Novelists
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
