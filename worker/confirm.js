/* Taxi Service Go Aktaa — booking confirmation worker.
 *
 * Why this exists: GitHub Pages serves files and nothing else. Sending an
 * email or an SMS needs an API key, and any key put in the website itself
 * is readable by every visitor. This runs on Cloudflare Workers instead,
 * where the keys stay server-side.
 *
 * What it does, in order:
 *   1. takes the booking from the site
 *   2. emails the customer a confirmation   (if they gave an address)
 *   3. texts the customer a confirmation    (always — we have their mobile)
 *   4. emails the booking to the dispatcher
 *
 * A failure in any one step does not fail the others, and the site is told
 * what actually went out, so it never claims something that did not happen.
 *
 * ── Setup ─────────────────────────────────────────────────────────────
 *
 * 1. Cloudflare account (free) → Workers & Pages → Create Worker.
 *    Paste this file in, deploy, and note the URL it gives you.
 *
 * 2. Settings → Variables → add these as SECRETS, not plain text:
 *
 *      RESEND_KEY        from resend.com   — free tier covers 3,000 mails/month
 *      MESSAGEBIRD_KEY   from messagebird.com — SMS is paid, about €0.08 each
 *      DISPATCH_EMAIL    taxiservice.goaktaa@gmail.com
 *      FROM_EMAIL        bookings@taxiservicegoaktaa.nl
 *      SITE_ORIGIN       https://taxiservicegoaktaa.nl
 *
 *    Never paste these keys into the website, into chat, or into git.
 *
 * 3. In app.js set CONFIRM.endpoint to the Worker URL.
 *
 * Note on FROM_EMAIL: Resend needs the sending domain verified, which means
 * adding DNS records at TransIP. Until that is done use onboarding@resend.dev,
 * which works immediately but shows Resend's name to the customer.
 */

export default {
  async fetch(request, env) {
    const origin = env.SITE_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405, cors);
    }

    let b;
    try { b = await request.json(); }
    catch { return json({ error: 'bad json' }, 400, cors); }

    /* Only a bot fills this in. Answer as though it worked. */
    if (b.trap) return json({ ok: true, email: false, sms: false }, 200, cors);

    const ride = {
      ref: str(b.ref, 12),
      pickup: str(b.pickup, 120),
      dest: str(b.dest, 120),
      when: str(b.when, 60),
      pax: str(b.pax, 30),
      bags: str(b.bags, 30),
      flight: str(b.flight, 12),
      name: str(b.name, 60),
      phone: str(b.phone, 24),
      email: str(b.email, 120),
      notes: str(b.notes, 400),
      lang: ['en', 'nl', 'ar'].includes(b.lang) ? b.lang : 'en'
    };

    if (!ride.ref || !ride.phone || !ride.pickup || !ride.dest) {
      return json({ error: 'incomplete booking' }, 400, cors);
    }

    const t = COPY[ride.lang];
    const sent = { email: false, sms: false, dispatch: false };
    const failed = [];

    /* ── 1. confirmation email to the customer ── */
    if (ride.email && env.RESEND_KEY) {
      try {
        await send('https://api.resend.com/emails', env.RESEND_KEY, {
          from: `Taxi Service Go Aktaa <${env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
          to: [ride.email],
          subject: t.subject.replace('{ref}', ride.ref),
          html: emailHtml(ride, t)
        });
        sent.email = true;
      } catch (e) { failed.push('email: ' + e.message); }
    }

    /* ── 2. confirmation SMS to the customer ── */
    if (env.MESSAGEBIRD_KEY) {
      try {
        const body = t.sms
          .replace('{ref}', ride.ref)
          .replace('{when}', ride.when)
          .replace('{pickup}', ride.pickup);
        const res = await fetch('https://rest.messagebird.com/messages', {
          method: 'POST',
          headers: {
            'Authorization': 'AccessKey ' + env.MESSAGEBIRD_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            originator: 'GoAktaa',       /* max 11 characters */
            recipients: [ride.phone.replace(/[^\d+]/g, '')],
            body
          })
        });
        if (!res.ok) throw new Error('messagebird ' + res.status);
        sent.sms = true;
      } catch (e) { failed.push('sms: ' + e.message); }
    }

    /* ── 3. the booking itself, to the dispatcher ── */
    if (env.RESEND_KEY && env.DISPATCH_EMAIL) {
      try {
        await send('https://api.resend.com/emails', env.RESEND_KEY, {
          from: `Bookings <${env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
          to: [env.DISPATCH_EMAIL],
          reply_to: ride.email || undefined,
          subject: `Ride request ${ride.ref} — ${ride.when}`,
          html: dispatchHtml(ride)
        });
        sent.dispatch = true;
      } catch (e) { failed.push('dispatch: ' + e.message); }
    }

    return json({ ok: sent.dispatch || sent.sms || sent.email, ...sent, failed }, 200, cors);
  }
};

/* ── helpers ─────────────────────────────────────────────────────── */

