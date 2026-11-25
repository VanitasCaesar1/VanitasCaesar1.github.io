"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useRef, useState } from "react";
import { DitherArt } from "@/components/dither/DitherArt";
import { EMAIL, experience, projects, quote, skills } from "@/lib/content";
import { Brand, Icon } from "./icons";
import { MoreList, PeekLayer, RowItem, ShowMore } from "./Rows";
import { copyEmail } from "./Rails";

function Hand({ side, children }: { side: "left" | "right"; children: string }) {
  return (
    <span
      aria-hidden
      data-hand
      className={
        "pointer-events-none absolute top-8.5 hidden font-hand transition-opacity duration-(--dur-base) data-tucked:opacity-0 text-[19px] whitespace-nowrap text-muted-foreground min-[1240px]:block " +
        (side === "left" ? "right-[calc(100%+44px)] -rotate-5" : "left-[calc(100%+44px)] rotate-4")
      }
    >
      {children}
    </span>
  );
}

function Heading({ children }: { children: string }) {
  return (
    <>
      <h2 className="text-heading font-semibold tracking-[-0.01em]">{children}</h2>
      <div className="rule mt-4.5 mb-2" />
    </>
  );
}

export function Experience() {
  return (
    <section id="experience" className="relative border-b border-line px-4 pt-9 pb-6 sm:px-6">
      <Hand side="left">where I&apos;ve worked</Hand>
      <Heading>Experience</Heading>
      {experience.map((r, i) => <RowItem key={r.title} row={r} kind="job" divider={i > 0} />)}
    </section>
  );
}

