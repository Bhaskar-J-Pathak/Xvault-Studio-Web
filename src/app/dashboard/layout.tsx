import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/auth";
import AppSidebar from "./_components/app-sidebar";

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
    <div className="flex h-screen bg-[#FAFAF8] overflow-hidden">
      <AppSidebar profile={profile} email={user.email ?? ""} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