function str(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

async function send(url, key, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('resend ' + res.status);
  return res.json();
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function row(label, value) {
  return value
    ? `<tr><td style="padding:6px 16px 6px 0;color:#55606D;font-size:13px">${esc(label)}</td><td style="padding:6px 0;font-size:14px"><strong>${esc(value)}</strong></td></tr>`
    : '';
}

function emailHtml(r, t) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#14181D">
  <div style="background:#153A8A;color:#fff;padding:20px 24px;border-radius:6px 6px 0 0">
    <div style="font-size:20px;font-weight:700">Taxi Service Go Aktaa</div>
    <div style="font-size:13px;opacity:.8">${esc(t.tagline)}</div>
  </div>
  <div style="border:1px solid #D6DEE7;border-top:0;padding:24px;border-radius:0 0 6px 6px">
    <p style="margin:0 0 16px">${esc(t.greeting.replace('{name}', r.name))}</p>
    <p style="margin:0 0 20px;color:#55606D">${esc(t.intro)}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      ${row(t.l.ref, r.ref)}${row(t.l.when, r.when)}${row(t.l.pickup, r.pickup)}
      ${row(t.l.dest, r.dest)}${row(t.l.pax, r.pax)}${row(t.l.flight, r.flight)}
    </table>
    <div style="background:#FFF6E5;border-left:3px solid #F5B02E;padding:12px 16px;margin-bottom:20px">
      <strong style="font-size:13px">${esc(t.l.fare)}</strong><br>
      <span style="font-size:13px;color:#55606D">${esc(t.fare)}</span>
    </div>
    <p style="margin:0;font-size:13px;color:#55606D">${esc(t.contact)}
      <a href="tel:+31613331111" style="color:#153A8A">+31 6 1333 1111</a></p>
  </div>
</div>`;
}

function dispatchHtml(r) {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif">
  <h2 style="margin:0 0 12px">Ride request ${esc(r.ref)}</h2>
  <table style="border-collapse:collapse">
    ${row('Pick-up', r.pickup)}${row('Destination', r.dest)}${row('When', r.when)}
    ${row('Passengers', r.pax)}${row('Suitcases', r.bags)}${row('Flight', r.flight)}
    ${row('Name', r.name)}${row('Mobile', r.phone)}${row('Email', r.email)}
    ${row('Notes', r.notes)}${row('Reply in', r.lang)}
  </table>
  <p style="color:#55606D;font-size:13px">Fare: on the taximeter — no price quoted.</p>
</div>`;
}

/* Customer-facing copy, in the language they booked in. */
const COPY = {
  en: {
    subject: 'Your taxi is booked — {ref}',
    tagline: 'Metered transfers, Amsterdam Schiphol',
    greeting: 'Hello {name},',
    intro: 'Your ride is with the dispatcher. We will come back to you with the driver’s name and licence plate before the pick-up time.',
    fare: 'On the taximeter, within the Dutch national maximum tariff. Nothing is charged in advance.',
    contact: 'Questions, or need to change something? Call or WhatsApp',
    sms: 'Go Aktaa: booking {ref} received. {when} from {pickup}. We confirm your driver before pick-up. Questions: +31613331111',
    l: { ref: 'Reference', when: 'When', pickup: 'Pick-up', dest: 'Destination', pax: 'Passengers', flight: 'Flight', fare: 'Fare' }
  },
  nl: {
    subject: 'Je taxi is geboekt — {ref}',
    tagline: 'Ritten op de meter, Amsterdam Schiphol',
    greeting: 'Hallo {name},',
    intro: 'Je rit staat bij de centrale. We laten je de naam en het kenteken van de chauffeur weten voor de ophaaltijd.',
    fare: 'Op de taxameter, binnen het Nederlandse maximumtarief. Vooraf wordt niets afgeschreven.',
    contact: 'Vragen of iets wijzigen? Bel of app',
    sms: 'Go Aktaa: boeking {ref} ontvangen. {when} vanaf {pickup}. We bevestigen je chauffeur voor vertrek. Vragen: +31613331111',
    l: { ref: 'Referentie', when: 'Wanneer', pickup: 'Ophalen', dest: 'Bestemming', pax: 'Passagiers', flight: 'Vlucht', fare: 'Tarief' }
  },
  ar: {
    subject: 'تم حجز التاكسي — {ref}',
    tagline: 'توصيل بالعدّاد، مطار أمستردام سخيبول',
    greeting: 'مرحباً {name}،',
    intro: 'طلبك وصل إلى غرفة التوزيع. سنوافيك باسم السائق ولوحة سيارته قبل موعد الانطلاق.',
    fare: 'على العدّاد، ضمن الحد الأقصى للتعريفة الهولندية. لا يُخصم أي مبلغ مسبقاً.',
    contact: 'لأي سؤال أو تعديل، اتصل أو راسل',
    sms: 'Go Aktaa: تم استلام الحجز {ref}. {when} من {pickup}. سنؤكد السائق قبل الموعد. للاستفسار: +31613331111',
    l: { ref: 'المرجع', when: 'الموعد', pickup: 'الانطلاق', dest: 'الوجهة', pax: 'المسافرون', flight: 'الرحلة', fare: 'الأجرة' }
  }
};
