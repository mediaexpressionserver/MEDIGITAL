// src/lib/getClientsBlog2.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getClientsBlog2() {
  const { data, error } = await supabaseAdmin
    .from("clients_blog2")
    .select("*");

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}