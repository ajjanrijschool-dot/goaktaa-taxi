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
    endpoint: 'https://formspree.io/f/mkjwqpkk',
    inbox: 'taxiservice.goaktaa@gmail.com'
  };

  /* ── Confirmations to the customer ────────────────────────────
     Paste the Twilio Function URL here once it is deployed (see
     twilio-function/confirm.js). With it set, the booking goes there,
     and it texts and emails the customer and forwards the booking to
     dispatch. Left empty, the form behaves exactly as before: the
     booking reaches you through Formspree and the customer hears
     nothing automatic — which is what the wording on the page says. */
  var CONFIRM = { endpoint: '' };

  /* ── The booking fee ──────────────────────────────────────────
     A flat €20 per booking, paid online. Because the amount never
     varies, this needs no server and no API key: one payment link
     from Stripe or Mollie does it.

     Stripe: Payments → Payment links → create a €20 link. It accepts
     ?client_reference_id= so the booking reference lands in your
     dashboard next to the payment, and ?prefilled_email= to save the
     customer typing it again.

     Empty means no payment step is shown at all — better a missing
     button than one that leads nowhere. */
  var FEE = { amount: 20, currency: 'EUR', payUrl: '' };

  function feeReady() { return /^https:\/\/.+/.test(FEE.payUrl); }

  function confirmsReady() { return /^https:\/\/.+/.test(CONFIRM.endpoint); }

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
  var emailEl = document.getElementById('email');
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

  /* Start from a real date and time rather than empty boxes. Segmented
     date/time controls are easy to half-fill — a missing minute or a
     mistyped year reads as blank to the browser — and the booking then
     refuses to move for reasons that are hard to see. Editing a sensible
     default is far more reliable than composing one from nothing.
     Tomorrow mid-morning: never in the past, never inside the 30-minute
     same-day cutoff. */
  (function seedWhen() {
    if (!dateEl.value) {
      var d = new Date();
      d.setDate(d.getDate() + 1);
      dateEl.value = localDate(d);
    }
    if (!timeEl.value) timeEl.value = '10:00';
  }());

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

  /* ── Which exit at Schiphol ────────────────────────────────
     Opens from the pick-up field like a dropdown. Only offered while the
     pick-up is the airport, and it closes the moment a door is chosen. */
  var exitsWrap = document.getElementById('exits');
  var SCHIPHOL_UNSURE = 'Schiphol Plaza — I will call when I land';

  function atSchiphol() {
    var v = pickup.value.trim();
    return v === '' || /schiphol/i.test(v);
  }

  function markExits() {
    if (!exitsWrap) return;
    var found = pickup.value.match(/arrivals[^0-9]*([1-4])/i);
    var current = found ? found[1] : (/departures|p1/i.test(pickup.value) ? 'dep' : '');
    exitsWrap.querySelectorAll('.exits__opt').forEach(function (b) {
      b.setAttribute('aria-selected', String(b.dataset.exit === current));
    });
  }

  function openExits() {
    if (!exitsWrap || !atSchiphol()) return;
    markExits();
    exitsWrap.hidden = false;
  }

  function closeExits() {
    if (exitsWrap) exitsWrap.hidden = true;
  }

  if (exitsWrap) {
    pickup.addEventListener('focus', openExits);
    pickup.addEventListener('click', openExits);
    pickup.addEventListener('input', function () {
      if (atSchiphol()) openExits(); else closeExits();
    });

    exitsWrap.querySelectorAll('.exits__opt').forEach(function (b) {
      b.addEventListener('click', function () {
        pickup.value = b.dataset.exit === 'dep' ? SCHIPHOL_OUT
          : b.dataset.exit ? 'Schiphol Plaza, Arrivals ' + b.dataset.exit
          : SCHIPHOL_UNSURE;
        clearError(pickup);
        closeExits();
        dest.focus();
      });
    });

    /* Click away or press Escape and it folds up again. */
    document.addEventListener('click', function (event) {
      if (exitsWrap.hidden) return;
      if (event.target === pickup || exitsWrap.contains(event.target)) return;
      closeExits();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !exitsWrap.hidden) { closeExits(); pickup.focus(); }
    });
  }

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
    paxHint.hidden = n < 5;   /* five or more needs a second car */
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

      /* A half-typed date or time reads as empty to the browser. Saying
         "pick a date" to someone who just typed one is maddening, so name
         what is actually missing. */
      if (dateEl.validity.badInput) check(dateEl, false, 'err.datePart');
      else check(dateEl, !!dateEl.value && dateEl.value >= today, 'err.date');

      var timeOk = !!timeEl.value;
      var sameDay = dateEl.value === today;
      if (timeOk && sameDay) {
        var now = new Date();
        var mins = now.getHours() * 60 + now.getMinutes();
        var parts = timeEl.value.split(':');
        timeOk = (Number(parts[0]) * 60 + Number(parts[1])) > mins + 29;
      }
      if (timeEl.validity.badInput) check(timeEl, false, 'err.timePart');
      else check(timeEl, timeOk, sameDay ? 'err.timeSoon' : 'err.time');

      if (retEl.checked) {
        check(retDate, !!retDate.value && retDate.value >= (dateEl.value || today), 'err.retDate');
        check(retTime, !!retTime.value, 'err.retTime');
      }
    }

    if (step === 2) {
      check(nameEl, nameEl.value.trim().length > 1, 'err.name');
      check(phoneEl, digits(phoneEl.value) >= 8, 'err.phone');
      /* Required: the written confirmation has nowhere to go without it,
         and a typo is the same as leaving it blank. */
      if (emailEl) {
        var mail = emailEl.value.trim();
        check(emailEl, /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(mail),
              mail ? 'err.email' : 'err.emailNeed');
      }
    }

    /* Say at the button why the button did nothing. Without this, a blocked
       click reads as a broken button. */
    var stop = document.getElementById('blockNote');
    if (stop) {
      stop.hidden = bad.length === 0;
      if (bad.length) {
        stop.textContent = bad.length === 1
          ? t('err.one')
          : t('err.many').replace('{n}', String(bad.length));
      }
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

  /* The booking, written out for WhatsApp. One tap by the customer puts the
     whole ride in a thread both sides can reply in — which is also how the
     15-minute confirmation gets sent back. */
  function paintWaSend(ride) {
    var link = document.getElementById('waSend');
    if (!link || !ride) return;
    var lines = [
      t('r.wa.head').replace('{ref}', ride.ref),
      t('r.pickup') + ': ' + ride.pickup,
      t('r.dest') + ': ' + ride.dest,
      t('r.when') + ': ' + readableWhen(),
      t('r.pax') + ': ' + paxLabel(),
      t('r.contact') + ': ' + ride.name + ' — ' + ride.phone
    ];
    if (ride.flight) lines.push(t('r.flight') + ': ' + ride.flight);
    link.href = 'https://wa.me/31613331111?text=' + encodeURIComponent(lines.join('\n'));
  }

  /* The payment link, with the booking reference attached so a payment
     can be matched to a ride without asking the customer. */
  function paintPay(ride) {
    var box = document.getElementById('payBox');
    var btn = document.getElementById('payBtn');
    if (!box || !btn) return;
    if (!feeReady()) { box.hidden = true; return; }

    btn.href = payLink(ride);
    box.hidden = false;
  }

  /* Hand the customer to the payment page. The reference travels with
     them so the payment arrives labelled with the ride it belongs to. */
  function payLink(ride) {
    /* Mollie payment links take no query parameters — anything we append
       is dropped, so send the bare link and match the payment to the
       booking by name and time instead. Stripe does carry them. */
    if (FEE.payUrl.indexOf('mollie.com') > -1) return FEE.payUrl;

    var url = FEE.payUrl + (FEE.payUrl.indexOf('?') < 0 ? '?' : '&')
      + 'client_reference_id=' + encodeURIComponent(ride.ref);
    if (ride.email) url += '&prefilled_email=' + encodeURIComponent(ride.email);
    return url;
  }

  function goPay(ride) {
    lastRide = ride;
    try { sessionStorage.setItem('goaktaa.ref', ride.ref); } catch (e) { /* private mode */ }
    window.location.href = payLink(ride);
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
    paintWaSend(ride);
    paintPay(ride);
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
  /* What the Worker needs. Field names are its own, not Formspree's. */
  function confirmPayload(ride) {
    return {
      ref: ride.ref,
      pickup: ride.pickup + (ride.via ? ' via ' + ride.via : ''),
      dest: ride.dest,
      when: readableWhen(),
      pax: paxLabel(),
      bags: bagsEl.value ? selectedText(bagsEl) : '',
      flight: ride.flight,
      name: ride.name,
      phone: ride.phone,
      email: emailEl ? emailEl.value.trim() : '',
      notes: ride.notes,
      lang: window.I18N.lang(),
      trap: trapEl.value
    };
  }

  function payload(ride) {
    var out = {
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

    /* Lowercase and only when filled in: this is the key Formspree
       replies to and sends its confirmation to. An address of "not
       given" would make it try to write to nobody. */
    if (ride.email) out.email = ride.email;

    return out;
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
      email: emailEl ? emailEl.value.trim() : '',
      lang: ({ en: 'English', nl: 'Dutch', ar: 'Arabic' })[window.I18N.lang()]
    };

    /* No endpoint yet: the form still runs, but say plainly nothing was sent. */
    if (!mailReady()) {
      console.warn('Go Aktaa: demo mode — no Formspree endpoint in app.js, so ' +
        ride.ref + ' was not sent to ' + MAIL.inbox + '.');
      if (feeReady()) { goPay(ride); return; }
      showReceipt(ride);
      return;
    }

    sending(true);

    /* The Worker confirms the customer and forwards to dispatch in one
       call. Without it, Formspree still delivers the booking to us. */
    var target = confirmsReady() ? CONFIRM.endpoint : MAIL.endpoint;
    var body = confirmsReady() ? confirmPayload(ride) : payload(ride);

    fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      sending(false);
      if (res.ok) {
        /* The booking is safely with us before the customer leaves the
           site. If they abandon the payment we still have the request,
           and can chase it — better than losing the ride entirely. */
        if (feeReady()) { goPay(ride); return; }
        showReceipt(ride);
        return;
      }
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
    paintWhatsApp();
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

  /* WhatsApp opens with a first line already typed, in the language the
     visitor is reading, so they are not staring at an empty chat. */
  function paintWhatsApp() {
    var wa = document.getElementById('waBtn');
    if (!wa) return;
    wa.href = 'https://wa.me/31613331111?text=' + encodeURIComponent(t('wa.text'));
  }
  paintWhatsApp();

  /* The kerbside band takes a real photo of Schiphol when there is one. */
  (function bandPhoto() {
    var band = document.querySelector('.hero__art');
    if (!band) return;
    var img = band.querySelector('.hero__photo');
    if (!img) return;
    function reveal() {
      if (!img.naturalWidth) return;
      band.classList.add('hero__art--photo');
      var drawing = band.querySelector('.hero__draw');
      if (drawing) drawing.remove();
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
      img.parentNode.classList.add('is-photo');
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

  /* ── Google rating ─────────────────────────────────────────
     Fill this in once you have a Google Business Profile with real
     reviews on it, and the badge appears above the review section.
     Leave it empty and nothing shows — an invented score is the fastest
     way for a business to lose the trust it is trying to buy.

       url:    your Google profile or review link
       rating: what Google actually shows, e.g. '4.8'
       count:  how many reviews, e.g. '37'                       */
  var GOOGLE = { url: '', rating: '', count: '' };

  (function googleBadge() {
    var el = document.getElementById('gBadge');
    if (!el) return;
    if (!GOOGLE.url || !GOOGLE.rating || !GOOGLE.count) return;   /* stays hidden */
    var score = Math.max(0, Math.min(5, parseFloat(GOOGLE.rating) || 0));
    var full = Math.floor(score);
    var half = score - full >= 0.35;
    document.getElementById('gStars').textContent =
      '★'.repeat(full) + (half ? '⯨' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
    document.getElementById('gScore').textContent = GOOGLE.rating;
    document.getElementById('gCount').textContent =
      t('reviews.count').replace('{n}', GOOGLE.count);
    el.href = GOOGLE.url;
    el.hidden = false;
  }());


  /* ── The mobile menu ───────────────────────────────────────── */
  (function menu() {
    var nav = document.getElementById("mainnav");
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!nav || !toggle || !links) return;

    function setOpen(on) {
      nav.classList.toggle("is-open", on);
      toggle.setAttribute("aria-expanded", String(on));
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    /* Picking a destination should close the menu behind you. */
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("click", function (e) {
      if (!nav.contains(e.target)) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });

    /* Leaving it open while the layout turns back into a row would strand
       the panel mid-screen. */
    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) setOpen(false);
    });
  }());

  /* ── Sections arrive rather than appear ─────────────────────
     Quiet on purpose: a short rise and fade, once, never repeated.
     The hiding is applied by script, so if the script never runs the
     page is simply all visible — content is never hidden by CSS alone.
     Anyone who asks for reduced motion gets none of it. */
  (function reveal() {
    var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calm || !("IntersectionObserver" in window)) return;

    var targets = document.querySelectorAll(
      ".svcs__title, .svc, .board__title, .board__panel, .fare__title, .state," +
      " .reviews__title, .point, .meet__copy > *, .plaza, .legal__title, .legal__item," +
      " .gbadge__row"
    );
    if (!targets.length) return;

    document.documentElement.classList.add("reveal-on");
    [].forEach.call(targets, function (el, i) {
      el.classList.add("reveal");
      /* neighbours follow each other in, but the stagger is capped so a
         long row never leaves the last card lagging behind the scroll */
      el.style.setProperty("--reveal-delay", Math.min(i % 4, 3) * 70 + "ms");
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

    [].forEach.call(targets, function (el) { io.observe(el); });
  }());

  /* Most of our rides start at the airport, so start there. */
  if (!pickup.value) pickup.value = SCHIPHOL_IN;
  paintPax();
  markExits();
  paint();

  /* No payment link yet? Then the button must not promise a payment
     screen. Swapping the key rather than the text keeps the language
     switcher working. */
  if (!feeReady()) {
    var sendEl = document.getElementById('sendBtn');
    var noteEl = document.querySelector('.form__note');
    if (sendEl) sendEl.setAttribute('data-i18n', 'form.submit.nofee');
    if (noteEl) noteEl.setAttribute('data-i18n', 'form.note.nofee');
    if (window.I18N) window.I18N.apply(window.I18N.lang());
  }

  /* Back from the payment page. Stripe redirects here after a successful
     payment, so say so plainly rather than dropping them on a blank form.
     This runs after paint(), which sets the cards from `step` and would
     otherwise put the booking form straight back on screen. */
  (function paidReturn() {
    if (!/[?&]paid=/.test(location.search)) return;

    var box = document.getElementById('paidBox');
    if (!box) return;

    var ref = '';
    try { ref = sessionStorage.getItem('goaktaa.ref') || ''; } catch (e) { /* private mode */ }
    var slot = document.getElementById('paidRef');
    if (slot && ref) slot.textContent = ref;

    step = 3;
    paint();               /* marks the rail done, hides the booking card */
    confirmPanel.hidden = true;   /* the slip is replaced by the paid panel */
    box.hidden = false;
    box.scrollIntoView({ block: 'start' });
  }());
}());
