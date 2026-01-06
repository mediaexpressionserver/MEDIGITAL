"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import AnimatedSmiley from "@/components/AnimatedSmiley";
import ServicePillList, { ServiceItem } from "@/components/Servicelist";
import logoData, { type LogoItem } from "@/data/logoData";
import Link from "next/link";
import ClientsCarousel from "@/components/ClientsCarousel";
import HeaderScrollListener from "@/components/HeaderScrollListener";
import useForceRepaintOnNav from "@/hooks/useForceRepaintOnNav";
import { StaticImport } from "next/dist/shared/lib/get-img-props";

const services: ServiceItem[] = [
  { label: "Social Media Marketing", iconSrc: "/images/Socialmediamarketting.png" },
  { label: "Google Ads", iconSrc: "/images/Googleads.png" },
  { label: "Performance Marketing", iconSrc: "/images/PFMarketing.png" },
  { label: "Organic Promotions", iconSrc: "/images/Organicmarketing.png" },
  { label: "Influencer Marketing", iconSrc: "/images/Influencer marketting.png" },
  { label: "Email Marketing", iconSrc: "/images/Emailmarketting.png" },
  { label: "Content Marketing", iconSrc: "/images/Contentmarketting.png" },
];

export default function HorizontalScrollWebsite() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const verticalSectionsRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const logoScrollRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [spacerHeight, setSpacerHeight] = useState<number>(0);
  const [viewportWidth, setViewportWidth] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showFullText, setShowFullText] = useState(false);


//useForceRepaintOnNav(containerRef);

  // inside your component render (replace the existing image block)


  // ---------- hooks & tiny handlers (paste here, only once) ----------
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLogo, setActiveLogo] = useState<LogoItem | null>(null);

  const openModal = (item: LogoItem) => {
    setActiveLogo(item);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setActiveLogo(null);
  };

  const scrollLogosLeft = () => {
    if (!logoScrollRef.current) return;
    logoScrollRef.current.scrollBy({ left: -240, behavior: "smooth" });
  };
  const scrollLogosRight = () => {
    if (!logoScrollRef.current) return;
    logoScrollRef.current.scrollBy({ left: 240, behavior: "smooth" });


  };

  const imageSrc = (activeLogo as any)?.logo || (activeLogo as any)?.logoUrl || (activeLogo as any)?.image;

