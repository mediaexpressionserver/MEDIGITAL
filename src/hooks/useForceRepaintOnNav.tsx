// src/hooks/useForceRepaintOnNav.tsx
import { useEffect, RefObject } from "react";

/**
 * useForceRepaintOnNav
 * - Attempts several safe techniques to force a repaint when the page becomes visible
 *   (pageshow / popstate / visibilitychange). Useful for 'blank until scroll' issues.
 *
 * containerRef: optional ref to a container element to nudge; falls back to document.body.
 */
export default function useForceRepaintOnNav(containerRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = () => (containerRef && containerRef.current) || document.body || null;

    // single repaint nudge attempt
    function tryRepaintOnce() {
      const target = el();
      if (!target) return;

      try {
        // 1) quick will-change + transform trick (cheap)
        target.style.willChange = "transform, opacity";
        target.style.transform = "translateZ(0)";

        // 2) force layout/read — use `void` to avoid lint warnings about unused expressions
        void (target as HTMLElement).offsetHeight;

        // 3) tiny scroll nudge if it's scrollable
        // 3) avoid changing window scroll — do a tiny non-layout transform nudge instead
try {
  // apply a temporary translateX that does not affect layout, then remove it
  const prevTransform = (target as HTMLElement).style.transform || "";
  (target as HTMLElement).style.transition = "transform 80ms linear";
  (target as HTMLElement).style.transform = `${prevTransform} translateX(0.5px)`;
  // cleanup rapidly
  setTimeout(() => {
    try {
      (target as HTMLElement).style.transform = prevTransform;
      // remove transition shortly after
      setTimeout(() => {
        try { (target as HTMLElement).style.transition = ""; } catch {}
      }, 100);
    } catch {}
  }, 90);
} catch (err) {
  // ignore
}

        // 4) quick transform reset (forces composite update)
        requestAnimationFrame(() => {
          try {
            target.style.transform = "";
          } catch {}
        });

        // 5) draw a 1x1 canvas onto DOM to encourage a paint (some engines respond to this)
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = 1;
          canvas.style.position = "fixed";
          canvas.style.left = "-9999px";
          canvas.style.top = "-9999px";
          // draw to ensure GPU has some work
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "rgba(0,0,0,0)";
            ctx.fillRect(0, 0, 1, 1);
          }
          document.body.appendChild(canvas);
          // remove shortly after
          setTimeout(() => {
            try {
              document.body.removeChild(canvas);
            } catch {}
          }, 50);
        } catch (err) {
          // ignore
        }

        // clear will-change after a short delay
        setTimeout(() => {
          try {
            target.style.willChange = "";
          } catch {}
        }, 300);
      } catch (err) {
        // fallback: force reflow via getBoundingClientRect
        try {
          void document.body.getBoundingClientRect();
        } catch {}
      }
    }

    // run multiple attempts spaced out (covers weird timing)
    function runAttempts() {
      tryRepaintOnce();
      const t1 = setTimeout(tryRepaintOnce, 60);
      const t2 = setTimeout(tryRepaintOnce, 200);
      const t3 = setTimeout(tryRepaintOnce, 600);
      // cleanup
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    // event handler wrappers
    const handler = () => {
      const cleanup = runAttempts();
      // also run a micro animation to force paint
      requestAnimationFrame(() => requestAnimationFrame(() => {}));
      // remove after some time
      setTimeout(() => cleanup(), 1000);
    };

    // visibility handler (named so we can remove it correctly)
    const visibilityHandler = () => {
      if (document.visibilityState === "visible") handler();
    };

    // Attach listeners that fire on back/forward/tab-visible
    window.addEventListener("pageshow", handler);
    window.addEventListener("popstate", handler);
    document.addEventListener("visibilitychange", visibilityHandler);
    window.addEventListener("resize", handler);

    // run once on mount (use RAF timing)
    requestAnimationFrame(() => handler());

    return () => {
      window.removeEventListener("pageshow", handler);
      window.removeEventListener("popstate", handler);
      document.removeEventListener("visibilitychange", visibilityHandler);
      window.removeEventListener("resize", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}