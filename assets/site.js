// Site v13 (todas as páginas): abertura animada, palco do reel da home, barra de progresso,
// previews dos projetos, players do YouTube, "ver mais" e menu do celular.
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EN = (root.lang || '').startsWith('en'); // versão em inglês (pasta /en)

// ABERTURA ANIMADA (uma vez por sessão, em qualquer página que a pessoa abrir primeiro)
// 1. o logo rola da direita para a esquerda, girando no sentido anti-horário
//    (o giro acompanha a distância percorrida, como uma roda de verdade);
// 2. "carlos anibale" aparece depois da borda do logo, conforme ele passa;
// 3. o laranja sobe e revela o site.
(function () {
  const scr = document.querySelector('.intro-screen');
  if (!scr) return;
  const finish = () => {
    try { sessionStorage.setItem('intro-seen', '1'); } catch (e) {}
    root.classList.remove('intro-on');
    scr.remove();
  };
  if (!root.classList.contains('intro-on')) { finish(); return; }

  const logo = scr.querySelector('.roll');
  const name = scr.querySelector('.name');
  const ROLL = 1300, HOLD = 450, EXIT = 900, DELAY = 200;
  const ease = t => 1 - Math.pow(1 - t, 3); // desacelera no fim, como quem freia

  let dx, r, nameL, nameW, baseL;
  const measure = () => {
    logo.style.transform = 'none';
    const lr = logo.getBoundingClientRect(), nr = name.getBoundingClientRect();
    r = lr.width / 2; baseL = lr.left;
    nameL = nr.left; nameW = nr.width;
    dx = innerWidth - lr.left + 8; // começa logo depois da borda direita
  };
  let t0 = null;
  const frame = now => {
    if (t0 === null) t0 = now + DELAY;
    const t = Math.min(Math.max((now - t0) / ROLL, 0), 1);
    const x = dx * (1 - ease(t));
    const deg = (x / r) * 180 / Math.PI; // ângulo = distância / raio
    logo.style.transform = 'translateX(' + x + 'px) rotate(' + deg + 'deg)';
    // o texto só aparece depois da borda direita do logo (nunca por trás dele)
    const edge = baseL + 2 * r + x;
    const cut = Math.min(Math.max(edge - nameL, 0), nameW);
    name.style.clipPath = 'inset(0 0 0 ' + (cut / nameW * 100) + '%)';
    if (t < 1) return requestAnimationFrame(frame);
    name.style.clipPath = 'inset(0 0 0 0)';
    setTimeout(() => {
      scr.classList.add('out'); // o laranja sobe (transição no CSS)
      setTimeout(finish, EXIT + 50);
    }, HOLD);
  };
  // espera a fonte do nome carregar para medir as posições certas
  // (no máximo 500 ms, para a abertura nunca ficar parada no laranja)
  let started = false;
  const once = () => { if (!started) { started = true; measure(); requestAnimationFrame(frame); } };
  if (document.fonts) document.fonts.ready.then(once, once);
  setTimeout(once, 500);
  setTimeout(() => { if (document.body.contains(scr)) finish(); }, 6000); // segurança
})();

// PALCO DO REEL (só na home): --p vai de 0 a 1 durante a primeira tela de rolagem.
// O vídeo fica parado em tela cheia, escurece e a apresentação sobe por cima;
// depois a seção solta e tudo segue a rolagem normal.
// Barra de progresso do topo: em todas as páginas.
(function () {
  const hero = document.querySelector('.hero');
  const mobile = matchMedia('(max-width:900px)');
  const bar = document.querySelector('.top .scrub span');
  if (reduce) document.querySelectorAll('.hero video, .case-hero video').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });
  let ticking = false;
  const upd = () => {
    ticking = false;
    if (hero) {
      const range = hero.offsetHeight - innerHeight;
      // celular e "menos movimento": apresentação já visível, sem efeito de rolagem
      const p = (reduce || mobile.matches) ? 1 : Math.min(Math.max(scrollY / range, 0), 1);
      hero.style.setProperty('--p', p.toFixed(4));
    }
    if (bar) {
      const max = root.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
    }
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  upd();
})();

