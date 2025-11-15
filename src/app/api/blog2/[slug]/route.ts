// src/app/api/blog2/[slug]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const slug = String(params.slug ?? "").trim();
    if (!slug) return new NextResponse("Missing slug", { status: 400 });

    // Attempt direct lookup by blog2_slug
    const { data, error } = await supabaseAdmin
      .from("clients_blog2")
      .select("*")
      .eq("blog2_slug", slug)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[GET /api/blog2/[slug]] supabase error:", error);
      return new NextResponse("Not found", { status: 404 });
    }

    if (!data) {
      // fallback: try matching against other slug columns if you store under different field
      const fallback = await supabaseAdmin
        .from("clients_blog2")
        .select("*")
        .or(`blog_slug.eq.${slug},slug.eq.${slug}`)
        .limit(1)
        .maybeSingle();

      if (fallback.error) {
        console.error("[GET /api/blog2/[slug]] fallback error:", fallback.error);
        return new NextResponse("Not found", { status: 404 });
      }
      if (!fallback.data) {
        return new NextResponse("Not found", { status: 404 });
      }
      return NextResponse.json(fallback.data);
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[GET /api/blog2/[slug]] exception:", err);
    return new NextResponse("Not found", { status: 404 });
  }
}