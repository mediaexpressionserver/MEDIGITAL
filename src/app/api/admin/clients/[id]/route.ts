// src/app/api/admin/clients/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
const TABLE = "clients";

function parseArrayField(raw: any): any[] | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === "string") {
    const s = raw.trim();
    if (s === "") return [];
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {
      // not JSON — fall back to comma-split
      return s.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  if (typeof raw === "object") {
    try {
      // try common keys first
      if (Array.isArray((raw as any).urls)) return (raw as any).urls.filter(Boolean).map(String);
      if (Array.isArray((raw as any).files)) return (raw as any).files.filter(Boolean).map(String);
      return Object.values(raw).flat().filter(Boolean).map(String);
    } catch {}
    return [];
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

    // images (allow string/array/null)
    if (payload.images !== undefined) {
      const parsed = parseArrayField(payload.images);
      update.images = Array.isArray(parsed) ? parsed : [];
    }

    // videos (allow string/array/null) — explicit empty array will clear DB column
    if (payload.videos !== undefined) {
      const parsed = parseArrayField(payload.videos);
      update.videos = Array.isArray(parsed) ? parsed : [];
    }

    // --- blog2 fields ---
    if (payload.blog2_title ?? payload.blog2Title) update.blog2_title = payload.blog2_title ?? payload.blog2Title;
    if (payload.blog2_slug ?? payload.blog2Slug) update.blog2_slug = payload.blog2_slug ?? payload.blog2Slug;
    if (payload.blog2_body_html ?? payload.blog2BodyHtml) update.blog2_body_html = payload.blog2_body_html ?? payload.blog2BodyHtml;
    if (payload.blog2_feature_image ?? payload.blog2FeatureImage) update.blog2_feature_image = payload.blog2_feature_image ?? payload.blog2FeatureImage;

    if (payload.blog2_images !== undefined) {
      const parsed = parseArrayField(payload.blog2_images);
      update.blog2_images = Array.isArray(parsed) ? parsed : [];
    }
    if (payload.blog2_videos !== undefined) {
      const parsed = parseArrayField(payload.blog2_videos);
      update.blog2_videos = Array.isArray(parsed) ? parsed : [];
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