"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay before the reveal starts (seconds) */
  delay?: number;
  /** Direction the content enters from */
  from?: "bottom" | "left" | "right" | "scale";
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  from = "bottom",
}: ScrollRevealProps) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = wrapRef.current;
      if (!el) return;

      const fromVars: gsap.TweenVars = {
        opacity: 0,
        duration: 1,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      };

      if (from === "bottom") {
        fromVars.y = 48;
        fromVars.clipPath = "inset(100% 0% 0% 0%)";
        fromVars.duration = 1.1;
        fromVars.ease = "power4.out";
      } else if (from === "left") {
        fromVars.x = -60;
      } else if (from === "right") {
        fromVars.x = 60;
      } else if (from === "scale") {
        fromVars.scale = 0.88;
        fromVars.clipPath = "inset(8% 4% 8% 4% round 12px)";
        fromVars.duration = 1.2;
        fromVars.ease = "power3.out";
      }

      gsap.from(el, fromVars);
    },
    { scope: wrapRef, dependencies: [delay, from] }
  );

  return (
    <div ref={wrapRef} className={className}>
      {children}
    </div>
  );
}

/** Staggered reveal for a list of items */
export function StaggerReveal({
  children,
  className,
  stagger = 0.1,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = wrapRef.current;
      if (!el) return;

      gsap.from(el.children, {
        opacity: 0,
        y: 32,
        duration: 0.8,
        stagger,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: wrapRef, dependencies: [stagger] }
  );

  return (
    <div ref={wrapRef} className={className}>
      {children}
    </div>
  );
}

// Keep ScrollTrigger accessible for consumers
export { ScrollTrigger };
