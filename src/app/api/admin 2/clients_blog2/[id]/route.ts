// src/app/api/admin/clients_blog2/[id]/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
const TABLE = "clients_blog2";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id in path" }, { status: 400 });

    const payload = (await req.json()) as Record<string, any>;
    const update: Record<string, any> = {};

    if (payload.client_name ?? payload.clientName) update.client_name = payload.client_name ?? payload.clientName;
    if (payload.logo_url ?? payload.logoUrl) update.logo_url = payload.logo_url ?? payload.logoUrl;
    if (payload.blog2_title ?? payload.blog2Title) update.blog2_title = payload.blog2_title ?? payload.blog2Title;
    if (payload.blog2_slug ?? payload.blog2Slug) update.blog2_slug = payload.blog2_slug ?? payload.blog2Slug;
    if (payload.blog2_body_html ?? payload.blog2BodyHtml) update.blog2_body_html = payload.blog2_body_html ?? payload.blog2BodyHtml;
    if (payload.blog2_feature_image ?? payload.blog2FeatureImage) update.blog2_feature_image = payload.blog2_feature_image ?? payload.blog2FeatureImage;
    if (payload.blog2_images !== undefined) update.blog2_images = Array.isArray(payload.blog2_images) ? payload.blog2_images : [];
    if (payload.blog2_videos !== undefined) update.blog2_videos = Array.isArray(payload.blog2_videos) ? payload.blog2_videos : [];

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.from(TABLE).update(update).eq("id", id).select("*").single();

    if (error) {
      console.error("[PATCH /api/admin/clients_blog2/[id]] update error:", error);
      return NextResponse.json({ error: error.message ?? "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, row: data }, { status: 200 });
  } catch (err: any) {
    console.error("[PATCH /api/admin/clients_blog2/[id]] exception:", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id in path" }, { status: 400 });

    const { data, error } = await supabaseAdmin.from(TABLE).delete().eq("id", id).select("*").single();

    if (error) {
      console.error("[DELETE /api/admin/clients_blog2/[id]] delete error:", error);
      return NextResponse.json({ error: error.message ?? "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, row: data }, { status: 200 });
  } catch (err: any) {
    console.error("[DELETE /api/admin/clients_blog2/[id]] exception:", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}