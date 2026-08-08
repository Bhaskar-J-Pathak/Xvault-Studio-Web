"use client";

import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, rx: 0, ry: 0 });
  const hovering = useRef(false);

  useGSAP(() => {
    gsap.ticker.add(() => {
      const p = pos.current;
      // Ring lags behind cursor for a trailing feel
      p.rx += (p.x - p.rx) * 0.12;
      p.ry += (p.y - p.ry) * 0.12;
      gsap.set(dotRef.current, { x: p.x, y: p.y });
      gsap.set(ringRef.current, { x: p.rx, y: p.ry });
    });
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };

    const onEnterLink = () => {
      hovering.current = true;
      gsap.to(ringRef.current, {
        width: 56,
        height: 56,
        opacity: 0.6,
        duration: 0.4,
        ease: "power2.out",
      });
      gsap.to(dotRef.current, {
        scale: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const onLeaveLink = () => {
      hovering.current = false;
      gsap.to(ringRef.current, {
        width: 36,
        height: 36,
        opacity: 0.5,
        duration: 0.4,
        ease: "power2.out",
      });
      gsap.to(dotRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const onMouseDown = () => {
      gsap.to(ringRef.current, {
        scale: 0.75,
        duration: 0.15,
        ease: "power2.out",
      });
    };

    const onMouseUp = () => {
      gsap.to(ringRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "back.out(2)",
      });
    };

    // Attach to interactive elements
    const attachListeners = () => {
      const targets = document.querySelectorAll("a, button, [role='button'], input, textarea, select");
      targets.forEach((el) => {
        el.addEventListener("mouseenter", onEnterLink);
        el.addEventListener("mouseleave", onLeaveLink);
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    attachListeners();

    // Re-attach on DOM mutations (dynamic elements)
    const observer = new MutationObserver(attachListeners);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2"
        aria-hidden
        style={{ top: 0, left: 0 }}
      >
        <div className="h-2 w-2 rounded-full bg-violet-600" />
      </div>

      {/* Trailing ring */}
      <div
        ref={ringRef}
        className="pointer-events-none fixed z-[9998] -translate-x-1/2 -translate-y-1/2"
        aria-hidden
        style={{ top: 0, left: 0, width: 36, height: 36, opacity: 0.5 }}
      >
        <div
          className="h-full w-full rounded-full border border-violet-500 mix-blend-multiply"
          style={{ boxSizing: "border-box" }}
        />
      </div>
    </>
  );
}
