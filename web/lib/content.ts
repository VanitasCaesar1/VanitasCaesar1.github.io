// Everything the page says. Components only lay it out.

export const EMAIL = "chakravarthi8a2ss@gmail.com";

export type Tech = { name: string; icon?: string; brand?: string };

// Simple Icons (CC0) live in /public/icons. Brand colours are lifted for a dark page where the real one is near black.
export const T = {
  typescript: { name: "TypeScript", icon: "typescript", brand: "#3178C6" },
  javascript: { name: "JavaScript", icon: "javascript", brand: "#F7DF1E" },
  go: { name: "Go", icon: "go", brand: "#00ADD8" },
  rust: { name: "Rust", icon: "rust", brand: "#F74C00" },
  elixir: { name: "Elixir", icon: "elixir", brand: "#A974D6" },
  sql: { name: "SQL", icon: "postgresql", brand: "#6B8FF0" },
  kotlin: { name: "Kotlin", icon: "kotlin", brand: "#7F52FF" },
  c: { name: "C", icon: "c", brand: "#A8B9CC" },
  claude: { name: "Claude Code", icon: "claude", brand: "#D97757" },
  codex: { name: "Codex", icon: "openai", brand: "#FFFFFF" },
  llm: { name: "LLM APIs", icon: "anthropic", brand: "#F0EEE6" },
  rn: { name: "React Native", icon: "react", brand: "#61DAFB" },
  expo: { name: "Expo", icon: "expo", brand: "#FFFFFF" },
  react: { name: "React", icon: "react", brand: "#61DAFB" },
  next: { name: "Next.js", icon: "nextdotjs", brand: "#FFFFFF" },
  tauri: { name: "Tauri", icon: "tauri", brand: "#24C8D8" },
  ios: { name: "iOS release", icon: "apple", brand: "#FFFFFF" },
  android: { name: "Android release", icon: "android", brand: "#3DDC84" },
  node: { name: "Node.js", icon: "nodedotjs", brand: "#5FA04E" },
  fiber: { name: "Fiber", icon: "go", brand: "#00ADD8" },
  phoenix: { name: "Phoenix", icon: "phoenixframework", brand: "#FD4F00" },
  graphql: { name: "GraphQL", icon: "graphql", brand: "#E10098" },
  rabbitmq: { name: "RabbitMQ", icon: "rabbitmq", brand: "#FF6600" },
  webrtc: { name: "LiveKit / WebRTC", icon: "webrtc", brand: "#FFFFFF" },
  postgres: { name: "PostgreSQL", icon: "postgresql", brand: "#6B8FF0" },
  elastic: { name: "Elasticsearch", icon: "elasticsearch", brand: "#00BFB3" },
  redis: { name: "Redis / Dragonfly", icon: "redis", brand: "#FF4438" },
  docker: { name: "Docker", icon: "docker", brand: "#2496ED" },
  linux: { name: "Linux", icon: "linux", brand: "#FCC624" },
  gha: { name: "GitHub Actions", icon: "githubactions", brand: "#2088FF" },
  cloudflare: { name: "Cloudflare Workers & R2", icon: "cloudflare", brand: "#F38020" },
  workers: { name: "Cloudflare Workers", icon: "cloudflareworkers", brand: "#F38020" },
  git: { name: "Git", icon: "git", brand: "#F05032" },
  posthog: { name: "PostHog", icon: "posthog", brand: "#F9BD2B" },
  sentry: { name: "Sentry", icon: "sentry", brand: "#A78BFA" },
  homebrew: { name: "Homebrew", icon: "homebrew", brand: "#FBB040" },
  razorpay: { name: "Razorpay", icon: "razorpay", brand: "#3395FF" },
  npm: { name: "npm", icon: "npm", brand: "#CB3837" },
} satisfies Record<string, Tech>;

const plain = (name: string): Tech => ({ name });

export const facts: { strong: string; soft: string }[] = [
  { strong: "Treato", soft: "built it from 0 to 1, Oct 2024 – Nov 2026" },
  { strong: "3,560", soft: "commits since March 2025" },
  { strong: "React Native, Go, Rust, Postgres", soft: "stack" },
  { strong: "LLM agents", soft: "tool calling, guardrails, evals" },
  { strong: "BCA", soft: "Adikavi Nannaya University, 2025" },
  { strong: "English, Telugu, Hindi, Gujarati", soft: "speaks" },
  { strong: "India", soft: "IST" },
];