{imageSrc ? (
  <div className="relative w-32 sm:w-40 md:w-48 h-16 sm:h-20 md:h-24 mx-auto">
    <Image
      src={imageSrc as string | StaticImport} // cast is safe because we checked existence
      alt={`${(activeLogo as any)?.clientName ?? (activeLogo as any)?.title ?? "client"} logo`}
      fill
      style={{ objectFit: "contain" }}
      unoptimized
    />
  </div>
) : null}
  // --------------------------------------------------------------------

  // REPLACE current handleNavClick with this improved version (keeps your mapping logic)
  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // allow /blog (or other full routes) to behave normally
    if (href === "/blog2") return;

    // only handle hash anchors here
    if (!href.startsWith("#")) {
      e.preventDefault();
      return;
    }
    e.preventDefault();

    try {
      const selector = href; // e.g. "#servicesdesktop"
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) {
        console.warn("Target not found:", selector);
        return;
      }

      // If viewport sizes not computed yet, fallback to simple scrolling
      if (!viewportWidth || !viewportHeight) {
        const topSimple = el.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: Math.max(0, Math.floor(topSimple)), behavior: "smooth" });
        // accessibility: focus the element after short delay
        setTimeout(() => {
          try {
            el.setAttribute("tabindex", "-1");
            el.focus({ preventScroll: true });
          } catch {}
        }, 350);
        return;
      }

      // Recreate the same geometry used by your scroll handler
      const horizontalSections = 3;
      const totalWidth = viewportWidth * horizontalSections;
      const horizontalScrollDistance = totalWidth - viewportWidth; // This is how much we need to scroll to see all sections

      const bufferZone = viewportHeight * 0.8;
      const transitionZone = viewportHeight * 1.2;

      const horizontalEnd = horizontalScrollDistance;
      const bufferEnd = horizontalEnd + bufferZone;
      const transitionEnd = bufferEnd + transitionZone;

      // helper: compute offsetLeft of `el` relative to `container` using offsetParent chain
      const computeOffsetLeftWithin = (child: HTMLElement, container: HTMLElement) => {
        let left = 0;
        let node: HTMLElement | null = child;
        while (node && node !== container && node.offsetParent instanceof HTMLElement) {
          left += node.offsetLeft;
          node = node.offsetParent as HTMLElement | null;
        }
        // if node === container, we have accumulated the offset; otherwise fall back to bounding rect method
        if (node === container) return left;
        // fallback (should be rare)
        const childRect = child.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        return Math.round(childRect.left - containerRect.left + (container.scrollLeft || 0));
      };

      // 1) If element lives inside the horizontal container -> compute offsetLeft and map to page Y
      const horizContainer = containerRef.current;
      if (horizContainer && horizContainer.contains(el)) {
        // Use offset-based calculation (robust across transforms)
        const offsetLeftInside = computeOffsetLeftWithin(el, horizContainer);

        // In your layout the page Y for horizontal sections equals the horizontal X offset (identity mapping)
        let targetY = offsetLeftInside;

        // Clamp to document bounds and scroll
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const finalY = Math.min(Math.max(0, targetY), maxScroll);
        window.scrollTo({ top: finalY, behavior: "smooth" });

        // accessibility focus after scroll
        setTimeout(() => {
          try {
            el.setAttribute("tabindex", "-1");
            el.focus({ preventScroll: true });
          } catch {}
        }, 450);

        return;
      }

      // 2) If element is inside the verticalSectionsRef -> compute transitionEnd + offsetTop
      const verticalContainer = verticalSectionsRef.current;
      if (verticalContainer && verticalContainer.contains(el)) {
        const offsetInsideVertical = Math.round(
          el.getBoundingClientRect().top - verticalContainer.getBoundingClientRect().top + (verticalContainer.scrollTop || 0)
        );

        const headerOffset = 0; // set if you have a fixed header
        let targetY = Math.max(0, Math.floor(transitionEnd + offsetInsideVertical - headerOffset));

        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const finalY = Math.min(targetY, maxScroll);

        window.scrollTo({ top: finalY, behavior: "smooth" });

        setTimeout(() => {
          try {
            el.setAttribute("tabindex", "-1");
            el.focus({ preventScroll: true });
          } catch {}
        }, 450);

        return;
      }

      // 3) Fallback: normal anchor (outside both special containers)
      const top = el.getBoundingClientRect().top + window.pageYOffset;
      const headerOffset = 0;
      const desired = Math.max(0, Math.floor(top - headerOffset));
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const finalTop = Math.min(desired, maxScroll);
      window.scrollTo({ top: finalTop, behavior: "smooth" });

      setTimeout(() => {
        try {
          el.setAttribute("tabindex", "-1");
          el.focus({ preventScroll: true });
        } catch {}
      }, 350);
    } catch (err) {
      console.error("handleNavClick error:", err);
    }
  };


 function forceRepaint(el: HTMLElement | null) {
    if (!el) return;
    try {
      // 1) apply a GPU layer hint (cheap)
      el.style.willChange = "transform, opacity";
      // 2) small transform to nudge the compositor
      el.style.transform = "translateZ(0)";
      // 3) force reflow
      // @ts-ignore
      void el.offsetHeight;
      // 4) tiny scroll nudge if it is scrollable (keeps layout intact)
      try {
        el.scrollBy?.({ left: 1, behavior: "instant" as any });
        el.scrollBy?.({ left: -1, behavior: "instant" as any });
      } catch {}
      // restore style (safe to leave willChange or clear it)
      el.style.transform = "";
      // clear will-change after a short delay so browser can optimize normally
      setTimeout(() => {
        try {
          el.style.willChange = "";
        } catch {}
      }, 300);
    } catch (err) {
      // fallback: force reflow only
      try {
        void el.getBoundingClientRect();
      } catch {}
    }
  }

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Run on first mount (next paint)
    requestAnimationFrame(() => forceRepaint(el));

    // Handler that calls repaint on navigation events
    const onVisible = () => forceRepaint(el);

    // pageshow fires on back/forward navigation (important)
    window.addEventListener("pageshow", onVisible);
    // popstate for some routers/browsers
    window.addEventListener("popstate", onVisible);
    // visibilitychange covers tab switching and some navigation scenarios
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") onVisible();
    });

    // optional: also handle resize (if layout depends on viewport)
    window.addEventListener("resize", onVisible);

    return () => {
      window.removeEventListener("pageshow", onVisible);
      window.removeEventListener("popstate", onVisible);
      document.removeEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") onVisible();
      });
      window.removeEventListener("resize", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  useEffect(() => {
  const el = containerRef.current;
  if (!el) return;

  // Delay until next paint so layout is complete
  requestAnimationFrame(() => {
    try {
      // tiny scroll nudge forces a repaint
      el.scrollBy({ left: 1, behavior: "instant" as any });
      el.scrollBy({ left: -1, behavior: "instant" as any });
    } catch {
      // fallback: force style reflow
      if (el) {
        // force reflow read
        void el.getBoundingClientRect();
        // force GPU layer repaint
        el.style.transform = "translateZ(0)";
      }
    }
  });
}, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // ----- NEW: centralized header-scroll-to handler
 // unified header-scroll + initial-hash handler
useEffect(() => {
  if (typeof window === "undefined") return;
  // compute geometry helper used for mapping element -> page Y when needed
  const getGeometry = () => {
    const vw = viewportWidth || window.innerWidth;
    const vh = viewportHeight || window.innerHeight;
    const horizontalSections = 3; // same as your layout
    const totalWidth = vw * horizontalSections;
    const horizontalScrollDistance = totalWidth - vw;
    const bufferZone = vh * 0.8;
    const transitionZone = vh * 1.2;
    const horizontalEnd = horizontalScrollDistance;
    const bufferEnd = horizontalEnd + bufferZone;
    const transitionEnd = bufferEnd + transitionZone;
    return { vw, vh, horizontalScrollDistance, horizontalEnd, bufferEnd, transitionEnd };
  };

  // helper: compute offsetLeft of `el` relative to `container` using offsetParent chain
  const computeOffsetLeftWithin = (child: HTMLElement, container: HTMLElement) => {
    let left = 0;
    let node: HTMLElement | null = child;
    while (node && node !== container && node.offsetParent instanceof HTMLElement) {
      left += node.offsetLeft;
      node = node.offsetParent as HTMLElement | null;
    }
    if (node === container) return left;
    // fallback to bounding rect if not found
    const childRect = child.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return Math.round(childRect.left - containerRect.left + (container.scrollLeft || 0));
  };

  const scrollContainerToElement = (el: HTMLElement) => {
    const container = containerRef.current;
    if (!container) return false;

    // compute offsetLeft inside container (works for nested children)
    const offsetLeftInside = computeOffsetLeftWithin(el, container);

    // Map horizontal X offset to window Y (your scroll -> transform mapping uses Y to set translateX)
    const targetY = Math.max(0, offsetLeftInside);
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({ top: Math.min(targetY, maxScroll), behavior: "smooth" });

    // focus accessibility
    setTimeout(() => {
      try { el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); } catch {}
    }, 450);
    return true;
  };

  const scrollWindowToVerticalElement = (el: HTMLElement) => {
    const geom = getGeometry();
    // if element is inside your vertical container, compute mapped Y:
    if (verticalSectionsRef.current && verticalSectionsRef.current.contains(el)) {
      const verticalRect = verticalSectionsRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      // offset inside the vertical container
      const offsetInside = Math.round(elRect.top - verticalRect.top + (verticalSectionsRef.current.scrollTop || 0));
      // map to page Y after the horizontal+buffer+transition
      const targetY = Math.max(0, Math.floor(geom.transitionEnd + offsetInside));
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: Math.min(targetY, maxScroll), behavior: "smooth" });
      setTimeout(() => { try { el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); } catch {} }, 450);
      return true;
    }

    // fallback: element is normal document child — use native scrollIntoView
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => { try { el.setAttribute("tabindex", "-1"); el.focus({ preventScroll: true }); } catch {} }, 350);
      return true;
    } catch {
      return false;
    }
  };

  // main handler which attempts container scroll first, then vertical mapping, then fallback
  const performScrollToHash = (hrefOrHash: string) => {
    const raw = String(hrefOrHash || (window.location.hash || ""));
    const id = raw.replace(/^#/, "");
    if (!id) return;
    // Try exact id first
    let el = document.getElementById(id);
    // fallback: try lowercase id if not present (defensive)
    if (!el) el = document.querySelector(`[id="${id.toLowerCase()}"]`) as HTMLElement | null;

    if (!el) {
      console.warn("[header-scroll-to] target element not found for:", id);
      return;
    }

    // If element is inside horizontal container -> scroll the window to the mapped Y
    if (containerRef.current && containerRef.current.contains(el)) {
      scrollContainerToElement(el);
      return;
    }

    // If element is in verticalSectionsRef or general page -> scroll window appropriately
    scrollWindowToVerticalElement(el);
  };

  // event listener for header dispatch
  const onHeaderEvent = (ev: Event) => {
    const detail = (ev as CustomEvent).detail;
    const href = typeof detail === "string" ? detail : (window.location.hash || "");
    // small timeout to ensure the page layout mounted after navigation
    setTimeout(() => performScrollToHash(href), 80);
  };

  // handle direct hash on initial load
  const handleInitialHash = () => {
    if (!window.location.hash) return;
    setTimeout(() => performScrollToHash(window.location.hash), 120);
  };

  window.addEventListener("header-scroll-to", onHeaderEvent);
  // also respond to normal hashchange in case user used browser navigation
  const onHashChange = () => performScrollToHash(window.location.hash);
  window.addEventListener("hashchange", onHashChange);

  // initial run
  handleInitialHash();

  return () => {
    window.removeEventListener("header-scroll-to", onHeaderEvent);
    window.removeEventListener("hashchange", onHashChange);
  };
}, [containerRef, verticalSectionsRef, viewportWidth, viewportHeight]);// depends on viewport sizes (mapping better when set)

  // Mobile detection (viewport-based, not user agent)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(max-width: 1024px)");

    const update = () => {
      try {
        // Layout should depend ONLY on viewport, not user agent.
        setIsMobile(Boolean(mq.matches));
      } catch {
        // fallback using viewport width
        const w = window.innerWidth || 0;
        setIsMobile(w <= 1024);
      }
    };

    update();

    // Modern browsers
    if (mq.addEventListener) {
      mq.addEventListener("change", update);
    } else {
      // Fallback for older Safari
      window.addEventListener("resize", update);
      window.addEventListener("orientationchange", update);
    }

    return () => {
      try {
        if (mq.removeEventListener) {
          mq.removeEventListener("change", update);
        } else {
          window.removeEventListener("resize", update);
          window.removeEventListener("orientationchange", update);
        }
      } catch {}
    };
  }, []);

  // Resize / initial sizes (only for desktop)
  useEffect(() => {
    if (isMobile) return;

    const updateSizes = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Calculate exact scroll distances
      const horizontalSections = 3;
      const totalWidth = vw * horizontalSections;
      const horizontalScrollDistance = totalWidth - vw;

      setContainerWidth(totalWidth);
      setViewportWidth(vw);
      setViewportHeight(vh);

      const bufferZone = vh * 0.8;
      const transitionZone = vh * 1.2;
      const verticalSections = 4.7;
      setSpacerHeight(horizontalScrollDistance + bufferZone + transitionZone + vh * verticalSections);

      if (containerRef.current) {
        containerRef.current.style.width = `${totalWidth}px`;
      }
    };

    updateSizes();
    window.addEventListener("resize", updateSizes);
    return () => window.removeEventListener("resize", updateSizes);
  }, [isMobile]);

  // send email api
  const API_URL = "/api/send-email";

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const form = e.currentTarget;

  const fd = new FormData(form);
  const payload = {
    name: fd.get("name")?.toString().trim() || "",
    email: fd.get("email")?.toString().trim() || "",
    mobile: fd.get("mobile")?.toString().trim() || "",
    message: fd.get("message")?.toString().trim() || "",
  };

  // basic guard — don’t waste API calls
  if (!payload.name || !payload.email || !payload.message) {
    alert("Please fill all required fields");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data?.error || "Send failed");
    }

    alert("✅ Message sent successfully");
    form.reset();
  } catch (err: any) {
    console.error("Send email failed:", err);
    alert("❌ Failed to send message. Please try again.");
  }
};

  // scroll-to-top helper (used by the floating button)
  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // ignore in non-browser contexts
    }
  };

  // show/hide state for the floating Home button
