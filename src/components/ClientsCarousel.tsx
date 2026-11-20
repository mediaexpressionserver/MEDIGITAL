"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

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


  if (loading) {
    return <div className="py-8 text-center">Loading clients…</div>;
  }

  if (items.length === 0) {
    return <div className="py-8 text-center">No clients found yet.</div>;
  }

  const clientCardClass = (size: string) =>
    `group flex ${size} flex-shrink-0 items-center justify-center rounded border-2 border-transparent bg-white transition duration-200 hover:scale-[1.03] hover:border-[#EEAA45] hover:shadow-lg`;

  const renderClientCards = (size: string, duplicate = false) =>
    items.map((item, index) => (
      <div
        key={`${duplicate ? "copy" : "client"}-${item.id}-${index}`}
        aria-hidden={duplicate || undefined}
        className={clientCardClass(size)}
      >
        {item.logo ? (
          <div className="relative h-full w-full p-2">
            <Image
              src={item.logo}
              alt={duplicate ? "" : `${item.title} logo`}
              fill
              style={{ objectFit: "contain" }}
              unoptimized
            />
          </div>
        ) : (
          <div className="text-sm text-gray-600">{item.title}</div>
        )}
      </div>
    ));

  const DesktopCarousel = () => (
    <section className="w-full overflow-hidden bg-white">
      <div className="client-carousel-viewport overflow-hidden py-6">
        <div className="client-carousel-track flex w-max">
          <div className="flex shrink-0 items-center gap-8 px-6">
            {renderClientCards("h-40 w-72")}
          </div>
          <div className="flex shrink-0 items-center gap-8 px-6" aria-hidden="true">
            {renderClientCards("h-40 w-72", true)}
          </div>
        </div>
      </div>
    </section>
  );

  const MobileCarousel = () => (
    <section className="w-full overflow-hidden bg-white">
      <div className="client-carousel-viewport overflow-hidden py-4">
        <div className="client-carousel-track flex w-max">
          <div className="flex shrink-0 items-center gap-4 px-4">
            {renderClientCards("h-28 w-44")}
          </div>
          <div className="flex shrink-0 items-center gap-4 px-4" aria-hidden="true">
            {renderClientCards("h-28 w-44", true)}
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <>
      <style jsx global>{`
        @keyframes clients-carousel-back-and-forth {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .client-carousel-track {
          animation: clients-carousel-back-and-forth 32s ease-in-out infinite alternate;
          will-change: transform;
        }
      `}</style>
      {isMobile ? <MobileCarousel /> : <DesktopCarousel />}
    </>
  );
}