export const links = [
  { label: "GitHub", href: "https://github.com/VanitasCaesar1", icon: "github" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/chintapatla-chakravarthi", icon: "linkedin" },
  { label: "X", href: "https://x.com/phantommenace_x", icon: "x" },
  { label: "Email", href: `mailto:${EMAIL}`, icon: "mail" },
  { label: "Resume", href: "/resume.html", icon: "file" },
  { label: "treato.cloud", href: "https://treato.cloud", icon: "globe" },
] as const;

export type Row = {
  title: string;
  at?: string;
  atHref?: string;
  meta?: string[];
  desc?: string;
  stack?: Tech[];
  href?: string;
  github?: string;
  peek?: string;
  stats?: { value: string; label: string }[];
  bullets: { lead?: string; text: string }[];
  shots?: { src: string; alt: string }[];
  media?: { kind: "img" | "video"; src: string; poster?: string; alt: string };
  caption?: string;
};

export const experience: Row[] = [
  {
    title: "Full-stack engineer (AI)",
    at: "Treato",
    atHref: "https://treato.cloud",
    meta: ["Full time, India", "Oct 2024 – Nov 2026", "2y"],
    stack: [T.expo, T.rn, T.go, T.rust, T.elixir, T.postgres, T.next, T.tauri],
    bullets: [
      { text: "Took a care platform for India from 0 to 1: patient and doctor apps, the website, a desktop app for clinic front desks, and the backend under all of them." },
      { text: "Designed the core API in Go on PostgreSQL (about 360 migrations), a Rust auth service for phone OTP and passkeys, and chat in Elixir and Phoenix." },
      { text: "Built Maya, an LLM agent with tool calling that explains reports in plain words and drafts a brief before a visit. Safety checks run before the model, and it never diagnoses." },
      { text: "Owned the deploys and backups: Docker on a self-hosted VPS with Dokploy, Cloudflare, PostHog and Sentry." },
    ],
  },
  {
    title: "Advisor",
    at: "[24]7.ai",
    meta: ["Bengaluru", "Apr 2025 – Sep 2025", "6m"],
    bullets: [{ text: "Customer support and sales for enterprise clients." }],
  },
  {
    title: "BCA",
    at: "Aditya Degree College",
    meta: ["Adikavi Nannaya University", "2022 – 2025"],
    bullets: [
      { text: "Bachelor of Computer Applications." },
      { text: "Plus the Google Cybersecurity and IBM RAG and Agentic AI certificates on Coursera." },
    ],
  },
];

export const skills: { group: string; icon: string; items: Tech[] }[] = [
  { group: "Languages", icon: "braces", items: [T.typescript, T.javascript, T.go, T.rust, T.elixir, T.sql, T.kotlin, T.c] },
  { group: "AI & agents", icon: "spark", items: [T.claude, T.codex, T.llm, plain("Tool calling"), plain("AI agents"), plain("RAG"), plain("Guardrails"), plain("Evals"), plain("Prompt engineering")] },
  { group: "Frontend & mobile", icon: "phone", items: [T.rn, T.expo, T.react, T.next, T.tauri, T.ios, T.android] },
  { group: "Backend", icon: "server", items: [T.node, T.fiber, T.phoenix, plain("REST"), T.graphql, plain("WebSockets"), T.rabbitmq, T.webrtc] },
  { group: "Data", icon: "db", items: [T.postgres, T.elastic, T.redis, plain("Schema design & migrations")] },
  { group: "Infra & DevOps", icon: "box", items: [T.docker, T.linux, T.gha, plain("Dokploy"), T.cloudflare, T.git, plain("Playwright"), T.posthog, T.sentry, T.homebrew] },
];

export const projects: Row[] = [
  {
    title: "Treato",
    desc: "One shared health record for families, doctors and clinics in India.",
    href: "https://treato.cloud",
    peek: "/assets/img/treato-home.webp",
    stack: [T.expo, T.go, T.rust, T.elixir, T.postgres, T.next, T.tauri],
    stats: [
      { value: "4", label: "apps: patient, doctor, web, clinic desk" },
      { value: "~360", label: "database migrations" },
      { value: "1", label: "identity across patient, doctor and clinic" },
    ],
    bullets: [
      { lead: "Mobile.", text: "Patient and doctor apps in React Native and Expo: booking, family records, in-app chat and LiveKit video visits." },
      { lead: "Backend.", text: "The core API in Go (Fiber) on PostgreSQL: REST plus a read-only GraphQL layer, RabbitMQ between services." },
      { lead: "Auth.", text: "A Rust service for phone OTP and passkeys." },
      { lead: "AI.", text: "Maya, an LLM agent in Go with tool calling. It explains reports in plain words, keeps a health diary and drafts a brief before a visit." },
      { lead: "Web and desktop.", text: "A Next.js website with a public doctor directory, and a Tauri app for clinic front desks: tokens, walk-ins, billing." },
    ],
    shots: [
      { src: "/assets/img/treato-home.webp", alt: "Treato Health home screen" },
      { src: "/assets/img/treato-records.webp", alt: "Family records" },
      { src: "/assets/img/treato-report.webp", alt: "A lab report, explained in plain words" },
      { src: "/assets/img/treato-maya-brief.webp", alt: "Maya's brief before a visit" },
    ],
    caption: "Screens from the Treato Health app as of October 2026, with sample data.",
  },
  {
    title: "hoarding.top",
    desc: "Paid leaderboards for the world, your country and your city, where what you pay is your rank.",
    href: "https://hoarding.top",
    peek: "/assets/img/hoarding-top.webp",
    stack: [T.next, T.typescript, T.razorpay, T.docker],
    bullets: [
      { text: "Anyone can put a card on the boards: a logo, a name and one link. The #1 of each board gets the billboard spot, and taking it costs $1 more than the card there now." },
      { text: "Under the boards is a free directory of apps, websites and open-source projects, built from public data." },
      { text: "Built end to end: Next.js, Convex on my own server, Razorpay payments with a review step, invoices and emails." },
    ],
    media: { kind: "img", src: "/assets/img/hoarding-top.webp", alt: "The hoarding.top boards" },
  },
  {
    title: "tabcn",
    desc: "46 animated tab bars and panels for Expo and React Native, in the style of shadcn/ui.",
    github: "https://github.com/VanitasCaesar1/tabcn",
    href: "https://vanitascaesar1.github.io/tabcn/",
    peek: "/assets/img/tabcn-poster.webp",
    stack: [T.expo, T.rn, T.typescript, T.npm],
    bullets: [
      { text: "A small npm package, react-native-tabcn, handles the navigator, safe areas, the sliding highlight, badges and accessibility." },
      { text: "Each design is one file you copy in with the shadcn CLI, matched to a real app's screenshots and checked right to left and at the largest text size." },
    ],
    media: { kind: "video", src: "/assets/img/tabcn.mp4", poster: "/assets/img/tabcn-poster.webp", alt: "tabcn tab bars in motion" },
  },
  {
    title: "expo-hot-toast",
    desc: "The react-hot-toast API for Expo: Liquid Glass on iOS 26, Material 3 on Android, frosted glass on the web.",
    github: "https://github.com/VanitasCaesar1/expo-hot-toast",
    href: "https://vanitascaesar1.github.io/expo-hot-toast/",
    peek: "/assets/img/toast-poster.webp",
    stack: [T.expo, T.ios, T.android, T.typescript],
    bullets: [{ text: "Every button on the demo site fires a real toast from the library, running in your browser." }],
    media: { kind: "video", src: "/assets/img/expo-hot-toast.mp4", poster: "/assets/img/toast-poster.webp", alt: "expo-hot-toast toasts in motion" },
  },
  {
    title: "hippo",
    desc: "Memory for AI coding agents. Every night it turns the day's repeated corrections into rules.",
    github: "https://github.com/VanitasCaesar1/hippo",
    href: "https://vanitascaesar1.github.io/hippo/",
    stack: [T.rust, T.claude, T.codex],
    bullets: [{ text: "Reads the day's Claude Code, Codex and OpenCode sessions, turns repeated corrections into rules, and has a second model check each rule against what happened." }],
  },
  {
    title: "Vesta Arcade",
    desc: "An arcade where coding agents publish browser games and get players' crashes back as reports they can fix.",
    href: "https://vestapowered.in",
    stack: [T.typescript, T.workers],
    bullets: [{ text: "Runs on Cloudflare Workers with D1 and R2." }],
  },
  {
    title: "ZVault",
    desc: "A secrets manager that keeps API keys away from AI coding tools.",
    github: "https://github.com/VanitasCaesar1/ZVault",
    stack: [T.rust, T.homebrew],
    bullets: [{ text: "AES-256-GCM, installed from a Homebrew tap." }],
  },
  {
    title: "ButterUI",
    desc: "Smooth screen transitions and native portals for React Native, packaged as agent skills.",
    github: "https://github.com/VanitasCaesar1/ButterUI",
    stack: [T.rn, T.typescript],
    bullets: [{ text: "Works with Claude Code, Cursor and Codex." }],
  },
];

export const quote = { text: "Simplicity is prerequisite for reliability.", by: "Edsger W. Dijkstra" };
