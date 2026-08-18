/* Taxi Service Go Aktaa — booking confirmation, as a Twilio Function.
 *
 * Why this exists: GitHub Pages serves files and nothing else. Sending an
 * SMS or an email needs credentials, and anything put in the website itself
 * is readable by every visitor. This runs inside your Twilio account, where
 * the credentials never leave.
 *
 * The nice part: it does NOT need your Account SID, Auth Token or API key.
 * Running inside Twilio, context.getTwilioClient() is already authenticated.
 * There is no Twilio credential to copy anywhere, so none to leak.
 *
 * What it does, in order:
 *   1. texts the customer a confirmation
 *   2. emails the customer a confirmation   (if they gave an address)
 *   3. emails the booking to dispatch
 *
 * A failure in one step does not stop the others, and the site is told what
 * actually went out, so it never claims something that did not happen.
 *
 * ── Setup ─────────────────────────────────────────────────────────────
 *
 * 1. Twilio Console → Builder tools → Functions and Assets → Services
 *    → Create Service → name it "goaktaa".
 *
 * 2. Add Function → path /confirm → paste this file → Save → Deploy All.
 *
 * 3. In the same service, Settings → Environment Variables:
 *
 *      TWILIO_FROM     who the text comes from. Either:
 *                        GoAktaa   an alphanumeric sender ID: free, no number
 *                                  to buy, 11 characters max, one-way (the
 *                                  customer cannot reply). Needs the account
 *                                  upgraded off trial.
 *                        +3197…    a Twilio number you bought, ~EUR 1/month.
 *
 *      TWILIO_NUMBER   optional. Only useful when TWILIO_FROM is alphanumeric:
 *                      the US and Canada do not carry those, so +1 customers
 *                      are sent from this number instead. Without it a +1
 *                      booking gets no SMS — the booking still reaches you.
 *
 *      DISPATCH_EMAIL  taxiservice.goaktaa@gmail.com
 *      SENDGRID_KEY    optional, for email. Twilio owns SendGrid: 3,000 a
 *                      month free. Leave it out and SMS still works.
 *      FROM_EMAIL      bookings@taxiservicegoaktaa.nl  (needs SendGrid sender
 *                      verification; until then use a verified address)
 *      SITE_ORIGIN     https://taxiservicegoaktaa.nl
 *
 * 4. Under the function's ⋯ menu set visibility to PUBLIC — the website has
 *    to be able to call it. It is guarded by a honeypot field and by
 *    validating every booking before anything is sent.
 *
 * 5. Copy the function URL (like
 *    https://goaktaa-1234.twil.io/confirm) and put it in app.js as
 *    CONFIRM.endpoint.
 *
 * ── Trial accounts ───────────────────────────────────────────────────
 * On the free trial Twilio only texts numbers you have verified in the
 * console, stamps "Sent from your Twilio trial account" on each message,
 * and will not carry alphanumeric sender IDs at all. Fine for testing on
 * your own phone; upgrade before customers rely on it.
 */

exports.handler = async function (context, event, callback) {
  const res = new Twilio.Response();
  res.appendHeader('Access-Control-Allow-Origin', context.SITE_ORIGIN || '*');
  res.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.appendHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.appendHeader('Content-Type', 'application/json');

  /* Only a bot fills the honeypot. Answer as though it worked. */
  if (event.trap) {
    res.setBody({ ok: true, sms: false, email: false });
    return callback(null, res);
  }

  const ride = {
    ref: str(event.ref, 12),
    pickup: str(event.pickup, 120),
    dest: str(event.dest, 120),
    when: str(event.when, 60),
    pax: str(event.pax, 30),
    bags: str(event.bags, 30),
    flight: str(event.flight, 12),
    name: str(event.name, 60),
    phone: str(event.phone, 24),
    email: str(event.email, 120),
    notes: str(event.notes, 400),
    lang: ['en', 'nl', 'ar'].includes(event.lang) ? event.lang : 'en'
  };

  if (!ride.ref || !ride.phone || !ride.pickup || !ride.dest) {
    res.setStatusCode(400);
    res.setBody({ error: 'incomplete booking' });
    return callback(null, res);
  }

  const sent = { sms: false, email: false, dispatch: false };
  const failed = [];

  /* ── 1. SMS to the customer ── */
  try {
    const to = ride.phone.replace(/[^\d+]/g, '');

    /* Alphanumeric sender IDs are free and look like us, but the US and
       Canada do not carry them, and plenty of Schiphol passengers hold a
       +1 number. Use a real number for those when one is configured. */
    const noAlpha = /^\+1/.test(to);
    const from = (noAlpha && context.TWILIO_NUMBER) ? context.TWILIO_NUMBER : context.TWILIO_FROM;

    if (!from) throw new Error('TWILIO_FROM is not set');
    if (noAlpha && !/^\+/.test(from)) {
      throw new Error('a +1 number needs TWILIO_NUMBER: alphanumeric senders are not carried in the US or Canada');
    }

    const body = COPY.sms
      .replace('{ref}', ride.ref)
      .replace('{when}', ride.when);

    await context.getTwilioClient().messages.create({ to, from, body });
    sent.sms = true;
  } catch (e) { failed.push('sms: ' + e.message); }

  /* ── 2. confirmation email to the customer ── */
  if (ride.email && context.SENDGRID_KEY) {
    try {
      await sendMail(context, {
        to: ride.email,
        subject: COPY.subject.replace('{ref}', ride.ref),
        html: customerHtml(ride)
      });
      sent.email = true;
    } catch (e) { failed.push('email: ' + e.message); }
  }

  /* ── 3. the booking itself, to dispatch ── */
  if (context.DISPATCH_EMAIL && context.SENDGRID_KEY) {
    try {
      await sendMail(context, {
        to: context.DISPATCH_EMAIL,
        subject: 'Ride request ' + ride.ref + ' — ' + ride.when,
        html: dispatchHtml(ride),
        replyTo: ride.email || undefined
      });
      sent.dispatch = true;
    } catch (e) { failed.push('dispatch: ' + e.message); }
  }

  res.setBody(Object.assign({ ok: sent.sms || sent.email || sent.dispatch }, sent, { failed }));
  return callback(null, res);
};

