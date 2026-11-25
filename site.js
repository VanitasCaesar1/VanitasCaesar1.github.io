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
  // s.pt = { x, y, k }: the pointer in the canvas's own CSS pixels, k = 0..1 how present it is.
  const bump = (s, x, y, r) => {
    const P = s.pt;
    if (!P || P.k < 0.01) return 0;
    const dx = x - P.x, dy = y - P.y;
    return P.k * Math.exp(-(dx * dx + dy * dy) / (r * r));
  };
  const ARTS = {
    clouds(s) {
      return (x, y, t) => {
        const { w, h } = s;
        const b = bump(s, x, y, 120);
        const P = s.pt;
        const lx = b ? x + (x - P.x) * 0.5 * b : x, ly = b ? y + (y - P.y) * 0.5 * b : y;
        const n = fbm(lx * 0.0105 + t * 0.012, ly * 0.017 - t * 0.004);
        const dx = (x - w / 2) / Math.max(w * 0.3, 170), dy = (y - h * 0.47) / (h * (w < 600 ? 0.5 : 0.36));
        const open = sstep(0.35, 1.5, dx * dx + dy * dy);
        const ragged = (noise(x * 0.05, 7.3) - 0.5) * 36;
        const bottom = 1 - sstep(h * 0.66, h * 0.98, y + ragged);
        return ((n - 0.4) * 2.6 * (0.25 + 0.75 * open) + b * (n * 0.9 - 0.05)) * bottom;
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
        const glow = Math.exp(-(d - R) / (R * 0.55)) * flame * (1 + 1.4 * bump(s, x, y, 140));
        return (glow - 0.1) * sstep(w * 0.05, w * 0.6, x);
      };
    },
    tide(s) {
      return (x, y, t) => {
        const { w, h } = s;
        const p = y / h + 0.07 * Math.sin(x * 0.018 + t * 0.7) + 0.12 * (fbm(x * 0.02, t * 0.25) - 0.5);
        return sstep(0.38, 1.02, p) * 0.92 * (0.75 + 0.25 * Math.sin((x / w) * Math.PI)) + 0.45 * bump(s, x, y, 90);
      };
    },
    horizon(s) {
      return (x, y, t) => {
        const { h } = s;
        const band = Math.exp(-Math.pow((y - h * 0.86) / (h * 0.1), 2));
        const n = fbm(x * 0.012 + t * 0.02, y * 0.04);
        let v = band * (n - 0.3) * 1.5 + bump(s, x, y, 110) * (n - 0.15);
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
  // Rotation state: autorotates, can be dragged, keeps the throw's speed and slows down.
  const G = { lon: 78, lat: 8, v: 0, dragging: false, sp: Math.sin(8 * RAD), cp: Math.cos(8 * RAD) };
  ARTS.globe = (s) => {
    loadLand();
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
      const sp = G.sp, cp = G.cp;
      const lat = Math.asin(Math.max(-1, Math.min(1, ny * cp + nz * sp))) / RAD;
      const lam0 = G.lon;
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
    const job = { s, art, field: null, visible: false, last: 0, tx: 0, ty: 0, inside: false };
    s.pt = { x: 0, y: 0, k: 0 };
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

  let prev = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.1, (now - prev) / 1000);
    prev = now;
    if (!reduce && !G.dragging) {
      G.lon += (G.v - 4) * dt;
      G.v *= Math.exp(-dt * 1.6);
    }
    G.sp = Math.sin(G.lat * RAD); G.cp = Math.cos(G.lat * RAD);
    if (!document.hidden) {
      for (const job of jobs) {
        if (!job.visible) continue;
        const P = job.s.pt;
        const a = 1 - Math.exp(-dt * 14);
        P.x += (job.tx - P.x) * a; P.y += (job.ty - P.y) * a;
        P.k += ((job.inside ? 1 : 0) - P.k) * (1 - Math.exp(-dt * 6));
        const busy = P.k > 0.01 || (job.art === "globe" && (G.dragging || Math.abs(G.v) > 0.5));
        const frame = busy ? 1000 / 40 : 1000 / 15;
        if (reduce && !busy && job.last) continue;
        if (now - job.last >= frame) drawJob(job, now);
      }
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // The pointer lights up the pixel art under it (mouse only; not with reduce motion).
  if (!reduce) {
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      for (const job of jobs) {
        if (!job.visible || job.art === "globe") continue;
        const r = job.s.canvas.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const pad = 60;
        job.inside = x > -pad && y > -pad && x < r.width + pad && y < r.height + pad;
        if (job.inside) {
          if (job.s.pt.k < 0.01) { job.s.pt.x = x; job.s.pt.y = y; }
          job.tx = x; job.ty = y;
        }
      }
    }, { passive: true });
    document.addEventListener("pointerleave", () => jobs.forEach((j) => { j.inside = false; }));
  }

  // Drag the globe: it follows the pointer 1:1 and keeps the throw's speed.
  const globe = document.querySelector("canvas.globe");
  if (globe) {
    let last = null, samples = [];
    globe.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      last = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
      samples = [{ t: e.timeStamp, lon: G.lon }];
      G.v = 0;
    });
    globe.addEventListener("pointermove", (e) => {
      if (!last || e.pointerId !== last.id) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      if (!last.moved) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        if (e.pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx)) { last = null; return; } // let a phone scroll
        last.moved = true;
        G.dragging = true;
        globe.classList.add("grabbing");
        globe.setPointerCapture(e.pointerId);
      }
      const R = Math.min(globe.clientWidth * 0.4, globe.clientHeight * 0.8);
      G.lon -= (dx / R) / RAD;
      G.lat = Math.max(-25, Math.min(45, G.lat + (dy / R) / RAD));
      last.x = e.clientX; last.y = e.clientY;
      samples.push({ t: e.timeStamp, lon: G.lon });
      if (samples.length > 6) samples.shift();
    });
    const end = (e) => {
      if (!last || (e && e.pointerId !== last.id)) return;
      if (last.moved && samples.length > 1) {
        const a = samples[0], b = samples[samples.length - 1];
        const span = (b.t - a.t) / 1000;
        G.v = span > 0 && e.timeStamp - b.t < 80 ? Math.max(-400, Math.min(400, (b.lon - a.lon) / span + 4)) : 0;
      }
      G.dragging = false;
      globe.classList.remove("grabbing");
      last = null;
    };
    globe.addEventListener("pointerup", end);
    globe.addEventListener("pointercancel", end);
    globe.addEventListener("lostpointercapture", end);
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
  const tip = document.querySelector(".graph-tip");
  let hover = -1;
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
    if (wrap && !wrap.dataset.scrolled && wrap.scrollWidth > wrap.clientWidth) { wrap.scrollLeft = wrap.scrollWidth; wrap.dataset.scrolled = "1"; }

    const total = document.querySelector(".contrib-total");
    if (total) total.textContent = data.total.toLocaleString("en-US");

    // The hovered day: its week column lifts, the cell gets a bright frame.
    if (hover >= 0 && hover < counts.length) {
      const wk = Math.floor(hover / 7), day = hover % 7;
      const x = Math.round(wk * pitch), y = Math.round(top + day * pitch);
      ctx.fillStyle = "rgba(141, 156, 255, 0.10)";
      ctx.fillRect(x - 2, top - 2, size + 4, 7 * pitch);
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;
      ctx.strokeRect(x - 1.5, y - 1.5, size + 3, size + 3);
    }
    graph._layout = { pitch, top, size, start, counts };
  }
  if (graph && tip) {
    graph.addEventListener("pointermove", (e) => {
      const L = graph._layout;
      if (!L) return;
      const b = graph.getBoundingClientRect();
      const wk = Math.floor((e.clientX - b.left) / L.pitch);
      const day = Math.floor((e.clientY - b.top - L.top) / L.pitch);
      const n = wk * 7 + day;
      const next = day < 0 || day > 6 || n < 0 || n >= L.counts.length ? -1 : n;
      if (next === hover) return;
      hover = next;
      drawGraph();
      if (hover < 0) { tip.classList.remove("show"); return; }
      const d = new Date(L.start.getTime() + hover * 86400000);
      const when = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
      const c = L.counts[hover];
      tip.innerHTML = `<b>${c === 0 ? "No" : c.toLocaleString("en-US")} contribution${c === 1 ? "" : "s"}</b> on ${when}`;
      const host = tip.parentElement.getBoundingClientRect();
      const cx = b.left - host.left + wk * L.pitch + L.size / 2;
      const cy = b.top - host.top + L.top + day * L.pitch;
      const half = tip.offsetWidth / 2;
      tip.style.translate = `${Math.max(8, Math.min(host.width - tip.offsetWidth - 8, cx - half))}px ${cy - tip.offsetHeight - 8}px`;
      tip.classList.add("show");
    });
    graph.addEventListener("pointerleave", () => { hover = -1; drawGraph(); tip.classList.remove("show"); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawGraph);
  drawGraph();

  /* ---------- Name scramble: on load, and again when the pointer reaches it ---------- */
  const scramble = document.querySelector("[data-scramble]");
  if (scramble && !reduce) {
    const final = scramble.textContent;
    const pool = "abcdefghijklmnopqrstuvwxyz";
    let running = false;
    const run = (dur) => {
      if (running) return;
      running = true;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const fixed = Math.floor(p * final.length);
        let out = final.slice(0, fixed);
        for (let i = fixed; i < final.length; i++) out += pool[Math.floor(Math.random() * pool.length)];
        scramble.textContent = out;
        if (p < 1) requestAnimationFrame(step); else { scramble.textContent = final; running = false; }
      };
      requestAnimationFrame(step);
    };
    scramble.setAttribute("aria-label", final);
    run(900);
    scramble.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") run(450); });
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

  /* ---------- Toast (assets/feel): from the bottom, 4 s, swipe down to dismiss ---------- */
  document.addEventListener("touchstart", () => {}, { passive: true }); // :active presses on iPhone
  const toast = document.querySelector(".toast");
  let toastTimer = 0;
  const closeToast = () => { clearTimeout(toastTimer); toast.setAttribute("data-feel-state", "closed"); };
  const say = (msg) => {
    if (!toast) return;
    toast.innerHTML = `<svg aria-hidden="true"><use href="#i-check"/></svg>${msg}`;
    toast.style.transform = "";
    toast.removeAttribute("data-feel-dragged");
    toast.setAttribute("data-feel-state", "closed");
    void toast.offsetWidth; // restart the arrival when one replaces another
    toast.setAttribute("data-feel-state", "open");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(closeToast, 4000);
  };
  if (toast && window.Feel) {
    window.Feel.drag(toast, { axis: "y", dismiss: 1, onDismiss: closeToast });
    toast.addEventListener("pointerenter", () => clearTimeout(toastTimer));
    toast.addEventListener("pointerleave", () => { if (toast.getAttribute("data-feel-state") === "open") toastTimer = setTimeout(closeToast, 4000); });
  }
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        say("Email copied");
        const ico = btn.querySelector(".copy-ico");
        if (ico) {
          ico.setAttribute("data-on", "");
          clearTimeout(ico._t);
          ico._t = setTimeout(() => ico.removeAttribute("data-on"), 1800);
        }
      } catch {
        window.location.href = `mailto:${btn.dataset.copy}`;
      }
    });
  });

  /* ---------- Pointer layer: spotlight, avatar tilt, magnetic button, project preview ---------- */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (fine) {
    // Dotted spotlight: every .spot knows where the pointer is.
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(".spot");
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  }

  if (fine && !reduce) {
    // Avatar tilts toward the pointer anywhere over the hero.
    const avatar = document.querySelector(".avatar");
    if (hero && avatar) {
      hero.addEventListener("pointermove", (e) => {
        const r = avatar.getBoundingClientRect();
        const nx = (e.clientX - (r.left + r.width / 2)) / (hero.clientWidth / 2);
        const ny = (e.clientY - (r.top + r.height / 2)) / (hero.clientHeight / 2);
        avatar.classList.add("tilting");
        avatar.style.setProperty("--ry", `${Math.max(-1, Math.min(1, nx)) * 14}deg`);
        avatar.style.setProperty("--rx", `${Math.max(-1, Math.min(1, ny)) * -14}deg`);
        avatar.style.setProperty("--gx", `${50 + nx * 50}%`);
        avatar.style.setProperty("--gy", `${50 + ny * 50}%`);
      });
      hero.addEventListener("pointerleave", () => {
        avatar.classList.remove("tilting");
        avatar.style.setProperty("--rx", "0deg");
        avatar.style.setProperty("--ry", "0deg");
      });
    }

    // The email button leans toward a pointer that comes near it.
    const cta = document.querySelector(".cta");
    const contact = document.querySelector(".contact");
    if (cta && contact) {
      contact.addEventListener("pointermove", (e) => {
        const r = cta.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const near = Math.abs(dx) < r.width / 2 + 70 && Math.abs(dy) < r.height / 2 + 50;
        cta.classList.toggle("magnet", near);
        cta.style.setProperty("--tx", near ? `${dx * 0.18}px` : "0px");
        cta.style.setProperty("--ty", near ? `${dy * 0.3}px` : "0px");
      });
      contact.addEventListener("pointerleave", () => {
        cta.classList.remove("magnet");
        cta.style.setProperty("--tx", "0px");
        cta.style.setProperty("--ty", "0px");
      });
    }

    // A small preview of the project follows the pointer over its closed row.
    const peek = document.querySelector(".peek");
    const peekImg = peek && peek.querySelector("img");
    if (peek && peekImg) {
      let px = 0, py = 0, tx = 0, ty = 0, on = false, raf = 0;
      const follow = () => {
        px += (tx - px) * 0.2; py += (ty - py) * 0.2;
        const x = Math.min(window.innerWidth - peek.offsetWidth - 12, px + 24);
        const y = Math.max(12, Math.min(window.innerHeight - peek.offsetHeight - 12, py - peek.offsetHeight / 2));
        peek.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        raf = on || Math.abs(tx - px) > 0.5 ? requestAnimationFrame(follow) : 0;
      };
      const hide = () => { on = false; peek.classList.remove("show"); };
      document.querySelectorAll("summary[data-peek]").forEach((sum) => {
        const row = sum.parentElement;
        sum.addEventListener("pointerenter", (e) => {
          if (row.open) return;
          if (peekImg.getAttribute("src") !== sum.dataset.peek) peekImg.src = sum.dataset.peek;
          if (!on) { px = tx = e.clientX; py = ty = e.clientY; }
          on = true;
          peek.classList.add("show");
          if (!raf) raf = requestAnimationFrame(follow);
        });
        sum.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
        sum.addEventListener("pointerleave", hide);
        row.addEventListener("toggle", () => { if (row.open) hide(); });
      });
      window.addEventListener("scroll", hide, { passive: true });
    }
  }

  /* ---------- Pixels around the mouse ---------- */
  // A dithered halo sits under the pointer and a short pixel trail follows it, anywhere on the page.
  const fx = document.querySelector(".cursor-fx");
  if (fx && fine && !reduce) {
    const ctx2 = fx.getContext("2d");
    const pts = [];           // trail: { x, y, life }
    let mx = -999, my = -999, halo = 0, haloTarget = 0, idle = 0, running = false, last = 0, k = 1;
    let box = null;           // last drawn area in device pixels
    const size = () => {
      k = dpr();
      fx.width = Math.round(window.innerWidth * k);
      fx.height = Math.round(window.innerHeight * k);
      box = null;
    };
    size();
    window.addEventListener("resize", size);

    const HALO_R = 46, TRAIL_R = 16;
    const field = (x, y) => {
      let v = 0;
      if (halo > 0.01) {
        const dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
        if (d2 < 9 * HALO_R * HALO_R) v += 0.42 * halo * Math.exp(-d2 / (HALO_R * HALO_R));
      }
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const r = TRAIL_R * (0.5 + 0.5 * p.life);
        const dx = x - p.x, dy = y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < 9 * r * r) v += 0.5 * p.life * Math.exp(-d2 / (r * r));
      }
      return 0.66 * (1 - Math.exp(-1.8 * v)); // overlapping trail saturates at bright blue, never white
    };

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      idle += dt;
      haloTarget = idle < 1.4 ? 1 : 0;
      halo += (haloTarget - halo) * (1 - Math.exp(-dt * (haloTarget ? 10 : 3)));
      for (const p of pts) p.life -= dt * 2.4;
      while (pts.length && pts[0].life <= 0) pts.shift();

      // Area to repaint: everything alive now, plus what was drawn last frame.
      let x0 = mx - 3 * HALO_R, y0 = my - 3 * HALO_R, x1 = mx + 3 * HALO_R, y1 = my + 3 * HALO_R;
      for (const p of pts) { x0 = Math.min(x0, p.x - 3 * TRAIL_R); y0 = Math.min(y0, p.y - 3 * TRAIL_R); x1 = Math.max(x1, p.x + 3 * TRAIL_R); y1 = Math.max(y1, p.y + 3 * TRAIL_R); }
      if (box) ctx2.clearRect(box.x, box.y, box.w, box.h);
      const cellPx = Math.max(2, Math.round(CELL * k)), dotPx = Math.max(1, Math.round(DOT * k));
      const ci0 = Math.max(0, Math.floor((x0 * k) / cellPx)), cj0 = Math.max(0, Math.floor((y0 * k) / cellPx));
      const ci1 = Math.min(Math.ceil(fx.width / cellPx), Math.ceil((x1 * k) / cellPx)), cj1 = Math.min(Math.ceil(fx.height / cellPx), Math.ceil((y1 * k) / cellPx));
      const W = (ci1 - ci0) * cellPx, H = (cj1 - cj0) * cellPx;
      if (W > 0 && H > 0 && (halo > 0.01 || pts.length)) {
        const img = ctx2.createImageData(W, H);
        const buf = new Uint32Array(img.data.buffer);
        for (let j = cj0; j < cj1; j++) {
          for (let i = ci0; i < ci1; i++) {
            const v = field(((i + 0.5) * cellPx) / k, ((j + 0.5) * cellPx) / k);
            if (v <= 0.02) continue;
            const q = clamp(v) * LEVELS;
            let lvl = Math.floor(q);
            if (q - lvl > BAYER[(j & 3) * 4 + (i & 3)]) lvl++;
            if (lvl <= 0) continue;
            const col = PAL[Math.min(lvl, LEVELS)];
            const ox = (i - ci0) * cellPx, oy = (j - cj0) * cellPx;
            for (let yy = oy; yy < oy + dotPx; yy++) for (let xx = ox; xx < ox + dotPx; xx++) buf[yy * W + xx] = col;
          }
        }
        ctx2.putImageData(img, ci0 * cellPx, cj0 * cellPx);
        box = { x: ci0 * cellPx, y: cj0 * cellPx, w: W, h: H };
      } else {
        box = null;
      }
      if (halo > 0.01 || pts.length) requestAnimationFrame(frame);
      else { running = false; if (box) ctx2.clearRect(box.x, box.y, box.w, box.h); box = null; }
    };
    const wake = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } };

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const x = e.clientX, y = e.clientY;
      // Lay trail points every few pixels so fast moves leave a continuous streak.
      if (mx > -999) {
        const dist = Math.hypot(x - mx, y - my);
        const steps = Math.min(12, Math.floor(dist / 7));
        for (let s2 = 1; s2 <= steps; s2++) pts.push({ x: mx + ((x - mx) * s2) / steps, y: my + ((y - my) * s2) / steps, life: 1 });
        while (pts.length > 40) pts.shift();
      }
      mx = x; my = y; idle = 0;
      wake();
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { idle = 99; wake(); });
  }

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
