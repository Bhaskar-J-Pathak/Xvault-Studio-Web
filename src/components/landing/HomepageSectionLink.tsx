"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const STORAGE_KEY = "xvault-home-section";

export function HomepageSectionScrollRestorer() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;

    const targetId = window.sessionStorage.getItem(STORAGE_KEY);
    if (!targetId) return;
    window.sessionStorage.removeItem(STORAGE_KEY);

    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", "/");
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}

interface HomepageSectionLinkProps extends Omit<React.ComponentProps<typeof Link>, "href"> {
  targetId: string;
  onNavigate?: () => void;
}

export function HomepageSectionLink({ targetId, onNavigate, onClick, ...props }: HomepageSectionLinkProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Link
      {...props}
      href="/"
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        event.preventDefault();
        onNavigate?.();

        if (pathname === "/") {
          document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", "/");
          return;
        }

        window.sessionStorage.setItem(STORAGE_KEY, targetId);
        router.push("/");
      }}
    />
  );
}