const [showHomeBtn, setShowHomeBtn] = useState(false);

useEffect(() => {
  if (typeof window === "undefined") return;
  const onScroll = () => {
    // show button when user scrolls down > 120px, hide when near top
    setShowHomeBtn(window.scrollY > 120);
  };
  // initialize state
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);

  // Hide horizontal overflow (only for desktop)
  useEffect(() => {
    if (isMobile) return;
    const prev = document.body.style.overflowX;
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = prev;
    };
  }, [isMobile]);



  //debug block

useEffect(() => {
  if (!containerRef.current) return;

  // prefer explicit selector, but fallback to direct child sections
  let sections = Array.from(containerRef.current.querySelectorAll('[data-horizontal-section]')) as HTMLElement[];

  if (!sections || sections.length === 0) {
    // fallback: use direct children that match full-viewport width (w-screen)
    sections = Array.from(containerRef.current.children).filter((ch) => {
      if (!(ch instanceof HTMLElement)) return false;
      // accept elements that have width roughly equal to viewport width
      const rect = ch.getBoundingClientRect();
      return Math.abs(rect.width - window.innerWidth) < 4; // small tolerance
    }) as HTMLElement[];
  }

  const scrollW = containerRef.current.scrollWidth;
  const clientW = containerRef.current.clientWidth;
  console.info(`[HORIZONTAL] found ${sections.length} sections; scrollWidth=${scrollW}; clientWidth=${clientW}; window.innerWidth=${window.innerWidth}`);
  // optional: list section ids/classes for debugging
  console.info(sections.map((s, i) => ({ idx: i, id: s.id || null, classes: s.className, width: s.getBoundingClientRect().width })));
}, [containerRef, containerWidth]);

  // Scroll handler (only for desktop) — kept your logic intact
  useEffect(() => {
    if (isMobile) return;

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY || window.pageYOffset;

        const horizontalScrollDistance = (viewportWidth * 3) - viewportWidth; // 2 * viewportWidth
        const bufferZone = viewportHeight * 0.8;
        const transitionZone = viewportHeight * 1.2;

        const horizontalEnd = horizontalScrollDistance;
        const bufferEnd = horizontalEnd + bufferZone;
        const transitionEnd = bufferEnd + transitionZone;

        if (y <= horizontalEnd) {
          // Phase 1: Horizontal scrolling (Hero → Ideas → Services)
          const x = (y / horizontalEnd) * horizontalScrollDistance;

          if (containerRef.current) {
            containerRef.current.style.transform = `translateX(-${x}px)`;
            containerRef.current.style.position = "fixed";
            containerRef.current.style.top = "0px";
            containerRef.current.style.zIndex = "30";
            containerRef.current.style.opacity = "1";
          }

          if (verticalSectionsRef.current) {
            verticalSectionsRef.current.style.opacity = "0";
            verticalSectionsRef.current.style.pointerEvents = "none";
            verticalSectionsRef.current.style.transform = "translateY(100vh)";
            verticalSectionsRef.current.style.position = "fixed";
            verticalSectionsRef.current.style.zIndex = "10";
          }
        } else if (y > horizontalEnd && y <= bufferEnd) {
          if (containerRef.current) {
            containerRef.current.style.transform = `translateX(-${horizontalScrollDistance}px)`;
            containerRef.current.style.position = "fixed";
            containerRef.current.style.top = "0px";
            containerRef.current.style.zIndex = "30";
            containerRef.current.style.opacity = "1";
          }

          if (verticalSectionsRef.current) {
            verticalSectionsRef.current.style.opacity = "0";
            verticalSectionsRef.current.style.pointerEvents = "none";
            verticalSectionsRef.current.style.transform = "translateY(100vh)";
            verticalSectionsRef.current.style.position = "fixed";
            verticalSectionsRef.current.style.zIndex = "10";
          }
        } else if (y > bufferEnd && y <= transitionEnd) {
          const transitionProgress = (y - bufferEnd) / transitionZone;
          const slideUpDistance = transitionProgress * viewportHeight;
          if (containerRef.current) {
            containerRef.current.style.transform = `translateX(-${horizontalScrollDistance}px) translateY(-${slideUpDistance}px)`;
            containerRef.current.style.position = "fixed";
            containerRef.current.style.top = "0px";
            containerRef.current.style.zIndex = "20";
            containerRef.current.style.opacity = `${1 - transitionProgress * 0.8}`;
          }

          if (verticalSectionsRef.current) {
            const slideInDistance = viewportHeight * (1 - transitionProgress);
            verticalSectionsRef.current.style.opacity = `${transitionProgress}`;
            verticalSectionsRef.current.style.pointerEvents = transitionProgress > 0.5 ? "auto" : "none";
            verticalSectionsRef.current.style.transform = `translateY(${slideInDistance}px)`;
            verticalSectionsRef.current.style.position = "fixed";
            verticalSectionsRef.current.style.zIndex = "25";
          }
        } else {
          const verticalScroll = y - transitionEnd;

          if (containerRef.current) {
            containerRef.current.style.transform = `translateX(-${horizontalScrollDistance}px) translateY(-${viewportHeight * 2}px)`;
            containerRef.current.style.position = "fixed";
            containerRef.current.style.zIndex = "10";
            containerRef.current.style.opacity = "0";
          }

          if (verticalSectionsRef.current) {
            verticalSectionsRef.current.style.opacity = "1";
            verticalSectionsRef.current.style.pointerEvents = "auto";
            verticalSectionsRef.current.style.transform = `translateY(-${verticalScroll}px)`;
            verticalSectionsRef.current.style.position = "fixed";
            verticalSectionsRef.current.style.zIndex = "30";
          }
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [viewportWidth, viewportHeight, isMobile]);
  // Mobile Layout
  if (isMobile) {
  return (
    
    <div className="min-h-screen bg-white">
      {/* Section 1 - Hero with extended orange rounded background */}
      <div className="relative w-full">
  <section
  className="relative w-full h-screen flex flex-col justify-center items-center text-white rounded-b-[3rem] overflow-hidden z-20 bg-[#EEAA45]"
  style={{
    backgroundImage: "url('/images/Bg_1.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
  {/* Top Bar */}
  <div className="flex items-center justify-between px-6 pt-6 absolute top-0 left-0 right-0 z-30">
    <Image
      src="/images/Logo.png"
      alt="Logo"
      width={100}
      height={40}
      className="cursor-pointer"
    />
    <button
      onClick={() => setMenuOpen(!menuOpen)}
      className="flex flex-col justify-between w-6 h-5 focus:outline-none z-40"
    >
      <span className="block h-0.5 bg-white rounded"></span>
      <span className="block h-0.5 bg-white rounded"></span>
      <span className="block h-0.5 bg-white rounded"></span>
    </button>
  </div>

  {/* Slide-in White Menu */}
<div
  className={`absolute top-0 right-0 w-72 h-[500px] landscape:h-[350px] bg-white text-black shadow-2xl transform transition-transform duration-300 z-50 ${
    menuOpen ? "translate-x-0" : "translate-x-full"
  } rounded-bl-2xl landscape:rounded-bl-2xl`}
  ref={menuRef}
>
  {/* Logo inside menu */}
  <div className="flex items-center justify-between px-6 pt-6 absolute top-0 left-0 right-0 z-30 translate-x-[80px]">
    <Image
      src="/images/Group1234.png"
      alt="Logo"
      width={100}
      height={40}
      className="cursor-pointer"
    />
  </div>

  {/* Menu Options */}
  <div className="flex flex-col items-start p-6 translate-y-[120px]">
    {[
      { label: "ABOUT US", href: "#ourwaydesktop" },
      { label: "SERVICES", href: "#servicesdesktop" },
      { label: "PORTFOLIO", href: "#portfoliodesktop" },
      { label: "BLOG", href: "/blog2" },
      { label: "REACH US", href: "#reachusdesktop" },
    ].map((item, index) => (
      <a
        key={index}
        href={item.href}
        className="text-lg font-semibold leading-[50px] landscape:leading-[50px]"
      >
        {item.label}
      </a>
    ))}
  </div>
</div>

  {/* Centered Content */}
  <div className="relative z-30 flex flex-col items-center justify-center text-center px-6 landscape:translate-x-[-100px] landscape:translate-y-[100px]">
    <AnimatedSmiley
      src="/images/Smiley.png"
      alt="Smiley"
      className="
        max-h-[300px]
        max-w-[300px]
        landscape:w-[200px]
        landscape:h-[200px]
        translate-y-[-100px]
        landscape:translate-x-[-200px]
        landscape:translate-y-[100px]
      "
    />
  </div>

  {/* Updated Text */}
  <div
    className="transform text-4xl font-extrabold text-white leading-snug translate-y-[80px] landscape:-translate-y-[80px] landscape:translate-x-[200px]"
    style={{
      textShadow: `
        -2px 0 0 #D59A3F,
        2px 0 0 #AF2648
      `,
    }}
  >
    <span>
      Digital is <br /> what&apos;s <br /> happening.
    </span>
  </div>

  {/* Chevron Down */}
  <div className="translate-y-[180px] landscape:translate-y-[-10px]">
    <ChevronDown className="w-10 h-10 text-white animate-bounce" />
  </div>
</section>
</div>
{/* Section 2 - Ideas */}
<section id="ourwaydesktop"
    className="relative -mt-24 min-h-screen flex flex-col p-6 bg-cover bg-center bg-no-repeat z-10 landscape:min-h-[130vh] "
  style={{
    backgroundImage: "url('/images/ofcework.png')",
  }}
>
  <div className="flex-1 flex flex-col justify-end items-start text-left pb-12">
  <div className="bg-black/60 backdrop-blur-sm p-6 rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.6)] text-white w-full max-w-[100%] mt-[100px]">
    <h2 className="text-4xl font-extrabold text-[#EEAA45] leading-tight mb-6 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.6)]">
      Ideas That<br />Break<br />Through.
    </h2>
    <p>
      We dont play it safe—we push ideas further. A team that tries,
      learns, and reinvents until your brand{" "}
      <span className="text-[#EEAA45]">speaks louder than the crowd.</span>
    </p>
    <p className="mt-4">
      Every idea begins as a spark — small, rough, and full of potential. What we do is nurture that spark into something memorable. We dive into insights, explore new angles, and shape concepts that feel alive. Our process is part intuition, part strategy, and entirely driven by passion.
    </p>
    <p className="mt-4">
      We experiment fearlessly, polishing every thought until it reflects clarity and purpose. We rethink, rework, and reinvent until the message feels effortless. For us, creativity isn’t a moment — it’s a commitment.
    </p>
    <p className="mt-4">
      We build ideas that connect emotionally, communicate intelligently, and stand confidently in a crowded world. Whether it’s a brand story, a campaign, or a single line of copy, we make sure it resonates. We’re here to craft work that feels distinctive, meaningful, and undeniably yours.
    </p>
    <p className="mt-4">
      Because for us, “good enough” is never enough.
    </p>
  </div>
</div>
</section>


  {/* Mobile Section 3 - Services (replaces existing mobile-only markup) */}
<section
  id="servicesdesktop"
  className="md:hidden w-screen bg-[#EEAA45] text-black py-8"
>
  <div className="max-w-screen-sm mx-auto px-6">
    {/* Heading (mobile-scaled version of desktop heading) */}
    <div className="text-center mb-6">
      <h2 className="text-3xl font-extrabold leading-snug">
        Need a digital<br />marketing partner?
      </h2>
      <p className="mt-3 text-sm text-black/90">
        Marketing doesn&apos;t have to be complicated. With us, it&apos;s
        smart, simple, and effective. Let&apos;s get started.
      </p>
    </div>

   

    {/* Service pill list (same component used on desktop) */}
    <div className="bg-white rounded-[20px] p-[30px] shadow-sm">
      {/* Use same props as desktop — tweak iconSize / overlap for mobile if needed */}
      <ServicePillList
        items={services}
        iconSize={48}        // slightly smaller for mobile
        iconInnerScale={0.65}
        overlap={0.5}
      />
    </div>

  </div>
</section>

{/* Mobile Section 4 - Our Way */}
<section
  className="min-h-screen text-white p-6 flex flex-col justify-center rounded-b-[3rem] overflow-hidden md:hidden relative z-10"
  style={{
    backgroundImage: "url('/images/digital-marketing.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
  {/* Content */}
  <div className="relative z-10">
    <div className="text-center mb-8">
      <h2 className="text-5xl font-extrabold text-[#EEAA45] mb-6">
        Our Way
      </h2>
    </div>

    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-extrabold text-[#EEAA45] mb-2">Listen</h3>
        <p className="text-white text-sm leading-relaxed">
          Every great idea begins with listening. We tune in closely to
          understand who our clients are, what they value, and what they
          truly need.
        </p>
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-extrabold text-[#EEAA45] mb-2">Reflect</h3>
        <p className="text-white text-sm leading-relaxed">
          Clear, thoughtful thinking is where creativity sparks. The
          sharper the thought, the stronger the idea.
        </p>
      </div>

      <div className="text-center">
        <h3 className="text-2xl font-extrabold text-[#EEAA45] mb-2">Create</h3>
        <p className="text-white text-sm leading-relaxed">
          Ideas alone are just words. When brought to life with purpose and
          precision, they evolve into impact — and sometimes, into legacies.
        </p>
      </div>
    </div>
  </div>
</section>

{/* Mobile Section 5 - Design Process */}
<section
  className="min-h-[100px] p-6 pt-20 flex flex-col justify-start relative bg-cover bg-center bg-no-repeat -mt-16"
  style={{
    backgroundImage: "url('/images/laptop-table.png')",
  }}
>
  {/* Optional dark overlay */}
  <div className="absolute inset-0 bg-black/40"></div>

  {/* Content wrapper with extra top spacing */}
  <div className="relative z-10 pt-[100px]">
    {/* Section Heading */}
    <div className="text-center mb-16">
      <h2 className="text-3xl font-extrabold text-[#EEAA45] mb-4">
        Our Design Process
      </h2>
      <p className="text-gray-200 text-base leading-relaxed">
        Reboot Your Brand in{" "}
        <span className="text-[#EEAA45]">4 Daring Steps.</span>
      </p>
    </div>

    {/* Cards Stack */}
    <div className="relative flex flex-col items-center">
      {/* Card 1 */}
      <div className="bg-[#EEAA45] text-white p-8 pt-[80px] h-80 w-[350px] rounded-2xl relative z-50 shadow-lg">
        <h3 className="text-2xl font-extrabold mb-4">Connect & Collaborate</h3>
        <p className="text-base leading-relaxed">
          We begin by immersing ourselves in your brand&apos;s universe. Our
          international client base feeds on trust, enduring partnerships, and
          solid referrals.
        </p>
      </div>

      {/* Card 2 */}
      <div className="bg-white text-gray-800 p-8 pt-[80px] h-80 w-[350px] rounded-b-2xl relative z-40 -translate-y-12 shadow-lg">
        <h3 className="text-2xl font-extrabold text-[#EEAA45] mb-4">
          Define Your Vision
        </h3>
        <p className="text-base leading-relaxed">
          Brilliant campaigns begin with crystal-clear objectives. We reveal your
          brand&apos;s purpose and develop targets that don&apos;t merely reach for the stars.
        </p>
      </div>

      {/* Card 3 */}
      <div className="bg-[#EEAA45] text-white p-8 pt-[80px] h-80 w-[350px] rounded-b-2xl relative z-30 -translate-y-24 shadow-lg">
        <h3 className="text-2xl font-extrabold mb-4">
          Develop a Winning Strategy
        </h3>
        <p className="text-base leading-relaxed">
          Our digital specialists don&apos;t merely plan; they create. We develop a
          vibrant, results-driven media strategy.
        </p>
      </div>

      {/* Card 4 */}
      <div className="bg-white text-gray-800 p-8 pt-[80px] h-80 w-[350px] rounded-b-2xl relative z-20 -translate-y-36 shadow-lg">
        <h3 className="text-2xl font-extrabold text-[#EEAA45] mb-4">
          Make It Happen
        </h3>
        <p className="text-base leading-relaxed">
          Concepts are only as good as their implementation. Our service and
          marketing teams work diligently.
        </p>
      </div>

    </div>
  </div>
</section>



{/* Mobile Section 6 - Portfolio */}
<section id = "portfoliodesktop"
  className="min-h-screen flex flex-col justify-center relative bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: "url('/images/Web page1.PNG')",
  }}
>
  {/* Dark overlay */}
  <div className="absolute inset-0 bg-black/60"></div>

  {/* Section Heading */}
  <div className="relative z-10 flex flex-col justify-center items-center text-center px-4 mb-12">
    <h2 className="text-3xl font-bold text-[#EEAA45] mb-2">
      Our Portfolio
    </h2>
    <h3 className="text-lg font-semibold text-[#EEAA45] mb-2">
      We Advertise. We Amaze.
    </h3>
    <p className="text-white text-sm leading-relaxed max-w-md">
      <span className="text-[#EEAA45]">&quot;Don’t tell, show&quot;</span> is our mantra. 
      Our work speaks — bold, impactful, unforgettable.
    </p>
  </div>

  {/* Dynamic Clients Carousel (replaces hardcoded logos) */}
  <div className="relative z-10 w-full bg-white py-10 flex justify-center items-center">
    {/* 
      ✅ This uses the same Supabase-powered ClientsCarousel 
      ✅ It’ll automatically fetch and render logos dynamically
    */}
    <div className="w-full max-w-none">
      <ClientsCarousel apiUrl="/api/clients" />
    </div>
  </div>
</section>

{/* Hide scrollbar utility */}
<style jsx>{`
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
`}</style>

       {/* Mobile Section 7 - Contact Form nash new 25 */}
<section id = "reachusdesktop"
  className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-center p-6"
  style={{
    backgroundImage: "url('/images/black-wired-phone-black-background 1.png')",
  }}
>
  {/* Dark overlay for contrast */}
  <div className="absolute inset-0 bg-black/0"></div>

  <div className="relative z-10 flex-1 flex flex-col justify-center items-center">
    {/* Heading */}
    <div className="text-center mb-8">
      <h2 className="text-7xl font-bold text-[#EEAA45] mb-4">
        Let&apos;s Talk!
      </h2>
      <p className="text-white text-sm leading-relaxed max-w-md mx-auto">
        Ready to elevate your brand? Fill our quick <br></br>form, and
        we&apos;ll connect soon.  Prefer email?<br></br>Reach us at <Link href="mailto:medigital2000@gmail.com" className="text-[#EEAA45]">medigital2000@gmail.com</Link>
      </p>
    </div>

    {/* Contact Form Card */}
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-6 w-full max-w-md">
      <h3 className="text-xl font-semibold text-[#EEAA45] mb-6 text-center">
        Reach out to us | Say hi
      </h3>

<form onSubmit={handleSubmit} className="space-y-6">
  <input
    type="text"
    name="name"
    placeholder="Name"
    required
    className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent focus:border-[#EEAA45] focus:outline-none text-gray-700 placeholder-gray-500"
  />

  <input
    type="email"
    name="email"
    placeholder="Email id"
    required
    className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent focus:border-[#EEAA45] focus:outline-none text-gray-700 placeholder-gray-500"
  />

  <input
    type="tel"
    name="mobile"
    placeholder="Mobile"
    className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent focus:border-[#EEAA45] focus:outline-none text-gray-700 placeholder-gray-500"
  />

  <textarea
    name="message"
    placeholder="Message"
    rows={3}
    required
    className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent focus:border-[#EEAA45] focus:outline-none text-gray-700 placeholder-gray-500 resize-none"
  />

  <div className="text-center">
    <button
      type="submit"
      className="bg-[#EEAA45] text-white px-8 py-3 rounded-lg hover:bg-[#EEAA45] transition-colors duration-300 font-medium"
    >
      Submit
    </button>
  </div>
</form>
    </div>
  </div>
</section>
        {/* Mobile Section 8 - Search and Footer (updated to match desktop content) */}
<section
  className="min-h-96 bg-black text-white p-6 flex flex-col justify-center items-center w-full"
  style={{
    backgroundImage: "url('/images/Bg_1.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
  <Image
    src="/images/Logo.png"
    alt="Logo"
    width={180}
    height={32}
    className="mb-6"
  />

  {/* Grid Content - stacked for mobile */}
  <div className="w-full max-w-md grid grid-cols-1 gap-8 text-center">
    <div>
      <h3 className="text-lg font-semibold mb-2">ABOUT US</h3>
      <p className="text-gray-300 leading-relaxed text-sm">
        Our dedicated media strategies has proven effective for numerous credible clients, all being leading players in the industry.
      </p>
    </div>

    <div>
      <h3 className="text-lg font-semibold mb-2">CONTACTS</h3>
      <p className="text-gray-300 leading-relaxed text-sm">
        Door No. 41/941, Pipeline Road,<br />
        Padivattom, Near Govt LP School, Padivattom, 682024, Kerala
      </p>


      <a
        href="tel:+918848226408"
        className="mt-4 font-semibold text-base hover:text-[#EEAA45] transition-colors block"
      >
        +91 88482 26408
      </a>
      <a
        href="tel:+9104842808241"
        className="mt-4 font-semibold text-lg hover:text-[#EEAA45] transition-colors"
      >
        0484 2808241
      </a>
      <br></br>
      <a
        href="mailto:info@mediaexpression.in"
        className="text-gray-300 mt-1 hover:text-[#EEAA45] transition-colors block text-sm"
      >
        info@mediaexpression.in
      </a>
    </div>

   

    <div>
      <h3 className="text-lg font-semibold mb-2">CREATIVE SERVICES</h3>
      <ul className="space-y-1 text-gray-300 text-sm">
        <li>Design Services</li>
        <li>Strategy Services</li>
        <li>Creative Content Development</li>
        <li>Market Research & Analysis</li>
        <li>Media Communication Services</li>
      </ul>
    </div>
  </div>

  {/* Social Media Icons */}
  <div className="flex justify-center space-x-6 mt-8">
    {[
      { src: "/images/Insta.png", alt: "Instagram", href: "https://www.instagram.com/me__digital/" },
      { src: "/images/Facebook.png", alt: "Facebook", href: "https://www.facebook.com/MediaExpressionDigital/" },
      { src: "/images/Youtube.png", alt: "YouTube", href: "https://www.youtube.com/@mediaexpressiondigital8057/featured" },
      { src: "/images/Linkedin.png", alt: "LinkedIn", href: "https://www.linkedin.com/company/mediaexpressiondigital/posts/?feedView=all" },
    ].map((social, i) => (
      <a
        key={i}
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 relative flex items-center justify-center hover:scale-110 transition-transform duration-300"
      >
        <Image src={social.src} alt={social.alt} width={40} height={40} className="object-contain" />
      </a>
    ))}
  </div>

  {/* Bottom Line + Copyright */}
  <div className="w-full h-[1px] bg-gradient-to-r from-[#EEAA45] via-gray-500 to-[#EEAA45] mt-8 max-w-md"></div>
  <p className="text-gray-400 text-sm mt-6">Media Expression © 2025. All rights reserved.</p>
</section>

      {/* Floating scroll-to-top button (mobile) */}
   {showHomeBtn && (
  <button
    type="button"
    onClick={scrollToTop}
    aria-label="Scroll to top"
    className="fixed bottom-6 right-6 z-50 bg-[#EEAA45] text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transform transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-[#EEAA45]/50 select-none"
  >
    <span className="font-semibold text-sm uppercase">Home</span>
  </button>
)}
      </div>
    );
  }

  // Desktop Layout (unchanged)
return (
  
  <div className="min-w-[1280px] overflow-x-auto">
    
    {!isMobile && <HeaderScrollListener />}
    {/* Horizontal fixed container */}
    <div
      ref={containerRef}
      data-horizontal-container
      className="fixed top-0 left-0 h-screen flex"
      style={{
        width: containerWidth ? `${containerWidth}px` : "300vw",
        transformOrigin: "top left",
        willChange: "transform",
        zIndex: 30,
      }}
    >

        {/* Section 1 - Hero */}
        <section data-horizontal-section 
          className="w-screen h-screen relative flex flex-col justify-between bg-black text-white"
          style={{
            backgroundImage: "url('/images/Bg_1.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Top Bar - Logo + Icons */}
          <div className="flex items-center justify-between px-10 pt-6">
            <div className="flex items-center space-x-6">
              <Image
                src="/images/Logo.png"
                alt="Logo"
                width={100}
                height={40}
                className="cursor-pointer"
              />
            <div className="flex justify-center space-x-6">
  {[
    { src: "/images/Insta.png", alt: "Instagram", href: "https://www.instagram.com/me__digital/" },
    { src: "/images/Facebook.png", alt: "Facebook", href: "https://www.facebook.com/MediaExpressionDigital/" },
    { src: "/images/Youtube.png", alt: "YouTube", href: "https://www.youtube.com/@mediaexpressiondigital8057/featured" }, // optional if you have one
    { src: "/images/Linkedin.png", alt: "LinkedIn", href: "https://www.linkedin.com/company/mediaexpressiondigital/posts/?feedView=all" },
  ].map((social, index) => (
    <a
      key={index}
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-8 h-8 relative flex items-center justify-center hover:scale-110 transition-transform duration-300"
    >
      <Image
        src={social.src}
        alt={social.alt}
        width={32}
        height={32}
        className="object-contain"
      />
    </a>
  ))}
</div>
            </div>
          </div>

        {/* Main Hero Content */}
<div className="flex flex-1 px-10 items-center justify-between">
  {/* Left Navigation Menu - Vertical Words */}
  <div className="flex flex-col items-center relative">
  <ul className="flex flex-col items-center space-y-[80px]">
  {[
    { label: "ABOUT US", href: "#ourwaydesktop" },
    { label: "SERVICES", href: "#servicesdesktop" },
    { label: "PORTFOLIO", href: "#portfoliodesktop" },
    { label: "BLOG", href: "/blog2" },
    { label: "REACH US", href: "#reachusdesktop" },
  ].map((item) => (
    <li
      key={item.href} // USE a stable unique key (href is unique here)
      className="text-gray-200 font-medium text-[9px] hover:text-[#EEAA45] transition-colors duration-300"
    >
      {item.href === "/blog2" ? (
        // New Link API — no legacyBehavior; pass className directly to Link
        <Link href="/blog2" className="inline-block transform -rotate-90 whitespace-nowrap cursor-pointer hover:text-[#EEAA45] transition-colors duration-300 px-1">
          {item.label}
        </Link>
      ) : (
        <a
          href={item.href}
          onClick={(e) => handleNavClick(e, item.href)}
          className="inline-block transform -rotate-90 whitespace-nowrap cursor-pointer hover:text-[#EEAA45] transition-colors duration-300 px-1"
        >
          {item.label}
        </a>
      )}
    </li>
  ))}
</ul>



    <div className="absolute right-[-30px] top-[-50px] h-[480px] w-[2px] bg-gray-500"></div>
  </div>

  {/* Center Hero Text */}
  <div className="flex flex-col items-start justify-center space-y-8">
    <div
      className="text-[70px] font-extrabold leading-snug max-w-lg text-white -translate-x-20"
      style={{
        textShadow: `
          -2px 0 0 #D59A3F,
          2px 0 0 #AF2648
        `,
      }}
    >
      <span>
        Digital is <br /> what&apos;s <br /> happening.
      </span>
    </div>

    <div className="flex items-center text-sm translate-y-[70px] -translate-x-28">
      <span className="text-[#FF9800] font-medium">Creative</span>
      <span className="mx-[20px] text-white text-lg">•</span>

      <span className="text-[#FF9800] font-medium">Web</span>
      <span className="mx-[20px] text-white text-lg">•</span>

      <span className="text-[#FF9800] font-medium">Performance</span>
      <span className="mx-[20px] text-white text-lg">•</span>

      <span className="text-[#FF9800] font-medium">Content</span>
    </div>
  </div>



            {/* Right Content - Smiley Image */}
<div
  className="relative flex-shrink-0
             scale-110 -translate-x-[180px] -translate-y-[0px]"
>
  <AnimatedSmiley
    src="/images/Smiley.png"
    alt="Smiley"
    // no translate/scale classes here — animation controls transforms
    className=""
    style={{
      maxWidth: "100%",
      height: "auto",
      width: viewportWidth ? viewportWidth * 0.25 + 80 : 300,
    }}
  />
</div>
          </div>
        </section>

        {/* Section 2 - Ideas */}
        <section id="ourwaydesktop" data-horizontal-section className="w-screen h-screen flex relative">
          <div
            className="flex-1 flex flex-col justify-center px-10 relative z-10 max-h-[80vh]"
            style={{ transform: "translateX(calc(clamp(24px, 4vw, 100px) + 50px)) translateY(calc(clamp(18px, 6vh, 100px) + 40px))" }}
          >
            <h2 className="text-5xl font-extrabold text-[#EEAA45]">
              Ideas That Break Through.
            </h2>
            <div className="mt-4 text-[15px] text-gray-600 w-full">
              <div className="pr-4 max-w-[600px]">
                <p>
                  We dont play it safe—we push ideas further. A team that tries,
                  learns, and reinvents until your brand <span className="text-[#EEAA45]">speaks louder than the crowd.</span>
                </p>
                <p className="mt-4">
                  Every idea begins as a spark — small, rough, and full of potential. What we do is nurture that spark into something memorable. We dive into insights, explore new angles, and shape concepts that feel alive. Our process is part intuition, part strategy, and entirely driven by passion.
                </p>
                <p className="mt-4">
                  We experiment fearlessly, polishing every thought until it reflects clarity and purpose. We rethink, rework, and reinvent until the message feels effortless. For us, creativity isn’t a moment — it’s a commitment.
                </p>
                <p className="mt-4">
                  We build ideas that connect emotionally, communicate intelligently, and stand confidently in a crowded world. Whether it’s a brand story, a campaign, or a single line of copy, we make sure it resonates. We’re here to craft work that feels distinctive, meaningful, and undeniably yours.
                </p>
                <p className="mt-4">
                  Because for us, “good enough” is never enough.
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <Image
              src="/images/ofcework.png"
              alt="Office Work"
              fill
              style={{ objectFit: "contain" }}
              priority
              className="transition-all duration-300"
            />
          </div>
        </section>

        {/* Section 3 - Services (stable when zooming) */}
<section
  data-horizontal-section
  id="servicesdesktop"
  className="w-screen h-screen flex flex-nowrap items-center px-12 bg-gray-200"
  style={{ minWidth: "1200px" }} // keeps layout from collapsing on zoom-out (adjust as needed)
>
  {/* Left column: service pills (kept constrained) */}
  <div className="flex-shrink-0 w-[420px] p-6 translate-x-[800px]">
    <div className="max-w-[400px] mx-auto">
      <ServicePillList
        items={services}
        iconSize={60}
        iconInnerScale={0.7}
        overlap={0.55}
      />
    </div>
  </div>

  {/* Right column: text — use padding instead of translate to shift */}
  <div className="flex-1 min-w-0 translate-x-[-300px]">
    <div className="max-w-2xl pl-6">
      <h2 className="text-5xl lg:text-7xl font-extrabold text-black mb-4 leading-tight">
        Need a <br />digital<br />marketing<br />partner?
      </h2>

      <div className="w-3/4 h-[2px] bg-black my-4" />

      <p className="text-gray-600 text-base lg:text-[15px] max-w-lg my-5">
        Marketing doesn&apos;t have to be complicated. With us, it&apos;s smart,
        simple, and effective. Let&apos;s get started.
      </p>

      <div className="w-3/4 h-[2px] bg-black mt-4" />
    </div>
  </div>
</section>
      </div>

      {/* Vertical Sections Container */}
      <div
        ref={verticalSectionsRef}
        className="fixed top-0 left-0 w-screen"
        style={{
          height: `${viewportHeight * 5}px`, // Updated from 2 to 5
          opacity: 0,
          pointerEvents: 'none',
          transform: 'translateY(100vh)',
          willChange: 'transform, opacity',
          zIndex: 25,
        }}
      >
        {/* Section 4 - Digital Marketing */}
        <section 
          className="w-screen h-screen relative flex flex-col justify-center items-center bg-black text-white"
          style={{
            backgroundImage: "url('/images/digital-marketing.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="text-left z-10">
  <h2
    className="text-6xl font-extrabold text-[#EEAA45] mb-6 translate-x-[-370px] translate-y-[100px]"
    style={{
      textShadow: "4px 4px 12px rgba(0, 0, 0, 0.6)"
    }}
  >
    Our Way
  </h2>
</div>

          <div className="relative flex flex-col items-center text-center text-white mt-20 translate-y-[50px]">
  {/* === Headings row === */}
  <div className="grid grid-cols-3 gap-12 w-full max-w-5xl mb-3 "
  style={{
      textShadow: "4px 4px 12px rgba(0, 0, 0, 0.6)"
    }}
  >
    <div>
      <h2 className="text-3xl font-extrabold text-[#e29a4d] mb-1">Listen</h2>
    </div>
    <div>
      <h2 className="text-3xl font-extrabold text-[#e29a4d] mb-1">Reflect</h2>
    </div>
    <div>
      <h2 className="text-3xl font-extrabold text-[#e29a4d] mb-1">Create</h2>
    </div>
  </div>

  {/* === Orange line + white arrows === */}
  <div className="relative w-full max-w-5xl mb-8">
    {/* orange line */}
    <div className="h-[2px] bg-[#e29a4d] w-full" />

    {/* arrows */}
    <div
      className="absolute left-[16.6%] -translate-x-1/2"
      style={{ top: "100%" }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "10px solid white",
        }}
      />
    </div>
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{ top: "100%" }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "10px solid white",
        }}
      />
    </div>
    <div
      className="absolute left-[83.3%] -translate-x-1/2"
      style={{ top: "100%" }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "8px solid transparent",
          borderRight: "8px solid transparent",
          borderTop: "10px solid white",
        }}
      />
    </div>
  </div>

  {/* === Paragraphs row === */}
  <div className="grid grid-cols-3 gap-12 w-full max-w-5xl text-left">
    {/* Listen */}
    <div>
      <p className="text-white text-[14px] leading-relaxed max-w-xs">
        Every great idea begins with<br></br>
listening. We tune in closely to<br></br>
understand who our clients are,<br></br>
what they value, and what they<br></br>
truly need.
      </p>
    </div>

    {/* Reflect */}
    <div>
      <p className="text-white text-[14px] leading-relaxed max-w-xs">
        Clear, thoughtful thinking is<br></br>
where creativity sparks. The<br></br>
sharper the thought, the<br></br>
stronger the idea.
      </p>
    </div>

    {/* Create */}
    <div>
      <p className="text-white text-[14px] leading-relaxed max-w-xs">
        Ideas alone are just words. When<br></br>
brought to life with purpose and<br></br>
precision, they evolve into impact — and sometimes, into<br></br>legacies.
      </p>
    </div>
  </div>
</div>
        </section>

      {/* Section 5 - Design Process */}
      <section className="w-screen h-screen flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left: Image side with overlay and text */}
        <div className="relative w-full lg:w-[470px] h-[50vh] lg:h-full translate-x-[156px]">
          <Image
            src="/images/laptop-table.png"
            alt="Design Process"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black bg-opacity-30" />

       
        </div>

        {/* Right: Text side */}
        
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-10 py-10 translate-x-[330px] translate-y-[-150px]">
          <div className="mb-10">
            <h2 className="text-[220px] font-extrabold text-[#EEAA45] leading-tight translate-x-[-160px] translate-y-[230px]">4</h2>
            <h2 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold text-[#EEAA45] leading-tight">Daring<br />Steps.</h2>
            <p className="text-xl text-gray-700 mt-2">
              Reboot Your Brand in <span className="text-[#EEAA45] font-semibold">4 Daring Steps.</span>
            </p>
          </div>

          <div className="max-w-2xl mb-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start" style={{ transform: 'translateX(-135px)' }}>
                <div className="text-left" style={{ transform: 'translateX(-55px)' }}>
                  <h3 className="text-2xl font-bold text-[#EEAA45] mb-2">Connect &amp; Collaborate</h3>
                  <p className="text-sm text-gray-700">
                    We begin by immersing ourselves in your brand&apos;s universe. Our international client base feeds on trust, partnerships, and solid referrals.
                  </p>
                </div>

                <div className="text-left">
                  <h3 className="text-2xl font-bold text-[#EEAA45] mb-2">Make It Happen</h3>
                  <p className="text-sm text-gray-700">
                    Concepts are only as good as their implementation. Our teams execute with precision and creativity to deliver impactful results.
                  </p>
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-2xl" style={{ transform: "translateX(clamp(-260px, -10vw, -190px)) translateY(clamp(18px, 6vh, 50px))" }}>
              <div>
                <h3 className="text-2xl font-bold text-[#EEAA45] mb-1">Define Your Vision</h3>
                <p className="text-sm text-gray-600">
                  Brilliant campaigns begin with clear objectives. We reveal your brand’s purpose and build a roadmap that connects strategy to results.
                </p>
              </div>
              <div style={{ transform: "translateX(clamp(12px, 3vw, 50px))" }}>
                <h3 className="text-2xl font-bold text-[#EEAA45] mb-1">Develop a Winning Strategy</h3>
                <p className="text-sm text-gray-600">
                  Our specialists craft distinctive, results-driven strategies tailored to your brand and audience.
                </p>
              </div>
            </div>
          </div>
      </section>

{/* Section 6 - Portfolio */}
<section
  data-horizontal-section
  id="portfoliodesktop"
  className="w-screen h-screen relative flex items-center justify-between overflow-visible  translate-x-0 bg-cover bg-center bg-no-repeat"
  style={{ backgroundImage: "url('/images/Web page1.PNG')" }}
>
  {/* Left side - Rectangle image */}
  <div className="w-1/2 relative h-screen flex items-center justify-start translate-x-[156px]">
    <div className="w-[470px] h-screen relative">
      
      {/* black transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-65 z-10" />
    </div>
  </div>

 
  <div className="absolute inset-0 rounded-lg flex flex-col justify-center items-start p-8 translate-y-[-150px] translate-x-[150px] z-20 pointer-events-none">
    <h2 className="text-5xl font-bold text-[#EEAA45] mb-4 pointer-events-auto">
      Our Portfolio
    </h2>
    <h1 className="text-2xl font-semibold text-[#EEAA45] mb-2 pointer-events-auto">
      We Advertise.<br />We Amaze.
    </h1>
    <p className="text-white text-[10px] leading-relaxed pointer-events-auto">
      <span className="text-[#EEAA45]">“Don’t tell, show”</span> is our mantra. Our work speaks—bold,<br />
      impactful, unforgettable. Explore our portfolio and see<br />
      the difference!
    </p>
  </div>

  {/* ABSOLUTE full-bleed carousel at the bottom of Section 6 */}
<div className="absolute left-0 right-0 bottom-0 z-30">
  <div className="w-full bg-white shadow-xl h-[200px] flex items-center justify-center">
    {/* You can adjust h-[400px] → 300px / 500px depending on your design */}
    <div className="w-full max-w-none">
      <ClientsCarousel apiUrl="/api/clients" />
    </div>
  </div>
</div>
</section>


{/* Simple Modal (keep this after the carousel) */}
{modalOpen && activeLogo && (
  <div
    role="dialog"
    aria-modal="true"
    className="fixed inset-0 z-50 flex items-center justify-center px-4"
    onClick={closeModal}
  >
    <div className="absolute inset-0 bg-black/60" />
    <div
      className="relative z-10 max-w-lg w-full bg-white rounded-2xl shadow-xl p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={closeModal}
        className="absolute top-3 right-3 text-gray-600 hover:text-black"
      >
        ✕
      </button>

      <div className="flex justify-center mb-4">
        <div className="relative w-48 h-20">
          {activeLogo?.src ? (
            <Image
              src={activeLogo.src as string | StaticImport}
              alt={activeLogo.title || "client logo"}
              fill
              style={{ objectFit: "contain" }}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
        {activeLogo.title}
      </h3>
      <p className="text-center text-gray-700 text-sm leading-relaxed">
        {activeLogo.body}
      </p>
    </div>
  </div>
)}

        {/* Section 7 - Contact Form */}
        <section  id="reachusdesktop" className="w-screen h-screen relative flex items-center justify-between bg-white px-10" >
          {/* Left side - Rectangle image with content */}
          <div className="w-1/2 relative h-full flex items-center justify-start translate-x-[116px]">
            <div className="w-[470px] h-screen relative">
              <Image
                src="/images/black-wired-phone-black-background 1.png" // Replace with your image path
                alt="Contact Rectangle"
                fill
                style={{ objectFit: "cover" }}
                
              />
              {/* Content overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-60 rounded-lg flex flex-col justify-center items-start p-8">
                <h2 className="text-5xl font-bold text-[#EEAA45] mb-6">
                  Let&apos;s<br />
                  Talk!
                </h2>
                <p className="text-white text-sm leading-relaxed">
                  Ready to elevate your brand? Fill our quick form, and<br />
                  we&apos;ll connect soon. Prefer email? Reach us at<br />
                   <Link href="mailto:medigital2000@gmail.com" className="text-[#EEAA45]">medigital2000@gmail.com</Link>
      
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Contact Form */}
          <div id="reachouttous" className="w-1/2 flex flex-col items-center justify-center px-10 " > 
            <div className="w-full max-w-md">
              <h3 className="text-2xl font-semibold text-[#EEAA45] mb-2">
                Reach out to us | Say hi
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6 mt-8">
  <div>
    <input
      type="text"
      name="name"
      placeholder="Name"
      required
      className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent focus:border-[#EEAA45] focus:outline-none text-gray-700 placeholder-gray-400"
    />
  </div>

  <div>
    <input
      type="email"
      name="email"
      placeholder="Email id"
      required
      className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent focus:border-[#EEAA45] focus:outline-none text-gray-700 placeholder-gray-400"
    />
  </div>

  <div>
    <input
      type="tel"
      name="mobile"
      placeholder="Mobile"
      className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent focus:border-[#EEAA45] focus:outline-none text-gray-700 placeholder-gray-400"
    />
  </div>

  <div>
    <textarea
      name="message"
      placeholder="Message"
      rows={3}
      required
      className="w-full px-0 py-3 border-0 border-b-2 border-gray-300 bg-transparent focus:border-[#EEAA45] focus:outline-none text-gray-700 placeholder-gray-400 resize-none"
    />
  </div>

  <button
    type="submit"
    className="bg-[#EEAA45] text-white px-8 py-2 rounded-lg hover:bg-[#EEAA45] transition-colors duration-300 font-medium"
  >
    Submit
  </button>
</form>
            </div>
          </div>
        </section>

        {/* Section 8 - Search and Logos */}
        <section
  className="w-screen py-20 px-6 bg-black text-white flex flex-col items-center justify-center"
  style={{
    backgroundImage: "url('/images/Bg_1.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
  {/* Grid Content */}
  <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-4 gap-12">

    {/* ABOUT US */}
    <div>
      <h3 className="text-lg font-semibold mb-4">ABOUT US</h3>
      <p className="text-gray-300 leading-relaxed">
        Our dedicated media strategies has
        proven effective for numerous credible
        clients, all being leading players in the
        industry.
      </p>
    </div>

    {/* CONTACTS */}
    <div>
      <h3 className="text-lg font-semibold mb-4">CONTACTS</h3>
      <p className="text-gray-300 leading-relaxed">
        Door No. 41/941, Pipeline Road,<br />
        Padivattom, Near Govt LP<br />
        School, Padivattom, 682024,<br />
        Kerala
      </p>

      <a
        href="https://maps.google.com/maps/place//data=!4m2!3m1!1s0x3b080d1caa1c847d:0xe65338c1c3b6b820?entry=s&sa=X&ved=2ahUKEwj6xqrF8ICRAxV7SmwGHSqAOsAQ4kB6BAgEEAA"
        target="_blank"
        rel="noopener noreferrer"
        className="underline block mt-2"
      >
        View on Google Map
      </a>

      <a
        href="tel:+918848226408"
        className="mt-4 font-semibold text-lg hover:text-[#EEAA45] transition-colors"
      >
        +91 88482 26408
      </a>
      <br></br>
      <a
        href="tel:+9104842808241"
        className="mt-4 font-semibold text-lg hover:text-[#EEAA45] transition-colors"
      >
        0484 2808241
      </a>
<br></br>
      <a
        href="mailto:info@mediaexpression.in"
        className="text-gray-300 mt-1 hover:text-[#EEAA45] transition-colors"
      >
        info@mediaexpression.in
      </a>
    </div>

    

    {/* CREATIVE SERVICES */}
    <div>
      <h3 className="text-lg font-semibold mb-4">CREATIVE SERVICES</h3>
      <ul className="space-y-2 text-gray-300">
        <li>Design Services</li>
        <li>Strategy Services</li>
        <li>Creative Content Development</li>
        <li>Market Research & Analysis</li>
        <li>Media Communication Services</li>
      </ul>
    </div>

    {/* smiley image */}
    <div className="flex flex-col items-center justify-center">
      <Image
        src="/images/Logo.png"
        alt="Smiley"
        width={200}
        height={200}
        className="object-contain"
      />
    </div>
  </div>

  {/* Social Media Icons */}
  <div className="flex items-center justify-center space-x-8 mt-16 translate-y-[-50px]">
    {[
      { src: "/images/Insta.png", alt: "Instagram", href: "https://www.instagram.com/me__digital/" },
      { src: "/images/Facebook.png", alt: "Facebook", href: "https://www.facebook.com/MediaExpressionDigital/" },
      { src: "/images/Youtube.png", alt: "YouTube", href: "https://www.youtube.com/@mediaexpressiondigital8057/featured" },
      { src: "/images/Linkedin.png", alt: "LinkedIn", href: "https://www.linkedin.com/company/mediaexpressiondigital/posts/?feedView=all" },
    ].map((social, i) => (
      <a
        key={i}
        href={social.href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 relative flex items-center justify-center hover:scale-110 transition-transform duration-300"
      >
        <Image
          src={social.src}
          alt={social.alt}
          width={40}
          height={40}
          className="object-contain"
        />
      </a>
    ))}
  </div>

  {/* Bottom Text */}
  <div className="w-full h-[1px] bg-gradient-to-r from-[#EEAA45] via-gray-500 to-[#EEAA45] mt-10 translate-y-[-80px]"></div>
  <p className="text-gray-400 text-sm mt-10 translate-y-[-100px]">
    Media Expression © 2025. All rights reserved.
  </p>
</section>


      </div>

      {/* Spacer for total scroll height */}
      <div
        style={{
          height: spacerHeight ? `${Math.max(0, spacerHeight + 50)}px` : "1600vh",
        }}
      />
      {/* Floating scroll-to-top button (desktop) */}
  {showHomeBtn && (
  <button
    type="button"
    onClick={scrollToTop}
    aria-label="Scroll to top"
    className="fixed bottom-6 right-6 z-50 bg-[#EEAA45] text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transform transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-[#EEAA45]/50 select-none"
  >
    <span className="font-semibold text-sm uppercase">Home</span>
  </button>
)}
    </div>
  );
};

