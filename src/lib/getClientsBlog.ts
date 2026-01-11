// src/lib/getClientsBlog.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getClientsBlog() {
  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("*"); // or restrict fields if you want later

  if (error) {
    console.error("getClientsBlog error:", error);
    return [];
  }

  return data ?? [];
}