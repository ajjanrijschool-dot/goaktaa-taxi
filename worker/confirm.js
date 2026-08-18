/* Taxi Service Go Aktaa — booking confirmation worker.
 *
 * Why this exists: GitHub Pages serves files and nothing else. Sending an
 * email or an SMS needs an API key, and any key put in the website itself
 * is readable by every visitor. This runs on Cloudflare Workers instead,
 * where the keys stay server-side.
 *
 * What it does, in order:
 *   1. texts the customer a confirmation    (Twilio — we always have a mobile)
 *   2. emails the customer a confirmation   (if they gave an address)
 *   3. emails the booking to the dispatcher
 *
 * A failure in any one step does not fail the others, and the site is told
 * what actually went out, so it never claims something that did not happen.
 *
 * ── Setup ─────────────────────────────────────────────────────────────
 *
 * 1. Cloudflare account (free) → Workers & Pages → Create Worker.
 *    Paste this file in, deploy, note the URL it gives you.
 *
 * 2. Settings → Variables → add these as SECRETS, not plain text:
 *
 *      TWILIO_SID      your Account SID, starts AC… (always needed — it is
 *                      part of the URL, not the password)
 *
 *    then EITHER an API key, which can be revoked on its own — preferred:
 *      TWILIO_KEY      the API key SID, starts SK…
 *      TWILIO_SECRET   the secret Twilio shows once when the key is made
 *
 *    OR the account password, simpler but far broader:
 *      TWILIO_TOKEN    your Auth Token
 *      TWILIO_FROM     who the text comes from. Either:
 *                        GoAktaa   — an alphanumeric sender ID: free, no
 *                                    number to buy, max 11 characters, and
 *                                    one-way (the customer cannot reply).
 *                                    Needs the account upgraded off trial.
 *                        +3197…    — a Twilio number you bought, ~EUR 1/month,
 *                                    replies land in the Twilio console.
 *
 *      TWILIO_NUMBER   optional, and only worth setting if TWILIO_FROM is an
 *                      alphanumeric ID. The US and Canada do not carry those,
 *                      so +1 customers are sent from this number instead.
 *                      Without it, a +1 booking gets no SMS — the booking
 *                      still reaches dispatch, and the site says so.
 *      DISPATCH_EMAIL  taxiservice.goaktaa@gmail.com
 *      FROM_EMAIL      bookings@taxiservicegoaktaa.nl
 *      SITE_ORIGIN     https://taxiservicegoaktaa.nl
 *
 *    And ONE of these for email:
 *      SENDGRID_KEY    Twilio's own email service, 3,000/month free
 *      RESEND_KEY      resend.com, also free at this volume
 *
 * 3. In app.js set CONFIRM.endpoint to the Worker URL.
 *
 * ── Twilio trial accounts ─────────────────────────────────────────────
 * On the free trial Twilio will ONLY text numbers you have verified in the
 * console, and it prefixes every message with "Sent from your Twilio trial
 * account". Real customers cannot be reached until the account is upgraded.
 * Fine for testing; upgrade before you rely on it.
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
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, cors);

    let b;
    try { b = await request.json(); }
    catch { return json({ error: 'bad json' }, 400, cors); }

    /* Only a bot fills this in. Answer as though it worked. */
    if (b.trap) return json({ ok: true, sms: false, email: false }, 200, cors);

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

    const t = COPY;
    const sent = { sms: false, email: false, dispatch: false };
    const failed = [];

    /* ── 1. SMS to the customer, via Twilio ──
       Twilio speaks form-encoded, not JSON, and authenticates with
       HTTP Basic using the SID as user and the token as password. */
    /* Authenticate with an API key when one is set — it can be revoked on
       its own without changing the account password. Falls back to the
       Account SID and Auth Token when no key is configured. */
    const twUser = env.TWILIO_KEY || env.TWILIO_SID;
    const twPass = env.TWILIO_SECRET || env.TWILIO_TOKEN;

    if (env.TWILIO_SID && twUser && twPass && env.TWILIO_FROM) {
      try {
        const body = t.sms
          .replace('{ref}', ride.ref)
          .replace('{when}', ride.when)
          .replace('{pickup}', ride.pickup);

        const to = ride.phone.replace(/[^\d+]/g, '');

        /* Alphanumeric sender IDs — "GoAktaa" instead of a number — are free
           and look like us, but the US and Canada do not carry them, and a
           good share of Schiphol passengers hold a +1 number. Where a real
           Twilio number is configured, use it for those. */
        const noAlpha = /^\+1/.test(to);
        const from = (noAlpha && env.TWILIO_NUMBER) ? env.TWILIO_NUMBER : env.TWILIO_FROM;

        if (noAlpha && !env.TWILIO_NUMBER && !/^\+/.test(from)) {
          throw new Error('+1 number needs TWILIO_NUMBER: alphanumeric senders are not carried in the US or Canada');
        }

        const form = new URLSearchParams({ To: to, From: from, Body: body });

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_SID}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(twUser + ':' + twPass),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: form
          }
        );
        if (!res.ok) {
          const detail = await res.text();
          throw new Error('twilio ' + res.status + ' ' + detail.slice(0, 180));
        }
        sent.sms = true;
      } catch (e) { failed.push('sms: ' + e.message); }
    }

    /* ── 2. confirmation email to the customer ── */
    if (ride.email) {
      try {
        await sendMail(env, {
          to: ride.email,
          subject: t.subject.replace('{ref}', ride.ref),
          html: customerHtml(ride, t)
        });
        sent.email = true;
      } catch (e) { failed.push('email: ' + e.message); }
    }

    /* ── 3. the booking itself, to dispatch ── */
    if (env.DISPATCH_EMAIL) {
      try {
        await sendMail(env, {
          to: env.DISPATCH_EMAIL,
          subject: `Ride request ${ride.ref} — ${ride.when}`,
          html: dispatchHtml(ride),
          replyTo: ride.email || undefined
        });
        sent.dispatch = true;
      } catch (e) { failed.push('dispatch: ' + e.message); }
    }

    return json({ ok: sent.sms || sent.dispatch || sent.email, ...sent, failed }, 200, cors);
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

