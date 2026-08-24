import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/auth";
import DashboardShell from "@/app/dashboard/_components/dashboard-shell";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/auth");

  const profile = await getProfile(user.id);

  return (
    <DashboardShell
      profile={profile}
      email={user.email ?? ""}
      isBeta={process.env.BETA_MODE === "true"}
    >
      {children}
    </DashboardShell>
  );
}
