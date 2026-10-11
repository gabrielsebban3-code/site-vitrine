/* =========================================================
   Serrurerie Lenoir (démo) : interactions
   - heure de Paris en direct : tarif en cours (jour, nuit, dimanche, férié)
   - scènes pilotées par le scroll : la porte, la serrure, l'escargot, les avis
   - questions dépliées en douceur, formulaire de démonstration
   Aucune dépendance.
   ========================================================= */
(function () {
  'use strict';
  window.lenoirReady = true;

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var smooth = function (x) { return x * x * (3 - 2 * x); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Animations seulement si la page est en mode animé (classe .js toujours là) et si l'appareil l'accepte
  var motion = function () { return root.classList.contains('js') && !reduced.matches; };
  // Scènes épinglées : mêmes seuils que le CSS (ordinateur ≥ 680 px de haut, téléphone ≥ 600 px)
  var pinned = function () {
    var w = window.innerWidth, h = window.innerHeight;
    return motion() && (w >= 900 ? h >= 520 : h >= 600);
  };
  var NB = ' ';

  /* ---------- Titres en mots (copie complète pour les lecteurs d'écran), numéro en chiffres ---------- */
  $$('.split').forEach(function (el) {
    var text = el.textContent.trim();
    el.textContent = '';
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    el.appendChild(sr);
    text.split(/[ \t\n]+/).forEach(function (w, i) {
      if (i) el.appendChild(document.createTextNode(' '));
      var outer = document.createElement('span'), inner = document.createElement('span');
      outer.className = 'w';
      outer.setAttribute('aria-hidden', 'true');
      inner.style.setProperty('--i', i);
      inner.textContent = w;
      outer.appendChild(inner);
      el.appendChild(outer);
    });
  });
  $$('[data-typed]').forEach(function (el) {
    var text = el.textContent;
    el.textContent = '';
    text.split('').forEach(function (c, i) {
      var span = document.createElement('span');
      span.className = 'c';
      span.style.setProperty('--i', i);
      span.textContent = c;
      el.appendChild(span);
    });
  });

  /* ---------- Heure de Paris : tarif en cours et horloge ---------- */
  function parisNow() {
    var d = new Date(), p = {};
    try {
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris', year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', weekday: 'short', hourCycle: 'h23'
      }).formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, min: +p.minute, wd: p.weekday };
    } catch (e) {
      return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), min: d.getMinutes(), wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] };
    }
  }
  // Jours fériés : dates fixes, puis lundi de Pâques, Ascension et lundi de Pentecôte
  function isHoliday(y, m, d) {
    if (['1-1', '5-1', '5-8', '7-14', '8-15', '11-1', '11-11', '12-25'].indexOf(m + '-' + d) > -1) return true;
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - Math.floor(b / 4) - g + 15) % 30, l = (32 + 2 * e + 2 * Math.floor(c / 4) - h - c % 4) % 7;
    var mm = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * mm + 114;
    var diff = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, Math.floor(n / 31) - 1, n % 31 + 1)) / 864e5);
    return diff === 1 || diff === 39 || diff === 50;
  }
  function rateOf(t) {
    var extra = ', +' + NB + '50' + NB + '€';
    if (isHoliday(t.y, t.m, t.d)) return 'tarif jour férié' + extra;
    if (t.wd === 'Sun') return 'tarif du dimanche' + extra;
    if (t.h >= 20 || t.h < 7) return 'tarif de nuit' + extra;
    return 'tarif de jour';
  }
  var liveText = $('.live__text'), clockTime = $('.clock__time'), clockText = $('.clock__text');
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function tick() {
    var t = parisNow(), rate = rateOf(t);
    if (liveText) liveText.textContent = 'Ouvert maintenant · ' + rate;
    if (clockTime) {
      clockTime.hidden = false;
      clockTime.textContent = '';
      clockTime.appendChild(document.createTextNode(pad(t.h)));
      clockTime.appendChild(document.createElement('i')).textContent = ':';
      clockTime.appendChild(document.createTextNode(pad(t.min)));
    }
    if (clockText) {
      clockText.textContent = '';
      var sr = clockText.appendChild(document.createElement('span'));
      sr.className = 'sr-only';
      sr.textContent = 'Il est ' + t.h + ' h ' + pad(t.min) + ' ';
      clockText.appendChild(document.createTextNode('à Paris, ' + rate + '. On décroche à toute heure.'));
    }
  }
  tick();
  setInterval(tick, 15000);

  /* ---------- Apparitions à l'entrée dans l'écran (une seule fois) ---------- */
  var revealEls = $$('.split, [data-reveal], .urgent__phone');
  if (!motion() || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Démo : les boutons d'appel affichent un message au lieu d'appeler ---------- */
  var toast = $('.toast'), toastTimer, toastShow;
  var TOAST = 'Démonstration' + NB + ': sur le vrai site, ce bouton appelle directement l’artisan.';
  $$('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!toast) return;
      e.preventDefault();
      // On vide puis on réécrit : le message est annoncé à chaque appui
      toast.textContent = '';
      clearTimeout(toastTimer);
      clearTimeout(toastShow);
      toastShow = setTimeout(function () { toast.textContent = TOAST; }, 60);
      toastTimer = setTimeout(function () { toast.textContent = ''; }, 3600);
    });
  });

  /* ---------- Questions : ouverture et fermeture en douceur ---------- */
  $$('.faq details').forEach(function (d) {
    var summary = $('summary', d), body = $('.faq__a', d), anim = null;
    summary.addEventListener('click', function (e) {
      if (!motion() || !body.animate) return;
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
  if (form) {
    var errorBox = $('.form__error', form), sentBox = $('.form__sent', form);
    var NAMES = { type: 'votre projet', nom: 'votre nom', tel: 'votre téléphone', arr: 'votre arrondissement' };
    var clear = function (el) {
      if (!el.name) return;
      if (el.type === 'radio') $$('input[name="' + el.name + '"]', form).forEach(function (r) { r.removeAttribute('aria-invalid'); });
      else el.removeAttribute('aria-invalid');
    };
    form.addEventListener('input', function (e) { clear(e.target); });
    form.addEventListener('change', function (e) { clear(e.target); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      sentBox.textContent = '';
      errorBox.textContent = '';
      $$('[aria-invalid]', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
      if (!form.checkValidity()) {
        var missing = [];
        $$('input, select, textarea', form).forEach(function (i) {
          if (!i.validity.valid) {
            i.setAttribute('aria-invalid', 'true');
            if (NAMES[i.name] && missing.indexOf(NAMES[i.name]) < 0) missing.push(NAMES[i.name]);
          }
        });
        errorBox.textContent = 'Il manque ' + missing.join(', ') + '.';
        var first = $('input:invalid, select:invalid, textarea:invalid', form);
        if (first) first.focus();
        return;
      }
      sentBox.textContent = 'Démonstration' + NB + ': sur le vrai site, la demande arrive par e-mail ou SMS à l’artisan.';
    });
  }

  /* ---------- Éléments des scènes ---------- */
  var bar = $('.bar');
  var scene = $('.scene'), hero = $('.hero'), heroText = $('.hero__text'), heroFloor = $('.hero__floor');
  var door = $('.door'), doorIn = $('.door__in'), inside = $('.inside'), prices = $('.prices');
  var heroCtas = $('.hero__ctas'), callbar = $('.callbar');
  var method = $('.method'), lockSvg = $('.lock__svg'), methodPin = $('.method__pin');
  var msteps = $$('.mstep'), methodNow = $('.method__now'), methodState = $('.method__state');
  var zone = $('.zone'), spiral = $('.map__spiral'), tip = $('.map__tip'), arrs = $$('.map__arr');
  var reviews = $('.reviews'), track = $('.reviews__track'), reviewsPin = $('.reviews__pin');
  var toned = $$('main > section, .foot');
  var lock = null, geo = null, stops = [0], spiralLen = 0, ticking = false, ctaVisible = true, lastStep = -1, lockLive = false;

  /* ---------- Barre d'appel mobile : elle arrive quand les boutons de l'accueil ne sont plus utilisables ---------- */
  if (callbar && heroCtas && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) { ctaVisible = entries[0].isIntersecting; request(); }).observe(heroCtas);
  } else if (callbar) {
    ctaVisible = false;
  }

  /* ---------- Clavier : revenir sur l'accueil le fait réapparaître (pas au clic de souris) ---------- */
  if (hero) hero.addEventListener('focusin', function (e) {
    var kb = true;
    try { kb = e.target.matches(':focus-visible'); } catch (err) { kb = true; }
    if (kb && pinned() && window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' });
  });

  /* ---------- « Tarifs » : on traverse la porte jusqu'à la plaque des prix ---------- */
  $$('a[href="#tarifs"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!pinned() || !prices) return;
      e.preventDefault();
      var top = prices.getBoundingClientRect().top + window.scrollY - bar.getBoundingClientRect().bottom - 16;
      window.scrollTo({ top: top, behavior: 'smooth' });
      if (history.replaceState) history.replaceState(null, '', '#tarifs');
      var h = $('#titre-liste'), done = false;
      var focusIt = function () {
        if (done || !h) return;
        done = true;
        h.setAttribute('tabindex', '-1');
        h.focus({ preventScroll: true });
      };
      if ('onscrollend' in window) window.addEventListener('scrollend', focusIt, { once: true });
      setTimeout(focusIt, 2500);
    });
  });

  /* ---------- La serrure : géométrie lue dans le SVG ---------- */
  if (lockSvg) {
    try { lock = JSON.parse(lockSvg.getAttribute('data-lock')); } catch (e) { lock = null; }
    if (lock) {
      lock.key = $('.lk-key', lockSvg);
      lock.turn = $$('.lk-turn', lockSvg);
      lock.kp = $$('.lk-kp', lockSvg);
      lock.dp = $$('.lk-dp', lockSvg);
      lock.sp = $$('.lk-spring', lockSvg);
      lock.face = $('.lk-face__plug', lockSvg);
    }
  }
  // Hauteur du dessus de la clé à l'abscisse x (repère de la clé enfoncée), null hors de la clé
  function keyTop(x) {
    var p = lock.top;
    if (x < 180 || x > p[p.length - 1][0]) return null;
    if (x <= p[0][0]) return p[0][1];
    for (var i = 1; i < p.length; i++) {
      if (x <= p[i][0]) {
        var a = p[i - 1], b = p[i];
        return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      }
    }
    return null;
  }
  function setLock(k, turn) {
    if (!lock) return;
    lock.key.setAttribute('transform', 'translate(' + k.toFixed(1) + ' 0)');
    lock.x.forEach(function (x, i) {
      var t = keyTop(x - k);
      var bottom = t === null ? lock.rest : Math.min(lock.rest, t);
      var kpTop = bottom - lock.l[i];
      var dpTop = kpTop - 70;
      lock.kp[i].setAttribute('transform', 'translate(' + (x - 20) + ' ' + kpTop.toFixed(1) + ')');
      lock.dp[i].setAttribute('transform', 'translate(' + (x - 20) + ' ' + dpTop.toFixed(1) + ')');
      lock.sp[i].setAttribute('transform', 'translate(' + x + ' 62) scale(1 ' + ((dpTop - 62) / 100).toFixed(3) + ')');
    });
    // Le rotor tourne : vu en coupe, son contenu se resserre vers l'axe (sans disparaître)
    var c = Math.cos(turn * .55 * Math.PI / 180);
    var m = 'matrix(1 0 0 ' + c.toFixed(4) + ' 0 ' + (lock.axis * (1 - c)).toFixed(2) + ')';
    lock.turn.forEach(function (g) { g.setAttribute('transform', m); });
    lock.face.setAttribute('transform', 'rotate(' + turn.toFixed(1) + ')');
  }

  // Position de la porte : vers le centre (e1), puis travelling avant à travers l'ouverture (z)
  function doorPose(z, e1, vw, vh) {
    if (z <= 0) {
      return { s: 1 + (geo.g - 1) * e1, tx: e1 * (geo.bx - geo.ox), ty: e1 * (geo.by - geo.oy) };
    }
    // Zoom régulier, l'ouverture glisse vers le centre de l'écran au même rythme
    var s = geo.g * Math.pow(geo.S / geo.g, z);
    var k = (s - geo.g) / (geo.S - geo.g);
    var cbx = geo.bx + geo.g * (geo.cx - geo.ox), cby = geo.by + geo.g * (geo.cy - geo.oy);
    var cx = cbx + k * (vw / 2 - cbx), cy = cby + k * (vh / 2 - cby);
    return { s: s, tx: cx - geo.ox - s * (geo.cx - geo.ox), ty: cy - geo.oy - s * (geo.cy - geo.oy) };
  }
  function opening(d) {
    return {
      L: geo.ox + d.s * (geo.ix - geo.ox) + d.tx, R: geo.ox + d.s * (geo.ix + geo.iw - geo.ox) + d.tx,
      T: geo.oy + d.s * (geo.it - geo.oy) + d.ty, B: geo.oy + d.s * (geo.ib - geo.oy) + d.ty
    };
  }

  function progressOf(r, el) {
    var total = el.offsetHeight - window.innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  }
  var inView = function (r, vh) { return r.bottom > 0 && r.top < vh; };

  function measure() {
    var vw = window.innerWidth, vh = window.innerHeight, pin = pinned();
    var topH = bar ? bar.getBoundingClientRect().bottom : 0;
    // Porte : position au repos, position « au centre » (plus grande), puis zoom à travers l'ouverture
    if (door && doorIn) {
      door.style.transform = '';
      var frame = doorIn.parentNode;
      var x = door.offsetLeft, y = door.offsetTop, w = door.offsetWidth, h = door.offsetHeight;
      var ix = x + frame.offsetLeft + doorIn.offsetLeft, iy = y + frame.offsetTop + doorIn.offsetTop;
      var iw = doorIn.offsetWidth, ih = doorIn.offsetHeight, arch = ih * .21;
      var avail = vh - topH - (vw < 900 ? 92 : 40);
      var g = Math.max(1, Math.min(2.4, avail * .9 / h));
      geo = {
        ox: x + w / 2, oy: y + h / 2,
        bx: vw / 2, by: topH + avail / 2,                  // centre de la porte « au centre »
        g: g,
        cx: ix + iw / 2, cy: iy + arch + (ih - arch) / 2,  // centre de l'ouverture sous l'arche
        ix: ix, iw: iw, it: iy + arch, ib: iy + ih,
        S: Math.max(vw / iw, vh / (ih - arch)) * 1.08
      };
      doorIn.style.perspective = Math.round(iw * 2.4) + 'px';
      // Moment où l'ouverture remplit l'écran : l'intérieur apparaît juste avant, sans temps mort
      var zc = 1;
      for (var zz = 0; zz <= 1; zz += .01) {
        var o = opening(doorPose(zz, 1, vw, vh));
        if (o.L <= 0 && o.R >= vw && o.T <= topH && o.B >= vh - (vw < 900 ? 60 : 0)) { zc = zz; break; }   // en bas, la barre d'appel cache le seuil
      }
      geo.p0 = Math.max(.5, .3 + .36 * zc - .03);
    }
    // Avis : arrêts successifs (une carte entière à gauche), hauteur de la section en conséquence
    if (track && reviews) {
      var cards = $$('.review', track);
      var shift = Math.max(0, track.scrollWidth - vw);
      var pitch = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : shift;
      stops = [0];
      while (pitch > 0 && stops[stops.length - 1] + pitch < shift - 4) stops.push(stops[stops.length - 1] + pitch);
      if (shift > 0) stops.push(shift);
      reviews.style.height = pin ? Math.round(vh * 1.25 + (stops.length - 1) * vh * .55) + 'px' : '';
    }
    if (spiral && spiral.getTotalLength) spiralLen = spiral.getTotalLength();
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight, vw = window.innerWidth;
    var pin = pinned();
    var barBottom = bar ? bar.getBoundingClientRect().bottom : 0;
    var sceneR = scene ? scene.getBoundingClientRect() : null;
    var sceneP = 0, light = false;

    // Accueil : le texte s'efface, la porte vient au centre et s'ouvre, puis on la franchit
    if (scene && door && geo && pin) {
      if (inView(sceneR, vh)) {
        sceneP = progressOf(sceneR, scene);
        var t = clamp(sceneP / .14);
        var e1 = smooth(clamp((sceneP - .02) / .28));
        var a = 100 * smooth(clamp((sceneP - .1) / .36));
        var z = clamp((sceneP - .3) / .36);
        var shown = clamp((sceneP - geo.p0) / .1);   // le texte arrive quand la lumière remplit l'écran
        heroText.style.opacity = (1 - t).toFixed(3);
        heroText.style.translate = '0 ' + (-t * 5).toFixed(2) + 'vh';
        heroText.style.visibility = t >= 1 ? 'hidden' : '';
        if (heroFloor) heroFloor.style.opacity = (1 - e1).toFixed(3);
        door.style.setProperty('--a', a.toFixed(2));
        door.style.setProperty('--glow', (.3 + .7 * clamp((sceneP - .02) / .3)).toFixed(3));
        door.style.setProperty('--z', z.toFixed(3));
        var d = doorPose(z, e1, vw, vh);
        door.style.transform = (d.s !== 1 || d.tx || d.ty) ? 'translate3d(' + d.tx.toFixed(1) + 'px,' + d.ty.toFixed(1) + 'px,0) scale(' + d.s.toFixed(4) + ')' : '';
        // L'ouverture couvre-t-elle tout l'écran ? (en-tête et fond de la scène passent alors en clair)
        var o = opening(d);
        light = o.L <= 0 && o.R >= vw && o.T <= barBottom;
        scene.style.background = (light && o.B >= vh) || shown > 0 ? 'var(--pierre)' : '';
        inside.style.setProperty('--io', shown.toFixed(3));
        inside.classList.toggle('is-shown', shown > 0);
      }
    } else if (door) {
      door.style.transform = '';
      if (heroText) { heroText.style.opacity = ''; heroText.style.translate = ''; heroText.style.visibility = ''; }
      if (heroFloor) heroFloor.style.opacity = '';
      if (scene) scene.style.background = '';
    }

    // Méthode : la clé entre, les goupilles montent et descendent, s'alignent (déclic), le rotor tourne
    if (method && lock) {
      var mr = method.getBoundingClientRect();
      if (pin && inView(mr, vh)) {
        lockLive = true;
        var q = progressOf(mr, method);
        var kk = lock.k0 * (1 - smooth(clamp((q - .04) / .5)));
        var turn = 90 * smooth(clamp((q - .62) / .24));
        setLock(kk, turn);
        method.classList.toggle('is-aligned', q >= .55);
        var open = turn > 80;
        if (method.classList.contains('is-open') !== open) {
          method.classList.toggle('is-open', open);
          if (methodState) methodState.textContent = open ? 'Ouvert' : 'Fermé';
        }
        var step = q < .3 ? 0 : q < .6 ? 1 : 2;
        if (step !== lastStep) {
          lastStep = step;
          msteps.forEach(function (el, i) { el.classList.toggle('is-on', i === step); });
          if (methodNow) methodNow.textContent = step + 1;
        }
        methodPin.style.setProperty('--v', clamp(q / .9).toFixed(3));
      } else if (!pin && lockLive) {
        // Retour en version fixe (rotation de l'écran) : clé enfoncée, goupilles alignées
        lockLive = false;
        setLock(0, 0);
      }
    }

    // Zone : le tracé part du 1er et s'enroule jusqu'au 20e
    if (zone && spiral && pin) {
      var zr = zone.getBoundingClientRect();
      if (inView(zr, vh)) {
        var dz = clamp((progressOf(zr, zone) - .06) / .74);
        spiral.style.setProperty('--d', dz.toFixed(4));
        arrs.forEach(function (gg) { gg.classList.toggle('is-lit', dz >= parseFloat(gg.dataset.at) - .004); });
        if (tip && spiralLen) {
          var pt = spiral.getPointAtLength(dz * spiralLen);
          tip.setAttribute('cx', pt.x.toFixed(1));
          tip.setAttribute('cy', pt.y.toFixed(1));
          tip.style.opacity = dz > 0 && dz < 1 ? 1 : 0;
        }
      }
    }

    // Avis : la bande glisse d'une carte à l'autre, avec une pause sur chacune
    if (reviews && track && pin) {
      var rr = reviews.getBoundingClientRect();
      if (inView(rr, vh) && stops.length > 1) {
        var v = clamp((progressOf(rr, reviews) - .04) / .9);
        var n = stops.length - 1, u = v * n, j = Math.min(n - 1, Math.floor(u)), f = u - j;
        var pos = stops[j] + (stops[j + 1] - stops[j]) * smooth(clamp((f - .15) / .7));
        track.style.setProperty('--tx', (-pos).toFixed(1) + 'px');
        reviewsPin.style.setProperty('--v', v.toFixed(3));
      }
    }

    // Barre d'appel : visible dès que les boutons de l'accueil ne sont plus utilisables
    if (callbar) {
      var heroGone = pin && scene ? (sceneP > .1 || sceneR.bottom < vh) : !ctaVisible;
      callbar.classList.toggle('is-shown', heroGone);
    }

    // En-tête : il prend la couleur de ce qui passe dessous
    if (bar) {
      var mid = barBottom - bar.offsetHeight / 2, tone = '';
      toned.concat(pin ? [] : [hero, inside]).forEach(function (el) {
        if (!el) return;
        var r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) tone = el.getAttribute('data-tone') || '';
      });
      if (scene && pin && sceneR.top <= mid && sceneR.bottom >= mid) tone = light ? '' : 'dark';
      if (tone) bar.setAttribute('data-tone', tone); else bar.removeAttribute('data-tone');
    }
  }

  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function remeasure() { measure(); request(); }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', remeasure);
  window.addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if (reduced.addEventListener) reduced.addEventListener('change', function () { location.reload(); });
  measure();
  update();
})();
