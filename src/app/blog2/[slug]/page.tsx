// src/app/blog2/[slug]/page.tsx
// Server component (no "use client") — data fetch & minimal SSR, mounts gallery via client wrapper

import React from "react";
import Header from "@/components/Header";
import { readClientsData } from "@/lib/data";
import MediaGalleryClient from "@/components/MediaGallery"; // client wrapper (ssr:false inside)
import Image from "next/image";

// Import the client wrapper that handles the sessionStorage flag and history.back()
import BackButtonClient from "./BackButtonClient";

export const metadata = {
  title: "Blog",
};

type AnyClient = Record<string, any>;

async function fetchBlog2AdminRows(): Promise<AnyClient[]> {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    "http://localhost:3000";

  const url = `${base.replace(/\/$/, "")}/api/admin/clients_blog2`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json)) return json;
    if (json && Array.isArray(json.data)) return json.data;
    if (json && Array.isArray(json.clients)) return json.clients;
    return [];
  } catch {
    return [];
  }
}

/** Canonicalize slugs to a consistent form:
 *  - String -> lowercase
 *  - trim
 *  - replace whitespace with '-'
 *  - remove characters that commonly break URLs
 */
function canonicalSlug(s: any): string {
  if (s == null) return "";
  try {
    const str = String(s);
    // decode if percent-encoded already (best-effort)
    let decoded = str;
    try {
      decoded = decodeURIComponent(str);
    } catch {
      // ignore decode errors, use original string
      decoded = str;
    }
    // lower, trim, replace space groups with dash
    const cleaned = decoded
      .toLowerCase()
      .trim()
      // normalize punctuation: replace spaces with dashes
      .replace(/\s+/g, "-")
      // remove characters that shouldn't be in a slug (keep alnum, dash, underscore)
      .replace(/[^a-z0-9-_]/g, "")
      // collapse multiple dashes
      .replace(/-+/g, "-")
      // strip leading/trailing dashes
      .replace(/^-+|-+$/g, "");
    return cleaned;
  } catch {
    return String(s ?? "").toLowerCase().trim();
  }
}

