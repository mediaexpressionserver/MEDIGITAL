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
  apiUrl?: string;
};

export default function ClientsCarousel({
  apiUrl = "/api/clients",
}: ClientsCarouselProps) {
  const [items, setItems] = useState<Array<ReturnType<typeof normalize>>>([]);
  const [loading, setLoading] = useState(true);
  const logoScrollRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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

        if (mounted) setItems(raw.map(normalize));
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

  useEffect(() => {
    const checkMobile = () => {
      try {
        const ua =
          navigator.userAgent ||
          navigator.vendor ||
          (window as any).opera ||
          "";
        const isTabletOrMobileUA =
          /iPhone|iPod|Android|Mobile|iPad|Tablet|PlayBook|Silk/i.test(ua);
        const width = window.innerWidth;
        const height = window.innerHeight;
        const isSmallScreen = width <= 1024 && height <= 1366;
        const isDesktopMac = /Macintosh/i.test(ua) && !/iPad/i.test(ua);

        setIsMobile(
          !isDesktopMac && (isTabletOrMobileUA || isSmallScreen)
        );
      } catch {
        setIsMobile(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  function scrollLogosLeft() {
    logoScrollRef.current?.scrollBy({ left: -240, behavior: "smooth" });
  }

  function scrollLogosRight() {
    logoScrollRef.current?.scrollBy({ left: 240, behavior: "smooth" });
  }

  if (loading) {
    return <div className="py-8 text-center">Loading clients…</div>;
  }

  if (items.length === 0) {
    return <div className="py-8 text-center">No clients found yet.</div>;
  }

  const clientCardClass = (size: string, hasBlogSlug: boolean) =>
    `group flex ${size} flex-shrink-0 items-center justify-center rounded border-2 border-transparent bg-white transition duration-200 hover:scale-[1.03] hover:border-[#EEAA45] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EEAA45] ${
      hasBlogSlug ? "cursor-pointer" : "cursor-not-allowed opacity-60"
    }`;

  const DesktopCarousel = () => (
    <section className="w-full overflow-hidden bg-white">
      <div className="relative mx-auto max-w-full">
        <button
          type="button"
          onClick={scrollLogosLeft}
          aria-label="Previous logos"
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={scrollLogosRight}
          aria-label="Next logos"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow-md"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div
          ref={logoScrollRef}
          className="no-scrollbar flex items-center gap-8 overflow-x-auto px-6 py-6"
        >
          <div className="w-3 flex-shrink-0" />

          {items.map((item) => (
            <Link
              key={item.id}
              href={
                item.blogSlug
                  ? `/blog/${encodeURIComponent(item.blogSlug)}`
                  : "#"
              }
              aria-label={
                item.blogSlug
                  ? `View ${item.title} case study`
                  : `${item.title} case study link unavailable`
              }
              aria-disabled={!item.blogSlug}
              onClick={(event) => {
                if (!item.blogSlug) event.preventDefault();
              }}
              className={clientCardClass("h-40 w-72", Boolean(item.blogSlug))}
            >
              {item.logo ? (
                <div className="relative h-full w-full p-2">
                  <Image
                    src={item.logo}
                    alt={`${item.title} logo`}
                    fill
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="text-sm text-gray-600">{item.title}</div>
              )}
            </Link>
          ))}

          <div className="w-3 flex-shrink-0" />
        </div>
      </div>
    </section>
  );

  const MobileCarousel = () => (
    <section className="w-full overflow-hidden bg-white">
      <div className="relative mx-auto max-w-full">
        <div
          ref={logoScrollRef}
          className="no-scrollbar flex items-center gap-4 overflow-x-auto px-4 py-4"
        >
          <div className="w-2 flex-shrink-0" />

          {items.map((item) => (
            <Link
              key={item.id}
              href={
                item.blogSlug
                  ? `/blog/${encodeURIComponent(item.blogSlug)}`
                  : "#"
              }
              aria-label={
                item.blogSlug
                  ? `View ${item.title} case study`
                  : `${item.title} case study link unavailable`
              }
              aria-disabled={!item.blogSlug}
              onClick={(event) => {
                if (!item.blogSlug) event.preventDefault();
              }}
              className={clientCardClass("h-28 w-44", Boolean(item.blogSlug))}
            >
              {item.logo ? (
                <div className="relative h-full w-full p-2">
                  <Image
                    src={item.logo}
                    alt={`${item.title} logo`}
                    fill
                    style={{ objectFit: "contain" }}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="text-xs text-gray-600">{item.title}</div>
              )}
            </Link>
          ))}

          <div className="w-2 flex-shrink-0" />
        </div>
      </div>
    </section>
  );

  return <>{isMobile ? <MobileCarousel /> : <DesktopCarousel />}</>;
}