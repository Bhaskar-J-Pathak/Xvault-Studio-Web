import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/auth";
import DashboardShell from "./_components/dashboard-shell";
import PostHogIdentifier from "@/components/posthog-identifier";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/auth");

  const profile = await getProfile(user.id);

  return (
    <>
      <PostHogIdentifier userId={user.id} email={user.email ?? ""} plan={profile?.plan ?? "free"} />
      <DashboardShell
        profile={profile}
        email={user.email ?? ""}
        isBeta={process.env.BETA_MODE === "true"}
      >
        {children}
      </DashboardShell>
    </>
  );
}
