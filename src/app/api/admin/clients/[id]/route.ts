// src/app/api/admin/clients_blog2/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
const TABLE = "clients_blog2"; // <- NEW table for Blog2

function parseMaybeArrayField(val: any): string[] {
  if (Array.isArray(val)) return val.filter(Boolean).map(String);
  if (val === null) return [];
  if (typeof val === "string" && val.trim() !== "") {
    const s = val.trim();
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {
      return s.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  if (typeof val === "object" && val !== null) {
    if (Array.isArray((val as any).urls)) return (val as any).urls.filter(Boolean).map(String);
    if (Array.isArray((val as any).files)) return (val as any).files.filter(Boolean).map(String);
    try {
      return Object.values(val).flat().filter(Boolean).map(String);
    } catch {}
  }
  return [];
}

function normalizeRow(row: Record<string, any>) {
  const images = parseMaybeArrayField(row.blog2_images ?? row.images ?? row.image_urls ?? null);
  const videos = parseMaybeArrayField(row.blog2_videos ?? row.videos ?? row.video_urls ?? null);
  const feature =
    row.blog2_feature_image ??
    row.blog2_feature_image_url ??
    row.blog2FeatureImage ??
    (images.length > 0 ? images[0] : null) ??
    null;

  return {
    id: row.id,
    client_name: row.client_name ?? row.clientName ?? "",
    logo_url: row.logo_url ?? row.logoUrl ?? row.logo ?? "",
    blog2_title: row.blog2_title ?? row.blog2Title ?? "",
    blog2_slug: row.blog2_slug ?? row.blog2Slug ?? "",
    blog2_body_html: row.blog2_body_html ?? row.blog2BodyHtml ?? row.blog_body_html ?? row.blogBodyHtml ?? "",
    blog2_feature_image: feature,
    blog2_images: images,
    blog2_videos: videos,
    created_at: row.created_at ?? row.createdAt ?? null,
    raw: row,
  };
}

export async function GET() {
  try {
    const resp = await supabaseAdmin.from(TABLE).select("*").order("created_at", { ascending: false });
    const error = (resp as any).error ?? null;
    const data = (resp as any).data ?? resp;

    if (error) {
      console.error("[GET /api/admin/clients_blog2] supabase error:", error);
      return NextResponse.json([], { status: 200 });
    }
    if (!Array.isArray(data)) {
      console.warn("[GET /api/admin/clients_blog2] unexpected data shape:", data);
      return NextResponse.json([], { status: 200 });
    }

    const rows = data.map(normalizeRow);
    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/admin/clients_blog2] exception:", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Record<string, any>;

    const client_name = (payload.client_name ?? payload.clientName ?? "").toString().trim();
    const blog2_title = (payload.blog2_title ?? payload.blog2Title ?? payload.blog_title ?? "").toString().trim();
    const logo_url = (payload.logo_url ?? payload.logoUrl ?? "").toString().trim();

    if (!client_name || !blog2_title) {
      return NextResponse.json({ error: "Missing required fields: client_name and blog2_title are required." }, { status: 400 });
    }
    if (!logo_url) {
      return NextResponse.json({ error: "Missing required field: logo_url is required." }, { status: 400 });
    }

    const row: Record<string, any> = {
      client_name,
      logo_url,
      blog2_title,
      blog2_slug: payload.blog2_slug ?? payload.blog2Slug ?? blog2_title.toLowerCase().replace(/\s+/g, "-"),
      blog2_body_html: payload.blog2_body_html ?? payload.blog2BodyHtml ?? "",
      blog2_feature_image: payload.blog2_feature_image ?? payload.blog2FeatureImage ?? null,
      blog2_images: Array.isArray(payload.blog2_images) ? payload.blog2_images : ([] as string[]),
      blog2_videos: Array.isArray(payload.blog2_videos) ? payload.blog2_videos : ([] as string[]),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from(TABLE).insert([row]).select("*").single();

    if (error) {
      console.error("[POST /api/admin/clients_blog2] insert error:", error);
      return NextResponse.json({ error: error.message ?? "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, row: data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admin/clients_blog2] exception:", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}

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
      console.error("[PATCH /api/admin/clients_blog2] update error:", error);
      return NextResponse.json({ error: error.message ?? "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, row: data }, { status: 200 });
  } catch (err: any) {
    console.error("[PATCH /api/admin/clients_blog2] exception:", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    if (!id) return NextResponse.json({ error: "Missing id in path" }, { status: 400 });

    const { data, error } = await supabaseAdmin.from(TABLE).delete().eq("id", id).select("*").single();

    if (error) {
      console.error("[DELETE /api/admin/clients_blog2] delete error:", error);
      return NextResponse.json({ error: error.message ?? "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, row: data }, { status: 200 });
  } catch (err: any) {
    console.error("[DELETE /api/admin/clients_blog2] exception:", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}