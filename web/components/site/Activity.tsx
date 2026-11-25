"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import data from "@/lib/contributions.json";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TOP = 20;

// Log scale against the busiest day, so a few huge days don't flatten the rest.
const max = Math.max(1, ...data.counts);
const level = (c: number) => (c <= 0 ? 0 : Math.max(1, Math.min(4, Math.ceil((4 * Math.log(1 + c)) / Math.log(1 + max)))));
const start = new Date(`${data.start}T00:00:00Z`);
const weeks = Math.ceil(data.counts.length / 7);

export function Activity() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(-1);
  const [tip, setTip] = useState<{ x: number; y: number; text: React.ReactNode } | null>(null);
  const layout = useRef({ pitch: 16, size: 12 });

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const draw = () => {
      const k = Math.min(window.devicePixelRatio || 1, 2);
      const r = c.getBoundingClientRect();
      c.width = Math.round(r.width * k);
      c.height = Math.round(r.height * k);
      const ctx = c.getContext("2d")!;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.clearRect(0, 0, r.width, r.height);
      const pitch = Math.min(r.width / weeks, (r.height - TOP) / 7);
      const size = Math.max(4, Math.floor(pitch - 4));
      layout.current = { pitch, size };

      ctx.font = "10px var(--font-geist-mono), ui-monospace, monospace";
      ctx.fillStyle = "#85858f";
      ctx.textBaseline = "top";
      let last = -1;
      for (let wk = 0; wk < weeks - 2; wk++) {
        const d = new Date(start.getTime() + wk * 7 * 86400000);
        const m = d.getUTCMonth();
        if (m !== last) {
          if (last !== -1 || d.getUTCDate() <= 7) ctx.fillText(MONTHS[m], wk * pitch, 2);
          last = m;
        }
      }

      if (hover >= 0) {
        const wk = Math.floor(hover / 7);
        ctx.fillStyle = "rgb(141 156 255 / 0.10)";
        ctx.fillRect(Math.round(wk * pitch) - 2, TOP - 2, size + 4, 7 * pitch);
      }
      data.counts.forEach((count, n) => {
        const wk = Math.floor(n / 7), day = n % 7;
        const x = Math.round(wk * pitch), y = Math.round(TOP + day * pitch);
        const lv = level(count);
        ctx.fillStyle = "#17171d";
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = lv === 4 ? "#b4beff" : "#7f8ef5";
        const cx = x + size / 2, cy = y + size / 2;
        if (lv === 1) ctx.fillRect(Math.round(cx - 1), Math.round(cy - 1), 2, 2);
        else if (lv === 2) {
          const u = Math.max(2, Math.round(size / 4));
          for (const [ax, ay] of [[u, u], [size - u, size - u], [size - u, u], [u, size - u]]) ctx.fillRect(x + ax - 1, y + ay - 1, 2, 2);
        } else if (lv === 3) {
          for (let yy = 0; yy + 2 <= size; yy += 2) for (let xx = (yy / 2) % 2 ? 2 : 0; xx + 2 <= size; xx += 4) ctx.fillRect(x + xx, y + yy, 2, 2);
        } else if (lv === 4) ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
        if (n === hover) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - 1.5, y - 1.5, size + 3, size + 3);
        }
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    document.fonts?.ready.then(draw);
    return () => ro.disconnect();
  }, [hover]);

  // Open on the latest months when the graph has to scroll (phones).
  useEffect(() => {
    const w = wrap.current;
    if (w && w.scrollWidth > w.clientWidth) w.scrollLeft = w.scrollWidth;
  }, []);

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    const { pitch, size } = layout.current;
    const wk = Math.floor((e.clientX - b.left) / pitch);
    const day = Math.floor((e.clientY - b.top - TOP) / pitch);
    const n = wk * 7 + day;
    if (day < 0 || day > 6 || n < 0 || n >= data.counts.length) { setHover(-1); setTip(null); return; }
    if (n === hover) return;
    setHover(n);
    const host = e.currentTarget.parentElement!.parentElement!.getBoundingClientRect();
    const d = new Date(start.getTime() + n * 86400000);
    const when = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
    const c = data.counts[n];
    setTip({
      x: b.left - host.left + wk * pitch + size / 2,
      y: b.top - host.top + TOP + day * pitch,
      text: (<><b className="font-medium text-foreground">{c === 0 ? "No" : c.toLocaleString("en-US")} contribution{c === 1 ? "" : "s"}</b> on {when}</>),
    });
  };

  return (
    <section aria-label="GitHub activity" className="relative border-b border-line px-4 pt-5 pb-4.5 sm:px-6">
      <div ref={wrap} className="scrollbar-none overflow-x-auto">
        <canvas ref={canvas} aria-hidden className="h-33 w-full min-w-160" onPointerMove={onMove} onPointerLeave={() => { setHover(-1); setTip(null); }} />
      </div>
      <AnimatePresence>
        {tip && (
          <motion.div
            key="tip"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] } }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } }}
            style={{ left: tip.x, top: tip.y }}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-md border border-line-strong bg-popover px-2 py-1 text-meta whitespace-nowrap text-muted-foreground tabular-nums shadow-[0_8px_22px_rgb(0_0_0/0.5)]"
          >
            {tip.text}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-2.5 flex flex-col items-start justify-between gap-1.5 text-[13.5px] text-muted-foreground sm:flex-row sm:items-center">
        <p>
          <span className="tabular-nums">{data.total.toLocaleString("en-US")}</span> contributions in the last year on{" "}
          <a className="link-dotted text-foreground" href="https://github.com/VanitasCaesar1">GitHub</a>.
        </p>
        <p aria-hidden className="flex items-center gap-1.5 font-mono text-[11px] text-dim">
          Less
          <i className="inline-block size-2.75 bg-[#17171d]" />
          <i className="inline-block size-2.75 bg-[#17171d] bg-[radial-gradient(circle,#7f8ef5_1px,transparent_1.2px)] bg-size-[11px_11px] bg-center" />
          <i className="inline-block size-2.75 bg-[#17171d] bg-[radial-gradient(circle,#7f8ef5_1px,transparent_1.2px)] bg-size-[5.5px_5.5px]" />
          <i className="inline-block size-2.75 bg-[#17171d] bg-[repeating-conic-gradient(#7f8ef5_0_25%,transparent_0_50%)] bg-size-[4px_4px]" />
          <i className="inline-block size-2.75 bg-[#b4beff] shadow-[inset_0_0_0_1px_#17171d]" />
          More
        </p>
      </div>
    </section>
  );
}
