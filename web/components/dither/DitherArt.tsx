"use client";

// Dithered pixel art drawn by one WebGL shader. Each scene samples a real texture
// (NASA Blue Marble clouds and ocean mask, via three.js examples) and turns it into
// dots on a fixed 3px grid with 4x4 ordered dithering. The grid never moves, so the
// picture can drift and react to the pointer without the dots crawling.

import { useEffect, useRef } from "react";

export type Scene = "clouds" | "eclipse" | "tide" | "horizon" | "globe";
const SCENE_ID: Record<Scene, number> = { clouds: 0, eclipse: 1, tide: 2, horizon: 3, globe: 4 };

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uCell;
uniform float uDot;
uniform float uDpr;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMk;
uniform float uReveal;
uniform int uScene;
uniform vec2 uRot;
uniform sampler2D uClouds;
uniform sampler2D uOcean;

const float PI = 3.14159265;

float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 pal(float l) {
  if (l < 1.5) return vec3(28.0, 36.0, 104.0) / 255.0;
  if (l < 2.5) return vec3(48.0, 64.0, 168.0) / 255.0;
  if (l < 3.5) return vec3(86.0, 104.0, 226.0) / 255.0;
  if (l < 4.5) return vec3(140.0, 156.0, 255.0) / 255.0;
  return vec3(214.0, 220.0, 255.0) / 255.0;
}

float bump(vec2 p, float r) {
  vec2 d = p - uMouse;
  return uMk * exp(-dot(d, d) / (r * r));
}

float cloudsAt(vec2 uv) { return texture2D(uClouds, uv).r; }

