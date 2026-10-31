/* hero-fx.js — efeito "puxado" (rastro com corte) + luz azul nas linhas do capacete.
   Adicione no index.html, antes de </body>:  <script src="hero-fx.js" defer></script>  */
(function () {
  var reveal = document.getElementById('hsReveal');
  if (!reveal) return;
  var stage = reveal.parentElement, hero = reveal.closest('.hs');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mobileMQ = matchMedia('(max-width: 700px)');

  var css = document.createElement('style');
  css.textContent =
    '.hs-lines{position:absolute;inset:0;pointer-events:none;opacity:0;background:url(senna-linhas.webp) 50% 0/cover no-repeat;' +
    '-webkit-mask-image:linear-gradient(100deg,transparent 43%,#000 50%,transparent 57%);mask-image:linear-gradient(100deg,transparent 43%,#000 50%,transparent 57%);' +
    '-webkit-mask-size:300% 100%;mask-size:300% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:100% 0;mask-position:100% 0}' +
    '.hs-lines.run{animation:hsSweep .8s cubic-bezier(.55,0,.25,1) forwards}' +
    '.hs-lines.run.rev{animation-name:hsSweepR}' +
    '@keyframes hsSweep{0%{opacity:1;-webkit-mask-position:100% 0;mask-position:100% 0}88%{opacity:1}100%{opacity:0;-webkit-mask-position:0% 0;mask-position:0% 0}}' +
    '@keyframes hsSweepR{0%{opacity:1;-webkit-mask-position:0% 0;mask-position:0% 0}88%{opacity:1}100%{opacity:0;-webkit-mask-position:100% 0;mask-position:100% 0}}' +
    '@media(max-width:700px){.hs-lines{background-image:url(senna-linhas-m.webp)}}';
  document.head.appendChild(css);

  var lines = document.createElement('div');
  lines.className = 'hs-lines';
  stage.appendChild(lines);

  // luz azul correndo pelas linhas do capacete
  var lastFx = 0, dir = false;
  function sweep() {
    if (reduce) return;
    var n = performance.now();
    if (n - lastFx < 1500) return;
    lastFx = n; dir = !dir;
    lines.classList.remove('run', 'rev');
    void lines.offsetWidth;
    lines.classList.add('run');
    if (dir) lines.classList.add('rev');
  }

  // posição dos olhos/viseira dentro da imagem (considera object-fit: cover, alinhado ao topo)
  function anchor(b) {
    var m = mobileMQ.matches, ratio = m ? 1200 / 1800 : 16 / 9, fx = m ? 0.5 : 0.5417, fy = m ? 0.4222 : 0.4148;
    var s = Math.max(b.width / ratio, b.height), dw = s * ratio;
    return { x: (b.width - dw) / 2 + fx * dw, y: fy * s };
  }

  var N = 12, P = [], R = 0, px = 0, py = 0, lx = 0, ly = 0, active = false, visible = true, k;
  for (k = 0; k < N; k++) P.push({ x: 0, y: 0 });

  hero.addEventListener('pointermove', function (e) {
    active = true; px = e.clientX; py = e.clientY;
    if (Math.hypot(px - lx, py - ly) > 30) { lx = px; ly = py; sweep(); }
  }, { passive: true });
  hero.addEventListener('pointerdown', function (e) { active = true; px = e.clientX; py = e.clientY; sweep(); });
  ['pointerleave', 'pointerup', 'pointercancel'].forEach(function (ev) {
    hero.addEventListener(ev, function () { active = false; });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  }

  function loop(t) {
    requestAnimationFrame(loop);
    if (!visible) return;
    var b = reveal.getBoundingClientRect(), f = anchor(b), big = Math.min(b.width, b.height), tx, ty, tr;
    if (reduce) { tx = f.x; ty = f.y; tr = big * 0.26; }
    else if (active) { tx = px - b.left; ty = py - b.top; tr = fine ? Math.max(140, b.width * 0.095) : big * 0.3; }
    else if (fine) { tx = P[0].x; ty = P[0].y; tr = 0; }
    else { tx = f.x + Math.sin(t * 0.0009) * b.width * 0.14; ty = f.y + Math.cos(t * 0.0013) * b.height * 0.06; tr = big * 0.3; }

    if (R < 1 && tr > 0 && fine && !reduce) { for (k = 0; k < N; k++) { P[k].x = tx; P[k].y = ty; } }
    var h = P[0], ox = h.x, oy = h.y;
    h.x += (tx - h.x) * 0.32; h.y += (ty - h.y) * 0.32;
    var sp = Math.min(1, Math.hypot(h.x - ox, h.y - oy) / 30);
    for (k = 1; k < N; k++) { P[k].x += (P[k - 1].x - P[k].x) * 0.28; P[k].y += (P[k - 1].y - P[k].y) * 0.28; }
    R += (tr - R) * 0.14;

    var m;
    if (R < 1.5) m = 'linear-gradient(transparent,transparent)';
    else {
      var parts = [];
      for (k = 0; k < N; k++) {
        var r = Math.max(1, R * (1 - 0.6 * k / N) * (1 + 0.3 * sp));
        parts.push('radial-gradient(circle ' + r.toFixed(1) + 'px at ' + P[k].x.toFixed(1) + 'px ' + P[k].y.toFixed(1) + 'px,#000 84%,transparent 100%)');
      }
      m = parts.join(',');
    }
    reveal.style.webkitMaskImage = m;
    reveal.style.maskImage = m;
  }
  requestAnimationFrame(loop);

  setTimeout(sweep, 900);
  if (!fine && !reduce) setInterval(function () { if (visible) sweep(); }, 4500);
})();
