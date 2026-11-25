// Homepage behaviour: dithered pixel art, the contribution graph, the globe, the clock,
// the table of contents and a few buttons. No dependencies.

(() => {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);

  /* ---------- Noise ---------- */
  const hash = (x, y) => {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const smooth = (t) => t * t * (3 - 2 * t);
  const noise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = smooth(xf), v = smooth(yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y) => {
    let sum = 0, amp = 0.5, f = 1;
    for (let o = 0; o < 4; o++) { sum += amp * noise(x * f, y * f); f *= 2.03; amp *= 0.5; }
    return sum / 0.9375;
  };
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  /* ---------- Dither engine ---------- */
  // 4x4 Bayer thresholds; colours from dark indigo to near white. 0 = empty.
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const rgba = (r, g, b, a = 255) => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  const PAL = [0, rgba(28, 36, 104), rgba(48, 64, 168), rgba(86, 104, 226), rgba(140, 156, 255), rgba(214, 220, 255)];
  const LEVELS = PAL.length - 1;
  const CELL = 3, DOT = 2;

  function makeSurface(canvas) {
    const s = { canvas, ctx: canvas.getContext("2d"), w: 0, h: 0, img: null, buf: null, scale: 1 };
    s.resize = () => {
      const r = canvas.getBoundingClientRect();
      const k = dpr();
      s.w = Math.max(1, Math.round(r.width));
      s.h = Math.max(1, Math.round(r.height));
      s.scale = k;
      canvas.width = Math.round(s.w * k);
      canvas.height = Math.round(s.h * k);
      s.img = s.ctx.createImageData(canvas.width, canvas.height);
      s.buf = new Uint32Array(s.img.data.buffer);
    };
    // field(x, y, t) returns 0..1 in CSS pixels; drawn as dithered dots on a CELL grid.
    s.paint = (field, t) => {
      const { buf, img } = s;
      if (!buf) return;
      buf.fill(0);
      const W = img.width, H = img.height, k = s.scale;
      const cellPx = Math.max(2, Math.round(CELL * k)), dotPx = Math.max(1, Math.round(DOT * k));
      const cols = Math.ceil(W / cellPx), rows = Math.ceil(H / cellPx);
      for (let j = 0; j < rows; j++) {
        const y = (j + 0.5) * CELL;
        for (let i = 0; i < cols; i++) {
          const v = field((i + 0.5) * CELL, y, t);
          if (v <= 0.001) continue;
          const q = clamp(v) * LEVELS;
          let lvl = Math.floor(q);
          if (q - lvl > BAYER[(j & 3) * 4 + (i & 3)]) lvl++;
          if (lvl <= 0) continue;
          const col = PAL[Math.min(lvl, LEVELS)];
          const x0 = i * cellPx, y0 = j * cellPx;
          const x1 = Math.min(W, x0 + dotPx), y1 = Math.min(H, y0 + dotPx);
          for (let yy = y0; yy < y1; yy++) {
            const row = yy * W;
            for (let xx = x0; xx < x1; xx++) buf[row + xx] = col;
          }
        }
      }
      s.ctx.putImageData(img, 0, 0);
    };
    return s;
  }

  /* ---------- Art fields ---------- */
  const ARTS = {
    clouds(s) {
      return (x, y, t) => {
        const { w, h } = s;
        const n = fbm(x * 0.0105 + t * 0.012, y * 0.017 - t * 0.004);
        const dx = (x - w / 2) / Math.max(w * 0.3, 170), dy = (y - h * 0.47) / (h * (w < 600 ? 0.5 : 0.36));
        const open = sstep(0.35, 1.5, dx * dx + dy * dy);
        const ragged = (noise(x * 0.05, 7.3) - 0.5) * 36;
        const bottom = 1 - sstep(h * 0.66, h * 0.98, y + ragged);
        return (n - 0.4) * 2.6 * (0.25 + 0.75 * open) * bottom;
      };
    },
    eclipse(s) {
      return (x, y, t) => {
        const { w, h } = s;
        const R = Math.min(w * 0.3, h * 0.27, 80);
        const cx = w - R * 0.55, cy = h * 0.66;
        const dx = x - cx, dy = y - cy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < R - 2) return 0;
        if (d < R + 1.6) return 0.97;
        const a = Math.atan2(dy, dx);
        const flame = 0.7 + 0.5 * fbm(Math.cos(a) * 2.2 + 9, Math.sin(a) * 2.2 + d * 0.012 - t * 0.12);
        const glow = Math.exp(-(d - R) / (R * 0.55)) * flame;
        return (glow - 0.1) * sstep(w * 0.05, w * 0.6, x);
      };
    },
    tide(s) {
      return (x, y, t) => {
        const { w, h } = s;
        const p = y / h + 0.07 * Math.sin(x * 0.018 + t * 0.7) + 0.12 * (fbm(x * 0.02, t * 0.25) - 0.5);
        return sstep(0.38, 1.02, p) * 0.92 * (0.75 + 0.25 * Math.sin((x / w) * Math.PI));
      };
    },
    horizon(s) {
      return (x, y, t) => {
        const { h } = s;
        const band = Math.exp(-Math.pow((y - h * 0.86) / (h * 0.1), 2));
        const n = fbm(x * 0.012 + t * 0.02, y * 0.04);
        let v = band * (n - 0.3) * 1.5;
        const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
        if (y < h * 0.7 && hash(cx, cy) > 0.9965) v = 0.28 + 0.15 * Math.sin(t * 2 + cx);
        return v;
      };
    },
  };

  /* ---------- Globe ---------- */
  let landBits = null, LW = 0, LH = 0;
  function loadLand() {
    if (landBits || !window.LAND) return;
    const bin = atob(window.LAND.bits);
    landBits = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) landBits[i] = bin.charCodeAt(i);
    LW = window.LAND.w; LH = window.LAND.h;
  }
  const isLand = (lon, lat) => {
    let i = Math.floor(((lon + 180) / 360) * LW) % LW; if (i < 0) i += LW;
    const j = Math.min(LH - 1, Math.max(0, Math.floor(((90 - lat) / 180) * LH)));
    const n = j * LW + i;
    return (landBits[n >> 3] >> (n & 7)) & 1;
  };
  const RAD = Math.PI / 180;
  ARTS.globe = (s) => {
    loadLand();
    const phi0 = 8 * RAD, sp = Math.sin(phi0), cp = Math.cos(phi0);
    const L = [-0.32, 0.42, 0.85];
    return (x, y, t) => {
      const { w, h } = s;
      const R = Math.min(w * 0.4, h * 0.8);
      const cx = w / 2, cy = 70 + R;
      const nx = (x - cx) / R, ny = (cy - y) / R;
      const r2 = nx * nx + ny * ny;
      if (r2 > 1) {
        const r = Math.sqrt(r2);
        if (r < 1.16) return Math.pow(1 - (r - 1) / 0.16, 2) * 0.32;
        const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
        if (hash(gx, gy) > 0.994) return 0.25 + 0.2 * Math.sin(t * 1.7 + gx * 3.1);
        return 0;
      }
      if (!landBits) return 0.2;
      const nz = Math.sqrt(1 - r2);
      const lat = Math.asin(Math.max(-1, Math.min(1, ny * cp + nz * sp))) / RAD;
      const lam0 = 78 - t * 4;
      const lon = lam0 + Math.atan2(nx, nz * cp - ny * sp) / RAD;
      const lambert = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
      const limb = 0.55 + 0.45 * nz;
      return isLand(lon, lat) ? (0.4 + 0.42 * lambert) * limb : (0.07 + 0.2 * lambert) * limb;
    };
  };

  /* ---------- Run the canvases ---------- */
  const jobs = [];
  document.querySelectorAll("canvas[data-art], canvas.globe").forEach((canvas) => {
    const s = makeSurface(canvas);
    const art = canvas.classList.contains("globe") ? "globe" : canvas.dataset.art;
    const job = { s, art, field: null, visible: false, last: 0 };
    s.resize();
    job.field = ARTS[art](s);
    jobs.push(job);
  });

  const t0 = performance.now();
  const drawJob = (job, now) => {
    if (!job.field) job.field = ARTS[job.art](job.s);
    job.s.paint(job.field, reduce ? 0 : (now - t0) / 1000);
    job.last = now;
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const job = jobs.find((j) => j.s.canvas === e.target);
      if (!job) continue;
      job.visible = e.isIntersecting;
      if (job.visible) drawJob(job, performance.now());
    }
  }, { rootMargin: "100px" });
  jobs.forEach((j) => io.observe(j.s.canvas));

  if (!reduce) {
    const FRAME = 1000 / 15;
    const loop = (now) => {
      if (!document.hidden) {
        for (const job of jobs) if (job.visible && now - job.last >= FRAME) drawJob(job, now);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  let resizeTimer = 0;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      jobs.forEach((j) => { j.s.resize(); j.field = ARTS[j.art](j.s); drawJob(j, performance.now()); });
      drawGraph();
    }, 80);
  });
  jobs.forEach((j) => ro.observe(j.s.canvas));

  /* ---------- Contribution graph ---------- */
  const graph = document.querySelector(".graph");
  function drawGraph() {
    const data = window.CONTRIB;
    if (!graph || !data) return;
    const k = dpr();
    const r = graph.getBoundingClientRect();
    graph.width = Math.round(r.width * k);
    graph.height = Math.round(r.height * k);
    const ctx = graph.getContext("2d");
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, r.width, r.height);

    const counts = data.counts;
    const start = new Date(data.start + "T00:00:00Z");
    const weeks = Math.ceil(counts.length / 7);
    const top = 20;
    const pitch = Math.min(r.width / weeks, (r.height - top) / 7);
    const size = Math.max(4, Math.floor(pitch - 3));

    const nz = counts.filter((c) => c > 0).sort((a, b) => a - b);
    const q = (p) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] || 1;
    const t1 = q(0.25), t2 = q(0.5), t3 = q(0.8);
    const level = (c) => (c <= 0 ? 0 : c <= t1 ? 1 : c <= t2 ? 2 : c <= t3 ? 3 : 4);

    ctx.font = "10px 'Geist Mono', ui-monospace, monospace";
    ctx.fillStyle = "#85858f";
    ctx.textBaseline = "top";
    let lastMonth = -1;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let wk = 0; wk < weeks; wk++) {
      const d = new Date(start.getTime() + wk * 7 * 86400000);
      const m = d.getUTCMonth();
      if (m !== lastMonth && wk < weeks - 2) {
        if (lastMonth !== -1 || d.getUTCDate() <= 7) ctx.fillText(months[m], wk * pitch, 2);
        lastMonth = m;
      }
    }

    const dim = "#1a1a21", mid = "#8d9cff", hi = "#b9c2ff";
    counts.forEach((c, n) => {
      const wk = Math.floor(n / 7), day = n % 7;
      const x = Math.round(wk * pitch), y = Math.round(top + day * pitch);
      const lv = level(c);
      if (lv === 0) { ctx.fillStyle = dim; ctx.fillRect(x, y, size, size); return; }
      if (lv === 1) {
        ctx.fillStyle = mid;
        const u = Math.max(2, Math.floor(size / 4));
        ctx.fillRect(x + u - 1, y + u - 1, 2, 2); ctx.fillRect(x + size - u - 1, y + size - u - 1, 2, 2);
        ctx.fillRect(x + size - u - 1, y + u - 1, 2, 2); ctx.fillRect(x + u - 1, y + size - u - 1, 2, 2);
        return;
      }
      if (lv === 2) {
        ctx.fillStyle = mid;
        for (let yy = 0; yy < size; yy += 2) for (let xx = (yy / 2) % 2 ? 2 : 0; xx < size; xx += 4) ctx.fillRect(x + xx, y + yy, 2, 2);
        return;
      }
      if (lv === 3) { ctx.strokeStyle = hi; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, size - 2, size - 2); return; }
      ctx.fillStyle = hi; ctx.fillRect(x, y, size, size);
    });

    const wrap = graph.parentElement;
    if (wrap && wrap.scrollWidth > wrap.clientWidth) wrap.scrollLeft = wrap.scrollWidth;

    const total = document.querySelector(".contrib-total");
    if (total) total.textContent = data.total.toLocaleString("en-US");

    graph.onmousemove = (e) => {
      const b = graph.getBoundingClientRect();
      const wk = Math.floor((e.clientX - b.left) / pitch);
      const day = Math.floor((e.clientY - b.top - top) / pitch);
      const n = wk * 7 + day;
      if (day < 0 || day > 6 || n < 0 || n >= counts.length) { graph.title = ""; return; }
      const d = new Date(start.getTime() + n * 86400000);
      const when = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
      graph.title = `${counts[n]} contribution${counts[n] === 1 ? "" : "s"} on ${when}`;
    };
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawGraph);
  drawGraph();

  /* ---------- Name scramble ---------- */
  const scramble = document.querySelector("[data-scramble]");
  if (scramble && !reduce) {
    const final = scramble.textContent;
    const pool = "abcdefghijklmnopqrstuvwxyz";
    const start = performance.now();
    const dur = 900;
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const fixed = Math.floor(p * final.length);
      let out = final.slice(0, fixed);
      for (let i = fixed; i < final.length; i++) out += pool[Math.floor(Math.random() * pool.length)];
      scramble.textContent = out;
      if (p < 1) requestAnimationFrame(step); else scramble.textContent = final;
    };
    scramble.setAttribute("aria-label", final);
    requestAnimationFrame(step);
  }

  /* ---------- IST clock ---------- */
  const fmt = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });
  const tick = () => {
    const text = `${fmt.format(new Date()).toLowerCase()} IST`;
    document.querySelectorAll(".ist").forEach((el) => { el.textContent = text; });
  };
  tick();
  setInterval(tick, 20000);

  /* ---------- Table of contents + margin notes ---------- */
  const tocLinks = [...document.querySelectorAll(".toc a")];
  const sections = tocLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  const hands = [...document.querySelectorAll(".hand")];
  const rails = [...document.querySelectorAll(".rail-inner")];
  const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  let spyQueued = false;
  const spy = () => {
    spyQueued = false;
    const line = window.innerHeight * 0.4;
    let current = sections[0];
    for (const sec of sections) if (sec.getBoundingClientRect().top <= line) current = sec;
    tocLinks.forEach((a) => {
      const on = current && a.getAttribute("href") === `#${current.id}`;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
    // A note fades while it passes behind a sticky rail.
    const boxes = rails.map((r) => r.getBoundingClientRect());
    hands.forEach((h) => {
      const r = h.getBoundingClientRect();
      h.classList.toggle("tucked", boxes.some((b) => overlaps(r, { left: b.left, right: b.right, top: b.top - 16, bottom: b.bottom + 16 })));
    });
  };
  const queueSpy = () => { if (!spyQueued) { spyQueued = true; requestAnimationFrame(spy); } };
  window.addEventListener("scroll", queueSpy, { passive: true });
  window.addEventListener("resize", queueSpy);
  spy();

  /* ---------- Back to top ---------- */
  const toTop = document.querySelector(".to-top");
  const hero = document.querySelector(".hero");
  if (toTop && hero) {
    new IntersectionObserver(([e]) => toTop.classList.toggle("show", !e.isIntersecting)).observe(hero);
  }

  /* ---------- Toast + copy ---------- */
  const toast = document.querySelector(".toast");
  let toastTimer = 0;
  const say = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  };
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        say("Email copied");
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
      }
    });
  });

  /* ---------- Show more ---------- */
  document.querySelectorAll("[data-expand]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const box = btn.closest(btn.dataset.expand);
      if (!box) return;
      box.removeAttribute("data-collapsed");
      const next = box.querySelector(".extra summary") || box.querySelectorAll(".skill-row h3")[3];
      if (next) { if (!next.matches("summary")) next.tabIndex = -1; next.focus({ preventScroll: true }); }
      const fade = box.querySelector(".fade");
      if (fade) fade.remove();
    });
  });

  /* ---------- Rows: play media only while open ---------- */
  document.querySelectorAll("details.row").forEach((row) => {
    row.addEventListener("toggle", () => {
      row.querySelectorAll("video").forEach((v) => {
        if (row.open && !reduce) v.play().catch(() => {});
        else v.pause();
      });
    });
  });
  // Links inside a summary should open, not toggle the row.
  document.querySelectorAll("details.row summary a").forEach((a) => {
    a.addEventListener("click", (e) => e.stopPropagation());
  });
})();
