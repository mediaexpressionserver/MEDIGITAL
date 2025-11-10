// src/components/HeaderScrollListener.tsx
"use client";

import { useEffect } from "react";

/**
 * Robust scroll-to-hash listener that:
 * - detects the closest scrollable container (window or an ancestor with overflow/scroll)
 * - computes element position relative to that container and scrolls it
 * - retries a few times for async content
 *
 * Mount this component on the page that contains your section IDs.
 * It listens for:
 *  - window.location.hash on mount
 *  - 'header-scroll-to' CustomEvent (dispatched by Header after router.push)
 *  - hashchange/popstate
 */

function isScrollable(el: Element | null) {
  if (!el || !(el instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;
  const overflowX = style.overflowX;
  const canScrollY = (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
  const canScrollX = (overflowX === "auto" || overflowX === "scroll") && el.scrollWidth > el.clientWidth;
  return canScrollY || canScrollX;
}

function findScrollableAncestor(el: HTMLElement | null) {
  let cur: HTMLElement | null = el;
  while (cur) {
    if (isScrollable(cur)) return cur;
    cur = cur.parentElement;
  }
  // fallback: documentElement if it scrolls, otherwise window
  if (document.documentElement && (document.documentElement.scrollHeight > document.documentElement.clientHeight || document.documentElement.scrollWidth > document.documentElement.clientWidth)) {
    return document.documentElement;
  }
  return null;
}

function getElementRectRelativeToContainer(el: HTMLElement, container: HTMLElement | Document | Window) {
  const elRect = el.getBoundingClientRect();

  if (container === window) {
    return { top: elRect.top + window.scrollY, left: elRect.left + window.scrollX };
  }

  if (container instanceof Document) {
    return { top: elRect.top + window.scrollY, left: elRect.left + window.scrollX };
  }

  // container is an HTMLElement
  const containerRect = (container as HTMLElement).getBoundingClientRect();
  const top = elRect.top - containerRect.top + (container as HTMLElement).scrollTop;
  const left = elRect.left - containerRect.left + (container as HTMLElement).scrollLeft;
  return { top, left };
}

function scrollContainerTo(container: HTMLElement | Document | Window, top: number, left: number, behavior: ScrollBehavior = "smooth") {
  try {
    if (container === window || container === document) {
      window.scrollTo({ top, left, behavior });
      return;
    }
    (container as HTMLElement).scrollTo({ top, left, behavior });
  } catch {
    // older browsers might not support options, fall back:
    try {
      if (container === window || container === document) {
        window.scrollTo(left, top);
      } else {
        (container as HTMLElement).scrollTo(left, top);
      }
    } catch {
      /* ignore */
    }
  }
}

function tryScrollToId(id: string, opts?: { offset?: number; retries?: number; horizontal?: boolean }) {
  if (!id) return;
  const offset = opts?.offset ?? 0;
  const maxRetries = opts?.retries ?? 8;
  let attempts = 0;

  const attempt = () => {
    attempts += 1;
    const el = document.getElementById(id);
    if (!el) {
      if (attempts <= maxRetries) {
        window.setTimeout(attempt, 70 * attempts);
      }
      return;
    }

    // find closest scrollable ancestor of the element (excluding the element itself)
    const scrollableAncestor = findScrollableAncestor(el.parentElement) || document.documentElement || window;
    const rect = getElementRectRelativeToContainer(el, scrollableAncestor);

    // If ancestor is window/documentElement, use top/left as absolute doc position
    let targetTop = Math.max(0, Math.floor(rect.top - offset));
    let targetLeft = Math.max(0, Math.floor(rect.left - offset));

    // If ancestor is an HTMLElement, adjust for its current scroll (getElementRectRelativeToContainer did that)
    if (scrollableAncestor instanceof HTMLElement) {
      // ensure we don't overshoot (clamp)
      const maxTop = scrollableAncestor.scrollHeight - scrollableAncestor.clientHeight;
      const maxLeft = scrollableAncestor.scrollWidth - scrollableAncestor.clientWidth;
      targetTop = Math.min(targetTop, Math.max(0, maxTop));
      targetLeft = Math.min(targetLeft, Math.max(0, maxLeft));
    }

    // If element is mostly to the right in a horizontal layout, prefer horizontal scroll
    const preferHorizontal =
  (opts?.horizontal) ??
  (
    Math.abs(rect.left - (window.innerWidth / 2)) < 99999 &&
    (scrollableAncestor instanceof HTMLElement
      ? scrollableAncestor.scrollWidth > scrollableAncestor.clientWidth
      : false)
  );
    // Decide scroll axis: try vertical then horizontal if required
    scrollContainerTo(scrollableAncestor, targetTop, targetLeft, "smooth");

    // accessibility focus (without scrolling)
    try {
      el.setAttribute("tabindex", "-1");
      (el as HTMLElement).focus({ preventScroll: true });
    } catch {
      /* ignore */
    }
  };

  attempt();
}

export default function HeaderScrollListener() {
  useEffect(() => {
    const DEFAULT_OFFSET = 12;

    // on mount: if URL has hash, scroll (small delay to let layout settle)
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.replace(/^#/, "");
      setTimeout(() => tryScrollToId(id, { offset: DEFAULT_OFFSET, retries: 10 }), 120);
    }

    const onHeaderScroll = (ev: Event) => {
      try {
        const detail = (ev as CustomEvent).detail;
        if (!detail || typeof detail !== "string") return;
        const id = detail.replace(/^#/, "");
        setTimeout(() => tryScrollToId(id, { offset: DEFAULT_OFFSET, retries: 10 }), 120);
      } catch {
        // ignore
      }
    };
    window.addEventListener("header-scroll-to", onHeaderScroll as EventListener);

    const onHashChange = () => {
      const id = window.location.hash.replace(/^#/, "");
      tryScrollToId(id, { offset: DEFAULT_OFFSET, retries: 10 });
    };
    window.addEventListener("hashchange", onHashChange);

    const onPopstate = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id) tryScrollToId(id, { offset: DEFAULT_OFFSET, retries: 10 });
      else window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("popstate", onPopstate);

    return () => {
      window.removeEventListener("header-scroll-to", onHeaderScroll as EventListener);
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onPopstate);
    };
  }, []);

  return null;
}