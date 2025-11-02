// src/app/api/admin/clients/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
const TABLE = "clients";

function parseMaybeArrayField(val: any) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // not JSON — fallthrough
    }
  }
  return [];
}

function normalizeRow(row: Record<string, any>) {
  return {
    id: row.id,
    client_name: row.client_name ?? row.clientName ?? "",
    logo_url: row.logo_url ?? row.logoUrl ?? row.logo ?? "",
    blog_title: row.blog_title ?? row.blogTitle ?? row.title ?? "",
    blog_slug: row.blog_slug ?? row.blogSlug ?? row.slug ?? "",
    blog_body_html: row.blog_body_html ?? row.blogBodyHtml ?? row.body ?? "",
    blog_feature_image: row.blog_feature_image ?? row.blogFeatureImage ?? row.blog_feature_image_url ?? null,
    cta_text: row.cta_text ?? row.ctaText ?? "Read full blog",
    created_at: row.created_at ?? row.createdAt ?? null,
    images: parseMaybeArrayField(row.images),
    videos: parseMaybeArrayField(row.videos), // <- NEW: safe parsing of videos field
    body_data: row.body_data ?? row.bodyData ?? null,
    raw: row,
  };
}

export async function GET() {
  try {
    const resp = await supabaseAdmin.from(TABLE).select("*").order("created_at", { ascending: false });
    const error = (resp as any).error ?? null;
    const data = (resp as any).data ?? resp;

    if (error) {
      console.error("[GET /api/admin/clients] supabase error:", error);
      return NextResponse.json([], { status: 200 });
    }
    if (!Array.isArray(data)) {
      console.warn("[GET /api/admin/clients] unexpected data shape:", data);
      return NextResponse.json([], { status: 200 });
    }

    const rows = data.map(normalizeRow);
    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error("[GET /api/admin/clients] exception:", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Record<string, any>;

    const client_name = (payload.client_name ?? payload.clientName ?? "").toString().trim();
    const blog_title = (payload.blog_title ?? payload.blogTitle ?? "").toString().trim();
    const logo_url = (payload.logo_url ?? payload.logoUrl ?? "").toString().trim();

    if (!client_name || !blog_title) {
      return NextResponse.json({ error: "Missing required fields: client_name and blog_title are required." }, { status: 400 });
    }
    if (!logo_url) {
      return NextResponse.json({ error: "Missing required field: logo_url is required." }, { status: 400 });
    }

    const row: Record<string, any> = {
      client_name,
      logo_url,
      blog_title,
      blog_slug: payload.blog_slug ?? payload.blogSlug ?? blog_title.toLowerCase().replace(/\s+/g, "-"),
      cta_text: payload.cta_text ?? payload.ctaText ?? null,
      blog_body_html: payload.blog_body_html ?? payload.blogBodyHtml ?? null,
      blog_feature_image: payload.blog_feature_image ?? payload.blogFeatureImage ?? null,
      images: Array.isArray(payload.images) ? payload.images : ([] as string[]),
      videos: Array.isArray(payload.videos) ? payload.videos : ([] as string[]), // <- NEW: accept videos array
      body_data: payload.body_data ?? payload.bodyData ?? null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin.from(TABLE).insert([row]).select("*").single();

    if (error) {
      console.error("[POST /api/admin/clients] insert error:", error);
      return NextResponse.json({ error: error.message ?? "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, row: data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/admin/clients] exception:", err);
    return NextResponse.json({ error: err?.message ?? "server error" }, { status: 500 });
  }
}