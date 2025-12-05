// src/app/blog/[slug]/page.tsx
// Server component — optimized for smooth scrolling and rendering

import Image from "next/image";
import Header from "@/components/Header";
import { readClientsData } from "@/lib/data";
import BackButtonClient from "./BackButtonClient"; // if present
import MediaGallery from "@/components/MediaGallery";
import ScrollAfterBack from "./ScrollAfterBack"; // client component for scroll behavior

export const metadata = {
  title: "Blog2",
};

export default async function Blog2DetailPage({
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
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
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

  const images: string[] =
    Array.isArray(client.images) && client.images.length > 0
      ? client.images
      : Array.isArray(client.image) && client.image.length > 0
      ? client.image
      : (client.images || client.image || []) as string[];

  // prefer logo fields for the feature image (use logo as feature image);
  // fall back to any existing feature/image if no logo is present
  const feature =
    client.logo ??
    client.logo_url ??
    client.logoUrl ??
    client.brand_logo ??
    client.brandLogo ??
    client.logo_image ??
    client.logoImage ??
    client.blog_feature_image ??
    client.blogFeatureImage ??
    client.blog_feature_image_url ??
    client.blogFeatureImageUrl ??
    (images && images.length > 0 ? images[0] : null);

  // normalize videos
  const videosRaw =
    client.videos ?? client.video_urls ?? client.videoUrls ?? client.videos_list ?? [];
  const videos: string[] = Array.isArray(videosRaw)
    ? videosRaw
    : (typeof videosRaw === "string" && videosRaw ? JSON.parse(videosRaw) : []);

  const media = [
    ...(images || []).map((src: string) => ({ type: "image" as const, src, alt: title })),
    ...(videos || []).map((src: string) => ({ type: "video" as const, src, alt: title })),
  ];

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      {/* Optimized background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/Blogpagebg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 max-w-screen-xl mx-auto px-6 py-16">
        {typeof BackButtonClient === "function" ? <BackButtonClient /> : null}
        <ScrollAfterBack />

        <Header />

        <article className="bg-white rounded-lg overflow-hidden">
          {feature ? (
            <div className="relative w-full h-64 md:h-96 bg-white flex items-center justify-center overflow-hidden">
              {/* Preserve image aspect ratio with whitespace; use `object-contain` */}
              <Image
                src={feature}
                alt={title}
                fill
                style={{ objectFit: "contain", objectPosition: "center top" }}
                loading="lazy"
              />
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

            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />

            {client.blog_slug && (
              <div className="mt-6">
                <a
                  href={`/blog/${client.blog_slug}`}
                  className="inline-block bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
                >
                  Read full case study
                </a>
              </div>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}