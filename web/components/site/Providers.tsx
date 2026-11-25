"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CursorFX } from "./CursorFX";

// Sets --mx/--my on whichever .spot the pointer is over, so its light can follow.
function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.(".spot") as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    document.addEventListener("pointermove", move, { passive: true });
    // :active presses on iPhone need a touch listener
    const touch = () => {};
    document.addEventListener("touchstart", touch, { passive: true });
    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("touchstart", touch);
    };
  }, []);
  return null;
}

// A handwritten note fades while it passes behind a sticky rail.
function TuckNotes() {
  useEffect(() => {
    let queued = false;
    const run = () => {
      queued = false;
      const rails = [...document.querySelectorAll<HTMLElement>("[data-rail]")].map((r) => r.getBoundingClientRect());
      document.querySelectorAll<HTMLElement>("[data-hand]").forEach((h) => {
        const r = h.getBoundingClientRect();
        const hit = rails.some((b) => r.left < b.right && r.right > b.left && r.top < b.bottom + 16 && r.bottom > b.top - 16);
        h.toggleAttribute("data-tucked", hit);
      });
    };
    const q = () => { if (!queued) { queued = true; requestAnimationFrame(run); } };
    window.addEventListener("scroll", q, { passive: true });
    window.addEventListener("resize", q);
    run();
    return () => { window.removeEventListener("scroll", q); window.removeEventListener("resize", q); };
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={120} skipDelayDuration={300}>
        {children}
        <Spotlight />
        <TuckNotes />
        <CursorFX />
        <Toaster
          theme="dark"
          position="bottom-center"
          duration={4000}
          toastOptions={{
            classNames: {
              toast: "!bg-popover !border-line-strong !text-foreground !rounded-lg !shadow-[0_12px_40px_rgb(0_0_0/0.6)] !text-small !font-sans",
            },
          }}
        />
      </TooltipProvider>
    </MotionConfig>
  );
}
