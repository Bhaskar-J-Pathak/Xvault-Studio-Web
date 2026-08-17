import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliates | Xvault Studio",
  description: "Join the Xvault Studio affiliate program. Earn commission by recommending the AI writing studio for novelists.",
  alternates: { canonical: "https://xvault.dev/affiliates" },
  openGraph: {
    title: "Affiliates | Xvault Studio",
    description: "Join the Xvault Studio affiliate program. Earn commission by recommending the AI writing studio for novelists.",
    url: "https://xvault.dev/affiliates",
    type: "website",
  },
};

export default function AffiliatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
