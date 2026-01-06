"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // 🔒 Fully revoke the session (all devices/tabs)
    await supabase.auth.signOut({ scope: "global" });

    // 🔁 Hard reload to clear all client state and re-run middleware
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded bg-red-600 text-white text-sm hover:bg-red-700 transition"
    >
      Logout
    </button>
  );
}