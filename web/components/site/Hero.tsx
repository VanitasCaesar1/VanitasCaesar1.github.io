"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DitherArt } from "@/components/dither/DitherArt";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Icon } from "./icons";

const SURNAME = "Chintapatla";
const settle = { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const };

// Letters resolve left to right; replayed when the pointer reaches the name.
function useScramble(final: string) {
  const [text, setText] = useState(final);
  const running = useRef(false);
  const run = useCallback((dur: number) => {
    if (running.current) return;
    running.current = true;
    const pool = "abcdefghijklmnopqrstuvwxyz";
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const fixed = Math.floor(p * final.length);
      let out = final.slice(0, fixed);
      for (let i = fixed; i < final.length; i++) out += pool[Math.floor(Math.random() * pool.length)];
      setText(out);
      if (p < 1) requestAnimationFrame(step);
      else { setText(final); running.current = false; }
    };
    requestAnimationFrame(step);
  }, [final]);
  return { text, run };
}

export function Hero() {
  const reduce = useReducedMotion();
  const { text, run } = useScramble(SURNAME);
  useEffect(() => { if (!reduce) run(900); }, [reduce, run]);

  // Avatar tilts toward the pointer anywhere over the hero, on a spring.
  const px = useMotionValue(0), py = useMotionValue(0), lit = useMotionValue(0);
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const rx = useSpring(useTransform(py, [-1, 1], [12, -12]), spring);
  const ry = useSpring(useTransform(px, [-1, 1], [-12, 12]), spring);
  const glare = useSpring(lit, { stiffness: 200, damping: 30 });
  const gx = useTransform(px, [-1, 1], ["0%", "100%"]);
  const gy = useTransform(py, [-1, 1], ["0%", "100%"]);
  const avatarRef = useRef<HTMLDivElement>(null);
  const glareBg = useTransform([gx, gy], ([x, y]) => `radial-gradient(120px circle at ${x} ${y}, rgb(255 255 255 / 0.28), transparent 60%)`);

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !avatarRef.current) return;
    const r = avatarRef.current.getBoundingClientRect();
    const host = (e.currentTarget as HTMLElement).getBoundingClientRect();
    px.set(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (host.width / 2))));
    py.set(Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (host.height / 2))));
    lit.set(1);
  };
  const onLeave = () => { px.set(0); py.set(0); lit.set(0); };

  return (
    <header id="top" onPointerMove={onMove} onPointerLeave={onLeave} className="relative grid h-[300px] place-items-center overflow-hidden border-b border-line sm:h-80">
      <DitherArt scene="clouds" className="pointer-events-none absolute inset-0 size-full" />
      <div className="relative z-1 flex flex-col items-center gap-3.5 px-6 text-center sm:-mt-3 sm:flex-row sm:gap-5 sm:text-left" style={{ perspective: 700 }}>
        <motion.div
          ref={avatarRef}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: settle }}
          style={{ rotateX: rx, rotateY: ry }}
          className="relative size-22 shrink-0 rounded-[22px] border-[1.5px] border-dotted border-[rgb(170_180_255/0.85)] bg-background/70 p-1 shadow-[0_0_0_1px_rgb(98_115_234/0.25),0_0_28px_rgb(98_115_234/0.35)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/img/me.webp" width={320} height={320} alt="Chakravarthi's avatar" className="size-full rounded-[17px] object-cover" />
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-1 rounded-[17px]"
            style={{ opacity: glare, background: glareBg }}
          />
        </motion.div>
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { ...settle, delay: 0.09 } }}
            className="text-[30px] leading-[1.05] font-semibold tracking-[-0.03em] text-shadow-[0_2px_24px_rgb(0_0_0/0.6)] sm:text-display"
          >
            Chakravarthi{" "}
            <span
              aria-label={SURNAME}
              onPointerEnter={(e) => { if (e.pointerType === "mouse" && !reduce) run(450); }}
              className="block font-pixel font-normal tracking-normal text-[#f3f4ff] sm:inline"
            >
              {text}
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", transition: { ...settle, delay: 0.18 } }}
            className="mt-2 text-base text-soft text-shadow-[0_1px_12px_rgb(0_0_0/0.8)]"
          >
            Full-stack &amp; AI engineer
          </motion.p>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.a
            href="/resume.html"
            aria-label="Resume"
            whileTap={{ scale: 0.94 }}
            className="absolute right-4 bottom-4 z-1 grid size-9 place-items-center rounded-lg border border-line-strong bg-background/85 text-soft transition-colors duration-(--dur-fast) hover:border-brand/50 hover:text-foreground"
          >
            <Icon name="file" />
          </motion.a>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>Resume</TooltipContent>
      </Tooltip>
    </header>
  );
}
