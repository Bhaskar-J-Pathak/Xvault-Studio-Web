import type { Metadata } from "next";
import ContinuityChecker from "./continuity-checker";

export const metadata: Metadata = {
  title: "Free Novel Continuity Checker",
  description: "Compare two chapter excerpts for character, relationship, knowledge, and physical-detail changes. Free, private, and no signup required.",
  alternates: { canonical: "https://xvault.dev/continuity-check" },
};

export const dynamic = "force-dynamic";

export default function ContinuityCheckPage() {
  const clinicOpen = new Date() <= new Date("2026-10-06T23:59:59-07:00");
  return <ContinuityChecker clinicOpen={clinicOpen} />;
}
