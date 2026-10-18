/* Preloader: contador em %, preenchimento laranja subindo e saída vertical.
   Aparece uma vez por sessão e trava o scroll até terminar. */
(function () {
  var root = document.documentElement;
  var el = document.querySelector('.preloader');
  if (!el) return;

  function done() {
    try { sessionStorage.setItem('pl-seen', '1'); } catch (e) {}
    root.classList.remove('pl-on');
    if (el.parentNode) el.parentNode.removeChild(el);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!root.classList.contains('pl-on') || reduce) { done(); return; }

  var fill = el.querySelector('.pl-fill');
  var num = el.querySelector('.pl-num');
  var START = 250;      // atraso inicial (ms)
  var COUNT = 1700;     // tempo do contador (ms)
  var EXIT = 900;       // duração da saída (ms)
  var loaded = document.readyState === 'complete';
  if (!loaded) window.addEventListener('load', function () { loaded = true; });

  // "slow-warp": acelera, desacelera perto de 70% e volta a correr no final
  function warp(t) {
    var a = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic
    return a * .85 + t * .15;
  }

  var t0 = null;
  function frame(now) {
    if (t0 === null) t0 = now + START;
    var t = Math.min(Math.max((now - t0) / COUNT, 0), 1);
    var p = warp(t);
    if (!loaded) p = Math.min(p, .96); // não chega a 100% antes da página carregar
    fill.style.transform = 'scaleY(' + p + ')';
    num.textContent = Math.round(p * 100);
    if (p >= 1) return leave();
    requestAnimationFrame(frame);
  }

  function leave() {
    el.classList.add('pl-exit');
    setTimeout(done, EXIT + 50);
  }

  requestAnimationFrame(frame);
  setTimeout(done, 9000); // segurança: nunca prende o site
})();
