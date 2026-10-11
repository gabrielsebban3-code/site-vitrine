/* =========================================================
   Plomberie Rocher (démo) : interactions
   - titres découpés en mots, numéro qui s'écrit
   - scènes pilotées par le scroll (variables CSS --f, --zd, --r, --v…)
   - questions dépliées en douceur, formulaire de démonstration
   Aucune dépendance.
   ========================================================= */
(function () {
  'use strict';
  window.rocherReady = true;

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var easeInOut = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Scènes épinglées seulement si l'écran est assez haut (même seuil que le CSS)
  var pinned = function () { return !reduced.matches && window.innerHeight > 500; };

  /* ---------- Titres en mots, numéro en chiffres ---------- */
  $$('.split').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/[ \t\n]+/).map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
  });
  $$('[data-typed]').forEach(function (el) {
    el.innerHTML = el.textContent.split('').map(function (c, i) {
      return '<span class="c" style="--i:' + i + '">' + c + '</span>';
    }).join('');
  });

  /* ---------- Disponibilité réelle, à l'heure de Paris ---------- */
  var live = $('.live'), liveText = $('.live__text');
  if (live && liveText) {
    var h = 12;
    try { h = parseInt(new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Paris' }).format(new Date()), 10); } catch (e) { h = new Date().getHours(); }
    var open = h >= 7 && h < 22;
    live.classList.toggle('is-closed', !open);
    liveText.textContent = open ? 'Disponible maintenant · 7j/7 de 7 h à 22 h' : 'Fermé pour le moment · on décroche dès 7 h';
  }

  /* ---------- Apparitions à l'entrée dans l'écran (une seule fois) ---------- */
  var revealEls = $$('.split, [data-reveal], .quote__phone');
  if (reduced.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Barre d'appel mobile : elle arrive quand les boutons de l'accueil sortent ---------- */
  var callbar = $('.callbar'), heroCtas = $('.hero__ctas');
  if (callbar) {
    if (heroCtas && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        callbar.classList.toggle('is-shown', !entries[0].isIntersecting);
      }).observe(heroCtas);
    } else {
      callbar.classList.add('is-shown');
    }
  }

  /* ---------- Démo : les boutons d'appel affichent un message au lieu d'appeler ---------- */
  var toast = $('.toast'), toastTimer;
  $$('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!toast) return;
      e.preventDefault();
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.hidden = true; }, 3500);
    });
  });

  /* ---------- Questions : ouverture et fermeture en douceur ---------- */
  $$('.faq details').forEach(function (d) {
    var summary = $('summary', d), body = $('.faq__a', d), anim = null;
    summary.addEventListener('click', function (e) {
      if (reduced.matches || !body.animate) return;
      e.preventDefault();
      var from = body.offsetHeight;
      var closing = d.open && !d.classList.contains('is-closing');
      if (anim) { anim.cancel(); anim = null; }
      if (closing) {
        d.classList.add('is-closing');
        anim = body.animate([{ height: from + 'px' }, { height: '0px' }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = function () { d.open = false; d.classList.remove('is-closing'); anim = null; };
      } else {
        d.classList.remove('is-closing');
        d.open = true;
        var full = body.scrollHeight;
        anim = body.animate([{ height: (from || 0) + 'px' }, { height: full + 'px' }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = function () { anim = null; };
      }
    });
  });

  /* ---------- Formulaire : démonstration, rien n'est envoyé ---------- */
  var form = $('#formulaire');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    $$('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
    if (!form.checkValidity()) {
      $$(':invalid', form).forEach(function (i) { if (i.tagName !== 'FIELDSET') i.setAttribute('aria-invalid', 'true'); });
      form.reportValidity();
      return;
    }
    $('.form__sent', form).hidden = false;
  });

  /* ---------- Clavier : revenir sur l'accueil le fait réapparaître ---------- */
  var hero = $('.hero');
  if (hero) hero.addEventListener('focusin', function () {
    if (pinned() && window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' });
  });

  /* ---------- Scènes au scroll ---------- */
  var bar = $('.bar');
  var flood = $('.flood');
  var prices = $('.prices');
  var marquee = $('.marquee__track');
  var zone = $('.zone');
  var ringNear = $('.map__ring--near'), ringFar = $('.map__ring--far');
  var arrs = $$('.map__arr');
  var legendNear = $('.legend__item--near'), legendFar = $('.legend__item--far');
  var stepsBody = $('.steps__body');
  var pipe = $('.pipe');
  var stepEls = $$('.step');
  var reviews = $('.reviews');
  var reviewEls = $$('.review');
  var reviewNow = $('.reviews__now');
  var tonedSections = $$('main [data-tone], .foot');
  var S = 60;                   // unités de la carte par kilomètre
  var NEAR = 2.55, FAR = 9.7;   // rayons (km) : déplacement offert, puis tout Paris
  var marqueeHalf = 0, stepStops = [], vertical = false, ticking = false, lastReview = -1;

  function progress(el) {
    var r = el.getBoundingClientRect();
    var total = el.offsetHeight - window.innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  }

  function measure() {
    if (marquee) marqueeHalf = marquee.scrollWidth / 2;
    // Tuyau : du centre du premier raccord au centre du dernier
    if (pipe && stepsBody && stepEls.length) {
      var base = stepsBody.getBoundingClientRect();
      var pts = stepEls.map(function (s) {
        var r = $('.step__node', s).getBoundingClientRect();
        return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top };
      });
      var first = pts[0], last = pts[pts.length - 1], T = 14;
      vertical = Math.abs(last.y - first.y) > Math.abs(last.x - first.x);
      pipe.classList.toggle('pipe--v', vertical);
      if (vertical) {
        pipe.style.cssText = 'left:' + (first.x - T / 2) + 'px;top:' + first.y + 'px;width:' + T + 'px;height:' + (last.y - first.y) + 'px';
        stepStops = pts.map(function (p) { return (p.y - first.y) / (last.y - first.y); });
      } else {
        pipe.style.cssText = 'left:' + first.x + 'px;top:' + (first.y - T / 2) + 'px;width:' + (last.x - first.x) + 'px;height:' + T + 'px';
        stepStops = pts.map(function (p) { return (p.x - first.x) / (last.x - first.x); });
      }
    }
  }

  function setZone(r1, r2) {
    if (ringNear) ringNear.setAttribute('r', (r1 * S).toFixed(1));
    if (ringFar) ringFar.setAttribute('r', (r2 * S).toFixed(1));
    arrs.forEach(function (g) {
      var d = parseFloat(g.dataset.d);
      var near = d <= NEAR && d <= r1, far = !near && r2 > NEAR && d <= r2;
      g.classList.toggle('is-near', near);
      g.classList.toggle('is-far', far);
    });
    if (legendNear) legendNear.classList.toggle('is-on', r1 > .05);
    if (legendFar) legendFar.classList.toggle('is-on', r2 > NEAR + .05);
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var barMid = bar ? bar.getBoundingClientRect().top + bar.offsetHeight / 2 : 0;
    var pin = pinned();

    if (!reduced.matches) {
      // Accueil : la section tarifs (l'eau) monte et recouvre l'accueil resté en place
      if (flood && prices && pin) {
        var start = 0.92 * vh;
        flood.style.setProperty('--f', clamp((start - prices.getBoundingClientRect().top) / start).toFixed(4));
      }

      // Bandeau : il glisse au rythme du scroll
      if (marquee && marqueeHalf) {
        marquee.style.setProperty('--mx', (-((window.scrollY * 0.35) % marqueeHalf)).toFixed(1) + 'px');
      }

      // Zone : la carte se dessine pendant l'arrivée de la section, l'onde part dès qu'elle est en place
      if (zone) {
        if (pin) {
          var e = clamp((vh - zone.getBoundingClientRect().top) / vh);
          var q = progress(zone);
          zone.style.setProperty('--zd', clamp(e / 0.6).toFixed(4));
          zone.style.setProperty('--zs', clamp((e - 0.3) / 0.6).toFixed(4));
          var r1 = easeInOut(clamp(q / 0.3)) * NEAR;
          var r2 = q < 0.35 ? 0 : NEAR + easeInOut(clamp((q - 0.35) / 0.4)) * (FAR - NEAR);
          setZone(r1, r2);
        } else {
          setZone(NEAR, FAR);
        }
      }

      // Déroulé : le tuyau se remplit dès l'arrivée, chaque raccord s'allume quand l'eau l'atteint
      if (stepsBody && stepStops.length) {
        var b = stepsBody.getBoundingClientRect();
        var r = vertical
          ? clamp((vh * 0.7 - (b.top + parseFloat(pipe.style.top))) / parseFloat(pipe.style.height))
          : clamp((vh * 0.95 - b.top) / (vh * 0.4));
        stepsBody.style.setProperty('--r', r.toFixed(4));
        stepEls.forEach(function (s, i) { s.classList.toggle('is-on', r >= stepStops[i] - 0.01); });
      }

      // Avis : chacun reste net la moitié de son créneau, le relais se fait au milieu
      if (reviews && reviewEls.length && pin) {
        var v = progress(reviews);
        var n = reviewEls.length - 1;
        var u = clamp((v - 0.05) / 0.9) * n;
        reviews.style.setProperty('--v', clamp(v / 0.95).toFixed(4));
        reviewEls.forEach(function (el, k) {
          var d = u - k, t = clamp((Math.abs(d) - 0.25) / 0.25);
          el.style.setProperty('--o', (1 - t).toFixed(3));
          el.style.setProperty('--y', ((d > 0 ? -1 : 1) * t * 2.5).toFixed(3) + 'rem');
          el.style.pointerEvents = t >= 1 ? 'none' : '';
        });
        var now = Math.round(u);
        if (now !== lastReview && reviewNow) { lastReview = now; reviewNow.textContent = now + 1; }
      }
    }

    // En-tête : il prend la couleur de la section qui passe dessous (sombre ou menthe)
    var tone = '';
    tonedSections.forEach(function (s) {
      var rr = s.getBoundingClientRect();
      if (rr.top <= barMid && rr.bottom >= barMid) tone = s.getAttribute('data-tone');
    });
    if (bar) {
      if (tone) bar.setAttribute('data-tone', tone); else bar.removeAttribute('data-tone');
    }
  }

  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { measure(); request(); });
  window.addEventListener('load', function () { measure(); request(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); request(); });
  if (reduced.addEventListener) reduced.addEventListener('change', function () { location.reload(); });
  measure();
  update();
})();
