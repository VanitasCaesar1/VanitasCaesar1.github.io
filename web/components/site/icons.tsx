// Interface icons (stroke, 24 grid) and brand icons from /assets/icons (Simple Icons, CC0).

import { cn } from "@/lib/utils";
import type { Tech } from "@/lib/content";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const PATHS: Record<string, React.ReactNode> = {
  arrow: <path d="M7 17 17 7M8 7h9v9" />,
  right: <path d="M5 12h14M13 6l6 6-6 6" />,
  copy: (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h8" /></>),
  check: <path d="m5 12 5 5 9-10" />,
  chev: <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />,
  down: <path d="m6 9 6 6 6-6" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  file: (<><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  pin: (<><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" /></>),
  linkedin: (<><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></>),
  braces: <path d="M8 4H7a2 2 0 0 0-2 2v4l-2 2 2 2v4a2 2 0 0 0 2 2h1M16 4h1a2 2 0 0 1 2 2v4l2 2-2 2v4a2 2 0 0 1-2 2h-1" />,
  phone: (<><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></>),
  server: (<><rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" /><path d="M7 7.5h.01M7 16.5h.01" /></>),
  db: (<><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>),
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  box: (<><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></>),
};

export function Icon({ name, className }: { name: keyof typeof PATHS | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cn("size-4 shrink-0", className)}>
      {PATHS[name]}
    </svg>
  );
}

export function Brand({ icon, className }: { icon: string; className?: string }) {
  return <i aria-hidden className={cn("si size-3.5", className)} style={{ "--i": `url(/assets/icons/${icon}.svg)` } as React.CSSProperties} />;
}

// A tech icon in a row: grey at rest, its own colour on hover or focus, named in a tooltip.
export function TechIcon({ tech }: { tech: Tech }) {
  if (!tech.icon) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          role="img"
          aria-label={tech.name}
          style={{ "--brand": tech.brand } as React.CSSProperties}
          className="group/tech grid size-6.5 place-items-center rounded-md text-[#6c6c78] outline-none transition-colors duration-[var(--dur-fast)] ease-(--ease-out) hover:bg-white/6 hover:text-(--brand) focus-visible:bg-white/6 focus-visible:text-(--brand)"
          onClick={(e) => e.stopPropagation()}
        >
          <Brand icon={tech.icon} className="transition-transform duration-[var(--dur-slow)] ease-(--ease-out) group-hover/tech:scale-115" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>{tech.name}</TooltipContent>
    </Tooltip>
  );
}
