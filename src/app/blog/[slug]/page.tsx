// src/app/blog/[slug]/page.tsx
// Server component (no "use client") — exports metadata and reads data server-side.

import Image from "next/image";
import Header from "@/components/Header";
import { readClientsData } from "@/lib/data";
import BackButtonClient from "./BackButtonClient"; // if present
import MediaGallery from "@/components/MediaGallery"; // client component

export const metadata = {
  title: "Blog",
};

export default async function BlogDetailPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = String(resolvedParams?.slug ?? "").trim();

  const clients = await readClientsData();

  const client = (clients || []).find((c: any) => {
    const s = (c.blog_slug ?? c.blogSlug ?? c.slug ?? "").toString().trim();
    return s === slug;
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

  const title = client.blog_title ?? client.blogTitle ?? "Untitled";
  const bodyHtml = client.blog_body_html ?? client.blogBodyHtml ?? "";

  // normalize images
  const images: string[] =
    Array.isArray(client.images) && client.images.length > 0
      ? client.images
      : Array.isArray(client.image) && client.image.length > 0
      ? client.image
      : (client.images || client.image || []) as string[];

  const feature =
    client.blog_feature_image ??
    client.blogFeatureImage ??
    client.blog_feature_image_url ??
    client.blogFeatureImageUrl ??
    (images && images.length > 0 ? images[0] : null);

  // normalize videos — Postgres text[] should already be array; handle stringified JSON as fallback
  const videosRaw = client.videos ?? client.video_urls ?? client.videoUrls ?? client.videos_list ?? [];
  const videos: string[] = Array.isArray(videosRaw)
    ? videosRaw
    : (typeof videosRaw === "string" && videosRaw ? JSON.parse(videosRaw) : []);

  // Build unified media list
  const media = [
    ...(images || []).map((src: string) => ({ type: "image" as const, src, alt: title })),
    ...(videos || []).map((src: string) => ({ type: "video" as const, src, alt: title })),
  ];

  return (
    <main
      className="relative min-h-screen w-full bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/Blogpagebg.png')" }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-16">
        {/* optional BackButtonClient */}
        {typeof BackButtonClient === "function" ? <BackButtonClient /> : null}

        <Header />

        <article className="bg-white rounded-lg shadow overflow-hidden">
          {feature ? (
            <div className="relative w-full h-64">
              <Image src={feature} alt={title} fill style={{ objectFit: "cover" }} />
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400">
              No image
            </div>
          )}

          <div className="p-8">
            <h1 className="text-3xl font-bold mb-4">{title}</h1>

            {media && media.length > 0 && (
              <section className="mb-6">
                <h3 className="text-sm text-gray-600 mb-2">Gallery</h3>
                <MediaGallery media={media} />
              </section>
            )}

            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

            {client.blog_slug && (
              <div className="mt-6">
                <a href={`/blog/${client.blog_slug}`} className="inline-block bg-orange-500 text-white px-4 py-2 rounded">
                  Read full blog
                </a>
              </div>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}