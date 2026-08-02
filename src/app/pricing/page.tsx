import { Metadata } from "next";
import Pricing from "../../components/landing/Pricing";
import AnnouncementBar from "@/components/landing/AnnouncementBar";
import { getUser } from "@/lib/auth";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | Xvault Studio",
  description: "Simple pricing for writers. Free during public beta.",
};

export default async function PricingPage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-[#F8F5FF]">
      <AnnouncementBar />
      {/* Top bar for logged-in users */}
      {user && (
        <div className="border-b border-violet-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <span className="text-sm text-violet-700">
              Signed in as <span className="font-medium">{user.email}</span>
            </span>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-violet-600 hover:text-violet-800 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      <Pricing />
    </div>
  );
}