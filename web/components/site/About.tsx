import { DitherArt } from "@/components/dither/DitherArt";
import { facts, links } from "@/lib/content";
import { Brand, Icon } from "./icons";
import { Press } from "./Press";

const em = "font-medium text-foreground underline decoration-dotted decoration-[rgb(170_180_255/0.6)] decoration-[1.5px] underline-offset-[5px]";

export function About() {
  return (
    <>
      <div className="border-b border-line px-6 py-3 text-[13.5px] min-[1100px]:hidden">Open to new roles</div>
      <section id="about" className="relative border-b border-line px-4 pt-9 pb-10 sm:px-6">
        <DitherArt scene="eclipse" className="pointer-events-none absolute top-0 right-0 hidden h-full w-[46%] sm:block" />
        <p className="relative max-w-155 text-[15.5px] leading-[1.75] text-muted-foreground">
          I build software end to end: <em className={`not-italic ${em}`}>mobile apps</em>, <em className={`not-italic ${em}`}>web apps</em>, the{" "}
          <em className={`not-italic ${em}`}>backend</em> and the servers under it, and the <em className={`not-italic ${em}`}>LLM agents</em> inside
          them. I work with <em className={`not-italic ${em}`}>Claude Code</em> and <em className={`not-italic ${em}`}>Codex</em> every day.
        </p>
        <div className="rule mt-5.5 mb-5" />
        <ul className="relative flex flex-col gap-3">
          {facts.map((f) => (
            <li key={f.strong} className="flex items-baseline gap-2.5 text-[15.5px]">
              <Icon name="right" className="size-3.5 self-center text-muted-foreground" />
              <b className="font-medium text-foreground underline decoration-dim underline-offset-4">{f.strong}</b>
              <span className="text-small text-muted-foreground">{f.soft}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Find me online" className="grid grid-cols-2 border-b border-line sm:grid-cols-3">
        {links.map((l, i) => (
          <Press key={l.label} large asChild>
            <a
              href={l.href}
              className={[
                "spot group flex items-center gap-3 px-3.5 py-3 text-small font-medium sm:gap-3.5 sm:px-5 sm:py-3.5 sm:text-[14.5px]",
                "border-line",
                i % 2 === 0 ? "border-r" : "",
                i < 4 ? "border-b" : "",
                "sm:border-r sm:[&:nth-child(3n)]:border-r-0",
                i < 3 ? "sm:border-b" : "sm:border-b-0",
              ].join(" ")}
            >
              <span className="grid size-9 place-items-center rounded-lg border-[1.5px] border-dotted border-[rgb(170_180_255/0.7)] bg-[#0e0e13] text-[#d9dbe8] shadow-[0_0_14px_rgb(98_115_234/0.18)] transition-[border-color,box-shadow,color] duration-(--dur-base) ease-(--ease-out) group-hover:border-[rgb(190_200_255/0.95)] group-hover:text-white group-hover:shadow-[0_0_0_3px_rgb(98_115_234/0.16),0_0_26px_rgb(98_115_234/0.45)] sm:size-10">
                {l.icon === "github" || l.icon === "x" ? <Brand icon={l.icon} className="size-4.5" /> : <Icon name={l.icon} className="size-4.5" />}
              </span>
              {l.label}
              <Icon name="arrow" className="ml-auto size-3.5 text-dim transition-[translate,color] duration-(--dur-base) ease-(--ease-out) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            </a>
          </Press>
        ))}
      </nav>
    </>
  );
}
