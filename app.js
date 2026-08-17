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

  /* ── Direction shortcut ────────────────────────────────── */
  function isPreset(value) { return PRESETS.indexOf(value.trim()) !== -1; }

  form.querySelectorAll('input[name="direction"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.value === 'from') {
        pickup.value = SCHIPHOL_IN;
        if (isPreset(dest.value)) dest.value = '';
      } else if (radio.value === 'to') {
        dest.value = SCHIPHOL_OUT;
        if (isPreset(pickup.value)) pickup.value = '';
      } else {
        if (isPreset(pickup.value)) pickup.value = '';
        if (isPreset(dest.value)) dest.value = '';
      }
      clearError(pickup);
      clearError(dest);
    });
  });

  flight.addEventListener('input', function () {
    flight.value = flight.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
  });

  /* ── Validation ────────────────────────────────────────── */
  function field(el) { return el.closest('.field'); }

  function setError(el, message) {
    var slot = form.querySelector('[data-err-for="' + el.id + '"]');
    if (slot) slot.textContent = message;
    field(el).classList.add('is-bad');
    el.setAttribute('aria-invalid', 'true');
    el.dataset.errKey = '';
  }

  function clearError(el) {
    var slot = form.querySelector('[data-err-for="' + el.id + '"]');
    if (slot) slot.textContent = '';
    field(el).classList.remove('is-bad');
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
    backBtn.hidden = step === 1 || step > LAST_INPUT_STEP;
    nextBtn.hidden = step !== 1;
    sendBtn.hidden = step !== 2;
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
      if (field(el) && field(el).classList.contains('is-bad')) clearError(el);
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
    put('rPickup', ride.pickup);
    put('rDest', ride.dest);
    put('rWhen', readableWhen());
    put('rPax', selectedText(paxEl));
    put('rBags', bagsEl.value ? selectedText(bagsEl) : t('r.tbc'));
    put('rFlight', ride.flight || t('r.notgiven'));
    put('rContact', ride.name + ' · ' + ride.phone);
  }

  function showReceipt(ride) {
    lastRide = ride;
    renderReceipt(ride);
    form.hidden = true;
    receipt.hidden = false;
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

  function direction() {
    var picked = form.querySelector('input[name="direction"]:checked');
    return picked ? picked.value : 'other';
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
      Destination: ride.dest,
      Date: ride.date,
      Time: ride.time + ' (Amsterdam)',
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
      dest: dest.value.trim(),
      date: dateEl.value,
      time: timeEl.value,
      pax: paxEl.value,
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
    receipt.hidden = true;
    form.hidden = false;
    lastRide = null;
    form.reset();
    pickup.value = SCHIPHOL_IN;
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

  /* First load matches the default direction. */
  if (!pickup.value) pickup.value = SCHIPHOL_IN;
  paint();
}());
