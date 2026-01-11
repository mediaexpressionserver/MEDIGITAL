"use client";

import React, { useEffect, useState, useCallback } from "react";
import BackButton from "@/components/BackButton";
import { useRouter } from "next/navigation";

export default function BackButtonClient() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const detectMobile = useCallback(() => {
    try {
      const ua =
        (typeof navigator !== "undefined" && (navigator.userAgent || navigator.vendor)) ||
        (typeof (window as any) !== "undefined" && (window as any).opera) ||
        "";
      const isTabletOrMobileUA =
        /iPhone|iPod|Android|Mobile|iPad|Tablet|PlayBook|Silk/i.test(ua);
      const width = typeof window !== "undefined" ? window.innerWidth : 0;
      const height = typeof window !== "undefined" ? window.innerHeight : 0;
      const isSmallScreen = width <= 1024 && height <= 1366;
      const isDesktopMac = /Macintosh/i.test(ua) && !/iPad/i.test(ua);
      const shouldUseMobileLayout = !isDesktopMac && (isTabletOrMobileUA || isSmallScreen);
      setIsMobile(Boolean(shouldUseMobileLayout));
    } catch {
      setIsMobile(false);
    }
  }, []);

  useEffect(() => {
    detectMobile();
    // update on resize / orientation change
    const onResize = () => detectMobile();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
      }
    };
  }, [detectMobile]);

  const handleDesktopClick = () => {
    const targetUrl = "/Home#portfoliodesktop";

    // Always navigate with hash in a single step
    try {
      router.push(targetUrl);
    } catch (err) {
      console.warn("[BackButtonClient] router.push failed:", err);
    }
  };

  // Mobile behavior
  const handleMobileClick = () => {
    if (typeof window !== "undefined" && window.history && window.history.length > 0) {
      try {
        window.history.back();
      } catch (err) {
        console.warn("[BackButtonClient] history.back failed:", err);
      }
    } else {
      // fallback: navigate to a safe location if no history exists
      try {
        router.push("/");
      } catch {}
    }
  };

  const handleClick = isMobile ? handleMobileClick : handleDesktopClick;

  return (
    <div
      onClick={handleClick}
      style={{ display: "inline-block", cursor: "pointer" }}
      role="button"
      aria-label="Back"
    >
      <BackButton />
    </div>
  );
}