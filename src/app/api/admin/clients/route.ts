// src/app/api/admin/clients/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
const TABLE = "clients";

function parseMaybeArrayField(val: any): string[] {
  if (Array.isArray(val)) return val.filter(Boolean).map(String);
  if (val === null) return [];
  if (typeof val === "string" && val.trim() !== "") {
    const s = val.trim();
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {
      // not JSON — fallthrough to comma-split
      return s.split(",").map((x) => x.trim()).filter(Boolean);
    }
  }
  // if object with arrays inside, try to find common keys
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
  // primary/legacy fields
  const images = parseMaybeArrayField(row.images ?? row.image_urls ?? row.imageUrls ?? row.image ?? null);
  const videos = parseMaybeArrayField(row.videos ?? row.video_urls ?? row.videoUrls ?? row.video ?? null);

  // blog2-specific fields (separate columns)
  const blog2Images = parseMaybeArrayField(row.blog2_images ?? row.blog2_images_json ?? row.blog2Images ?? null);
  const blog2Videos = parseMaybeArrayField(row.blog2_videos ?? row.blog2_videos_json ?? row.blog2Videos ?? null);

  const blogFeature =
    row.blog_feature_image ??
    row.blog_feature_image_url ??
    row.blogFeatureImage ??
    row.blogFeatureImageUrl ??
    (images.length > 0 ? images[0] : null) ??
    null;

  const blog2Feature =
    row.blog2_feature_image ??
    row.blog2_feature_image_url ??
    row.blog2FeatureImage ??
    row.blog2FeatureImageUrl ??
    (blog2Images.length > 0 ? blog2Images[0] : null) ??
    null;

  return {
    id: row.id,
    client_name: row.client_name ?? row.clientName ?? "",
    logo_url: row.logo_url ?? row.logoUrl ?? row.logo ?? "",
    blog_title: row.blog_title ?? row.blogTitle ?? row.title ?? "",
    blog_slug: row.blog_slug ?? row.blogSlug ?? row.slug ?? "",
    blog_body_html: row.blog_body_html ?? row.blogBodyHtml ?? row.body ?? "",
    blog_feature_image: blogFeature,
    images,
    videos,
    // blog2 fields
    blog2_title: row.blog2_title ?? row.blog2Title ?? null,
    blog2_slug: row.blog2_slug ?? row.blog2Slug ?? null,
    blog2_body_html: row.blog2_body_html ?? row.blog2BodyHtml ?? null,
    blog2_feature_image: blog2Feature,
    blog2_images: blog2Images,
    blog2_videos: blog2Videos,
    cta_text: row.cta_text ?? row.ctaText ?? "Read full Case study",
    created_at: row.created_at ?? row.createdAt ?? null,
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
    const blog2_title = (payload.blog2_title ?? payload.blog2Title ?? "").toString().trim();
    const logo_url = (payload.logo_url ?? payload.logoUrl ?? "").toString().trim();

    // Require client_name and at least one blog title (blog1 or blog2)
    if (!client_name || (!blog_title && !blog2_title)) {
      return NextResponse.json(
        { error: "Missing required fields: client_name and at least one blog title (blog_title or blog2_title) are required." },
        { status: 400 }
      );
    }

    // Keep requiring a logo for client creation: adjust if you want to relax this.
    if (!logo_url) {
      return NextResponse.json({ error: "Missing required field: logo_url is required." }, { status: 400 });
    }

    const row: Record<string, any> = {
      // core fields — accept either blog1 or blog2 title for situations where UI created Blog2-only
      client_name,
      // logo: prefer logo_url if provided for blog2 or blog1 creation
      logo_url,
      // prefer explicit blog_title, otherwise fall back to blog2_title (so Blog2-only creations still have a top-level title)
      blog_title: (payload.blog_title ?? payload.blogTitle ?? payload.blog2_title ?? payload.blog2Title ?? blog_title ?? "").toString().trim(),
      // slug: prefer explicit blog_slug, otherwise derive from whichever title we picked
      blog_slug:
        (payload.blog_slug ?? payload.blogSlug) ||
        ((payload.blog_title ?? payload.blog2_title ?? blog_title ?? "")
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")),
      cta_text: payload.cta_text ?? payload.ctaText ?? null,

      // IMPORTANT: ensure we never insert a NULL into blog_body_html if column is NOT NULL
      // prefer blog_body_html, else fallback to blog2_body_html, else empty string
      blog_body_html:
        (payload.blog_body_html ?? payload.blogBodyHtml ?? payload.blogBody ?? payload.blog2_body_html ?? payload.blog2BodyHtml) ??
        "",

      // feature image: prefer blog1 feature then blog2 feature
      blog_feature_image:
        payload.blog_feature_image ??
        payload.blogFeatureImage ??
        payload.blog2_feature_image ??
        payload.blog2FeatureImage ??
        null,

      // images / videos: accept either blog1 arrays or blog2 arrays if provided (keeps blog2 separate)
      images:
        Array.isArray(payload.images)
          ? payload.images
          : Array.isArray(payload.blog2_images)
          ? payload.blog2_images
          : ([] as string[]),

      videos:
        Array.isArray(payload.videos)
          ? payload.videos
          : Array.isArray(payload.blog2_videos)
          ? payload.blog2_videos
          : ([] as string[]),

      // blog2 columns stored independently (so blog2 won't overwrite blog1)
      blog2_title: payload.blog2_title ?? payload.blog2Title ?? null,
      blog2_slug:
        payload.blog2_slug ??
        payload.blog2Slug ??
        (payload.blog2_title ?? payload.blog2Title
          ? (payload.blog2_title ?? payload.blog2Title).toString().trim().toLowerCase().replace(/\s+/g, "-")
          : null),
      blog2_body_html: payload.blog2_body_html ?? payload.blog2BodyHtml ?? null,
      blog2_feature_image: payload.blog2_feature_image ?? payload.blog2FeatureImage ?? null,
      blog2_images: Array.isArray(payload.blog2_images) ? payload.blog2_images : Array.isArray(payload.blog2Images) ? payload.blog2Images : [],
      blog2_videos: Array.isArray(payload.blog2_videos) ? payload.blog2_videos : Array.isArray(payload.blog2Videos) ? payload.blog2Videos : [],

      // optional body_data (unchanged)
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