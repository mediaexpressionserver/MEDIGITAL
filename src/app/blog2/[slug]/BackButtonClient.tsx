// src/app/blog2/[slug]/BackButtonClient.tsx
"use client";

import BackButton from "@/components/BackButton";
import { useRouter } from "next/navigation";

export default function BackButtonClient() {
  const router = useRouter();

  const handleClick = async () => {
    const targetRoute = "/horizontalscrollwebsite";
    const hash = "#portfoliodesktop";

    // If already on the target route, try immediate smooth scroll
    try {
      if (typeof window !== "undefined" && window.location.pathname === targetRoute) {
        const el = document.getElementById("portfoliodesktop");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          try { history.replaceState(null, "", hash); } catch {}
          return;
        }
      }
    } catch { /* ignore */ }

    // Navigate, then dispatch an event after a short delay so destination can hydrate/listen
    try {
      await router.push(targetRoute);
    } catch (err) {
      console.warn("[BackButtonClient] router.push failed:", err);
    }

    // small delay; adjust to 200-500ms if your page needs more time
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent("header-scroll-to", { detail: hash }));
      } catch (err) {
        console.warn("[BackButtonClient] failed to dispatch header-scroll-to", err);
      }
    }, 250);
  };

  return (
    <div onClick={handleClick} style={{ display: "inline-block", cursor: "pointer" }}>
      <BackButton />
    </div>
  );
}