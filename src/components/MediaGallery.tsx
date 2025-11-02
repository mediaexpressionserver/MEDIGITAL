// src/components/MediaGallery.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

type MediaItem = {
  type: "image" | "video";
  src: string;
  alt?: string;
  poster?: string | null;
};

export default function MediaGallery({ media }: { media: MediaItem[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<number>(0);
  const [computedPosters, setComputedPosters] = useState<Record<string, string>>({}); // src -> dataURL

  // generate lightweight poster for videos when possible (non-blocking)
  useEffect(() => {
    let cancelled = false;

    async function maybeGeneratePoster(item: MediaItem) {
      if (item.type !== "video") return;
      if (item.poster) return;
      if (computedPosters[item.src]) return;

      try {
        await new Promise<void>((resolve, reject) => {
          const video = document.createElement("video");
          video.crossOrigin = "anonymous";
          video.src = item.src;
          video.muted = true;
          video.playsInline = true;

          const cleanup = () => {
            try {
              video.removeAttribute("src");
              // @ts-ignore
              video.load?.();
            } catch {}
          };

          const onLoaded = () => {
            try {
              const time = Math.min(
                0.5,
                video.duration ? Math.max(0, Math.min(0.5, video.duration / 10)) : 0
              );
              const onSeeked = () => {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = Math.min(640, video.videoWidth || 640);
                  canvas.height = Math.min(360, video.videoHeight || 360);
                  const ctx = canvas.getContext("2d");
                  if (!ctx) {
                    cleanup();
                    reject(new Error("Canvas 2D not available"));
                    return;
                  }
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                  if (!cancelled) setComputedPosters((prev) => ({ ...prev, [item.src]: dataUrl }));
                  cleanup();
                  resolve();
                } catch (err) {
                  cleanup();
                  reject(err);
                }
              };

              const onSeekErr = (ev: any) => {
                cleanup();
                reject(ev || new Error("Video seek error"));
              };

              // seek to frame
              video.currentTime = time;
              video.addEventListener("seeked", onSeeked, { once: true });
              video.addEventListener("error", onSeekErr, { once: true });
            } catch (err) {
              cleanup();
              reject(err);
            }
          };

          video.addEventListener("loadedmetadata", onLoaded, { once: true });
          video.addEventListener(
            "error",
            (e) => {
              cleanup();
              reject(new Error("Video load error"));
            },
            { once: true }
          );

          // safety timeout
          setTimeout(() => {
            cleanup();
            reject(new Error("Poster generation timeout"));
          }, 5000);
        });
      } catch {
        // ignore poster generation failures (CORS, etc)
      }
    }

    (async () => {
      for (const item of media) {
        if (cancelled) break;
        if (item.type === "video" && !item.poster && !computedPosters[item.src]) {
          maybeGeneratePoster(item).catch(() => {});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media]);

  // open at specific index
  function openAt(i: number) {
    setIndex(Math.max(0, Math.min(i, media.length - 1)));
    setOpen(true);
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    setOpen(false);
    document.body.style.overflow = "";
  }

  function prev() {
    setIndex((cur) => (media.length === 0 ? 0 : (cur - 1 + media.length) % media.length));
  }

  function next() {
    setIndex((cur) => (media.length === 0 ? 0 : (cur + 1) % media.length));
  }

  // keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, media.length]);

  if (!media || media.length === 0) return null;

  const active = media[index];
  const activePoster = active?.poster ?? computedPosters[active?.src ?? ""];

  return (
    <>
      {/* Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {media.map((m, i) => (
          <button
            key={i}
            onClick={() => openAt(i)}
            className="relative w-full h-28 rounded overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
            aria-label={m.alt || `${m.type}-${i}`}
            title={m.alt || `${m.type}-${i}`}
          >
            {m.type === "image" ? (
              <Image src={m.src} alt={m.alt || `image-${i}`} fill style={{ objectFit: "cover" }} />
            ) : (m.poster || computedPosters[m.src]) ? (
              <Image src={m.poster ?? computedPosters[m.src]} alt={m.alt || `video-${i}`} fill style={{ objectFit: "cover" }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-600">Video</div>
            )}

            <div className="absolute left-2 top-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {m.type === "video" ? "Video" : "Image"}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      {open && active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          onClick={closeModal}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <div
            className="relative z-10 w-full max-w-5xl bg-transparent rounded"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "85vh" }}
          >
            {/* Left big button (prev) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous"
              className="hidden md:flex items-center justify-center absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 hover:bg-black/80 text-white text-3xl shadow-2xl z-20 transition"
              title="Previous"
            >
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Right big button (next) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next"
              className="hidden md:flex items-center justify-center absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/60 hover:bg-black/80 text-white text-3xl shadow-2xl z-20 transition"
              title="Next"
            >
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Top-right close button (big round) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}
              aria-label="Close"
              className="absolute top-4 right-4 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/80 text-white text-2xl flex items-center justify-center shadow-2xl z-30 transition"
              title="Close"
            >
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Media content */}
            <div className="flex items-center justify-center p-6">
              {active.type === "image" ? (
                <div className="relative w-full h-[60vh] md:h-[70vh]">
                  <Image src={active.src} alt={active.alt || "image"} fill style={{ objectFit: "contain" }} />
                </div>
              ) : (
                <div className="w-full">
                  <video
                    key={active.src}
                    src={active.src}
                    controls
                    autoPlay
                    playsInline
                    className="w-full max-h-[70vh] bg-black rounded"
                    poster={activePoster ?? undefined}
                  />
                </div>
              )}
            </div>

            {/* Mobile small nav (bottom) */}
            <div className="md:hidden absolute left-1/2 -translate-x-1/2 bottom-6 z-20 flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous"
                className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next"
                className="w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center shadow"
              >
                ›
              </button>
            </div>

            {/* Footer / index */}
            <div className="mt-2 text-center text-white">
              <div>
                <span className="font-medium">{index + 1}</span> / {media.length} —{" "}
                <span className="text-sm">{active.alt ?? (active.type === "video" ? "Video" : "Image")}</span>
              </div>
              {active.type === "video" && !activePoster && !computedPosters[active.src] && (
                <div className="mt-1 text-xs text-amber-300">
                  Thumbnail not available (possible CORS). Video should still play if URL is public.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}