// ROLAGEM SUAVE (mouse e trackpad no computador)
// A roda do mouse define um destino e a página desliza até ele com inércia,
// desacelerando no fim. Não roda em celular/tablet (a rolagem do toque já é suave),
// para quem prefere menos movimento, nem durante a abertura animada.
// Links para âncoras da mesma página (#projetos, #contato...) usam o mesmo movimento.
(function () {
  if (reduce || matchMedia('(pointer: coarse)').matches) return;
  root.style.scrollBehavior = 'auto'; // o CSS smooth brigaria com o movimento quadro a quadro
  const EASE = 7;     // quanto maior, mais rápido chega no destino
  const HEADER = 64;  // altura do topo fixo, para a âncora não ficar escondida atrás dele
  let target = scrollY, current = scrollY, running = false, last = 0;
  const max = () => root.scrollHeight - innerHeight;
  const clamp = v => Math.min(Math.max(v, 0), max());

  const tick = now => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    current += (target - current) * (1 - Math.exp(-EASE * dt));
    if (Math.abs(target - current) < 0.5) { current = target; running = false; }
    scrollTo(0, current);
    if (running) requestAnimationFrame(tick);
  };
  const start = () => {
    if (running) return;
    running = true; current = scrollY; last = performance.now();
    requestAnimationFrame(tick);
  };

  addEventListener('wheel', e => {
    if (e.ctrlKey || root.classList.contains('intro-on')) return; // zoom do navegador ou abertura
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;          // rolagem lateral fica nativa
    e.preventDefault();
    let d = e.deltaY;
    if (e.deltaMode === 1) d *= 40; else if (e.deltaMode === 2) d *= innerHeight;
    target = clamp(target + d);
    start();
  }, { passive: false });

  // se a página rolar por outro meio (teclado, barra de rolagem), parte dali
  addEventListener('scroll', () => { if (!running) target = current = scrollY; }, { passive: true });
  addEventListener('resize', () => { target = clamp(target); });

  // âncoras da mesma página
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute('href');
    const el = id.length > 1 ? document.querySelector(id) : document.body;
    if (!el) return;
    e.preventDefault();
    target = clamp(el === document.body ? 0 : el.getBoundingClientRect().top + scrollY - HEADER);
    start();
    history.pushState(null, '', id);
  });
})();

// Projetos: os vídeos carregam e tocam nítidos quando aparecem na tela
(function () {
  const vids = document.querySelectorAll('.shot video');
  const load = v => { if (!v.src) v.src = v.dataset.src; };
  if (!('IntersectionObserver' in window)) { vids.forEach(v => { load(v); if (!reduce) v.play().catch(() => {}); }); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    if (e.isIntersecting) { load(v); if (!reduce) v.play().catch(() => {}); }
    else v.pause();
  }), { rootMargin: '200px 0px', threshold: .2 });
  vids.forEach(v => io.observe(v));
})();

// YouTube: o player só carrega no clique (site mais leve)
document.querySelectorAll('.yt').forEach(yt => {
  yt.querySelector('button').addEventListener('click', () => {
    yt.innerHTML = '<iframe src="https://www.youtube.com/embed/' + yt.dataset.id + '?autoplay=1" title="' + (EN ? 'Video' : 'Vídeo') + '" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
  });
});

// "Ver mais / Ver menos": mostra ou esconde o conteúdo ligado ao botão
document.querySelectorAll('.toggle').forEach(b => {
  const alvo = document.getElementById(b.getAttribute('aria-controls'));
  const txt = b.querySelector('.toggle-txt');
  b.addEventListener('click', () => {
    const aberto = b.getAttribute('aria-expanded') === 'true';
    b.setAttribute('aria-expanded', String(!aberto));
    alvo.hidden = aberto;
    if (txt) txt.textContent = aberto ? b.dataset.more : b.dataset.less;
  });
});

// Menu no celular
(function () {
  const top = document.querySelector('.top');
  const btn = top && top.querySelector('.menu-btn');
  if (!btn) return;
  const set = open => {
    top.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? (EN ? 'Close menu' : 'Fechar menu') : (EN ? 'Open menu' : 'Abrir menu'));
  };
  btn.addEventListener('click', () => set(!top.classList.contains('open')));
  top.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  matchMedia('(min-width:901px)').addEventListener('change', e => { if (e.matches) set(false); });
})();
