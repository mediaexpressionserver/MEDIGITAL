// src/components/ClientsCarousel.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createPortal } from "react-dom";

export type ClientItem = {
  id: string;
  title: string;
  body: string;
  logo?: string; // path or URL to logo
  blogSlug?: string;
  ctaText?: string;
};

/** Normalizes arbitrary API payload into our ClientItem shape */
function normalize(item: Record<string, any>): ClientItem {
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
      undefined,
    blogSlug: item.blogSlug ?? item.blog_slug ?? item.slug ?? undefined,
    ctaText: item.cta_text ?? item.ctaText ?? "Read full case study",
  };
}

type ClientsCarouselProps = {
  apiUrl?: string; // optional prop, default to /api/clients
};

export default function ClientsCarousel({ apiUrl = "/api/clients" }: ClientsCarouselProps) {
  const [items, setItems] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [active, setActive] = useState<ClientItem | null>(null);
  const logoScrollRef = useRef<HTMLDivElement | null>(null);

  // modal DOM ref for blocking outside events
  const modalRef = useRef<HTMLDivElement | null>(null);

  // remember scroll position for robust body lock
  const scrollYRef = useRef<number>(0);

  // portal mount guard to avoid SSR mismatch
  const [portalMounted, setPortalMounted] = useState(false);
  useEffect(() => {
    setPortalMounted(true);
  }, []);

  // modal top (px) — computed relative to viewport and applied as position:fixed top: ...
  const [modalTop, setModalTop] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Failed to fetch clients");
        const data = await res.json();
        const raw = Array.isArray(data) ? data : data?.clients ?? data?.data ?? data?.entries ?? [];
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

  /**
   * openModal accepts an optional anchor element (the clicked logo button).
   * We compute the modalTop from that anchor's boundingClientRect so the modal is positioned
   * relative to the clicked item (works correctly under transforms).
   */
  function openModal(item: ClientItem, anchorEl?: HTMLElement | null) {
    // set global flag so the page knows a client modal is open (defensive)
    try {
      (window as any).__clientModalOpen = true;
    } catch {}

    setActive(item);

    // Primary positioning: if anchorEl provided, compute top from its viewport rect.
    if (anchorEl && typeof anchorEl.getBoundingClientRect === "function") {
      try {
        const rect = anchorEl.getBoundingClientRect();
        // position modal slightly above the center of the logo button (clamp to viewport)
        const desired = Math.round(rect.top + rect.height / 2 - 160); // ~320px modal height center
        const clamped = Math.min(Math.max(12, desired), Math.max(12, (window?.innerHeight ?? 800) - 200));
        setModalTop(clamped);
      } catch (err) {
        setModalTop(null);
      }
    } else {
      // fallback: clear and let recompute effect determine position
      setModalTop(null);
    }

    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setActive(null);
    // clear global flag (use try/catch to avoid SSR issues)
    try {
      (window as any).__clientModalOpen = false;
    } catch {}
  }

  function scrollLogosLeft() {
    logoScrollRef.current?.scrollBy({ left: -240, behavior: "smooth" });
  }
  function scrollLogosRight() {
    logoScrollRef.current?.scrollBy({ left: 240, behavior: "smooth" });
  }

  // === Robust body-lock for mobile & desktop (uses position:fixed) ===
  useEffect(() => {
    if (!portalMounted) return;

    const prevOverflow = document.body.style.overflow;
    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevLeft = document.body.style.left;
    const prevWidth = document.body.style.width;

    if (modalOpen) {
      scrollYRef.current = (typeof window !== "undefined" ? window.scrollY : 0) || 0;
      // lock body at current scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // restore
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.left = prevLeft;
      document.body.style.width = prevWidth;
      document.body.style.overflow = prevOverflow;
      // restore scroll position
      try {
        if (typeof window !== "undefined") window.scrollTo(0, scrollYRef.current || 0);
      } catch {}
    }

    return () => {
      // cleanup on unmount or dependency change
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.left = prevLeft;
      document.body.style.width = prevWidth;
      document.body.style.overflow = prevOverflow;
      try {
        if (typeof window !== "undefined") window.scrollTo(0, scrollYRef.current || 0);
      } catch {}
    };
  }, [modalOpen, portalMounted]);

  // Prevent touchmove/wheel events that would scroll the background (important for mobile)
  useEffect(() => {
    if (!portalMounted) return;

    const prevent = (e: Event) => {
      try {
        e.preventDefault();
      } catch {}
    };

    if (modalOpen) {
      document.addEventListener("touchmove", prevent, { passive: false });
      document.addEventListener("wheel", prevent, { passive: false });
    }

    return () => {
      document.removeEventListener("touchmove", prevent as EventListener);
      document.removeEventListener("wheel", prevent as EventListener);
    };
  }, [modalOpen, portalMounted]);

  // compute modalTop robustly after the modal opens and layout settles
  useEffect(() => {
    if (!portalMounted || !modalOpen) return;

    let raf = 0;
    const computeTop = () => {
      if (modalTop !== null) {
        const clamped = Math.min(Math.max(12, modalTop), Math.max(12, (window?.innerHeight ?? 800) - 200));
        if (clamped !== modalTop) setModalTop(clamped);
        return;
      }

      const el = logoScrollRef.current;
      if (!el) {
        setModalTop(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      const desiredTop = Math.round(rect.top - 100);
      const clamped = Math.min(Math.max(12, desiredTop), Math.max(12, (window?.innerHeight ?? 800) - 200));
      setModalTop(clamped);
    };

    raf = requestAnimationFrame(() => {
      computeTop();
      setTimeout(() => {
        computeTop();
      }, 60);
    });

    const onRecompute = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(computeTop);
    };

    window.addEventListener("resize", onRecompute);
    window.addEventListener("orientationchange", onRecompute);
    window.addEventListener("scroll", onRecompute, { passive: true });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onRecompute);
      window.removeEventListener("orientationchange", onRecompute);
      window.removeEventListener("scroll", onRecompute);
    };
  }, [modalOpen, portalMounted, modalTop]);

  // ===== Capturing guard: block anchors/pointer events outside modal while it's open =====
  useEffect(() => {
    if (!portalMounted) return;
    if (!modalOpen) return;

    const captureBlocker = (e: Event) => {
      try {
        const target = e.target as Element | null;
        const modalNode = modalRef.current;
        if (modalNode && target && modalNode.contains(target)) {
          return; // inside modal -> allow
        }
        // block navigation / clickable elements outside modal while modal open
        if (target && (target.closest?.("a, [data-nav], button[type='submit']") || (target as HTMLElement).tagName === "A")) {
          e.preventDefault();
          if (typeof (e as any).stopImmediatePropagation === "function")
            (e as any).stopImmediatePropagation();
          else (e as Event).stopPropagation();
        } else {
          e.preventDefault();
          if (typeof (e as any).stopImmediatePropagation === "function")
            (e as any).stopImmediatePropagation();
          else (e as Event).stopPropagation();
        }
      } catch (err) {
        // swallow
      }
    };

    document.addEventListener("pointerdown", captureBlocker, { capture: true, passive: false } as any);
    document.addEventListener("click", captureBlocker, { capture: true, passive: false } as any);

    return () => {
      document.removeEventListener("pointerdown", captureBlocker as EventListener, { capture: true } as any);
      document.removeEventListener("click", captureBlocker as EventListener, { capture: true } as any);
    };
  }, [modalOpen, portalMounted]);

  if (loading) return <div className="py-8 text-center">Loading clients…</div>;
  if (items.length === 0) return <div className="py-8 text-center">No clients found yet.</div>;

  const modalContent = active ? (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 p-4" onClick={closeModal}>
      <div
        className="absolute inset-0 bg-black/60"
        style={{ overscrollBehavior: "contain", touchAction: "none" }}
      />
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 max-w-lg w-full bg-white rounded-lg shadow-lg p-6 mx-auto"
        style={
          modalTop !== null
            ? {
                position: "fixed",
                left: "50%",
                transform: "translateX(-50%)",
                top: `${modalTop}px`,
                maxHeight: "calc(100vh - 32px)",
                overflow: "auto",
              }
            : {
                position: "fixed",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                maxHeight: "calc(100vh - 32px)",
                overflow: "auto",
              }
        }
      >
        <button
          type="button"
          onClick={closeModal}
          aria-label="Close"
          className="absolute right-3 top-3 text-gray-600 hover:text-black"
        >
          ✕
        </button>

        <div className="relative w-32 sm:w-40 md:w-48 h-16 sm:h-20 md:h-24 mx-auto">
          {active.logo ? (
            <Image src={active.logo} alt={`${active.title} logo`} fill style={{ objectFit: "contain" }} unoptimized />
          ) : null}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{active.title}</h3>

        <div className="overflow-auto max-h-[48vh] text-sm text-gray-700 mb-4 prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: active.body }} />
        </div>

        <div className="flex justify-center gap-3 mb-1">
          {active.blogSlug ? (
            <Link href={`/blog/${active.blogSlug}`} onClick={closeModal} className="inline-block bg-orange-500 text-white px-4 py-2 rounded text-sm">
              Read full case study
            </Link>
          ) : (
            <span className="text-sm text-gray-500">No blog linked</span>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <section
        className="w-full bg-white overflow-hidden clients-carousel-root"
        aria-hidden={modalOpen}
        style={{ pointerEvents: modalOpen ? "none" : undefined }}
      >
        <div className="relative max-w-full mx-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              scrollLogosLeft();
            }}
            aria-label="Previous logos"
            className="absolute left-3 top-1/2 z-10 p-2 -translate-y-1/2 bg-white rounded-full shadow-md focus:outline-none focus:ring"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              scrollLogosRight();
            }}
            aria-label="Next logos"
            className="absolute right-3 top-1/2 z-10 p-2 -translate-y-1/2 bg-white rounded-full shadow-md focus:outline-none focus:ring"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div
            ref={logoScrollRef}
            className="flex items-center gap-8 overflow-x-auto py-6 px-6 no-scrollbar scroll-smooth"
          >
            <div className="flex-shrink-0 w-6" />
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onPointerDown={(e) => {
                  try {
                    (e.nativeEvent as any)?.stopImmediatePropagation?.();
                  } catch {}
                }}
                onClick={(e) => {
                  try {
                    (e.nativeEvent as any)?.stopImmediatePropagation?.();
                  } catch {}
                  e.stopPropagation();

                  try {
                    (window as any).__clientModalOpen = true;
                  } catch {}

                  Promise.resolve().then(() => {
                    openModal(it, e.currentTarget as HTMLElement);
                  });
                }}
                className="w-28 sm:w-36 md:w-44 flex-shrink-0 flex items-center justify-center bg-white rounded focus:outline-none transform transition-transform duration-200 hover:scale-105 focus:scale-105 active:scale-95"
                aria-label={it.title}
                title={it.title}
              >
                {it.logo ? (
                  <div className="relative w-full h-14 sm:h-20 md:h-24 p-2">
                    <Image src={it.logo} alt={`${it.title} logo`} fill style={{ objectFit: "contain" }} sizes="144px" unoptimized />
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">{it.title}</div>
                )}
              </button>
            ))}
            <div className="flex-shrink-0 w-6" />
          </div>
        </div>
      </section>

      {portalMounted && modalOpen && active && typeof document !== "undefined" && createPortal(modalContent, document.body)}
    </>
  );
}