/* Whichever email service has a key set. SendGrid comes with Twilio,
   Resend is a separate signup — either is fine, neither is required. */
async function sendMail(env, m) {
  const from = env.FROM_EMAIL || 'onboarding@resend.dev';

  if (env.SENDGRID_KEY) {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.SENDGRID_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: m.to }] }],
        from: { email: from, name: 'Taxi Service Go Aktaa' },
        reply_to: m.replyTo ? { email: m.replyTo } : undefined,
        subject: m.subject,
        content: [{ type: 'text/html', value: m.html }]
      })
    });
    if (!res.ok) throw new Error('sendgrid ' + res.status + ' ' + (await res.text()).slice(0, 160));
    return;
  }

  if (env.RESEND_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Taxi Service Go Aktaa <${from}>`,
        to: [m.to],
        reply_to: m.replyTo,
        subject: m.subject,
        html: m.html
      })
    });
    if (!res.ok) throw new Error('resend ' + res.status + ' ' + (await res.text()).slice(0, 160));
    return;
  }

  throw new Error('no email key configured');
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function row(label, value) {
  return value
    ? `<tr><td style="padding:6px 16px 6px 0;color:#55606D;font-size:13px">${esc(label)}</td><td style="padding:6px 0;font-size:14px"><strong>${esc(value)}</strong></td></tr>`
    : '';
}

function customerHtml(r, t) {
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

/* Confirmations go out in English only. The customer's language is
   still passed through and shown to dispatch as 'Reply in', so whoever
   answers knows which language to use when they call back. */
const COPY = {
  subject: 'Your taxi is booked — {ref}',
  tagline: 'Metered transfers, Amsterdam Schiphol',
  greeting: 'Hello {name},',
  intro: 'Your ride is with the dispatcher. We will come back to you with the driver name and licence plate before the pick-up time.',
  fare: 'On the taximeter, within the Dutch national maximum tariff. Nothing is charged in advance.',
  contact: 'Questions, or need to change something? Call or WhatsApp',
  sms: 'Go Aktaa: booking {ref} received, {when}. We confirm your driver before pick-up. Questions: +31613331111',
  l: { ref: 'Reference', when: 'When', pickup: 'Pick-up', dest: 'Destination', pax: 'Passengers', flight: 'Flight', fare: 'Fare' }
};
