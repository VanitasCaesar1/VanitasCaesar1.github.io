"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import type { Row } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Brand, Icon, TechIcon } from "./icons";

const OUT = [0.22, 1, 0.36, 1] as const;
const IN = [0.4, 0, 1, 1] as const;

/* ── Peek: a preview of a closed project that follows the pointer ── */
type PeekApi = { show: (src: string, e: React.PointerEvent) => void; move: (e: React.PointerEvent) => void; hide: () => void };
const PeekCtx = createContext<PeekApi | null>(null);

export function PeekLayer({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [src, setSrc] = useState<string | null>(null);
  const [on, setOn] = useState(false);
  const x = useMotionValue(0), y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 28, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 260, damping: 28, mass: 0.6 });
  const fine = useRef(false);
  useEffect(() => {
    fine.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const hide = () => setOn(false);
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, []);
  const place = (e: React.PointerEvent, jump = false) => {
    const px = Math.min(window.innerWidth - 236, e.clientX + 24);
    const py = Math.max(12, Math.min(window.innerHeight - 312, e.clientY - 150));
    x.set(px); y.set(py);
    if (jump) { sx.jump(px); sy.jump(py); }
  };
  const api: PeekApi = {
    show: (s, e) => {
      if (reduce || !fine.current || e.pointerType !== "mouse") return;
      setSrc(s);
      place(e, !on);
      setOn(true);
    },
    move: (e) => { if (on) place(e); },
    hide: () => setOn(false),
  };
  return (
    <PeekCtx.Provider value={api}>
      {children}
      <AnimatePresence>
        {on && src && (
          <motion.div
            key="peek"
            aria-hidden
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1, transition: { type: "spring", visualDuration: 0.3, bounce: 0.1 } }}
            exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.17, ease: IN } }}
            style={{ x: sx, y: sy }}
            className="pointer-events-none fixed top-0 left-0 z-30 w-55 overflow-hidden rounded-xl border border-[rgb(170_180_255/0.35)] bg-chip shadow-[0_24px_60px_rgb(0_0_0/0.65),0_0_40px_rgb(98_115_234/0.25)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="block max-h-75 w-full object-cover object-top" />
          </motion.div>
        )}
      </AnimatePresence>
    </PeekCtx.Provider>
  );
}

