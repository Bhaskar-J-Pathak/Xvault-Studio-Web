import Image from "next/image";
import Link from "next/link";
import { HomepageSectionLink } from "./HomepageSectionLink";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Story Scan", targetId: "story-scan" },
      { label: "Story model", targetId: "story-model" },
      { label: "Story Pulse", targetId: "story-pulse" },
      { label: "How it works", targetId: "how-it-works" },
      { label: "Pricing", targetId: "pricing" },
    ],
  },
  {
    title: "For writers",
    links: [
      { label: "Free continuity check", href: "/continuity-check" },
      { label: "Guides", href: "/guides" },
      { label: "Writing articles", href: "/blog" },
      { label: "Comparisons", href: "/compare" },
      { label: "Affiliates", href: "/affiliates" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Start free", href: "/auth?mode=signup&next=%2Fdashboard%3Fscan%3D1" },
      { label: "Sign in", href: "/auth" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
] as const;

const socials = [
  ["X", "https://x.com/a1siel"],
  ["Instagram", "https://www.instagram.com/a1siel"],
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#F4F0E8] px-6 pb-8 text-[#191714] lg:px-10">
      <div className="mx-auto max-w-[1280px] border-t border-[#191714]/15 pt-10 lg:pt-14">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <Link href="/" aria-label="Xvault Studio home" className="inline-flex items-center gap-3">
              <Image src="/XVault.svg" alt="" width={34} height={34} />
              <span className="font-display text-2xl tracking-[-0.035em]">Xvault Studio</span>
            </Link>

            <p className="mt-7 max-w-[460px] font-display text-[clamp(2.2rem,3.5vw,3.9rem)] leading-[1] tracking-[-0.045em]">
              A writing studio that remembers the manuscript.
            </p>
            <p className="mt-6 max-w-[430px] text-sm leading-7 text-[#191714]/68">
              Map the people, relationships, threads, and emotional movement already inside the draft, then keep that context beside you as the book grows.
            </p>

            <a
              href="mailto:hello@xvaultstudio.com"
              className="mt-8 inline-flex text-[10px] font-semibold uppercase tracking-[0.16em] underline decoration-[#A6402D]/50 underline-offset-8 transition-colors hover:text-[#A6402D]"
            >
              hello@xvaultstudio.com
            </a>
          </div>

          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-10 border-t border-[#191714]/15 pt-7 sm:grid-cols-3 lg:border-t-0 lg:pt-0">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-[#A6402D]">{column.title}</p>
                <ul className="mt-5 space-y-3.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {"targetId" in link ? (
                        <HomepageSectionLink targetId={link.targetId} className="text-sm text-[#191714]/68 transition-colors hover:text-[#191714]">
                          {link.label}
                        </HomepageSectionLink>
                      ) : (
                        <Link href={link.href} className="text-sm text-[#191714]/68 transition-colors hover:text-[#191714]">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 border-y border-[#191714]/15 py-6 lg:mt-20">
          <p className="overflow-hidden whitespace-nowrap font-display text-[clamp(3.4rem,10.7vw,9.6rem)] leading-[0.82] tracking-[-0.065em] text-[#191714]/92">
            Xvault Studio
          </p>
        </div>

        <div className="flex flex-col gap-5 pt-6 text-[10px] uppercase tracking-[0.12em] text-[#191714]/64 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>© {year} Xvault Studio</span>
            <span>Built for fiction writers</span>
          </div>
          <div className="flex items-center gap-5">
            {socials.map(([label, href]) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#A6402D]">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