export default async function Blog2DetailPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug ?? "").trim();

  // Debug: show raw incoming slug (helpful in Vercel logs)
  // Remove these logs after debugging in prod
  // eslint-disable-next-line no-console
  console.log("[blog2] incomingSlug raw:", slug);

  // primary sources
  const clientsFromHelper: AnyClient[] = (await readClientsData()) ?? [];
  const blog2Rows: AnyClient[] = await fetchBlog2AdminRows();

  // merge/normalize — keep semantics same as before
  const byId = new Map<string, AnyClient>();
  const normalizeId = (raw: AnyClient, idx: number) =>
    String(
      raw?.id ??
        raw?._id ??
        raw?.client_id ??
        raw?.clientId ??
        raw?.slug ??
        raw?.blog_slug ??
        raw?.blog2_slug ??
        `tmp-${idx}`
    );

  const pushNormalized = (raw: AnyClient, source: "clients" | "clients_blog2", idx: number) => {
    const normalized: AnyClient = {
      id: normalizeId(raw, idx),
      client_name: raw.client_name ?? raw.clientName ?? raw.name ?? "",
      logo_url: raw.logo_url ?? raw.logoUrl ?? raw.logo ?? raw.image ?? undefined,
      blog2_title: raw.blog2_title ?? raw.blog2Title ?? undefined,
      blog2_slug: raw.blog2_slug ?? raw.blog2Slug ?? undefined,
      blog2_body_html: raw.blog2_body_html ?? raw.blog2BodyHtml ?? undefined,
      blog2_feature_image: raw.blog2_feature_image ?? raw.blog2FeatureImage ?? undefined,
      blog2_images: raw.blog2_images ?? raw.blog2Images ?? undefined,
      blog2_videos: raw.blog2_videos ?? raw.blog2Videos ?? undefined,
      blog_title: raw.blog_title ?? raw.blogTitle ?? undefined,
      blog_slug: raw.blog_slug ?? raw.blogSlug ?? raw.slug ?? undefined,
      blog_body_html: raw.blog_body_html ?? raw.blogBodyHtml ?? undefined,
      blog_feature_image: raw.blog_feature_image ?? raw.blogFeatureImage ?? undefined,
      images: raw.images ?? raw.imageUrls ?? raw.image ?? undefined,
      videos: raw.videos ?? raw.videoUrls ?? undefined,
      created_at: raw.created_at ?? raw.createdAt ?? undefined,
      _raw: raw,
      _source: source,
    };
    byId.set(String(normalized.id), normalized);
  };

  clientsFromHelper.forEach((c, i) => pushNormalized(c, "clients", i));
  blog2Rows.forEach((r, i) => pushNormalized(r, "clients_blog2", i + clientsFromHelper.length));

  const merged = Array.from(byId.values());

  // robust slug matching: decode incoming slug, canonicalize,
  // and compare against multiple candidate fields (snake_case/camelCase/raw). Also fall back to id match.
  let decodedCanonical = "";
  try {
    decodedCanonical = canonicalSlug(decodeURIComponent(String(slug || "").trim()));
  } catch {
    decodedCanonical = canonicalSlug(slug);
  }

  // Debug: show what we will match against
  // eslint-disable-next-line no-console
  console.log("[blog2] decodedCanonical:", decodedCanonical);

  const client = merged.find((c) => {
    // collect possible slug values from normalized object and raw payload
    const candidateSlugs = [
      c.blog2_slug,
      c.blog2Slug,
      c.blog_slug,
      c.blogSlug,
      c._raw?.blog2_slug,
      c._raw?.blog2Slug,
      c._raw?.blog_slug,
      c._raw?.blogSlug,
      c.slug,
      c._raw?.slug,
      c.id,
      c._raw?._id,
    ]
      .map((x) => canonicalSlug(x))
      .filter(Boolean);

    // Debug: emit candidate slugs per client id (helpful to inspect mismatches)
    // eslint-disable-next-line no-console
    console.log(`[blog2] candidate slugs for client id=${String(c?.id)}:`, candidateSlugs);

    return candidateSlugs.includes(decodedCanonical) || canonicalSlug(c.id) === decodedCanonical;
  });

  if (!client) {
    return (
      <main className="min-h-screen">
        <Header />
        <div className="max-w-screen-md mx-auto p-8 text-center">
          <h1 className="text-2xl font-semibold">Not found</h1>
          <p className="text-gray-600 mt-2">No blog found for slug: {slug}</p>
        </div>
      </main>
    );
  }

  // prefer blog2 values, fall back to blog1
  const title =
    client.blog2_title ??
    client.blog2Title ??
    client._raw?.blog2_title ??
    client._raw?.blog2Title ??
    client.blog_title ??
    client.blogTitle ??
    "Untitled";

  const bodyHtml =
    client.blog2_body_html ??
    client.blog2BodyHtml ??
    client._raw?.blog2_body_html ??
    client._raw?.blog2BodyHtml ??
    client.blog_body_html ??
    client.blogBodyHtml ??
    "";

  // images: prefer blog2 images then fallbacks
  const images: string[] =
    (Array.isArray(client.blog2_images) && client.blog2_images.length > 0
      ? client.blog2_images
      : Array.isArray(client.blog2Images) && client.blog2Images.length > 0
      ? client.blog2Images
      : Array.isArray(client._raw?.blog2_images) && client._raw.blog2_images.length > 0
      ? client._raw.blog2_images
      : Array.isArray(client.images) && client.images.length > 0
      ? client.images
      : Array.isArray(client._raw?.images) && client._raw.images.length > 0
      ? client._raw.images
      : []) as string[];

  const feature =
    client.blog2_feature_image ??
    client.blog2FeatureImage ??
    client._raw?.blog2_feature_image ??
    (images && images.length > 0 ? images[0] : null) ??
    client.blog_feature_image ??
    client.blogFeatureImage ??
    null;

  // videos normalization
  const videosRaw =
    client.blog2_videos ?? client.blog2Videos ?? client._raw?.blog2_videos ?? client._raw?.blog2Videos ?? [];
  const videos: string[] = Array.isArray(videosRaw)
    ? videosRaw
    : typeof videosRaw === "string" && videosRaw
    ? (() => {
        try {
          return JSON.parse(videosRaw);
        } catch {
          return [];
        }
      })()
    : [];

  // cap to a few items to reduce DOM
  const safeImages = Array.isArray(images) ? images.slice(0, 6) : [];
  const safeVideos = Array.isArray(videos) ? videos.slice(0, 6) : [];
  const media =
    [...safeImages.map((src: string) => ({ type: "image" as const, src, alt: title })), ...safeVideos.map((src: string) => ({ type: "video" as const, src, alt: title }))];

  const blog2Slug =
    client.blog2_slug ??
    client.blog2Slug ??
    client._raw?.blog2_slug ??
    client._raw?.blog2Slug ??
    client.blog_slug ??
    client.blogSlug ??
    "";

  // keep background as CSS image for faster initial paint
  const bgStyle: React.CSSProperties = {
    backgroundImage: "url('/images/Blogpagebg.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <main className="relative min-h-screen w-full bg-fixed" style={bgStyle}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-16">
        {/* Back button client (client component) */}
        <BackButtonClient />

        <Header />

        <article className="bg-white rounded-lg shadow overflow-hidden">
          {feature ? (
            <div className="w-full h-64 md:h-96 bg-white flex items-center justify-center overflow-hidden">
              {/*
                Show image while preserving aspect ratio. `object-contain` will fit the whole
                image inside the container and leave whitespace (background) if aspect ratios
                differ. If you prefer the image to be zoomed/cropped to fill the area, change
                the class on the <img> from `object-contain` to `object-cover`.
              */}
              <img src={feature} alt={title} loading="lazy" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400">No image</div>
          )}

          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">{title}</h1>

            {media && media.length > 0 && (
              <section className="mb-6">
                <h3 className="text-sm text-gray-600 mb-2">Gallery</h3>
                {/* Client-only gallery wrapper mounts dynamically (ssr:false inside wrapper) */}
                <MediaGalleryClient media={media} />
              </section>
            )}

            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          </div>
        </article>
      </div>
    </main>
  );
}