export function Skills() {
  const [all, setAll] = useState(false);
  const shown = all ? skills : skills.slice(0, 3);
  return (
    <section id="skills" className="relative border-b border-line pt-9 sm:px-0">
      <Hand side="right">what I build with</Hand>
      <div className="px-4 sm:px-6"><Heading>Skills</Heading></div>
      <motion.div layout="size" transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden">
        {shown.map((g) => (
          <div key={g.group} className="spot grid gap-2.5 border-b border-line px-4 py-4 last:border-b-0 sm:grid-cols-[190px_1fr] sm:gap-4 sm:px-6">
            <h3 className="flex items-center gap-2 pt-1 text-[14.5px] font-medium">
              <Icon name={g.icon} className="size-3.75 text-muted-foreground" />
              {g.group}
              <span className="font-mono text-[11px] text-dim tabular-nums">{g.items.length}</span>
            </h3>
            <ul className="flex flex-wrap gap-1.75">
              {g.items.map((t) => (
                <li
                  key={t.name}
                  style={{ "--brand": t.brand ?? "#8d9cff" } as React.CSSProperties}
                  className="inline-flex items-center gap-1.75 rounded-md border border-line-strong bg-chip py-1 pr-2.5 pl-2 text-[13px] text-soft transition-[translate,border-color,background-color,color] duration-(--dur-base) ease-(--ease-out) hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand)_9%,var(--chip))] hover:text-foreground [&:hover_.ico]:text-(--brand)"
                >
                  <span className="ico text-[#7c7c88] transition-colors duration-(--dur-fast)">
                    {t.icon ? <Brand icon={t.icon} className="size-3.25" /> : <Icon name="box" className="size-3.25" />}
                  </span>
                  {t.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!all && (
          <div className="absolute inset-x-0 bottom-0 grid h-32.5 place-items-center bg-linear-to-b from-panel/0 via-panel/85 to-panel/20">
            <DitherArt scene="tide" className="pointer-events-none absolute inset-0 size-full" />
            <ShowMore onClick={() => setAll(true)} className="mt-7.5">Show {skills.length - 3} more</ShowMore>
          </div>
        )}
      </motion.div>
    </section>
  );
}

export function Projects() {
  const rows = projects.map((r, i) => <RowItem key={r.title} row={r} kind="project" divider={i > 0} />);
  return (
    <section id="projects" className="relative border-b border-line px-4 pt-9 pb-8 sm:px-6">
      <Hand side="left">things I&apos;ve shipped</Hand>
      <Heading>Projects</Heading>
      <PeekLayer>
        <MoreList first={5} label={(n) => `See ${n} more`}>{rows}</MoreList>
      </PeekLayer>
    </section>
  );
}

export function Contact() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const tx = useMotionValue(0), ty = useMotionValue(0);
  const sx = useSpring(tx, { stiffness: 200, damping: 18, mass: 0.5 });
  const sy = useSpring(ty, { stiffness: 200, damping: 18, mass: 0.5 });
  // The email button leans toward a pointer that comes near it.
  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const near = Math.abs(dx) < r.width / 2 + 70 && Math.abs(dy) < r.height / 2 + 50;
    tx.set(near ? dx * 0.18 : 0);
    ty.set(near ? dy * 0.3 : 0);
  };
  return (
    <section id="contact" onPointerMove={onMove} onPointerLeave={() => { tx.set(0); ty.set(0); }} className="relative border-b border-line px-4 pt-16 pb-30 text-center sm:px-6">
      <DitherArt scene="horizon" className="pointer-events-none absolute inset-0 size-full opacity-90" />
      <Hand side="right">say hi</Hand>
      <h2 className="relative text-2xl font-medium tracking-[-0.02em] sm:text-[30px] sm:leading-tight">
        Building something?{" "}
        <a href={`mailto:${EMAIL}`} className="underline decoration-dotted decoration-[rgb(170_180_255/0.75)] decoration-2 underline-offset-[7px] transition-colors hover:text-white hover:decoration-solid">Let&apos;s talk.</a>
      </h2>
      <p className="relative mt-2.5 text-muted-foreground">Open to full-stack, mobile and AI engineering roles.</p>
      <motion.a
        ref={ref}
        href={`mailto:${EMAIL}`}
        style={{ x: sx, y: sy }}
        whileTap={{ scale: 0.97 }}
        className="group relative mt-6.5 inline-flex items-center gap-2.5 rounded-xl border border-line-strong bg-[#0e0e13] py-1.5 pr-1.5 pl-4 text-[14.5px] font-medium shadow-[0_0_0_4px_rgb(9_9_11/0.6),0_8px_30px_rgb(0_0_0/0.5)] transition-colors duration-(--dur-fast) hover:border-brand/55"
      >
        <Icon name="mail" />
        Email me
        <span className="grid size-7.5 place-items-center rounded-full bg-brand-soft text-primary-foreground transition-[rotate,background-color] duration-(--dur-base) ease-(--ease-out) group-hover:rotate-45 group-hover:bg-[#dfe4ff]">
          <Icon name="arrow" className="size-3.5 stroke-2" />
        </span>
      </motion.a>
      <p className="relative mt-4.5 flex flex-col items-center justify-center gap-1 text-[13px] text-muted-foreground sm:flex-row sm:gap-2">
        <span className="flex items-center gap-2"><Icon name="pin" className="size-3.5" />India, IST</span>
        <button type="button" onClick={copyEmail} className="link-dotted sm:ml-2.5">{EMAIL}</button>
      </p>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden px-4 pt-14 text-center sm:px-6">
      <blockquote>
        <p className="font-serif text-[27px] leading-[1.15] text-balance text-[#f2f2f6] italic sm:text-[34px]">{quote.text}</p>
        <cite className="mt-3.5 block font-mono text-[10.5px] font-medium tracking-[0.24em] text-muted-foreground uppercase not-italic">{quote.by}</cite>
      </blockquote>
      <div className="rule mx-auto mt-8 mb-5.5 max-w-130" />
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-meta whitespace-nowrap text-muted-foreground">
        <span>© 2026 Chakravarthi Chintapatla</span>
        <span aria-hidden className="text-dim">·</span>
        <a className="link-dotted text-soft" href="/llms.txt">llms.txt</a>
        <span aria-hidden className="text-dim">·</span>
        <a className="link-dotted text-soft" href="/geocities.html">the 1997 version</a>
      </p>
      <DitherArt scene="globe" label="A dithered globe turning, centred on India. Drag to spin it." className="mt-6 h-90 w-full cursor-grab touch-pan-y sm:h-130" />
    </footer>
  );
}

