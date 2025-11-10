// src/components/LogoModal.tsx
import React, { useEffect } from "react";
import Image from "next/image";
import type { LogoItem } from "@/data/logoData";

type Props = {
  open: boolean;
  onClose: () => void;
  item: LogoItem | null;
};

export default function LogoModal({ open, onClose, item }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
            <Image
              src={item.src || "/images/placeholder.png"}
              alt={item.title || "Client logo"}
              fill
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Title & body */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{item.title}</h3>
        <p className="text-sm text-gray-700 leading-relaxed text-center">{item.body}</p>
      </div>
    </div>
  );
}