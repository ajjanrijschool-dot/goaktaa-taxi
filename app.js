/* Taxi Service Go Aktaa — booking form behaviour.
   No pricing anywhere: the fare comes off the taximeter, so the form only
   collects the ride, validates it, and prints a request slip.
   All copy comes from i18n.js, so the form re-speaks itself on language change. */

(function () {
  'use strict';

  var t = window.I18N.t;

  /* ── Where booking requests are delivered ─────────────────────
     Formspree relays the form to an inbox, so the site stays static
     and can live on GitHub Pages with no server of our own.

     One step to go live: make a form at https://formspree.io for
     taxiservice.goaktaa@gmail.com, then paste its endpoint below —
     it looks like https://formspree.io/f/abcdwxyz. This is the only
     place it appears; the <form> action is set from it on load.

     Until then the form runs in demo mode: it validates and prints
     the slip, and sends nothing. */
  var MAIL = {
    endpoint: 'https://formspree.io/f/YOUR-FORMSPREE-ID',
    inbox: 'taxiservice.goaktaa@gmail.com'
  };

  function mailReady() {
    return MAIL.endpoint.indexOf('YOUR-FORMSPREE-ID') === -1;
  }

  var form    = document.getElementById('bookingForm');
  var receipt = document.getElementById('receipt');
  var again   = document.getElementById('againBtn');
  var pickup  = document.getElementById('pickup');
  var dest    = document.getElementById('dest');
  var dateEl  = document.getElementById('date');
  var timeEl  = document.getElementById('time');
  var flight  = document.getElementById('flight');
  var paxEl   = document.getElementById('pax');
  var bagsEl  = document.getElementById('bags');
  var nameEl  = document.getElementById('name');
  var phoneEl = document.getElementById('phone');
  var notesEl = document.getElementById('notes');
  var trapEl  = document.getElementById('gotcha');
  var failure = document.getElementById('formError');
  var panel   = document.getElementById('book');
  var nextBtn = document.getElementById('nextBtn');
  var backBtn = document.getElementById('backBtn');
  var sendBtn = document.getElementById('sendBtn');
  var submit  = sendBtn;
  var bookcard = document.getElementById('bookcard');
  var confirmPanel = document.getElementById('confirmPanel');
  var formFoot = document.getElementById('formFoot');
  var swapBtn = document.getElementById('swapBtn');
  var viaBtn  = document.getElementById('viaBtn');
  var viaOff  = document.getElementById('viaOff');
  var viaWrap = document.getElementById('viaWrap');
  var viaEl   = document.getElementById('via');
  var retEl   = document.getElementById('ret');
  var retWrap = document.getElementById('retWrap');
  var retDate = document.getElementById('retDate');
  var retTime = document.getElementById('retTime');
  var paxHint = document.getElementById('paxHint');

  /* Addresses stay in Latin script in every language: a Dutch driver reads them. */
  var SCHIPHOL_IN  = 'Schiphol Plaza, Arrivals 4';
  var SCHIPHOL_OUT = 'Schiphol P1, Departures';
  var PRESETS = [SCHIPHOL_IN, SCHIPHOL_OUT, ''];

  var lastRide = null;

  /* ── Meter: the face is Dutch hardware, so is its tariff row ─── */
  function tariff() {
    var out = document.getElementById('meterTariff');
    if (!out) return;
    var h = new Date().getHours();
    out.textContent = (h >= 0 && h < 6) ? '2 · nacht' : '1 · dag';
  }
  tariff();

  /* ── Date floor: today ─────────────────────────────────── */
  function localDate(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
  var today = localDate(new Date());
  dateEl.min = today;

  /* ── Swap, via stop, return leg, passenger count ───────── */
  swapBtn.addEventListener('click', function () {
    var held = pickup.value;
    pickup.value = dest.value;
    dest.value = held;
    /* Leaving Schiphol becomes going to it, so keep the default useful. */
    if (!pickup.value && !dest.value) pickup.value = SCHIPHOL_IN;
    else if (!dest.value && pickup.value === SCHIPHOL_IN) dest.value = '';
    clearError(pickup);
    clearError(dest);
    pickup.focus();
  });

  viaBtn.addEventListener('click', function () {
    viaWrap.hidden = false;
    viaBtn.hidden = true;
    viaEl.focus();
  });

  viaOff.addEventListener('click', function () {
    viaEl.value = '';
    viaWrap.hidden = true;
    viaBtn.hidden = false;
    viaBtn.focus();
  });

  retEl.addEventListener('change', function () {
    retWrap.hidden = !retEl.checked;
    if (retEl.checked) {
      if (!retDate.value) retDate.value = dateEl.value;
      retDate.focus();
    } else {
      clearError(retDate);
      clearError(retTime);
    }
  });

  function paxCount() {
    var n = parseInt(paxEl.value, 10);
    if (isNaN(n)) n = 1;
    return Math.min(8, Math.max(1, n));
  }

  function paintPax() {
    var n = paxCount();
    paxEl.value = String(n);
    paxHint.hidden = n < 5;
    form.querySelector('[data-pax="-1"]').disabled = n <= 1;
    form.querySelector('[data-pax="1"]').disabled = n >= 8;
  }

  form.querySelectorAll('[data-pax]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      paxEl.value = String(paxCount() + Number(btn.dataset.pax));
      paintPax();
    });
  });
  paxEl.addEventListener('input', paintPax);
  paxEl.addEventListener('blur', paintPax);

  /* Derived, not asked: the addresses already say which way you are going. */
  function direction() {
    var at = /schiphol/i;
    if (at.test(pickup.value)) return 'from Schiphol';
    if (at.test(dest.value)) return 'to Schiphol';
    return 'other route';
  }

  function paxLabel() {
    var n = paxCount();
    return n === 1 ? t('pax.one') : t('pax.n').replace('{n}', String(n));
  }

  flight.addEventListener('input', function () {
    flight.value = flight.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  });

  /* ── Validation ────────────────────────────────────────── */
  /* Fields live in three shapes now: .field wrappers on step 2, .route__leg
     for the address pills, .ctl for the time and passenger controls. */
  function field(el) { return el.closest('.field, .route__leg, .ctl'); }

  function setError(el, message) {
    var slot = form.querySelector('[data-err-for="' + el.id + '"]');
    if (slot) slot.textContent = message;
    var wrap = field(el);
    if (wrap) wrap.classList.add('is-bad');
    el.setAttribute('aria-invalid', 'true');
  }

  function clearError(el) {
    var slot = form.querySelector('[data-err-for="' + el.id + '"]');
    if (slot) slot.textContent = '';
    var wrap = field(el);
    if (wrap) wrap.classList.remove('is-bad');
    el.removeAttribute('aria-invalid');
    delete el.dataset.errKey;
  }

  function digits(value) { return (value.match(/\d/g) || []).length; }

  /* Each step checks only its own fields, so nobody is told about a
     problem on a pane they cannot see. */
  function validate(step) {
    var bad = [];

    function check(el, ok, key) {
      if (ok) { clearError(el); return; }
      setError(el, t(key));
      el.dataset.errKey = key;
      bad.push(el);
    }

    if (step === 1) {
      check(pickup, pickup.value.trim().length > 2, 'err.pickup');
      check(dest, dest.value.trim().length > 2, 'err.dest');
      check(dateEl, !!dateEl.value && dateEl.value >= today, 'err.date');

      var timeOk = !!timeEl.value;
      var sameDay = dateEl.value === today;
      if (timeOk && sameDay) {
        var now = new Date();
        var mins = now.getHours() * 60 + now.getMinutes();
        var parts = timeEl.value.split(':');
        timeOk = (Number(parts[0]) * 60 + Number(parts[1])) > mins + 29;
      }
      check(timeEl, timeOk, sameDay ? 'err.timeSoon' : 'err.time');

      if (retEl.checked) {
        check(retDate, !!retDate.value && retDate.value >= (dateEl.value || today), 'err.retDate');
        check(retTime, !!retTime.value, 'err.retTime');
      }
    }

    if (step === 2) {
      check(nameEl, nameEl.value.trim().length > 1, 'err.name');
      check(phoneEl, digits(phoneEl.value) >= 8, 'err.phone');
    }

    if (bad.length) {
      bad[0].focus();
      bad[0].scrollIntoView({ block: 'center', behavior: motion() });
    }
    return bad.length === 0;
  }

  /* ── Steps ─────────────────────────────────────────────── */
  var LAST_INPUT_STEP = 2;
  var step = 1;

  function paint() {
    form.querySelectorAll('[data-pane]').forEach(function (pane) {
      pane.hidden = Number(pane.dataset.pane) !== step;
    });
    document.querySelectorAll('.steps__i').forEach(function (item) {
      var n = Number(item.dataset.step);
      item.classList.toggle('is-now', n === step);
      item.classList.toggle('is-done', n < step);
      if (n === step) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    /* Step 1 carries its own Continue inside the controls row. */
    formFoot.hidden = step !== 2;
    bookcard.hidden = step > LAST_INPUT_STEP;
    confirmPanel.hidden = step <= LAST_INPUT_STEP;
  }

  function goStep(n, focusIt) {
    step = n;
    hideFailure();
    paint();
    panel.scrollIntoView({ block: 'start', behavior: motion() });
    if (focusIt) {
      var first = form.querySelector('[data-pane="' + n + '"] input, [data-pane="' + n + '"] select');
      if (first) first.focus({ preventScroll: true });
    }
  }

  nextBtn.addEventListener('click', function () {
    if (validate(1)) goStep(2, true);
  });

  backBtn.addEventListener('click', function () {
    goStep(1, true);
  });

  /* Enter in a step-1 field advances instead of submitting a half-filled form. */
  form.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    if (event.target.tagName === 'TEXTAREA') return;
    if (step > LAST_INPUT_STEP) return;
    if (step === 1) { event.preventDefault(); nextBtn.click(); }
  });

  function motion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  form.querySelectorAll('input, select, textarea').forEach(function (el) {
    el.addEventListener('input', function () {
      if (el.hasAttribute('aria-invalid')) clearError(el);
    });
  });

  /* ── Confirmation slip ─────────────────────────────────── */
  function reference() {
    var pool = 'ACDEFHJKLMNPRTUVWXY3479';
    var out = '';
    for (var i = 0; i < 4; i++) out += pool[Math.floor(Math.random() * pool.length)];
    return 'GA-' + out;
  }

  function selectedText(select) {
    return select.options[select.selectedIndex].text;
  }

  function readableWhen() {
    var d = new Date(dateEl.value + 'T' + timeEl.value);
    if (isNaN(d)) return dateEl.value + ' · ' + timeEl.value;
    var day = d.toLocaleDateString(window.I18N.locale(), {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
    return day + ' · ' + timeEl.value;
  }

  function put(id, value) {
    document.getElementById(id).textContent = value || '—';
  }

  function renderReceipt(ride) {
    put('rRef', ride.ref);
    put('rPickup', ride.pickup + (ride.via ? ' → ' + ride.via : ''));
    put('rDest', ride.dest);
    put('rWhen', readableWhen());
    put('rPax', paxLabel());
    put('rBags', bagsEl.value ? selectedText(bagsEl) : t('r.tbc'));
    put('rFlight', ride.flight || t('r.notgiven'));
    put('rContact', ride.name + ' · ' + ride.phone);
  }

  function showReceipt(ride) {
    lastRide = ride;
    renderReceipt(ride);
    step = 3;
    paint();
    receipt.focus();
    panel.scrollIntoView({ block: 'start', behavior: motion() });
  }

  /* ── Sending ───────────────────────────────────────────── */
  function sending(on) {
    submit.disabled = on;
    submit.textContent = on ? t('form.sending') : t('form.submit');
  }

  function showFailure() {
    failure.innerHTML = t('form.failed');
    failure.hidden = false;
    failure.scrollIntoView({ block: 'center', behavior: motion() });
  }

  function hideFailure() {
    failure.hidden = true;
    failure.textContent = '';
  }

  /* The dispatcher reads one language whatever the visitor picked, so the
     labels here stay English. _subject and _gotcha are Formspree's own. */
  function payload(ride) {
    return {
      _subject: 'Ride request ' + ride.ref + ' — ' + ride.date + ' ' + ride.time,
      _gotcha: trapEl.value,
      Reference: ride.ref,
      Direction: direction(),
      'Pick-up': ride.pickup,
      Via: ride.via || 'no stop',
      Destination: ride.dest,
      Date: ride.date,
      Time: ride.time + ' (Amsterdam)',
      'Return trip': ride.ret ? (ride.retDate + ' ' + ride.retTime) : 'one way',
      Passengers: ride.pax,
      Suitcases: ride.bags || 'not stated',
      Flight: ride.flight || 'not given',
      Name: ride.name,
      Mobile: ride.phone,
      Notes: ride.notes || '—',
      Fare: 'On the taximeter — no price quoted',
      'Reply in': ride.lang
    };
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    hideFailure();
    if (trapEl.value) return;      /* honeypot: only a bot fills this */
    if (!validate(1)) { goStep(1, true); return; }
    if (!validate(2)) return;

    var ride = {
      ref: reference(),
      pickup: pickup.value.trim(),
      via: viaWrap.hidden ? '' : viaEl.value.trim(),
      dest: dest.value.trim(),
      date: dateEl.value,
      time: timeEl.value,
      ret: retEl.checked,
      retDate: retDate.value,
      retTime: retTime.value,
      pax: String(paxCount()),
      bags: bagsEl.value === 'hand' ? 'hand luggage only' : bagsEl.value,
      flight: flight.value.trim(),
      name: nameEl.value.trim(),
      phone: phoneEl.value.trim(),
      notes: notesEl.value.trim(),
      lang: ({ en: 'English', nl: 'Dutch', ar: 'Arabic' })[window.I18N.lang()]
    };

    /* No endpoint yet: the form still runs, but say plainly nothing was sent. */
    if (!mailReady()) {
      console.warn('Go Aktaa: demo mode — no Formspree endpoint in app.js, so ' +
        ride.ref + ' was not sent to ' + MAIL.inbox + '.');
      showReceipt(ride);
      return;
    }

    sending(true);
    fetch(MAIL.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload(ride))
    }).then(function (res) {
      sending(false);
      if (res.ok) { showReceipt(ride); return; }
      showFailure();
      res.json().then(function (data) {
        console.error('Go Aktaa: Formspree rejected ' + ride.ref + '.', data);
      }, function () { /* no body to read */ });
    }, function () {
      sending(false);
      showFailure();
    });
  });

  again.addEventListener('click', function () {
    lastRide = null;
    form.reset();
    pickup.value = SCHIPHOL_IN;
    viaWrap.hidden = true;
    viaBtn.hidden = false;
    retWrap.hidden = true;
    paintPax();
    form.querySelectorAll('.is-bad').forEach(function (el) { el.classList.remove('is-bad'); });
    form.querySelectorAll('.err').forEach(function (el) { el.textContent = ''; });
    goStep(1, true);
  });

  /* Re-speak everything the dictionary can't reach on its own. */
  document.addEventListener('ml:lang', function () {
    tariff();
    form.querySelectorAll('[data-err-key]').forEach(function (el) {
      var slot = form.querySelector('[data-err-for="' + el.id + '"]');
      if (slot && el.dataset.errKey) slot.textContent = t(el.dataset.errKey);
    });
    if (lastRide) renderReceipt(lastRide);
  });

  /* One endpoint, one edit: the markup gets its action from the config. */
  if (mailReady()) {
    form.action = MAIL.endpoint;
    form.method = 'POST';
  }

  /* The hero photo, if there is one, takes over and the meter moves
     into its corner. Without car.jpg nothing changes. */
  (function heroPhoto() {
    var shot = document.getElementById('heroShot');
    if (!shot) return;
    var img = shot.querySelector('.shot__photo');
    if (!img) return;
    function reveal() {
      if (!img.naturalWidth) return;
      img.hidden = false;
      shot.classList.add('shot--photo');
    }
    if (img.complete) reveal();
    else img.addEventListener('load', reveal);
  }());

  /* ── A photo replaces its drawing, once one exists ─────────
     Drop amsterdam.jpg / rotterdam.jpg / denhaag.jpg beside index.html
     and the cards switch over. Until then the drawing stays and nothing
     looks broken. */
  document.querySelectorAll('.svc__photo').forEach(function (img) {
    function reveal() {
      if (!img.naturalWidth) return;
      img.hidden = false;
      var drawing = img.parentNode.querySelector('.svc__draw');
      if (drawing) drawing.remove();
    }
    if (img.complete) reveal();
    else img.addEventListener('load', reveal);
  });

  /* ── City cards fill the form in ───────────────────────── */
  document.querySelectorAll('[data-dest]').forEach(function (card) {
    card.addEventListener('click', function (event) {
      event.preventDefault();
      /* Coming from a city card, you are almost certainly leaving the airport. */
      if (!pickup.value.trim()) pickup.value = SCHIPHOL_IN;
      dest.value = card.dataset.dest;
      clearError(dest);
      if (step > LAST_INPUT_STEP) {
        form.reset();
        pickup.value = SCHIPHOL_IN;
        dest.value = card.dataset.dest;
        paintPax();
      }
      goStep(1, false);
      dest.focus({ preventScroll: true });
    });
  });

  /* ── Nav follows the scroll ────────────────────────────── */
  (function scrollspy() {
    var links = [].slice.call(document.querySelectorAll('.mainnav a[href^="#"]'));
    var home = links[0];
    /* #top is <main>, which wraps everything, so the sections are what get
       tracked and Home simply means "above all of them". */
    var watched = [];
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (a !== home && el && el.tagName !== 'MAIN') watched.push({ link: a, el: el });
    });
    if (!watched.length) return;

    /* The section you are inside is the last one whose top has passed the
       nav. Intersection ratios get this wrong when a tall section above
       still overlaps the band. */
    function update() {
      var line = document.querySelector('.mainnav').getBoundingClientRect().height + 60;
      var active = null;
      watched.forEach(function (w) {
        if (w.el.getBoundingClientRect().top <= line) active = w.link;
      });
      /* The last section plus the footer are shorter than the viewport, so it
         can never reach the line on its own. Hitting the bottom means it. */
      var doc = document.documentElement;
      if (window.innerHeight + window.pageYOffset >= doc.scrollHeight - 2) {
        active = watched[watched.length - 1].link;
      }
      links.forEach(function (a) { a.classList.toggle('is-here', a === (active || home)); });
    }

    var queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; update(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }());

  /* Most of our rides start at the airport, so start there. */
  if (!pickup.value) pickup.value = SCHIPHOL_IN;
  paintPax();
  paint();
}());