/* ── One row: a button that opens its details with a height spring ── */
export function RowItem({ row, kind, divider = true }: { row: Row; kind: "job" | "project"; divider?: boolean }) {
  const [open, setOpen] = useState(false);
  const peek = useContext(PeekCtx);
  const id = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (open && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.play().catch(() => {});
    else v.pause();
  }, [open]);

  const toggle = () => { setOpen((o) => !o); peek?.hide(); };

  return (
    <div className="group/row relative">
      {divider && <div className="rule-dots" />}
      <motion.div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
        onPointerEnter={(e) => { if (row.peek && !open) peek?.show(row.peek, e); }}
        onPointerMove={(e) => peek?.move(e)}
        onPointerLeave={() => peek?.hide()}
        whileTap={{ scale: 0.99, transition: { duration: 0.14, ease: OUT } }}
        transition={{ type: "spring", visualDuration: 0.35, bounce: 0 }}
        className="spot -mx-4 flex cursor-pointer items-start gap-4 px-4 py-4 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 sm:-mx-6 sm:px-6"
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-[15.5px] leading-snug font-medium transition-colors duration-(--dur-fast) group-hover/row:text-white">
            {row.title}
            {row.at && (
              <>
                {" "}<span className="font-normal text-muted-foreground">at</span>{" "}
                {row.atHref ? (
                  <a href={row.atHref} onClick={(e) => e.stopPropagation()} className="link-dotted">{row.at}</a>
                ) : row.at}
              </>
            )}
          </h3>
          {row.meta && (
            <p className="mt-1 flex flex-wrap items-center gap-2.5 text-[13px] text-muted-foreground">
              {row.meta.map((m, i) => (
                <span key={m} className={cn("flex items-center gap-2.5", i === 2 && "font-mono text-meta")}>
                  {i > 0 && <i className="h-2.75 w-px bg-line-strong" />}
                  {m}
                </span>
              ))}
            </p>
          )}
          {row.desc && <p className="mt-1.5 max-w-140 text-small text-muted-foreground transition-colors duration-(--dur-fast) group-hover/row:text-soft">{row.desc}</p>}
          {row.stack && (
            <div className="-ml-1.5 mt-2 flex flex-wrap gap-0.5">
              {row.stack.map((t) => <TechIcon key={t.name + kind} tech={t} />)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {row.github && <RowLink href={row.github} label={`${row.title} on GitHub`} tip="GitHub"><Brand icon="github" /></RowLink>}
          {row.href && kind === "project" && <RowLink href={row.href} label={`Open ${row.title}`} tip="Open"><Icon name="arrow" className="size-3.5" /></RowLink>}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", visualDuration: 0.3, bounce: 0 }} className="mt-0.5 ml-1.5 text-muted-foreground transition-colors group-hover/row:text-foreground">
            <Icon name="chev" />
          </motion.span>
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.34, ease: OUT }, opacity: { duration: 0.24, delay: 0.06, ease: [0, 0, 0.58, 1] } } }}
            exit={{ height: 0, opacity: 0, transition: { height: { duration: 0.24, ease: IN }, opacity: { duration: 0.12, ease: IN } } }}
            className="overflow-hidden"
          >
            <div className="pb-5">
              {row.stats && (
                <ul className="mb-4 grid gap-2 sm:grid-cols-3">
                  {row.stats.map((s) => (
                    <li key={s.label} className="spot rounded-lg border border-line bg-chip px-3.5 py-3 transition-colors duration-(--dur-fast) hover:border-brand/35">
                      <b className="block text-heading font-semibold tabular-nums">{s.value}</b>
                      <span className="text-[12.5px] text-muted-foreground">{s.label}</span>
                    </li>
                  ))}
                </ul>
              )}
              <ul className="flex max-w-170 flex-col gap-2">
                {row.bullets.map((b) => (
                  <li key={b.text} className="relative pl-4.5 text-small text-soft">
                    <span aria-hidden className="absolute top-[0.72em] left-0.5 size-1.25 bg-[#6273ea] shadow-[0_0_6px_rgb(98_115_234/0.7)]" />
                    {b.lead && <b className="font-medium text-foreground">{b.lead} </b>}
                    {b.text}
                  </li>
                ))}
              </ul>
              {row.shots && (
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {row.shots.map((s) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={s.src} src={s.src} alt={s.alt} loading="lazy" className="aspect-[600/955] w-full rounded-xl border border-line-strong bg-chip object-cover" />
                  ))}
                </div>
              )}
              {row.caption && <p className="mt-2 text-[12.5px] text-dim">{row.caption}</p>}
              {row.media && (
                <div className="mt-4">
                  {row.media.kind === "video" ? (
                    <video ref={videoRef} src={row.media.src} poster={row.media.poster} muted loop playsInline preload="none" aria-label={row.media.alt} className="max-h-105 w-full rounded-xl border border-line-strong bg-chip object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.media.src} alt={row.media.alt} loading="lazy" className="max-h-105 w-full rounded-xl border border-line-strong bg-chip object-cover" />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RowLink({ href, label, tip, children }: { href: string; label: string; tip: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.a
          href={href}
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
          whileTap={{ scale: 0.92 }}
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors duration-(--dur-fast) hover:bg-white/6 hover:text-foreground"
        >
          {children}
        </motion.a>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>{tip}</TooltipContent>
    </Tooltip>
  );
}

/* ── A list that shows the first few and opens the rest with a height spring ── */
export function MoreList({ children, first, label }: { children: React.ReactNode[]; first: number; label: (n: number) => string }) {
  const [all, setAll] = useState(false);
  const rest = children.slice(first);
  return (
    <>
      {children.slice(0, first)}
      <AnimatePresence initial={false}>
        {all && (
          <motion.div
            key="rest"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { height: { duration: 0.34, ease: OUT }, opacity: { duration: 0.24, delay: 0.06 } } }}
            className="overflow-hidden"
          >
            {rest}
          </motion.div>
        )}
      </AnimatePresence>
      {!all && rest.length > 0 && (
        <div className="flex flex-col items-center">
          <div className="rule-dots w-full" />
          <ShowMore onClick={() => setAll(true)} className="mt-4.5">{label(rest.length)}</ShowMore>
        </div>
      )}
    </>
  );
}

export function ShowMore({ onClick, children, className }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={cn("relative z-1 inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-background/90 px-3.5 py-1.5 text-[13px] text-soft transition-colors duration-(--dur-fast) hover:border-brand/50 hover:text-foreground", className)}
    >
      {children}
      <Icon name="down" className="size-3.25" />
    </motion.button>
  );
}
