"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function AccountSignOut() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className="text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50 transition-colors"
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
