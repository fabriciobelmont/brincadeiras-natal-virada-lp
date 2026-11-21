(function () {
  'use strict';
  var F = window.FLT || {};
  var reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conteudo = { content_ids: F.produtoId ? [F.produtoId] : undefined, content_name: F.produtoNome, content_type: 'product' };
  function fb(tipo, nome, dados) { if (window.fbq) { try { window.fbq(tipo, nome, dados || {}); } catch (e) {} } }
  function clarityEvento(nome) { if (window.clarity) { try { window.clarity('event', nome); } catch (e) {} } }
  function junta(a, b) { var r = {}, k; for (k in a) if (a[k] !== undefined) r[k] = a[k]; for (k in b) if (b[k] !== undefined) r[k] = b[k]; return r; }

  // 1. Rolagem suave (botões data-cta="rolagem"; destino padrão #o-que-voce-recebe ou data-alvo)
  var animando = false;
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function rolarAte(alvo) {
    function destino() {
      var barra = document.querySelector('[data-barra-fixa]');
      return alvo.getBoundingClientRect().top + window.pageYOffset - ((barra ? barra.offsetHeight : 0) + 12);
    }
    function focar() { var t = alvo.querySelector('h2') || alvo; t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
    if (reduzir) { window.scrollTo(0, destino()); focar(); return; }
    var inicio = window.pageYOffset, t0 = null;
    var duracao = Math.min(1300, Math.max(700, Math.abs(destino() - inicio) * 0.35));
    animando = true;
    function passo(agora) {
      if (!animando) return;
      if (t0 === null) t0 = agora;
      var p = Math.min((agora - t0) / duracao, 1);
      window.scrollTo(0, inicio + (destino() - inicio) * ease(p));
      if (p < 1) requestAnimationFrame(passo); else { animando = false; focar(); }
    }
    requestAnimationFrame(passo);
  }
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, function () { animando = false; }, { passive: true }); });
  document.querySelectorAll('[data-cta="rolagem"]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var alvo = document.getElementById(b.getAttribute('data-alvo') || 'o-que-voce-recebe');
      if (!alvo) return;
      e.preventDefault(); rolarAte(alvo);
    });
  });

  // 2. UTM e parâmetros da URL repassados ao checkout + 3. evento de clique de saída (não é InitiateCheckout)
  var params = new URLSearchParams(window.location.search);
  document.querySelectorAll('[data-cta="checkout"]').forEach(function (a) {
    try { var u = new URL(a.href); params.forEach(function (v, k) { if (!u.searchParams.has(k)) u.searchParams.set(k, v); }); a.href = u.toString(); } catch (e) {}
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      var local = a.getAttribute('data-local');
      fb('trackCustom', 'CheckoutOutboundClick', junta(conteudo, { local: local, plano: a.getAttribute('data-plano') || undefined, value: Number(a.getAttribute('data-value')) || undefined, currency: a.getAttribute('data-currency') || 'BRL' }));
      clarityEvento('checkout_click_' + local);
      if (window.fbq) { e.preventDefault(); var href = a.href; setTimeout(function () { window.location.href = href; }, 180); }
    });
  });

  // 4. ViewContent (padrão) uma vez por carregamento, quando a oferta aparece
  var oferta = document.getElementById('oferta');
  if (oferta && 'IntersectionObserver' in window) {
    var visto = false;
    new IntersectionObserver(function (ents, obs) {
      ents.forEach(function (en) {
        if (en.isIntersecting && !visto) { visto = true; fb('track', 'ViewContent', junta(conteudo, { value: F.valor, currency: F.moeda })); clarityEvento('view_content'); obs.disconnect(); }
      });
    }, { threshold: 0.35 }).observe(oferta);
  }

  // 5. Carrosséis de arrastar
  document.querySelectorAll('.carrossel').forEach(function (car) {
    var trilho = car.querySelector('.trilho'), slides = trilho.querySelectorAll('.slide'), cont = car.querySelector('.car-cont');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting && cont) cont.textContent = (Array.prototype.indexOf.call(slides, en.target) + 1) + '/' + slides.length; });
      }, { root: trilho, threshold: 0.6 });
      slides.forEach(function (s) { io.observe(s); });
    }
    function ir(dir) {
      var largura = slides[0] ? slides[0].getBoundingClientRect().width + 16 : trilho.clientWidth;
      var fim = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 4;
      if (dir > 0 && fim) trilho.scrollTo({ left: 0, behavior: reduzir ? 'auto' : 'smooth' });
      else trilho.scrollBy({ left: dir * largura, behavior: reduzir ? 'auto' : 'smooth' });
    }
    car.querySelectorAll('.car-seta').forEach(function (b) { b.addEventListener('click', function () { ir(Number(b.getAttribute('data-dir'))); }); });
    trilho.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') ir(1); if (e.key === 'ArrowLeft') ir(-1); });
    if (car.getAttribute('data-autoplay') !== 'sim' || reduzir) { var bp = car.querySelector('.car-pausa'); if (bp) bp.hidden = true; return; }
    var timer = null, pausado = false, visivel = false, btn = car.querySelector('.car-pausa');
    function tocar() { if (!timer && !pausado && visivel && !document.hidden) timer = setInterval(function () { ir(1); }, Number(car.getAttribute('data-intervalo')) || 3500); }
    function parar() { clearInterval(timer); timer = null; }
    if (btn) btn.addEventListener('click', function () { pausado = !pausado; btn.textContent = pausado ? 'Retomar' : 'Pausar'; btn.setAttribute('aria-label', btn.textContent); pausado ? parar() : tocar(); });
    ['pointerdown', 'mouseenter', 'focusin', 'touchstart'].forEach(function (ev) { car.addEventListener(ev, parar, { passive: true }); });
    car.addEventListener('mouseleave', tocar);
    document.addEventListener('visibilitychange', function () { document.hidden ? parar() : tocar(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (ents) { visivel = ents[0].isIntersecting; visivel ? tocar() : parar(); }, { threshold: 0.3 }).observe(car);
  });

  // 6. Vitrine contínua: pausa ao tocar (no mouse, o CSS pausa no hover)
  document.querySelectorAll('.vitrine').forEach(function (v) {
    v.addEventListener('pointerdown', function () { v.classList.toggle('pausado'); });
  });

  // 7. Brilho que segue o cursor nos cards (só mouse)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduzir) {
    document.querySelectorAll('.brilho').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  // 8. Revelar ao rolar (progressivo: sem JS ou com movimento reduzido, nada fica escondido)
  if (!reduzir && 'IntersectionObserver' in window && /revelar/.test(document.documentElement.getAttribute('data-efeitos') || '')) {
    var alvos = document.querySelectorAll('.revelar');
    var ior = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('visivel'); ior.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    alvos.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visivel');
      else ior.observe(el);
    });
    document.documentElement.classList.add('js');
    setTimeout(function () { alvos.forEach(function (el) { el.classList.add('visivel'); }); }, 6000);
  }

  // 9. Cronômetro: só existe quando content.prazoReal tem data de fim real; não reinicia ao recarregar
  document.querySelectorAll('.cronometro[data-fim]').forEach(function (el) {
    var fim = new Date(el.getAttribute('data-fim')).getTime();
    function atualiza() {
      var s = Math.max(0, Math.floor((fim - Date.now()) / 1000));
      var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60;
      el.textContent = (d ? d + 'd ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
      if (s === 0) { var f = el.closest('.faixa'); if (f) f.hidden = true; return; }
      setTimeout(atualiza, 1000);
    }
    atualiza();
  });

  // 7. Pop-up de saída: só com sinal claro de que a pessoa vai sair (pedido do usuário, 20/11/2026)
  (function () {
    var modal = document.getElementById('saida');
    if (!modal) return;
    var CHAVE = 'saida_vista', inicio = Date.now(), maxRolagem = 0, ultimoY = window.scrollY, ultimoT = inicio, subida = 0, ativo = true;
    function jaVisto() { try { return sessionStorage.getItem(CHAVE) === '1'; } catch (e) { return false; } }
    function marca() { try { sessionStorage.setItem(CHAVE, '1'); } catch (e) {} }
    function engajado() {
      if (window.scrollY > maxRolagem) maxRolagem = window.scrollY;
      var alturaUtil = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      return Date.now() - inicio >= 12000 && maxRolagem / alturaUtil >= 0.25;
    }
    var focoAntes = null;
    function abrir() {
      if (!ativo || jaVisto() || !engajado()) return;
      ativo = false; marca();
      focoAntes = document.activeElement;
      modal.hidden = false; document.documentElement.classList.add('saida-aberta');
      var btn = modal.querySelector('.btn'); if (btn) btn.focus();
      clarityEvento('exit_popup_shown');
    }
    function fechar() {
      modal.hidden = true; document.documentElement.classList.remove('saida-aberta');
      if (focoAntes && focoAntes.focus) focoAntes.focus();
    }
    modal.querySelectorAll('[data-saida-fechar]').forEach(function (el) { el.addEventListener('click', fechar); });
    document.addEventListener('keydown', function (e) { if (!modal.hidden && e.key === 'Escape') fechar(); });
    // Quem já foi para o checkout não vê o pop-up
    document.querySelectorAll('[data-cta="checkout"]').forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('data-local') !== 'exit-popup') { ativo = false; marca(); } }); });
    window.addEventListener('scroll', function () {
      var y = window.scrollY, t = Date.now();
      if (y > maxRolagem) maxRolagem = y;
      var dy = ultimoY - y, dt = Math.max(1, t - ultimoT);
      // Celular: subida rápida e contínua depois de já ter descido bastante (gesto de quem volta ao topo para sair)
      if (dy > 0 && dy / dt > 1.2) subida += dy; else if (dy <= 0) subida = 0;
      if (coarse && subida > window.innerHeight * 0.9 && maxRolagem > window.innerHeight * 2) { subida = 0; abrir(); }
      ultimoY = y; ultimoT = t;
    }, { passive: true });
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    // Computador: o mouse sai da página pelo topo (em direção às abas, à barra de endereço ou ao X)
    if (!coarse) {
      document.addEventListener('mouseout', function (e) {
        if (e.relatedTarget || e.toElement) return;
        if (e.clientY <= 8) abrir();
      });
    }
  })();
})();
