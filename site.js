// The sinking stack, the layer gauge, live numbers, toasts and the time machine.
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sheets = [...document.querySelectorAll(".sheet")];
  const gaugeLinks = new Map([...document.querySelectorAll(".gauge a")].map((a) => [a.dataset.for, a]));
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const stacked = () => getComputedStyle(sheets[1]).position === "sticky";

  // How far each sheet is covered by the next one (0 to 1), and which layer is on screen.
  let ticking = false;
  const update = () => {
    ticking = false;
    const h = window.innerHeight;
    const sticky = stacked();
    let current = sheets[0];
    sheets.forEach((sheet, i) => {
      const top = sheet.getBoundingClientRect().top;
      if (top <= h * 0.5) current = sheet;
      const next = sheets[i + 1];
      if (!sticky || reduce || !next) { sheet.style.removeProperty("--cover"); return; }
      const cover = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / h));
      sheet.style.setProperty("--cover", cover.toFixed(3));
    });
    gaugeLinks.forEach((a, id) => a.classList.toggle("is-on", id === current.id));
    if (themeColor) themeColor.content = getComputedStyle(current).getPropertyValue("--bg").trim() || "#f5f4f0";
    if (current.id !== lastLayer) { lastLayer = current.id; onLayer(current.id); }
  };
  let lastLayer = null;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  // A sheet taller than the screen sticks by its bottom edge, so all of it is seen before the next one covers it.
  const fit = () => {
    sheets.forEach((s) => { s.style.top = stacked() ? `${Math.min(0, window.innerHeight - s.offsetHeight)}px` : ""; });
    onScroll();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", fit);
  document.fonts?.ready.then(fit);

  // Numbers that count up once.
  const countUp = (el, prefix = "") => {
    const target = Number(el.dataset.target);
    if (!target || reduce) return;
    const start = performance.now();
    const dur = 1600;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      el.textContent = prefix + Math.round(target * (1 - Math.pow(1 - t, 4))).toLocaleString("en-US");
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const commits = document.querySelector(".commits");
  if (commits) countUp(commits);

  // Toasts, in the expo-hot-toast look.
  const toaster = document.querySelector(".toaster");
  const toast = (text) => {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = '<span class="toast__ok" aria-hidden="true">✓</span>';
    t.append(text);
    toaster.append(t);
    setTimeout(() => {
      t.classList.add("is-out");
      t.addEventListener("animationend", () => t.remove(), { once: true });
      if (reduce) t.remove();
    }, 2600);
  };
  const lines = ["Changes saved", "Visit booked for Friday", "Reminder set for 8 PM", "Report explained", "Deploy finished"];
  let n = 0;
  document.querySelectorAll("[data-toast]").forEach((b) => b.addEventListener("click", () => toast(lines[n++ % lines.length])));

  // Things that happen when a layer arrives.
  const seen = new Set();
  const video = document.querySelector(".phone video");
  function onLayer(id) {
    if (video) (id === "pixel" ? video.play().catch(() => {}) : video.pause());
    if (seen.has(id)) return;
    seen.add(id);
    if (id === "pixel") setTimeout(() => toast("Hi. This is what my toasts look like."), 500);
    if (id === "data") { const r = document.querySelector(".roll"); if (r) countUp(r, "~"); }
  }

  // Copy buttons.
  document.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      toast("Copied");
    } catch {
      toast(b.dataset.copy);
    }
  }));

  // Time machine: switch the screen off like an old CRT, then land in 1997.
  document.querySelectorAll("[data-time-machine]").forEach((b) => b.addEventListener("click", () => {
    if (reduce) { location.href = "1997/"; return; }
    document.body.classList.add("is-leaving");
    setTimeout(() => { location.href = "1997/"; }, 650);
  }));
  // Coming back with the browser's back button: undo the switch-off.
  window.addEventListener("pageshow", () => document.body.classList.remove("is-leaving"));

  fit();
})();