/* ── helpers ─────────────────────────────────────────────────────── */

function str(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

async function sendMail(context, m) {
  const from = context.FROM_EMAIL || context.DISPATCH_EMAIL;
  const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + context.SENDGRID_KEY,
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
  if (!r.ok) throw new Error('sendgrid ' + r.status + ' ' + (await r.text()).slice(0, 160));
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function row(label, value) {
  if (!value) return '';
  return '<tr><td style="padding:6px 16px 6px 0;color:#55606D;font-size:13px">' + esc(label) +
    '</td><td style="padding:6px 0;font-size:14px"><strong>' + esc(value) + '</strong></td></tr>';
}

function customerHtml(r) {
  const t = COPY;
  return '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#14181D">' +
    '<div style="background:#153A8A;color:#fff;padding:20px 24px;border-radius:6px 6px 0 0">' +
      '<div style="font-size:20px;font-weight:700">Taxi Service Go Aktaa</div>' +
      '<div style="font-size:13px;opacity:.8">' + esc(t.tagline) + '</div></div>' +
    '<div style="border:1px solid #D6DEE7;border-top:0;padding:24px;border-radius:0 0 6px 6px">' +
      '<p style="margin:0 0 16px">' + esc(t.greeting.replace('{name}', r.name)) + '</p>' +
      '<p style="margin:0 0 20px;color:#55606D">' + esc(t.intro) + '</p>' +
      '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
        row('Reference', r.ref) + row('When', r.when) + row('Pick-up', r.pickup) +
        row('Destination', r.dest) + row('Passengers', r.pax) + row('Flight', r.flight) +
      '</table>' +
      '<div style="background:#FFF6E5;border-left:3px solid #F5B02E;padding:12px 16px;margin-bottom:20px">' +
        '<strong style="font-size:13px">Fare</strong><br>' +
        '<span style="font-size:13px;color:#55606D">' + esc(t.fare) + '</span></div>' +
      '<p style="margin:0;font-size:13px;color:#55606D">' + esc(t.contact) +
        ' <a href="tel:+31613331111" style="color:#153A8A">+31 6 1333 1111</a></p>' +
    '</div></div>';
}

function dispatchHtml(r) {
  return '<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif">' +
    '<h2 style="margin:0 0 12px">Ride request ' + esc(r.ref) + '</h2>' +
    '<table style="border-collapse:collapse">' +
      row('Pick-up', r.pickup) + row('Destination', r.dest) + row('When', r.when) +
      row('Passengers', r.pax) + row('Suitcases', r.bags) + row('Flight', r.flight) +
      row('Name', r.name) + row('Mobile', r.phone) + row('Email', r.email) +
      row('Notes', r.notes) + row('Reply in', r.lang) +
    '</table>' +
    '<p style="color:#55606D;font-size:13px">Fare: on the taximeter — no price quoted.</p></div>';
}

/* Confirmations go out in English. The customer's language still travels
   with the booking and is shown to dispatch as "Reply in", so whoever
   calls back knows which language to use.
   SMS is billed per 160 characters, so this stays inside one segment. */
const COPY = {
  subject: 'Your taxi is booked — {ref}',
  tagline: 'Metered transfers, Amsterdam Schiphol',
  greeting: 'Hello {name},',
  intro: 'Your ride is with the dispatcher. We will come back to you with the driver name and licence plate before the pick-up time.',
  fare: 'On the taximeter, within the Dutch national maximum tariff. Nothing is charged in advance.',
  contact: 'Questions, or need to change something? Call or WhatsApp',
  sms: 'Go Aktaa: booking {ref} received, {when}. We confirm your driver before pick-up. Questions: +31613331111'
};
