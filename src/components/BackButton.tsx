// FILE: src/components/BackButton.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-4 bg-[#EEAA45] text-white px-4 py-2 rounded hover:bg-[#d6953a] transition"
        aria-label="Go back"
      >
        ← Back
      </button>
    </div>
  );
}