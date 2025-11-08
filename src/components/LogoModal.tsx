// src/components/LogoModal.tsx
"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import type { ClientItem } from "@/components/ClientsCarousel";

type Props = {
  open: boolean;
  onClose: () => void;
  item: ClientItem | null;
};

export default function LogoModal({ open, onClose, item }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (typeof window !== "undefined" && open) window.addEventListener("keydown", onKey);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal panel */}
      <div
        className="relative z-10 max-w-lg w-full bg-white rounded-2xl shadow-xl p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="relative w-48 h-20">
            {item.logo ? (
              <Image
                src={item.logo}
                alt={item.title ?? "client logo"}
                fill
                style={{ objectFit: "contain" }}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                No logo
              </div>
            )}
          </div>
        </div>

        {/* Title & body */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
          {item.title}
        </h3>
        <div className="text-sm text-gray-700 leading-relaxed text-center">
          {/* body may contain HTML — keep it consistent with your carousel */}
          <div dangerouslySetInnerHTML={{ __html: item.body ?? "" }} />
        </div>
      </div>
    </div>
  );
}