"use client";

// Dithered pixels around the mouse, page-wide: a soft halo under the pointer and a short
// trail that fades in about 0.3 s. Over anything clickable the halo steps back so the
// control answers instead. Mouse only; off with reduce motion; idle after 1.4 s.

import { useEffect, useRef } from "react";

const CELL = 3, DOT = 2;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const rgba = (r: number, g: number, b: number) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
const PAL = [0, rgba(28, 36, 104), rgba(48, 64, 168), rgba(86, 104, 226), rgba(140, 156, 255), rgba(214, 220, 255)];
const LEVELS = PAL.length - 1;
const HALO_R = 40, TRAIL_R = 11;

export function CursorFX() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fx = ref.current;
    if (!fx) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = fx.getContext("2d");
    if (!ctx) return;

    const pts: { x: number; y: number; life: number }[] = [];
    let mx = -999, my = -999, halo = 0, idle = 0, over = false, running = false, last = 0, k = 1;
    let box: { x: number; y: number; w: number; h: number } | null = null;

    const size = () => {
      k = Math.min(window.devicePixelRatio || 1, 2);
      fx.width = Math.round(window.innerWidth * k);
      fx.height = Math.round(window.innerHeight * k);
      box = null;
    };
    size();
    window.addEventListener("resize", size);

    const field = (x: number, y: number) => {
      let v = 0;
      if (halo > 0.01) {
        const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
        if (d2 < 9 * HALO_R * HALO_R) v += 0.3 * halo * Math.exp(-d2 / (HALO_R * HALO_R));
      }
      for (const p of pts) {
        const r = TRAIL_R * (0.5 + 0.5 * p.life);
        const dx = x - p.x, dy = y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 9 * r * r) v += 0.5 * p.life * Math.exp(-d2 / (r * r));
      }
      return 0.5 * (1 - Math.exp(-2 * v)); // saturates at bright blue, never white
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      idle += dt;
      const target = idle < 1.4 ? (over ? 0.25 : 1) : 0;
      halo += (target - halo) * (1 - Math.exp(-dt * (target > halo ? 10 : 3)));
      for (const p of pts) p.life -= dt * 3.2;
      while (pts.length && pts[0].life <= 0) pts.shift();

      let x0 = mx - 3 * HALO_R, y0 = my - 3 * HALO_R, x1 = mx + 3 * HALO_R, y1 = my + 3 * HALO_R;
      for (const p of pts) {
        x0 = Math.min(x0, p.x - 3 * TRAIL_R); y0 = Math.min(y0, p.y - 3 * TRAIL_R);
        x1 = Math.max(x1, p.x + 3 * TRAIL_R); y1 = Math.max(y1, p.y + 3 * TRAIL_R);
      }
      if (box) ctx.clearRect(box.x, box.y, box.w, box.h);
      const cellPx = Math.max(2, Math.round(CELL * k)), dotPx = Math.max(1, Math.round(DOT * k));
      const ci0 = Math.max(0, Math.floor((x0 * k) / cellPx)), cj0 = Math.max(0, Math.floor((y0 * k) / cellPx));
      const ci1 = Math.min(Math.ceil(fx.width / cellPx), Math.ceil((x1 * k) / cellPx));
      const cj1 = Math.min(Math.ceil(fx.height / cellPx), Math.ceil((y1 * k) / cellPx));
      const W = (ci1 - ci0) * cellPx, H = (cj1 - cj0) * cellPx;
      if (W > 0 && H > 0 && (halo > 0.01 || pts.length)) {
        const img = ctx.createImageData(W, H);
        const buf = new Uint32Array(img.data.buffer);
        for (let j = cj0; j < cj1; j++) {
          for (let i = ci0; i < ci1; i++) {
            const v = field(((i + 0.5) * cellPx) / k, ((j + 0.5) * cellPx) / k);
            if (v <= 0.02) continue;
            const q = Math.min(1, v) * LEVELS;
            let lvl = Math.floor(q);
            if (q - lvl > BAYER[(j & 3) * 4 + (i & 3)]) lvl++;
            if (lvl <= 0) continue;
            const col = PAL[Math.min(lvl, LEVELS)];
            const ox = (i - ci0) * cellPx, oy = (j - cj0) * cellPx;
            for (let yy = oy; yy < oy + dotPx; yy++) for (let xx = ox; xx < ox + dotPx; xx++) buf[yy * W + xx] = col;
          }
        }
        ctx.putImageData(img, ci0 * cellPx, cj0 * cellPx);
        box = { x: ci0 * cellPx, y: cj0 * cellPx, w: W, h: H };
      } else box = null;
      if (halo > 0.01 || pts.length) requestAnimationFrame(frame);
      else {
        running = false;
        if (box) ctx.clearRect(box.x, box.y, box.w, box.h);
        box = null;
      }
    };
    const wake = () => {
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const x = e.clientX, y = e.clientY;
      if (mx > -999) {
        const steps = Math.min(12, Math.floor(Math.hypot(x - mx, y - my) / 7));
        for (let s = 1; s <= steps; s++) pts.push({ x: mx + ((x - mx) * s) / steps, y: my + ((y - my) * s) / steps, life: 1 });
        while (pts.length > 40) pts.shift();
      }
      mx = x; my = y; idle = 0;
      over = !!(e.target as Element | null)?.closest?.("a, button, [role=button], [role=img][tabindex], canvas[data-drag]");
      wake();
    };
    const leave = () => { idle = 99; wake(); };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-25 hidden h-screen w-screen mix-blend-screen pointer-fine:block motion-reduce:hidden" />;
}
