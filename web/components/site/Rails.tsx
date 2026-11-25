"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EMAIL } from "@/lib/content";
import { cn } from "@/lib/utils";
import { Icon } from "./icons";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

export function useIstClock() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });
    const tick = () => setNow(`${fmt.format(new Date()).toLowerCase()} IST`);
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function copyEmail() {
  navigator.clipboard.writeText(EMAIL).then(
    () => toast("Email copied", { icon: <Icon name="check" className="size-3.5 text-brand" /> }),
    () => { window.location.href = `mailto:${EMAIL}`; },
  );
}

export function LeftRail() {
  const [active, setActive] = useState("about");
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    let queued = false;
    const spy = () => {
      queued = false;
      const line = window.innerHeight * 0.4;
      let current = els[0]?.id ?? "about";
      for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
      setActive(current);
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(spy); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    spy();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <aside aria-label="On this page" className="relative hidden min-[1100px]:block">
      <div data-rail className="sticky top-24 flex flex-col items-end px-8">
        <p className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.22em] text-dim">On this page</p>
        <nav className="flex flex-col items-end gap-1">
          {SECTIONS.map((s, i) => {
            const on = active === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={on ? "true" : undefined}
                className={cn("group relative flex items-center py-0.5 pr-11 font-mono text-[13px] leading-6 transition-colors duration-(--dur-fast)", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <span className={cn("mr-2.5 text-[10px] tabular-nums transition-opacity duration-(--dur-base)", on ? "opacity-50" : "opacity-0 group-hover:opacity-40")}>0{i + 1}</span>
                {s.label}
                <span
                  aria-hidden
                  className={cn(
                    "absolute right-0 top-1/2 h-px w-9 origin-left bg-current transition-[scale,opacity] duration-(--dur-slow) ease-(--ease-out)",
                    on ? "scale-x-90 opacity-100" : "scale-x-33 opacity-60 group-hover:scale-x-60",
                  )}
                />
              </a>
            );
          })}
        </nav>
      </div>
      <ToTop />
    </aside>
  );
}

function ToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href="#top"
          aria-label="Back to the top"
          initial={{ opacity: 0, y: 8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, y: 8, transition: { duration: 0.17, ease: [0.4, 0, 1, 1] } }}
          whileTap={{ scale: 0.94 }}
          className="fixed bottom-7 left-[max(24px,calc((100vw-900px)/2-76px))] z-20 grid size-11 place-items-center rounded-full text-white shadow-[0_0_0_1px_rgb(141_156_255/0.5),0_0_24px_rgb(98_115_234/0.45)]"
          style={{ background: "radial-gradient(circle, rgb(255 255 255 / 0.35) 0.8px, transparent 1.2px) 0 0 / 4px 4px, linear-gradient(180deg, #2b3794, #5263dc)" }}
        >
          <Icon name="up" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}

export function RightRail() {
  const now = useIstClock();
  const [copied, setCopied] = useState(false);
  const linkCls = "link-dotted inline-flex items-center gap-1.5 text-[13px] text-soft";
  return (
    <aside aria-label="Status" className="relative hidden min-[1100px]:block">
      <div data-rail className="sticky top-24 px-8">
        <p className="text-small text-foreground">Open to new roles</p>
        <p className="mt-3.5 text-[13px] leading-normal text-muted-foreground">
          India
          <br />
          <time className="font-mono text-soft tabular-nums">{now || "IST"}</time>
        </p>
        <div className="rule mt-5 mb-4 max-w-50" />
        <ul className="flex flex-col gap-2">
          <li>
            <button
              type="button"
              className={linkCls}
              onClick={() => { copyEmail(); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
            >
              Email me
              <span className="relative grid size-3">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={copied ? "check" : "copy"}
                    initial={{ opacity: 0, scale: copied ? 0.6 : 1 }}
                    animate={{ opacity: 1, scale: 1, transition: { type: "spring", visualDuration: 0.3, bounce: 0.2 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                    className="col-start-1 row-start-1"
                  >
                    <Icon name={copied ? "check" : "copy"} className={cn("size-3", copied ? "text-brand" : "text-muted-foreground")} />
                  </motion.span>
                </AnimatePresence>
              </span>
            </button>
          </li>
          {[
            { label: "Resume", href: "/resume.html" },
            { label: "GitHub", href: "https://github.com/VanitasCaesar1" },
            { label: "llms.txt", href: "/llms.txt" },
          ].map((l) => (
            <li key={l.label}>
              <a href={l.href} className={linkCls}>
                {l.label}
                <Icon name="arrow" className="size-3 text-muted-foreground" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
