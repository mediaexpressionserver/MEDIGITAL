"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ApiClient = Record<string, any>;

function normalize(item: ApiClient) {
  return {
    id: item.id ?? item.client_id ?? item.clientName ?? String(Math.random()),
    title:
      item.clientName ??
      item.client_name ??
      item.blogTitle ??
      item.blog_title ??
      "Client",
    body:
      item.blogBodyHtml ??
      item.blog_body_html ??
      item.body ??
      item.blogBody ??
      "",
    logo:
      item.logoUrl ??
      item.logo_url ??
      item.src ??
      item.image ??
      item.logo ??
      "",
    blogSlug: item.blogSlug ?? item.blog_slug ?? item.slug ?? "",
    ctaText: item.cta_text ?? item.ctaText ?? "Read full case study",
  };
}

type ClientsCarouselProps = {
  apiUrl?: string; // optional prop, default to /api/clients
};

export default function ClientsCarousel({ apiUrl = "/api/clients" }: ClientsCarouselProps) {
  const [items, setItems] = useState<Array<ReturnType<typeof normalize>>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState<ReturnType<typeof normalize> | null>(null);
  const logoScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Failed to fetch clients");
        const data = await res.json();
        const raw = Array.isArray(data)
          ? data
          : data?.clients ?? data?.data ?? data?.entries ?? [];
        const normalized = raw.map(normalize);
        if (mounted) setItems(normalized);
      } catch (err) {
        console.error("Clients load error:", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  function openModal(item: ReturnType<typeof normalize>) {
    setActive(item);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setActive(null);
  }

  function scrollLogosLeft() {
    logoScrollRef.current?.scrollBy({ left: -240, behavior: "smooth" });
  }
  function scrollLogosRight() {
    logoScrollRef.current?.scrollBy({ left: 240, behavior: "smooth" });
  }

  if (loading) return <div className="py-8 text-center">Loading clients…</div>;

  if (items.length === 0)
    return <div className="py-8 text-center">No clients found yet.</div>;

  return (
    <>
      {/* Full-bleed white background — stretches edge-to-edge */}
      <section className="w-full bg-white overflow-hidden">
        <div className="relative max-w-full mx-auto">
          {/* Left button */}
          <button
            onClick={scrollLogosLeft}
            aria-label="Previous logos"
            className="absolute left-3 top-1/2 z-10 p-2 -translate-y-1/2 bg-white rounded-full shadow-md focus:outline-none focus:ring"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Right button */}
          <button
            onClick={scrollLogosRight}
            aria-label="Next logos"
            className="absolute right-3 top-1/2 z-10 p-2 -translate-y-1/2 bg-white rounded-full shadow-md focus:outline-none focus:ring"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Scroll area */}
          <div
            ref={logoScrollRef}
            className="flex items-center gap-8 overflow-x-auto py-6 px-6 no-scrollbar scroll-smooth"
          >
            {/* Add some left padding so logos don't stick to edge */}
            <div className="flex-shrink-0 w-6" />

            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => openModal(it)}
                className="w-36 h-20 flex-shrink-0 flex items-center justify-center bg-white rounded focus:outline-none"
                aria-label={it.title}
                title={it.title}
              >
                {it.logo ? (
                  <div className="relative w-full h-full p-2">
                    <Image
                      src={it.logo}
                      alt={`${it.title} logo`}
                      fill
                      style={{ objectFit: "contain" }}
                      sizes="144px"
                      unoptimized // avoids Next image host config issues for external URLs
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">{it.title}</div>
                )}
              </button>
            ))}

            {/* Add some right padding too */}
            <div className="flex-shrink-0 w-6" />
          </div>
        </div>
      </section>

      {/* Modal */}
      {modalOpen && active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative z-10 max-w-lg w-full bg-white rounded-lg shadow-lg p-6 transform -translate-y-24 transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-3 top-3 text-gray-600 hover:text-black"
            >
              ✕
            </button>

            <div className="flex justify-center mb-4">
              <div className="relative w-40 h-20">
                {active.logo ? (
                  <Image
                    src={active.logo}
                    alt={`${active.title} logo`}
                    fill
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                ) : null}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{active.title}</h3>

            {/* Scrollable content area with fixed max height */}
            <div className="overflow-auto max-h-[48vh] text-sm text-gray-700 mb-4 prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: active.body }} />
            </div>

            <div className="flex justify-center gap-3">
              {active.blogSlug ? (
                <Link
                  href={`/blog/${active.blogSlug}`}
                  onClick={closeModal}
                  className="inline-block bg-orange-500 text-white px-4 py-2 rounded text-sm"
                >
                  {active.ctaText || "Read full case study"}
                </Link>
              ) : (
                <span className="text-sm text-gray-500">No blog linked</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}