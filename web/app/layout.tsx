import type { Metadata, Viewport } from "next";
import { Caveat, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import { Providers } from "@/components/site/Providers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: "italic" });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: "500" });
const pixel = localFont({ src: "./fonts/geist-pixel-square.woff2", variable: "--font-pixel-square", display: "swap" });

const site = "https://vanitascaesar1.github.io";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "Chakravarthi Chintapatla",
  description: "Chakravarthi Chintapatla, full-stack engineer. Built Treato end to end: mobile apps, Go backend, Rust auth and Maya, an LLM agent.",
  icons: { icon: "/assets/favicon.svg" },
  openGraph: {
    title: "Chakravarthi Chintapatla",
    description: "Full-stack engineer. Apps, backends and the AI inside them. Built Treato from 0 to 1.",
    url: site,
    type: "website",
    images: ["/assets/img/og.png"],
  },
  twitter: { card: "summary_large_image", creator: "@phantommenace_x" },
};

export const viewport: Viewport = { themeColor: "#09090b", colorScheme: "dark" };

const person = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Chakravarthi Chintapatla",
  jobTitle: "Full-Stack Engineer (AI)",
  url: `${site}/`,
  sameAs: ["https://github.com/VanitasCaesar1", "https://www.linkedin.com/in/chintapatla-chakravarthi", "https://x.com/phantommenace_x"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${instrument.variable} ${caveat.variable} ${pixel.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
