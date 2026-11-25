import { About } from "@/components/site/About";
import { Activity } from "@/components/site/Activity";
import { Hero } from "@/components/site/Hero";
import { LeftRail, RightRail } from "@/components/site/Rails";
import { Contact, Experience, Footer, Projects, Skills } from "@/components/site/Sections";

export default function Page() {
  return (
    <>
      <a href="#main" className="fixed -top-12 left-3 z-50 rounded-lg bg-foreground px-3 py-2 text-background focus:top-3">
        Skip to content
      </a>
      <div className="min-[1100px]:grid min-[1100px]:grid-cols-[minmax(0,1fr)_minmax(0,900px)_minmax(0,1fr)]">
        <LeftRail />
        <main id="main" className="column-edges relative mx-auto max-w-225 min-w-0 bg-panel max-[680px]:before:hidden max-[680px]:after:hidden">
          <Hero />
          <About />
          <Activity />
          <Experience />
          <Skills />
          <Projects />
          <Contact />
          <Footer />
        </main>
        <RightRail />
      </div>
    </>
  );
}
