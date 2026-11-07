// Sorena: a starfield that only moves when you scroll. Scrolling down drifts you gently forward through
// it, scrolling up drifts you back. Standing still, it stands still. With Reduce Motion it stays one frame.
(() => {
  // The bar has no surface at the top of the page and takes shape once you scroll
  const mark = () => document.documentElement.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", mark, { passive: true }); mark();
  // Pinned scenes: --p runs from 0 to 1 while the scene scrolls past, like an Apple product page
  const scenes = [...document.querySelectorAll(".scene")];
  let queued = false;
  const progress = () => {
    queued = false;
    for (const el of scenes) {
      const r = el.getBoundingClientRect(), run = el.offsetHeight - innerHeight;
      el.style.setProperty("--p", run > 0 ? Math.min(1, Math.max(0, -r.top / run)).toFixed(4) : "0");
    }
  };
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(progress); } };
  if (scenes.length) { addEventListener("scroll", ask, { passive: true }); addEventListener("resize", ask); progress(); }
  const canvas = document.querySelector(".warp");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COUNT = 700, DEPTH = 1600;
  let w = 0, h = 0, dpr = 1, lastY = scrollY;
  const stars = Array.from({ length: COUNT }, () => spawn(Math.random() * DEPTH));

  function spawn(z) {
    // Warm and cool whites, like the app's bone and sky tints
    const tint = Math.random();
    const colour = tint < 0.12 ? "255, 214, 170" : tint < 0.24 ? "190, 225, 255" : "242, 238, 230";
    return { x: (Math.random() - 0.5) * 2400, y: (Math.random() - 0.5) * 1600, z, colour, px: null, py: null };
  }
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  let velocity = 0;
  function frame() {
    const dy = scrollY - lastY; lastY = scrollY;
    // Ease towards the scroll speed and settle to a stop shortly after scrolling ends
    velocity += (Math.max(-40, Math.min(40, dy)) * 0.12 - velocity) * 0.12;
    if (Math.abs(velocity) < 0.002) velocity = 0;
    draw(still ? 0 : velocity);
    requestAnimationFrame(frame);
  }
  function draw(speed) {
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.45, f = Math.max(w, h) * 0.6;
    for (const s of stars) {
      s.z -= speed;
      if (s.z < 1) { Object.assign(s, spawn(DEPTH)); continue; }
      if (s.z > DEPTH) { Object.assign(s, spawn(DEPTH)); continue; }
      const k = f / s.z, x = cx + s.x * k, y = cy + s.y * k;
      if (x < -50 || x > w + 50 || y < -50 || y > h + 50) { Object.assign(s, spawn(DEPTH * (0.6 + Math.random() * 0.4))); continue; }
      const near = 1 - s.z / DEPTH, a = Math.min(0.9, 0.08 + near * near * 1.2), r = 0.25 + near * near * 1.3;
      ctx.fillStyle = `rgba(${s.colour}, ${a})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  addEventListener("resize", () => { resize(); draw(0); });
  resize();
  requestAnimationFrame(frame);
})();
