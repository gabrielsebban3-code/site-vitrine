/* =========================================================
   Atelier Morel (démo) : interactions
   - titres découpés en mots, apparitions au scroll
   - le rouleau peint l'accueil (--p), le pinceau relie les étapes (--s)
   - avant / après à faire glisser, estimation calculée en direct
   - carte : la teinte part du 17e et gagne Paris
   Aucune dépendance.
   ========================================================= */
(function () {
  'use strict';
  window.morelReady = true;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pinned = function () { return !reduced.matches && window.innerHeight >= 520; };
  var euros = function (n) { return Math.round(n / 10) * 10 === 0 ? '0 €' : (Math.round(n / 10) * 10).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' €'; };

  /* ---------- Titres en mots ---------- */
  $$('.split').forEach(function (el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/[ \t\n]+/).map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
  });

  /* ---------- Apparitions (une seule fois) ---------- */
  var revealEls = $$('.split, [data-reveal]');
  if (reduced.matches || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Disponibilité, à l'heure de Paris ---------- */
  var avail = $('.hero__avail');
  if (avail) {
    var h = 12, d = 1;
    try {
      var parts = new Intl.DateTimeFormat('fr-FR', { hour: 'numeric', weekday: 'short', hourCycle: 'h23', timeZone: 'Europe/Paris' }).formatToParts(new Date());
      parts.forEach(function (p) { if (p.type === 'hour') h = parseInt(p.value, 10); if (p.type === 'weekday') d = /dim/.test(p.value) ? 0 : 1; });
    } catch (e) { h = new Date().getHours(); }
    var open = d !== 0 && h >= 8 && h < 19;
    avail.textContent = open ? 'On décroche maintenant · visite gratuite sous 48 h' : 'Visite et devis gratuits sous 48 h · on rappelle dès 8 h';
  }

  /* ---------- Barre mobile : arrive quand les boutons de l'accueil sortent ---------- */
  var callbar = $('.callbar'), heroCtas = $('.hero__ctas');
  if (callbar) {
    if (heroCtas && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { callbar.classList.toggle('is-shown', !entries[0].isIntersecting); }).observe(heroCtas);
    } else { callbar.classList.add('is-shown'); }
  }

  /* ---------- Démo : les boutons d'appel affichent un message ---------- */
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

  /* ---------- Avant / après ---------- */
  var ba = $('.ba__frame'), baRange = $('.ba__range'), baTouched = false;
  function setBA(v) { ba.style.setProperty('--x', v + '%'); baRange.value = v; }
  if (ba && baRange) {
    baRange.addEventListener('input', function () { baTouched = true; setBA(baRange.value); });
    // Une première fois, la poignée glisse seule pour montrer qu'on peut la bouger
    if (!reduced.matches && 'IntersectionObserver' in window) {
      var baIo = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        baIo.disconnect();
        var t0 = null, from = 50;
        function step(t) {
          if (baTouched) return;
          if (!t0) t0 = t;
          var k = Math.min(1, (t - t0) / 2200);
          // 50 -> 82 -> 18 -> 50
          var v = k < .3 ? from + 32 * Math.sin(k / .3 * Math.PI / 2)
                : k < .75 ? 82 - 64 * ((1 - Math.cos((k - .3) / .45 * Math.PI)) / 2)
                : 18 + 32 * ((1 - Math.cos((k - .75) / .25 * Math.PI)) / 2);
          setBA(Math.round(v * 10) / 10);
          if (k < 1) requestAnimationFrame(step);
        }
        setTimeout(function () { requestAnimationFrame(step); }, 400);
      }, { threshold: .55 });
      baIo.observe(ba);
    }
  }

  /* ---------- Estimation ---------- */
  var calc = $('#calc');
  if (calc) {
    var surf = $('#surface', calc), surfOut = $('[data-surface]', calc);
    var minEl = $('[data-min]', calc), maxEl = $('[data-max]', calc), areaEl = $('[data-area]', calc);
    var HAUTEUR = 2.6, BASE = 26, PLAFOND = 30;
    var update = function (bump) {
      var s = +surf.value;
      var etat = +($('input[name="etat"]:checked', calc) || { value: 0 }).value;
      var plafond = $('input[name="plafond"]', calc).checked;
      // Murs : périmètre d'une pièce à peu près carrée × hauteur, moins ~15 % d'ouvertures
      var murs = 4 * Math.sqrt(s) * HAUTEUR * .85;
      // Un appartement entier a des cloisons : environ 1,6 fois plus de murs
      if (($('input[name="piece"]:checked', calc) || {}).value === 'appart') murs *= 1.6;
      var total = murs * (BASE + etat) + (plafond ? s * (PLAFOND + etat * .5) : 0);
      var area = Math.round(murs + (plafond ? s : 0));
      surfOut.textContent = s;
      surf.style.setProperty('--fill', ((s - surf.min) / (surf.max - surf.min) * 100) + '%');
      areaEl.textContent = area;
      minEl.textContent = euros(total * .9);
      maxEl.textContent = euros(total * 1.15);
      if (bump) [minEl, maxEl].forEach(function (b) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); });
      var formSurf = $('[data-calc-surface]');
      if (formSurf && !formSurf.dataset.edited) formSurf.value = s + ' m²';
    };
    $$('input[name="piece"]', calc).forEach(function (r) {
      r.addEventListener('change', function () { surf.value = r.dataset.s; update(true); });
    });
    surf.addEventListener('input', function () { update(false); });
    surf.addEventListener('change', function () { update(true); });
    $$('input[name="etat"], input[name="plafond"]', calc).forEach(function (i) { i.addEventListener('change', function () { update(true); }); });
    calc.addEventListener('submit', function (e) { e.preventDefault(); });
    var fs = $('[data-calc-surface]');
    if (fs) fs.addEventListener('input', function () { fs.dataset.edited = '1'; });
    update(false);
  }

  /* ---------- Questions : ouverture en douceur ---------- */
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

  /* ---------- Clavier : revenir sur l'accueil le remet à l'écran ---------- */
  var hero = $('.hero');
  if (hero) hero.addEventListener('focusin', function () {
    if (pinned() && window.scrollY > 0 && window.scrollY < window.innerHeight * 1.3) window.scrollTo({ top: 0, behavior: 'instant' });
  });

  /* ---------- Scènes au scroll ---------- */
  var wall = $('.wall');
  var zone = $('.zone');
  var ringNear = $('.map__ring--near'), ringFar = $('.map__ring--far');
  var arrs = $$('.map__arr');
  var stepsBody = $('.steps__body'), stepEls = $$('.step');
  var S = 60, NEAR = 3.3, FAR = 11;
  var ticking = false, lastP = 0;

  function progressPinned(el) {
    var r = el.getBoundingClientRect();
    var total = el.offsetHeight - window.innerHeight;
    return total > 0 ? clamp(-r.top / total) : 1;
  }
  // 0 quand le haut de l'élément entre en bas de l'écran, 1 quand son centre atteint le haut du tiers supérieur
  function progressIn(el, endAt) {
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((vh - r.top) / (vh * (endAt || .9)));
  }

  function frame() {
    ticking = false;
    var motion = pinned();

    // 1. Le mur
    if (wall) {
      var p = motion ? progressPinned(wall) : 1;
      // Le rouleau finit un peu avant la fin de la scène pour laisser lire le mur peint
      var pp = clamp(p / .82);
      var v = (pp - lastP) * 900; lastP = pp;
      wall.style.setProperty('--p', pp.toFixed(4));
      wall.style.setProperty('--v', Math.max(-3, Math.min(3, v)).toFixed(2));
    }

    // 2. La carte
    if (zone && ringNear) {
      var z = motion ? progressIn(zone, .95) : 1;
      var zn = clamp(z / .45), zf = clamp((z - .4) / .55);
      var rn = zn * NEAR * S, rf = zf * FAR * S;
      ringNear.setAttribute('r', rn.toFixed(1));
      ringFar.setAttribute('r', rf.toFixed(1));
      arrs.forEach(function (g) {
        var dkm = parseFloat(g.dataset.d) * S;
        g.style.opacity = (dkm <= Math.max(rn, rf) + 6 || !motion) ? 1 : .35;
      });
    }

    // 3. Le coup de pinceau
    if (stepsBody) {
      var s = motion ? clamp((progressIn(stepsBody, .75) - .15) / .7) : 1;
      stepsBody.style.setProperty('--s', s.toFixed(4));
      stepEls.forEach(function (el, i) { el.classList.toggle('is-on', s >= i / (stepEls.length - 1) - .02); });
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (reduced.addEventListener) reduced.addEventListener('change', onScroll);
  frame();
})();
