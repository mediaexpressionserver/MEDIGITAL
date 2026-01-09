// src/components/BackButton.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  const handleClick = async () => {
    const targetRoute = "/Home";

    // If already on target route, smooth-scroll immediately
    try {
      if (typeof window !== "undefined" && window.location.pathname === targetRoute) {
        const el = document.getElementById("portfoliodesktop");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          try {
            history.replaceState(null, "", "#portfoliodesktop");
          } catch {
            /* ignore */
          }
          return;
        }
      }
    } catch {
      // ignore
    }

    // Otherwise navigate to the route and dispatch event for destination to scroll
    try {
      await router.push(targetRoute);
    } catch (err) {
      console.warn("[BackButton] router.push failed:", err);
    }

    // Slight delay so the destination page can hydrate / install its listener, then ask it to scroll
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent("header-scroll-to", { detail: "#portfoliodesktop" }));
      } catch (err) {
        console.warn("[BackButton] failed to dispatch header-scroll-to event", err);
      }
    }, 200);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="mb-4 bg-[#EEAA45] text-white px-4 py-2 rounded hover:bg-[#d6953a] transition"
        aria-label="Go back"
      >
        ← Back
      </button>
    </div>
  );
}