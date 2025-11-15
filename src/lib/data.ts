// src/lib/data.ts
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import fs from "fs/promises";
import path from "path";

export type ClientRow = Record<string, any>;

/**
 * Parse a DB column that may contain:
 *  - an array (native text[] from Postgres / JSON array)
 *  - a JSON stringified array
 *  - a comma-separated string
 *  - an object with a `urls`/`items`/`files` array
 *
 * Returns a cleaned string[].
 */
function parseMediaField(raw: any): string[] {
  try {
    if (!raw && raw !== 0) return [];

    // Already an array
    if (Array.isArray(raw)) return raw.filter(Boolean).map(String);

    // Plain string: try JSON.parse then comma-split
    if (typeof raw === "string") {
      const s = raw.trim();
      if (!s) return [];

      // Try to parse JSON
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
        // If parsed is object with known keys
        if (parsed && typeof parsed === "object") {
          // try common array fields
          if (Array.isArray((parsed as any).urls)) return (parsed as any).urls.filter(Boolean).map(String);
          if (Array.isArray((parsed as any).files)) return (parsed as any).files.filter(Boolean).map(String);
        }
      } catch {
        // not JSON — fall back to comma-separated
        return s.split(",").map((x) => x.trim()).filter(Boolean);
      }
    }

    // If raw is object (e.g. jsonb with nested arrays)
    if (typeof raw === "object") {
      // common keys
      if (Array.isArray((raw as any).urls)) return (raw as any).urls.filter(Boolean).map(String);
      if (Array.isArray((raw as any).files)) return (raw as any).files.filter(Boolean).map(String);
      if (Array.isArray((raw as any).items)) return (raw as any).items.filter(Boolean).map(String);

      // flatten simple values
      const flattened = Object.values(raw)
        .flat()
        .filter(Boolean)
        .map(String);
      if (flattened.length > 0) return flattened;
    }
  } catch (e) {
    // ignore and return empty below
  }
  return [];
}

function parseImagesField(raw: any): string[] {
  return parseMediaField(raw);
}

function parseVideosField(raw: any): string[] {
  return parseMediaField(raw);
}

function normalizeRow(row: Record<string, any>) {
  const images = parseImagesField(row.images ?? row.image_urls ?? row.imageUrls ?? row.images_json ?? row.image ?? null);
  const videos = parseVideosField(row.videos ?? row.video_urls ?? row.videoUrls ?? row.videos_json ?? row.video ?? null);

  // blog2-specific media parsing
  const blog2Images = parseImagesField(row.blog2_images ?? row.blog2_images_json ?? row.blog2Images ?? null);
  const blog2Videos = parseVideosField(row.blog2_videos ?? row.blog2_videos_json ?? row.blog2Videos ?? null);

  // choose sensible feature image: explicit feature field -> first image -> null
  const blogFeatureFromRow =
    row.blog_feature_image ??
    row.blog_feature_image_url ??
    row.blogFeatureImageUrl ??
    row.blogFeatureImage ??
    row.feature_image ??
    row.featureImage ??
    null;

  const blogFeatureImageUrl = blogFeatureFromRow ?? (images.length > 0 ? images[0] : null);

  const blog2FeatureFromRow =
    row.blog2_feature_image ??
    row.blog2_feature_image_url ??
    row.blog2FeatureImageUrl ??
    row.blog2FeatureImage ??
    null;

  const blog2FeatureImageUrl = blog2FeatureFromRow ?? (blog2Images.length > 0 ? blog2Images[0] : null);

  return {
    id: String(row.id ?? row.client_name ?? Math.random()),
    clientName: row.client_name ?? row.clientName ?? row.name ?? "",
    logoUrl: row.logo_url ?? row.logoUrl ?? row.logo ?? "",
    // blog1 fields (existing)
    blogTitle: row.blog_title ?? row.blogTitle ?? row.title ?? "",
    blogSlug: row.blog_slug ?? row.blogSlug ?? row.slug ?? "",
    blogBodyHtml: row.blog_body_html ?? row.blogBodyHtml ?? row.body ?? "",
    blogFeatureImageUrl: blogFeatureImageUrl,
    // blog2 fields (new)
    blog2Title: row.blog2_title ?? row.blog2Title ?? null,
    blog2Slug: row.blog2_slug ?? row.blog2Slug ?? null,
    blog2BodyHtml: row.blog2_body_html ?? row.blog2BodyHtml ?? null,
    blog2FeatureImageUrl: blog2FeatureImageUrl,
    // arrays
    ctaText: row.cta_text ?? row.ctaText ?? "Read full Case Study",
    createdAt: row.created_at ?? row.createdAt ?? null,
    images,
    videos,
    blog2Images,
    blog2Videos,
    bodyData: row.body_data ?? row.bodyData ?? null,
    raw: row,
  };
}

/**
 * readClientsData
 * - First tries to fetch from Supabase (server/service role).
 * - If that fails (e.g. no DB during local dev), falls back to reading data/clients.json.
 * - Returns normalized rows (camelCase, images/videos arrays, bodyData).
 */
export async function readClientsData(): Promise<ClientRow[]> {
  // Try Supabase first (server-side)
  try {
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map(normalizeRow);
      } else {
        console.warn("readClientsData: Supabase returned error, falling back:", error);
      }
    }
  } catch (err) {
    console.warn("readClientsData: Supabase fetch failed, falling back to local file.", err);
  }

  // Fallback: read local JSON file (data/clients.json)
  try {
    const filePath = path.join(process.cwd(), "data", "clients.json");
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(normalizeRow);
    return [];
  } catch (err) {
    console.warn("readClientsData: failed to read local data file:", err);
    return [];
  }
}