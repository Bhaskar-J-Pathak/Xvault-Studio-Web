import { notFound } from "next/navigation";
import { AFFILIATE_PROGRAM_ENABLED } from "@/lib/affiliate-config";

export default function AffiliatesLayout({ children }: { children: React.ReactNode }) {
  if (!AFFILIATE_PROGRAM_ENABLED) notFound();
  return children;
}
