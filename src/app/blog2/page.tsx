// src/app/blog2/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";

type ClientBlog2 = {
  id: string;
  clientName: string;
  logoUrl?: string;
  // blog2-specific fields (preferred)
  blog2Title?: string;
  blog2Slug?: string;
  blog2BodyHtml?: string;
  blog2FeatureImageUrl?: string;
  blog2Images?: string[];
  blog2Videos?: string[];
  // fallback / legacy fields (in case API returns only blog1 shapes)
  blogTitle?: string;
  blogSlug?: string;
  blogBodyHtml?: string;
  blogFeatureImageUrl?: string;
  images?: string[];
  createdAt?: string;
  created_at?: string;
};

export default function Blog2ListPage() {
  const [clients, setClients] = useState<ClientBlog2[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      try {
        // Try the blog2-specific admin endpoint first, then fall back to other endpoints
        const endpoints = [
          "/api/admin/clients_blog2",
          `${window.location.origin}/api/admin/clients_blog2`,
          "/api/admin/clients",
          "/api/clients",
          `${window.location.origin}/api/admin/clients`,
          `${window.location.origin}/api/clients`,
        ];

        let data: any[] = [];
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, { cache: "no-store" });
            if (!res.ok) continue;
            const parsed = await res.json();
            if (Array.isArray(parsed)) {
              data = parsed;
              break;
            }
            // handle shapes like { clients: [...] } or { data: [...] }
            if (parsed && Array.isArray(parsed.clients)) {
              data = parsed.clients;
              break;
            }
            if (parsed && Array.isArray(parsed.data)) {
              data = parsed.data;
              break;
            }
          } catch (err) {
            // try next endpoint
            // eslint-disable-next-line no-console
            console.warn(`fetch ${ep} failed:`, err);
          }
        }

        // Normalize into ClientBlog2 shape (prefer blog2 fields)
        const normalized: ClientBlog2[] = (data || []).map((item: any, idx: number) => {
          const createdAt = item.created_at ?? item.createdAt ?? "";
          return {
            id: String(item.id ?? item._id ?? item.client_id ?? item.clientId ?? item.slug ?? item.blog_slug ?? `tmp-${idx}`),
            clientName: item.client_name ?? item.clientName ?? item.name ?? "",
            logoUrl: item.logo_url ?? item.logoUrl ?? item.logo ?? item.image ?? undefined,
            // prefer blog2 fields
            blog2Title: item.blog2_title ?? item.blog2Title ?? undefined,
            blog2Slug: item.blog2_slug ?? item.blog2Slug ?? undefined,
            blog2BodyHtml: item.blog2_body_html ?? item.blog2BodyHtml ?? undefined,
            blog2FeatureImageUrl: item.blog2_feature_image ?? item.blog2FeatureImage ?? undefined,
            blog2Images: item.blog2_images ?? item.blog2Images ?? undefined,
            blog2Videos: item.blog2_videos ?? item.blog2Videos ?? undefined,
            // fallback / legacy (if no blog2 present)
            blogTitle: item.blog_title ?? item.blogTitle ?? undefined,
            blogSlug: item.blog_slug ?? item.blogSlug ?? item.slug ?? undefined,
            blogBodyHtml: item.blog_body_html ?? item.blogBodyHtml ?? undefined,
            blogFeatureImageUrl: item.blog_feature_image ?? item.blogFeatureImage ?? undefined,
            images: item.images ?? item.imageUrls ?? undefined,
            createdAt,
            created_at: createdAt,
          };
        });

        setClients(normalized);
      } catch (err) {
        console.error("Error fetching blog2 clients:", err);
        setClients([]);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  // Only show items that actually have blog2 data (prefer blog2Title or blog2Slug)
  const blog2Clients = clients.filter((c) => (c.blog2Title && String(c.blog2Title).trim()) || (c.blog2Slug && String(c.blog2Slug).trim()));

  const INITIAL_COUNT = 9;
  const initialPosts = blog2Clients.slice(0, INITIAL_COUNT);
  const remainingPosts = blog2Clients.slice(INITIAL_COUNT);

  // helper: pick a display image (blog2 feature image first, then blog2Images, then fallbacks)
  const pickImage = (c: ClientBlog2) =>
    (c.blog2FeatureImageUrl as string) ||
    (c.blog2Images && c.blog2Images.length > 0 ? c.blog2Images[0] : null) ||
    (c.blogFeatureImageUrl as string) ||
    (c.images && c.images.length > 0 ? c.images[0] : null) ||
    null;

  // helper: pick title & slug to link to blog2 page
  const pickTitle = (c: ClientBlog2) => {
    if (c.blog2Title && String(c.blog2Title).trim()) return c.blog2Title;
    if (c.blogTitle && String(c.blogTitle).trim()) return c.blogTitle;
    return "Untitled";
  };
  const pickSlug = (c: ClientBlog2) => {
    if (c.blog2Slug && String(c.blog2Slug).trim()) return c.blog2Slug;
    if (c.blogSlug && String(c.blogSlug).trim()) return c.blogSlug;
    return "";
  };

  const formatDate = (d?: string) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString();
  };

  // ---- helpers for preview ----
  // strip HTML tags to plain text (client-side)
  function stripHtml(html: string | undefined) {
    if (!html) return "";
    try {
      const doc = typeof document !== "undefined" ? document : null;
      if (doc) {
        const tmp = doc.createElement("div");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
      }
      // Fallback naive strip for non-browser env (unlikely here)
      return html.replace(/<[^>]+>/g, "");
    } catch {
      return html.replace(/<[^>]+>/g, "");
    }
  }

  // style object that clamps to 5 lines with ellipsis
  const lineClampStyle: React.CSSProperties = {
    display: "-webkit-box",
    WebkitLineClamp: 5,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxHeight: "8.25rem", // approximate (5 lines * ~1.65rem line-height) to avoid layout jumps on non-webkit
  };

  // Shared card component (inline) for consistency between initial & remaining lists
  function Blog2Card({ client }: { client: ClientBlog2 }) {
    const title = pickTitle(client);
    const slug = pickSlug(client);
    const image = pickImage(client);
    const fullPlain = stripHtml(client.blog2BodyHtml ?? client.blogBodyHtml ?? "");
    const previewText = fullPlain.trim();

    // if no slug, we skip (calling code ensures)
    return (
      <article className="group bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden flex flex-col">
        {/* Feature image inside the card */}
        <div className="relative w-full h-64 bg-gray-100 overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={title}
              fill
              className="object-contain transform transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1">
         

          {/* Title + arrow */}
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-2xl font-semibold text-gray-900 leading-tight">{title}</h3>

            {/* arrow icon — visible and aligned right */}
            <Link
              href={`/blog2/${slug}`}
              className="ml-4 inline-flex items-center justify-center p-2 rounded-full text-gray-700 hover:text-black bg-white shadow-sm hover:shadow-md"
              aria-label={`Read ${title}`}
            >
              {/* diagonal arrow (↗) — SVG */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="currentColor" d="M14 3h7v7h-2V6.414L7.707 18.707l-1.414-1.414L17.586 5H14V3z" />
              </svg>
            </Link>
          </div>

          {/* preview — plain text clamped to ~5 lines */}
          <p
            className="text-sm text-gray-600 mt-3 mb-4"
            style={lineClampStyle}
            title={previewText.length > 200 ? previewText.slice(0, 200) + "…" : previewText}
          >
            {previewText || "No preview available."}
          </p>

          <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                {client.logoUrl ? (
                  <Image src={client.logoUrl} alt={client.clientName || "Author"} width={40} height={40} className="object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Logo</div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">{client.clientName || "Unknown Author"}</div>
                <div className="text-xs text-gray-500">{formatDate(client.createdAt ?? client.created_at)}</div>
              </div>
            </div>

            <div>
              {/* small read link (text) */}
              <Link href={`/blog2/${slug}`} className="text-sm text-orange-600 hover:underline">
                Read full Blog
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <main
      className="relative min-h-screen w-full bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/Blogpagebg.png')" }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-16">
        <Header />

        <section className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3 text-white">Our Clients&apos; Stories — Blog2</h1>
          <p className="text-gray-200 max-w-xl mx-auto">Explore how our clients achieved success through MeDigital.</p>
        </section>

        {loading ? (
          <p className="text-center text-white">Loading...</p>
        ) : blog2Clients.length === 0 ? (
          <p className="text-center text-white">No client blogs available.</p>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {initialPosts.map((client) => {
                const slug = pickSlug(client);
                if (!slug) return null;
                return <Blog2Card key={client.id} client={client} />;
              })}
            </section>

            {remainingPosts.length > 0 && (
              <>
                <div
                  className={`mt-10 transition-all duration-300 ${
                    showAll ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0 overflow-hidden"
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {remainingPosts.map((client) => {
                      const slug = pickSlug(client);
                      if (!slug) return null;
                      return <Blog2Card key={client.id} client={client} />;
                    })}
                  </div>
                </div>

                <div className="text-center mt-10">
                  <button onClick={() => setShowAll((s) => !s)} className="inline-flex items-center gap-2 px-6 py-2 bg-white text-black rounded hover:bg-[#C4C6C8] transition">
                    {showAll ? "Show less" : `Load more (${remainingPosts.length})`}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}