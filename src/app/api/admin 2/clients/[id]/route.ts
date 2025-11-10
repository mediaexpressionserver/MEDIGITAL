// src/app/api/admin/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
const TABLE = "clients";

function parseArrayField(raw: any): any[] | undefined {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw;
  if (raw === null) return [];
  if (typeof raw === "string") {
    const s = raw.trim();
    if (s === "") return [];
    // try JSON parse first
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON — fall back to comma-separated
      return s.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  // if object with values, flatten common shapes
  if (typeof raw === "object") {
    try {
      return Object.values(raw).flat().filter(Boolean);
    } catch {
      // final fallback
      return [];
    }
  }
  return [];
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id in path" }, { status: 400 });

    const payload = (await req.json()) as Record<string, any>;
    const update: Record<string, any> = {};

    // basic fields (accept either snake_case or camelCase)
    if (payload.client_name ?? payload.clientName) update.client_name = payload.client_name ?? payload.clientName;
    if (payload.logo_url ?? payload.logoUrl) update.logo_url = payload.logo_url ?? payload.logoUrl;
    if (payload.blog_title ?? payload.blogTitle) update.blog_title = payload.blog_title ?? payload.blogTitle;
    if (payload.blog_slug ?? payload.blogSlug) update.blog_slug = payload.blog_slug ?? payload.blogSlug;
    if (payload.cta_text ?? payload.ctaText) update.cta_text = payload.cta_text ?? payload.ctaText;
    if (payload.blog_body_html ?? payload.blogBodyHtml) update.blog_body_html = payload.blog_body_html ?? payload.blogBodyHtml;
    if (payload.blog_feature_image ?? payload.blogFeatureImage) update.blog_feature_image = payload.blog_feature_image ?? payload.blogFeatureImage;
    if (payload.body_data !== undefined) update.body_data = payload.body_data;

    // images (array/string)
    if (payload.images !== undefined) {
      const parsed = parseArrayField(payload.images);
      update.images = Array.isArray(parsed) ? parsed : [];
    }

    // videos (array/string) — allow empty array to clear videos
    if (payload.videos !== undefined) {
      const parsed = parseArrayField(payload.videos);
      update.videos = Array.isArray(parsed) ? parsed : [];
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[PATCH /api/admin/clients/[id]] update error:", error);
      return NextResponse.json({ error: error.message ?? "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, row: data }, { status: 200 });
  } catch (err: any) {
    console.error("[PATCH /api/admin/clients/[id]] exception:", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id in path" }, { status: 400 });

    const { data, error } = await supabaseAdmin.from(TABLE).delete().eq("id", id).select("*").single();

    if (error) {
      console.error("[DELETE /api/admin/clients/[id]] delete error:", error);
      return NextResponse.json({ error: error.message ?? "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, row: data }, { status: 200 });
  } catch (err: any) {
    console.error("[DELETE /api/admin/clients/[id]] exception:", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}