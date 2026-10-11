/* =========================================================
   Gabriel Sebban : interactions du site
   - menu mobile, thème clair/sombre
   - nom de l'entreprise tapé en direct dans la démo
   - scènes pilotées par le scroll (variables CSS --a, --s, --w…)
   Aucune dépendance.
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Découpe des titres en mots (chaque mot monte de sous une ligne) ----------
     On coupe seulement sur les espaces normales : « électricien&nbsp;: » reste d'un seul bloc. */
  function splitWords(el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/[ \t\n]+/).map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + w + '</span></span>';
    }).join(' ');
  }
  $$('.hero-title, .split').forEach(splitWords);

  /* ---------- Découpe en caractères : numéro qui « s'écrit », lettres de « un mois » ---------- */
  $$('[data-typed]').forEach(function (el) {
    el.innerHTML = el.textContent.split('').map(function (c, i) {
      return '<span class="c" style="--i:' + i + '">' + c + '</span>';
    }).join('');
  });
  var letterIndex = 0;
  $$('[data-letters] .ow').forEach(function (word) {
    word.innerHTML = word.textContent.split('').map(function (c) {
      return '<span class="c" style="--i:' + (letterIndex++) + '">' + c + '</span>';
    }).join('');
  });

  /* ---------- Titres de section : révélés une fois, en entrant dans l'écran ---------- */
  var splits = $$('.split, .reveal');
  if (reduced.matches || !('IntersectionObserver' in window)) {
    splits.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    splits.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Thème : automatique, ou choisi à la main et mémorisé ---------- */
  var themeBtn = $('.theme-btn');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() {
    var t = root.dataset.theme;
    return t ? t === 'dark' : systemDark.matches;
  }
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Compteur de visites anonyme : aucun cookie, aucune donnée personnelle ----------
     Une simple addition (+1) envoyée à un compteur public ; si le service ne répond pas,
     le site fonctionne normalement. Consultation : page mes-visites.html */
  try {
    if (!sessionStorage.getItem('vu')) {
      sessionStorage.setItem('vu', '1');
      var jour = new Date().toISOString().slice(0, 10);
      ['total', 'j-' + jour].forEach(function (k) {
        fetch('https://abacus.jasoncameron.dev/hit/gabriel-sebban-vitrine-93230/' + k).catch(function () {});
        fetch('https://api.counterapi.dev/v1/gabriel-sebban-vitrine-93230/' + k + '/up').catch(function () {});
      });
    }
  } catch (e) {}

  /* ---------- E-mail reconstruit au chargement : jamais en clair dans le code (anti-spam) ---------- */
  $$('[data-mail]').forEach(function (el) {
    var addr = el.dataset.mail.replace('*', '@');
    el.href = 'mailto:' + addr;
    el.textContent = addr;
  });

  /* ---------- Menu mobile ---------- */
  var nav = $('.nav');
  var menuBtn = $('.menu-btn');
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    $$('.nav__links a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
  }

  /* ---------- Nom de l'entreprise en direct dans la démo ---------- */
  var input = $('#nom-entreprise');
  var nameEls = $$('[data-name]');
  var slugEls = $$('[data-slug]');
  var DEFAULT_NAME = 'Plomberie Rocher';
  var DEMOS = {
    plombier: {
      name: 'Plomberie Rocher', label: 'plombier', live: 'demos/plombier/index.html',
      desktop: 'img/plombier-desktop.webp', desktopSm: 'img/plombier-desktop-sm.webp', mobile: 'img/plombier-mobile.webp',
      dw: 1440, dh: 6227, mw: 585, mh: 11250,
      alt: 'Démo de site pour un plombier parisien : numéro d’appel, tarifs, zone d’intervention, avis et questions fréquentes.',
      altM: 'La même démo plombier sur téléphone, avec le bouton d’appel toujours visible.',
      tour: [['Le numéro dès l’arrivée', 0, 0], ['Les prix affichés', .1368, .1061], ['La zone d’intervention', .3551, .2989], ['Le déroulé d’une intervention', .485, .4213], ['Les avis clients', .579, .526], ['L’appel d’urgence', .7092, .6617], ['Les questions fréquentes', .8371, .8474]]
    },
    serrurier: {
      name: 'Serrurerie Lenoir', label: 'serrurier', live: 'demos/serrurier/index.html',
      desktop: 'img/serrurier-desktop.webp', desktopSm: 'img/serrurier-desktop-sm.webp', mobile: 'img/serrurier-mobile.webp',
      dw: 1440, dh: 7060, mw: 585, mh: 12726,
      alt: 'Démo de site pour un serrurier parisien : numéro d’appel, tarifs, méthode, zone d’intervention, avis et questions fréquentes.',
      altM: 'La même démo serrurier sur téléphone, avec le bouton d’appel toujours visible.',
      tour: [['Le numéro dès l’arrivée', 0, 0], ['Les prix annoncés', .2069, .2265], ['La méthode, en coupe', .3478, .3585], ['La zone d’intervention', .4545, .4659], ['Les avis clients', .5692, .5709], ['L’appel d’urgence', .6944, .6631], ['Les questions fréquentes', .8393, .8533]]
    }
  };
  var currentDemo = 'plombier';
  function slugify(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      .replace(/&/g, '-et-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  if (input) input.addEventListener('input', function () {
    var name = input.value.trim() || DEFAULT_NAME;
    nameEls.forEach(function (el) {
      el.textContent = name;
      el.classList.remove('is-typing'); void el.offsetWidth; el.classList.add('is-typing');
    });
    slugEls.forEach(function (el) { el.textContent = slugify(name) || 'votre-entreprise'; });
    liveEntries.forEach(liveName);
  });

  /* ---------- Choix de la démo : plombier ou serrurier ---------- */
  var pickerEl = $('.picker');
  var liveLink = $('[data-live]');
  function setDemo(key) {
    var d = DEMOS[key];
    if (!d || key === currentDemo) return;
    currentDemo = key;
    var stageEl = $('.stage');
    var apply = function () {
      scene.dataset.demo = key;
      DEFAULT_NAME = d.name;
      input.placeholder = d.name;
      input.value = '';
      nameEls.forEach(function (el) { el.textContent = d.name; el.classList.remove('is-typing'); });
      slugEls.forEach(function (el) { el.textContent = slugify(d.name); });
      var imgD = $('img', shotD), imgM = $('img', shotM);
      imgD.width = d.dw; imgD.height = d.dh; imgD.alt = d.alt;
      imgD.srcset = d.desktopSm + ' 720w, ' + d.desktop + ' 1440w'; imgD.src = d.desktop;
      imgD.onload = imgM.onload = function () { measure(); request(); };
      imgM.width = d.mw; imgM.height = d.mh; imgM.alt = d.altM; imgM.src = d.mobile;
      var cap = $('.browser figcaption'); if (cap) cap.textContent = 'Démo ' + d.label + ', version ordinateur. Entreprise et numéro fictifs.';
      var tourEl = $('.tour');
      tourEl.setAttribute('aria-label', 'Ce que montre la démo ' + d.label);
      tourEl.innerHTML = d.tour.map(function (t) { return '<li data-top="' + t[1] + '" data-mtop="' + t[2] + '">' + t[0] + '</li>'; }).join('');
      tourItems = $$('.tour li');
      lastTour = -1;
      if (liveLink) liveLink.href = d.live;
      $$('.picker__btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.demo === key)); });
      liveSwitch();
      measure(); request();
      if (stageEl) stageEl.style.opacity = '';
    };
    if (stageEl && !reduced.matches) { stageEl.style.opacity = '0'; setTimeout(apply, 220); } else apply();
  }
  if (pickerEl) {
    pickerEl.hidden = false;
    $$('.picker__btn', pickerEl).forEach(function (b) { b.addEventListener('click', function () { setDemo(b.dataset.demo); }); });
  }

  /* ---------- Formulaire de devis ----------
     Vérifie les champs, puis envoie à l'adresse indiquée dans data-endpoint (service de formulaires,
     voir README). Tant qu'aucune adresse n'est renseignée, rien n'est envoyé et on le dit. */
  var quote = $('#devis');
  if (quote) {
    var quoteDone = $('#devis-envoye');
    var quoteStatus = $('.quote__status', quote);
    var quoteSend = $('.quote__send', quote);
    var quoteLabel = $('.quote__label', quote);
    var tried = false;
    var rules = [
      { el: $('#q-nom'), check: function (v) { return v.length >= 2 ? '' : 'Indiquez votre nom.'; } },
      { el: $('#q-tel'), check: function (v) {
        var d = v.replace(/[\s.\-()]/g, '');
        if (!v) return 'Indiquez votre numéro de téléphone.';
        return /^(?:\+33|0033|0)[1-9]\d{8}$/.test(d) ? '' : 'Ce numéro semble incomplet (10 chiffres, par exemple 06 12 34 56 78).';
      } },
      { el: $('#q-mail'), check: function (v) {
        if (!v) return '';   // facultatif : on rappelle par téléphone
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Cette adresse e-mail semble incomplète (par exemple nom@gmail.com).';
      } },
      { el: $('#q-msg'), check: function (v) { return v.length >= 5 ? '' : 'Décrivez votre besoin en quelques mots.'; } }
    ];
    var showErr = function (r, msg) {
      var field = r.el.closest('.field');
      field.classList.toggle('is-invalid', !!msg);
      r.el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      $('.field__err', field).textContent = msg;
    };
    var validate = function (r) { var msg = r.check(r.el.value.trim()); showErr(r, msg); return !msg; };
    // Après un premier essai, le message « Il manque… » suit les corrections
    var refreshCount = function () {
      if (!tried || !quoteStatus.classList.contains('is-error')) return;
      var left = rules.filter(function (r) { return r.check(r.el.value.trim()); }).length;
      setStatus(left === 0 ? '' : left === 1 ? 'Il manque une information.' : 'Il manque ' + left + ' informations.', left > 0);
    };
    rules.forEach(function (r) {
      // On ne signale une erreur qu'en quittant un champ déjà rempli (ou après un premier envoi), et on l'efface dès que c'est bon
      r.el.addEventListener('blur', function () { if (tried || r.el.value.trim()) validate(r); });
      r.el.addEventListener('input', function () { if (r.el.getAttribute('aria-invalid') === 'true') validate(r); refreshCount(); });
    });
    // Pilules du métier : un second clic désélectionne (le champ est facultatif)
    var lastChip = null;
    $$('.chip input', quote).forEach(function (inp) {
      inp.addEventListener('click', function () {
        if (lastChip === inp) { inp.checked = false; lastChip = null; } else lastChip = inp;
      });
    });
    var setStatus = function (msg, isError) {
      quoteStatus.textContent = msg;
      quoteStatus.classList.toggle('is-error', !!isError);
    };
    var finish = function () {
      var name = $('#q-nom').value.trim().split(/\s+/)[0];
      $('[data-done-text]', quoteDone).textContent = 'Merci ' + name + '. Je vous rappelle au ' + $('#q-tel').value.trim() + ' pour en parler.';
      quote.hidden = true;
      quoteDone.hidden = false;
      quoteDone.focus();
      request();   // la mise en page a changé : le numéro du dessous doit pouvoir s'écrire
    };
    quote.addEventListener('submit', function (e) {
      e.preventDefault();
      tried = true;
      var bad = rules.filter(function (r) { return !validate(r); });
      if (bad.length) {
        setStatus(bad.length === 1 ? 'Il manque une information.' : 'Il manque ' + bad.length + ' informations.', true);
        bad[0].el.focus();
        return;
      }
      if ($('#q-site').value) { finish(); return; }   // robot : on fait comme si
      var endpoint = quote.dataset.endpoint;
      if (!endpoint && quote.dataset.mailbox) endpoint = 'https://formsubmit.co/ajax/' + quote.dataset.mailbox.replace('*', '@');
      if (!endpoint) {
        setStatus('Démonstration : ce formulaire n’est pas encore relié, rien n’a été envoyé. Sur le site en ligne, votre demande m’arrivera directement par e-mail.', false);
        return;
      }
      var data = new FormData(quote);
      data.delete('site_web');
      if (quote.dataset.key) data.append('access_key', quote.dataset.key);
      quoteSend.setAttribute('aria-busy', 'true');
      quoteLabel.textContent = 'Envoi en cours…';
      setStatus('', false);
      fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json().catch(function () { return {}; }); })
        .then(function (json) { if (json && String(json.success) === 'false') throw new Error(json.message || ''); finish(); })
        .catch(function (err) {
          // Première utilisation : FormSubmit demande d'abord une confirmation par e-mail au propriétaire du site
          if (err && /activat|confirm|verif/i.test(err.message || '')) {
            setStatus('Le formulaire est en cours d’activation. Appelez-moi directement au numéro ci-dessous, ou réessayez dans quelques minutes.', true);
          } else {
            setStatus('L’envoi n’a pas marché. Réessayez, ou appelez-moi directement au numéro ci-dessous.', true);
          }
        })
        .then(function () { quoteSend.removeAttribute('aria-busy'); quoteLabel.textContent = 'Être rappelé'; });
    });
  }

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

  /* ---------- Démos filmées ----------
     Chaque vidéo n'est chargée qu'en arrivant près de l'écran et ne tourne que si on la voit.
     Le cadre ordinateur est masqué sur téléphone : sa vidéo n'est alors jamais chargée.
     Si l'appareil demande moins d'animations, elles restent sur l'image fixe ; le bouton les lance. */
  var wide = window.matchMedia('(min-width: 900px)');
  // MP4 (H.264) partout où il est lu, sinon WebM (VP9) : chaque visiteur ne télécharge qu'un seul format
  var probe = document.createElement('video');
  var videoExt = probe.canPlayType && probe.canPlayType('video/mp4; codecs="avc1.640028"') ? '.mp4' : '.webm';
  $$('.case__media').forEach(function (media) {
    var vids = $$('video', media), btn = $('.case__toggle', media), state = $('.case__state', media);
    if (!vids.length || !('IntersectionObserver' in window)) return;
    var paused = reduced.matches, visible = false;
    var label = function () {
      if (!btn) return;
      btn.classList.toggle('is-paused', paused);
      state.textContent = paused ? 'Lecture' : 'Pause';
    };
    var sync = function () {
      vids.forEach(function (v) {
        if (v.offsetParent === null || !visible || paused) { if (!v.paused) v.pause(); return; }
        if (!v.getAttribute('src')) v.src = v.dataset.src + videoExt;
        var pr = v.play();
        // Lecture automatique refusée (mode économie d'énergie…) : on reste sur l'image, le bouton propose « Lecture »
        if (pr && pr.catch) pr.catch(function (err) { if (err && err.name === 'NotAllowedError') { paused = true; label(); } });
      });
      label();
    };
    if (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () { paused = !paused; sync(); });
    }
    new IntersectionObserver(function (entries) {
      visible = entries[entries.length - 1].isIntersecting;
      sync();
    }, { rootMargin: '120px 0px' }).observe(media);
    if (wide.addEventListener) wide.addEventListener('change', sync); else if (wide.addListener) wide.addListener(sync);
  });

  /* ---------- Scènes au scroll ---------- */
  var scene = $('.scene');
  var shotD = $('.shot--desktop'), viewD = $('.browser__view');
  var shotM = $('.shot--mobile'), viewM = $('.phone__view');
  var tourItems = $$('.tour li');
  var tourNow = $('.tour-now');
  var offer = $('.offer');
  var steps = $('.steps__list');
  var stepEls = $$('.step');
  var checks = $$('.checklist li');
  var contact = $('.contact');
  var phone = $('.contact__phone');
  var caseMedia = $$('.case__media');
  var maxD = 0, maxM = 0, ticking = false, lastTour = -1, kbNav = false;
  document.addEventListener('keydown', function (e) { if (e.key === 'Tab') kbNav = true; });
  document.addEventListener('pointerdown', function () { kbNav = false; });
  var stopsD = [], stopsM = [];
  var easeInOut = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

  /* ---------- Démos en direct ----------
     Les vraies démos (dossier demos/) sont chargées dans les cadres, à la taille d'un écran
     d'ordinateur (1440 px) ou de téléphone (390 px), puis réduites. Le défilement du site pilote
     celui de la démo : ses animations jouent pour de vrai. Si le chargement échoue (ou si
     l'appareil demande moins d'animations), on garde les captures. */
  var LIVE_SECTIONS = {
    plombier: ['.hero', '.prices', '.zone', '.steps', '.reviews', '.quote', '.faq'],
    serrurier: ['.hero', '.prices', '.method', '.zone', '.reviews', '.urgent', '.faq']
  };
  var liveEntries = [
    { view: viewD, base: 1440, frame: null, win: null, doc: null, ready: false, failed: false, tops: [], max: 0, h: 0, y: -1 },
    { view: viewM, base: 390, frame: null, win: null, doc: null, ready: false, failed: false, tops: [], max: 0, h: 0, y: -1 }
  ];

  function liveName(e) {
    if (!e.ready) return;
    var name = input.value.trim() || DEFAULT_NAME;
    $$('.brand__name, .foot__name', e.doc).forEach(function (el) { el.textContent = name; });
  }
  function liveFit(e) {
    if (!e.frame || !e.view.clientWidth) return;
    var k = e.view.clientWidth / e.base;
    e.frame.style.width = e.base + 'px';
    e.frame.style.height = Math.round(e.view.clientHeight / k) + 'px';
    e.frame.style.transform = 'scale(' + k + ')';
  }
  function liveMeasure(e) {
    if (!e.ready) return;
    try {
      e.win.scrollTo(0, 0);
      e.tops = LIVE_SECTIONS[currentDemo].map(function (sel) {
        var el = e.doc.querySelector(sel);
        return el ? el.getBoundingClientRect().top + e.win.scrollY : 0;
      });
      e.max = Math.max(0, e.doc.documentElement.scrollHeight - e.win.innerHeight);
      e.h = e.win.innerHeight; e.y = -1;
    } catch (err) { liveFail(e); }
  }
  function liveFail(e) {
    if (e.frame && e.frame.parentNode) e.frame.parentNode.removeChild(e.frame);
    e.frame = null; e.ready = false; e.failed = true;
    if (!liveEntries.some(function (x) { return x.ready; })) scene.classList.remove('is-live');
    measure(); request();
  }
  function liveLoaded(e) {
    try {
      var w = e.frame.contentWindow;
      if (w.location.href === 'about:blank') return;   // chargement initial du cadre vide
      if (!w.document || !(w.rocherReady || w.lenoirReady)) throw new Error('démo non prête');
      e.win = w; e.doc = w.document; e.ready = true;
    } catch (err) { liveFail(e); return; }
    liveName(e);
    liveMeasure(e);
    scene.classList.add('is-live');
    // la démo termine ses propres mesures (polices, hauteurs des scènes) : on remesure ensuite
    [700, 2200].forEach(function (ms) { setTimeout(function () { liveMeasure(e); request(); }, ms); });
    measure(); request();
  }
  function liveStart() {
    if (!scene || reduced.matches) return;
    liveEntries.forEach(function (e) {
      if (e.frame || e.failed || !e.view || e.view.offsetParent === null) return;
      var f = document.createElement('iframe');
      f.className = 'live-frame';
      f.title = 'Démo animée';
      f.setAttribute('aria-hidden', 'true');
      f.setAttribute('inert', '');
      f.tabIndex = -1;
      f.addEventListener('load', function () { liveLoaded(e); });
      e.frame = f;
      f.src = 'demos/' + currentDemo + '/index.html';
      e.view.appendChild(f);
      liveFit(e);
    });
  }
  function liveSwitch() {
    liveEntries.forEach(function (e) {
      if (!e.frame) return;
      e.ready = false; e.y = -1;
      e.frame.src = 'demos/' + currentDemo + '/index.html';
    });
  }

  // Progression d'une section épinglée : 0 quand elle arrive en haut, 1 quand elle se termine
  function progress(el) {
    var r = el.getBoundingClientRect();
    var total = el.offsetHeight - window.innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  }

  function measure() {
    // Hauteurs sans transformation : distance que la capture doit parcourir dans son cadre
    maxD = shotD && viewD ? Math.max(0, shotD.offsetHeight - viewD.clientHeight) : 0;
    maxM = shotM && viewM ? Math.max(0, shotM.offsetHeight - viewM.clientHeight) : 0;
    if (scene) { scene.style.setProperty('--max-d', maxD); scene.style.setProperty('--max-m', maxM); }
    liveEntries.forEach(liveFit);
    // Téléphones : le cadre démarre sous le texte d'accueil (champ, boutons), même sur un écran bas
    var introEl = $('.scene__intro'), stageEl = $('.stage');
    if (scene && introEl && stageEl) scene.style.setProperty('--intro-gap', Math.max(0, introEl.offsetTop + introEl.offsetHeight + 16 - stageEl.offsetTop) + 'px');
    // Arrêts de la visite : la capture s'arrête sur chaque partie (haut de la partie à 40 px du haut du cadre)
    function stops(shot, max, key) {
      var list = tourItems.map(function (li) {
        return max ? clamp((parseFloat(li.dataset[key]) * shot.offsetHeight - 40) / max) : 0;
      });
      list.push(1);
      return list;
    }
    if (shotD) stopsD = stops(shotD, maxD, 'top');
    if (shotM) stopsM = stops(shotM, maxM, 'mtop');
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    nav.classList.toggle('is-scrolled', window.scrollY > 8);

    if (!reduced.matches) {
      // Accueil : 0 → 0,28 la démo grandit, 0,3 → 0,92 la capture défile
      if (scene) {
        var p = progress(scene);
        var live = scene.classList.contains('is-live');
        // En direct : la démo grandit plus vite (0 → 0,14) et la visite occupe le reste de la scène, qui est plus longue
        var grow = live ? 0.14 : 0.28;
        scene.style.setProperty('--a', clamp(p / grow).toFixed(4));
        // Champ ou bouton touché à la souris : une fois le texte d'accueil effacé, on lâche le focus (sinon il resterait affiché par-dessus la démo)
        var act = document.activeElement, introEl = $('.scene__intro');
        if (introEl) introEl.style.pointerEvents = p > grow * .7 ? 'none' : '';
        if (p > grow * .7 && !kbNav && introEl && act && act !== document.body && introEl.contains(act)) act.blur();
        // Visite : pause sur chaque partie (40 % du trajet), puis glissement jusqu'à la suivante
        var list = window.innerWidth < 900 ? stopsM : stopsD;
        var n = list.length - 1, s = 0, on = 0;
        if (live) {
          // Le défilement du site se convertit en défilement de la démo (continu : ses scènes animées jouent)
          var kk = clamp((p - grow - 0.02) / (0.94 - grow - 0.02));
          var main = liveEntries[window.innerWidth < 900 ? 1 : 0];
          liveEntries.forEach(function (e) {
            if (!e.ready) return;
            var y = Math.round(kk * e.max);
            if (y !== e.y) { e.y = y; try { e.win.scrollTo(0, y); } catch (err) {} }
          });
          if (main.ready) {
            for (var k = 0; k < main.tops.length; k++) if (main.tops[k] <= main.y + main.h * 0.4) on = k;
            on = Math.min(on, tourItems.length - 1);
          }
        } else if (n > 0) {
          var u = clamp((p - 0.3) / 0.62) * n;
          var i = Math.min(n - 1, Math.floor(u));
          var t = u - i;
          var e = t < .4 ? 0 : easeInOut((t - .4) / .6);
          s = list[i] + (list[i + 1] - list[i]) * e;
          on = Math.min(tourItems.length - 1, e > .5 ? i + 1 : i);
        }
        scene.style.setProperty('--s', s.toFixed(4));
        if (on !== lastTour) {
          lastTour = on;
          tourItems.forEach(function (li, k) { li.classList.toggle('is-on', k === on); });
          if (tourNow) tourNow.textContent = tourItems[on] ? tourItems[on].textContent : '';
        }
        scene.classList.add('tour-ready');
      }

      // Offre : 0 → 0,3 le volet monte, 0,15 → 0,6 les lettres de « un mois » montent, puis le texte arrive
      if (offer) {
        var q = progress(offer);
        var w = clamp(q / 0.3);
        offer.style.setProperty('--w', w.toFixed(4));
        offer.style.setProperty('--g', clamp((q - 0.15) / 0.45).toFixed(4));
        offer.style.setProperty('--b', clamp((q - 0.62) / 0.2).toFixed(4));
        // Le menu passe en ivoire quand le volet passe dessous
        var or = offer.getBoundingClientRect();
        var pinTop = or.top > 0 ? or.top : Math.min(0, or.bottom - vh);
        var mid = nav.offsetHeight / 2;
        nav.classList.toggle('is-inverse', pinTop + (1 - w) * vh < mid && pinTop + vh > mid);
      }

      // Étapes : la ligne suit le point situé à 60 % de la hauteur de l'écran
      if (steps) {
        var sr = steps.getBoundingClientRect();
        var r = clamp((vh * 0.6 - sr.top) / sr.height);
        steps.style.setProperty('--r', r.toFixed(4));
        stepEls.forEach(function (st) {
          st.classList.toggle('is-on', st.getBoundingClientRect().top - sr.top <= r * sr.height);
        });
      }

      // Démos filmées : position du cadre dans l'écran (0 en bas, 1 en haut), pour le décalage du téléphone
      caseMedia.forEach(function (m) {
        var mr = m.getBoundingClientRect();
        if (mr.bottom > -vh * .2 && mr.top < vh * 1.2) m.style.setProperty('--k', clamp((vh - mr.top) / (vh + mr.height)).toFixed(4));
      });

      checks.forEach(function (li) { li.classList.toggle('is-on', li.getBoundingClientRect().top < vh * 0.62); });
      if (phone) phone.classList.toggle('is-on', phone.getBoundingClientRect().top < vh * 0.85);
    }

    // Contact : la page passe en sombre pendant qu'on est sur le formulaire, puis redevient claire
    if (contact) {
      var cr = contact.getBoundingClientRect();
      root.classList.toggle('end-dark', cr.top < vh * 0.55 && cr.bottom > vh * 0.3);
    }
  }

  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', function () { measure(); request(); });
  window.addEventListener('load', function () { measure(); request(); });
  $$('.shot img').forEach(function (img) { if (!img.complete) img.addEventListener('load', function () { measure(); request(); }); });
  measure();
  update();
  liveStart();
  window.addEventListener('resize', liveStart);
})();