float scene(vec2 p, vec2 size, vec2 cell) {
  float w = size.x, h = size.y;
  if (uScene == 0) {
    // Hero: a window onto real cloud cover, darker behind the name, lit by the pointer.
    float b = bump(p, 130.0);
    vec2 lens = p + (p - uMouse) * 0.45 * b;
    float fw = 0.40;
    vec2 tuv = vec2(0.25 + lens.x / w * fw + uTime * 0.0012, 0.06 + lens.y / w * fw * 2.0);
    float c = smoothstep(0.04, 0.62, cloudsAt(tuv));
    vec2 e = vec2((p.x - w * 0.5) / max(w * 0.3, 170.0), (p.y - h * 0.47) / (h * (w < 600.0 ? 0.5 : 0.36)));
    float open = smoothstep(0.35, 1.5, dot(e, e));
    float ragged = (cloudsAt(vec2(p.x / w * 0.3, 0.9)) - 0.5) * 40.0;
    float bottom = 1.0 - smoothstep(h * 0.66, h * 0.98, p.y + ragged);
    float v = (c * 1.1 - 0.08) * (0.22 + 0.78 * open) + b * (c * 0.75 + 0.06);
    return v * bottom + 0.07 * bottom;
  }
  if (uScene == 1) {
    // Eclipse: a dark disc with a thin rim and a corona whose texture comes from the clouds.
    float R = min(min(w * 0.3, h * 0.27), 80.0);
    vec2 c = vec2(w - R * 0.55, h * 0.66);
    vec2 d = p - c;
    float r = length(d);
    if (r < R - 2.0) return 0.0;
    if (r < R + 1.6) return 0.97;
    float a = atan(d.y, d.x);
    float flame = 0.65 + 0.7 * smoothstep(0.02, 0.6, cloudsAt(vec2(a / (2.0 * PI) * 0.5 + 0.3 + uTime * 0.004, 0.12 + r / h * 0.3)));
    float glow = exp(-(r - R) / (R * 0.55)) * flame * (1.0 + 1.4 * bump(p, 140.0));
    return (glow - 0.1) * smoothstep(w * 0.05, w * 0.6, p.x);
  }
  if (uScene == 2) {
    // Tide: the band behind "Show more", rising from the bottom.
    float n = smoothstep(0.02, 0.6, cloudsAt(vec2(p.x / w * 0.5 + 0.1 + uTime * 0.002, 0.74 + p.y / h * 0.08)));
    float q = p.y / h + 0.07 * sin(p.x * 0.018 + uTime * 0.5) + 0.16 * (n - 0.4);
    return smoothstep(0.38, 1.02, q) * 0.92 * (0.75 + 0.25 * sin(p.x / w * PI)) + 0.45 * bump(p, 90.0);
  }
  if (uScene == 3) {
    // Horizon: a low band of cloud under the contact section, a few still stars above.
    float band = exp(-pow((p.y - h * 0.86) / (h * 0.1), 2.0));
    float n = smoothstep(0.02, 0.6, cloudsAt(vec2(p.x / w * 0.6 + 0.2 + uTime * 0.0015, 0.7 + p.y / h * 0.12)));
    float v = band * (n * 1.3 - 0.12) + bump(p, 110.0) * (n - 0.05);
    if (p.y < h * 0.7 && hash(cell) > 0.9965) v = 0.3;
    return v;
  }
  // Globe: orthographic, ocean mask for land, the same clouds drifting over it.
  float R = min(w * 0.4, h * 0.8);
  vec2 c = vec2(w * 0.5, 70.0 + R);
  float nx = (p.x - c.x) / R, ny = (c.y - p.y) / R;
  float r2 = nx * nx + ny * ny;
  if (r2 > 1.0) {
    float r = sqrt(r2);
    if (r < 1.16) return pow(1.0 - (r - 1.0) / 0.16, 2.0) * 0.3;
    if (hash(cell) > 0.994) return 0.28 + 0.12 * sin(uTime * 1.3 + cell.x);
    return 0.0;
  }
  float nz = sqrt(1.0 - r2);
  float sp = sin(uRot.y), cp = cos(uRot.y);
  float lat = asin(clamp(ny * cp + nz * sp, -1.0, 1.0));
  float lon = uRot.x + atan(nx, nz * cp - ny * sp);
  vec2 tuv = vec2(fract((lon + PI) / (2.0 * PI)), (PI * 0.5 - lat) / PI);
  float ocean = texture2D(uOcean, tuv).r;
  float cl = cloudsAt(tuv + vec2(uTime * 0.0015, 0.0));
  float lambert = max(0.0, dot(vec3(nx, ny, nz), normalize(vec3(-0.32, 0.42, 0.85))));
  float limb = 0.55 + 0.45 * nz;
  float ground = mix(0.4 + 0.42 * lambert, 0.07 + 0.2 * lambert, smoothstep(0.3, 0.7, ocean));
  return (ground + 0.3 * smoothstep(0.35, 0.9, cl) * lambert) * limb;
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 cell = floor(frag / uCell);
  vec2 local = frag - cell * uCell;
  if (local.x >= uDot || local.y >= uDot) discard;
  if (hash(cell + 7.0) > uReveal) discard;
  vec2 p = (cell + 0.5) * uCell / uDpr;
  float v = scene(p, uRes / uDpr, cell);
  float q = clamp(v, 0.0, 1.0) * 5.0;
  float lvl = floor(q);
  if (q - lvl > bayer4(cell)) lvl += 1.0;
  if (lvl < 0.5) discard;
  gl_FragColor = vec4(pal(lvl), 1.0);
}
`;

// Shared globe rotation: radians. Spins slowly, can be dragged and thrown.
const G = { lon: (78 * Math.PI) / 180, lat: (8 * Math.PI) / 180, v: 0, dragging: false };

const images = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string) {
  if (!images.has(src)) {
    images.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      }),
    );
  }
  return images.get(src)!;
}

export function DitherArt({ scene, className, label }: { scene: Scene; className?: string; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false, alpha: true });
    if (!gl) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = {
      res: u("uRes"), cell: u("uCell"), dot: u("uDot"), dpr: u("uDpr"), time: u("uTime"), mouse: u("uMouse"),
      mk: u("uMk"), reveal: u("uReveal"), scene: u("uScene"), rot: u("uRot"), clouds: u("uClouds"), ocean: u("uOcean"),
    };
    gl.uniform1i(U.scene, SCENE_ID[scene]);

    const texture = (unit: number, img: HTMLImageElement) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, gl.LUMINANCE, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    let ready = false;
    let visible = false;
    let raf = 0;
    let revealStart = 0;
    let reveal = reduce ? 1 : 0;
    let dpr = 1;
    let lastStill = 0;
    const ptr = { x: 0, y: 0, tx: 0, ty: 0, k: 0, inside: false };
    const t0 = performance.now();

    Promise.all([loadImage("/tex/clouds.jpg"), scene === "globe" ? loadImage("/tex/ocean.jpg") : null]).then(([c, o]) => {
      texture(0, c);
      gl.uniform1i(U.clouds, 0);
      if (o) { texture(1, o); gl.uniform1i(U.ocean, 1); } else gl.uniform1i(U.ocean, 0);
      ready = true;
      kick();
    }).catch(() => {});

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      lastStill = 0; // resizing clears the canvas: draw again even when nothing moves
      kick();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    let prev = performance.now();
    const frame = (now: number) => {
      raf = 0;
      if (!ready || !visible) return;
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      if (!revealStart) revealStart = now;
      if (reveal < 1) reveal = 1 - Math.pow(1 - Math.min(1, (now - revealStart) / 1100), 3);

      const a = 1 - Math.exp(-dt * 18);
      ptr.x += (ptr.tx - ptr.x) * a;
      ptr.y += (ptr.ty - ptr.y) * a;
      ptr.k += ((ptr.inside ? 1 : 0) - ptr.k) * (1 - Math.exp(-dt * (ptr.inside ? 8 : 4)));

      if (scene === "globe" && !reduce && !G.dragging) {
        G.lon += ((G.v - 3) * Math.PI / 180) * dt;
        G.v *= Math.exp(-dt * 1.6);
      }

      const time = reduce ? 0 : (now - t0) / 1000;
      // Without reduce motion the picture drifts very slowly, so keep drawing; with it, draw only when something changed.
      const changed = reveal < 1 || ptr.k > 0.002 || G.dragging || Math.abs(G.v) > 0.3;
      if (!reduce || changed || !lastStill) {
        gl.uniform2f(U.res, canvas.width, canvas.height);
        gl.uniform1f(U.cell, Math.max(2, Math.round(3 * dpr)));
        gl.uniform1f(U.dot, Math.max(1, Math.round(2 * dpr)));
        gl.uniform1f(U.dpr, dpr);
        gl.uniform1f(U.time, time);
        gl.uniform2f(U.mouse, ptr.x, ptr.y);
        gl.uniform1f(U.mk, ptr.k);
        gl.uniform1f(U.reveal, reveal);
        gl.uniform2f(U.rot, G.lon, G.lat);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        lastStill = now;
      }
      if (!reduce || changed) raf = requestAnimationFrame(frame);
    };
    function kick() {
      if (!raf && visible && ready) { prev = performance.now(); raf = requestAnimationFrame(frame); }
    }

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); });
    io.observe(canvas);

    // The pointer lights the art under it (mouse only, not with reduce motion).
    const onMove = (e: PointerEvent) => {
      if (reduce || e.pointerType !== "mouse" || scene === "globe") return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const pad = 60;
      ptr.inside = x > -pad && y > -pad && x < r.width + pad && y < r.height + pad;
      if (ptr.inside) {
        if (ptr.k < 0.01) { ptr.x = x; ptr.y = y; }
        ptr.tx = x; ptr.ty = y;
        kick();
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Globe: drag follows the pointer 1:1 and keeps the throw's speed.
    let drag: { x: number; y: number; id: number; moved: boolean } | null = null;
    let samples: { t: number; lon: number }[] = [];
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
      samples = [{ t: e.timeStamp, lon: G.lon }];
      G.v = 0;
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        if (e.pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        drag.moved = true;
        G.dragging = true;
        canvas.classList.add("cursor-grabbing");
        canvas.setPointerCapture(e.pointerId);
      }
      const R = Math.min(canvas.clientWidth * 0.4, canvas.clientHeight * 0.8);
      G.lon -= dx / R;
      G.lat = Math.max(-0.45, Math.min(0.8, G.lat + dy / R));
      drag.x = e.clientX; drag.y = e.clientY;
      samples.push({ t: e.timeStamp, lon: G.lon });
      if (samples.length > 6) samples.shift();
      kick();
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved && samples.length > 1) {
        const a = samples[0], b = samples[samples.length - 1];
        const span = (b.t - a.t) / 1000;
        // degrees per second, same sign convention as the idle spin
        G.v = span > 0 && e.timeStamp - b.t < 80 ? Math.max(-400, Math.min(400, ((b.lon - a.lon) * 180) / Math.PI / span + 3)) : 0;
      }
      G.dragging = false;
      canvas.classList.remove("cursor-grabbing");
      drag = null;
      kick();
    };
    if (scene === "globe") {
      canvas.addEventListener("pointerdown", down);
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [scene]);

  return (
    <canvas
      ref={ref}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      data-drag={scene === "globe" ? "" : undefined}
      className={className}
    />
  );
}
