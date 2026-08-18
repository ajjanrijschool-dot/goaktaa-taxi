# Taxi Service Go Aktaa — Schiphol transfers

Static site: hand-written HTML, CSS and JavaScript, no build step and no
framework. Three languages (English, Dutch, Arabic) with full right-to-left
support, and a booking form that never quotes a price — the fare comes off
the taximeter.

```
index.html    markup, all three languages keyed with data-i18n
styles.css    tokens, layout, the RTL and Arabic overrides
i18n.js       the three dictionaries and the language switch
app.js        form validation, sending, the confirmation slip
.nojekyll     tells GitHub Pages to serve the files as they are
```

## Preview it locally

Open `index.html` in a browser. Everything works offline except the web
fonts, which fall back to system faces.

The form is live: it posts to Formspree and mail arrives at the address set
on that form. If the endpoint is ever cleared the form falls back to demo
mode, printing the slip and sending nothing, and says so in the console —
so that state is never silent.

## 1. Formspree — the booking mail

1. Create a form at [formspree.io](https://formspree.io) — the *Send emails
   to* dropdown only offers verified addresses, so add the destination under
   **Account → Linked Emails** and click the confirmation mail first.
2. Copy the form's endpoint. It looks like `https://formspree.io/f/abcdwxyz`.
The endpoint in use is set in the `MAIL` block at the top of `app.js`. To
   change inbox, change it in Formspree — the endpoint stays the same.

That is the only place it appears — the `<form action>` is set from it on
load, so there is nothing to keep in sync. Changing which inbox receives the
mail is a Formspree setting; it does not change the endpoint or the code.

Each booking arrives as one message, always in English regardless of the
visitor's language, with a `Reply in` line telling you which language to
answer in:

```
Subject: Ride request GA-33MC — 2026-08-19 14:30

Reference    GA-33MC          Passengers   2
Direction    from             Suitcases    2
Pick-up      Schiphol Plaza, Arrivals 4
Destination  Prinsengracht 263, Amsterdam
Date         2026-08-19       Flight       KL1234
Time         14:30 (Amsterdam)
Name         Fadel Ahmad      Mobile       +31 6 1234 5678
Notes        Child seat
Fare         On the taximeter — no price quoted
Reply in     Arabic
```

Spam is filtered twice: a hidden `_gotcha` field that Formspree drops
server-side, and a check in `app.js` that abandons the submission before it
is sent. Formspree's free tier caps submissions per month — check their
pricing page for the current number.

If a send fails, the form keeps everything the visitor typed and shows the
phone number and mail address as fallbacks. It never shows the confirmation
slip for a request that did not arrive.

## 2. GitHub Pages — the hosting

The repository is <https://github.com/ajjanrijschool-dot/goaktaa-taxi>, and
`main` is what Pages serves. To publish a change:

```
git add -A
git commit -m "what changed"
git push
```

Pages rebuilds within a minute or so. Settings for it live under
**Settings → Pages**: source is `Deploy from a branch`, branch `main`,
folder `/ (root)`.

Without the custom domain the site answers at
`https://ajjanrijschool-dot.github.io/goaktaa-taxi/`. Every asset path in
`index.html` is relative, so it works identically there and at the domain
root — nothing to change between them.

## 3. The domain — taxiservicegoaktaa.nl

Registered at TransIP, which is also the DNS operator. The site lives on the
**bare domain**, with `www` redirecting to it.

### DNS, as configured at TransIP

Control panel → `taxiservicegoaktaa.nl` → **DNS**:

| Type  | Name | TTL   | Value                        |
|-------|------|-------|------------------------------|
| A     | @    | 1 Uur | 185.199.108.153              |
| A     | @    | 1 Uur | 185.199.109.153              |
| A     | @    | 1 Uur | 185.199.110.153              |
| A     | @    | 1 Uur | 185.199.111.153              |
| CNAME | www  | 1 Uur | `ajjanrijschool-dot.github.io.` |
| TXT   | @    | 1 Uur | `v=spf1 ~all`                |
| TXT   | _dmarc | 1 Uur | `v=DMARC1; p=none;`        |

All four A records are GitHub's Pages edge addresses; four of them is how the
redundancy works. Records with the same name and type must share one TTL —
TransIP refuses the save otherwise.

Deleted from TransIP's defaults, and worth keeping deleted:

- The `AAAA` record pointing at TransIP's parking address. A stale AAAA is
  the classic half-broken setup: IPv6 visitors reach the old host while
  everyone else sees the real site. To add IPv6 properly, use GitHub's
  `2606:50c0:8000::153` through `2606:50c0:8003::153`.
- The `MX` record, which pointed mail at `@`. With `@` on GitHub, mail sent
  to this domain would reach web servers that do not handle mail. There is no
  mail on the domain: Formspree delivers booking requests to Gmail. Before
  ever using an address at this domain, point `MX` at a real mail provider.

DNSSEC stays enabled — safe, because TransIP remains the DNS operator. It
would need attention only if the nameservers moved elsewhere.

### GitHub's side

Repository → **Settings → Pages → Custom domain**: `taxiservicegoaktaa.nl`,
no `www`. GitHub verifies DNS and commits a `CNAME` file containing just the
domain, then redirects `www` to it automatically. Once it resolves, tick
**Enforce HTTPS** — GitHub issues and renews the certificate free.

Do not hand-write the `CNAME` file. Letting GitHub create it keeps the file
and the Pages setting from disagreeing.

## City photos

The three service cards ship with drawn skylines. To use photographs
instead, put these files next to `index.html`:

```
amsterdam.jpg
rotterdam.jpg
denhaag.jpg
```

That is the whole job — no code changes. Each card checks for its photo
and swaps it in; any card without one keeps its drawing, so you can add
them one at a time and the page is never half-broken.

Roughly 4:3, at least 800px wide, and keep them under about 300KB each so
the page stays quick. Other formats work if you rename them to `.jpg`, or
tell me and I'll widen it.

**Use photos you are allowed to use.** Images found through a search
engine are usually licensed stock, and agencies do bill businesses that
publish them — the invoice would come to this company. Safe sources:

- Photographs you or a driver took. A real car at a real address beats any
  stock skyline for trust, and costs nothing.
- [Unsplash](https://unsplash.com) and [Pexels](https://pexels.com) —
  free for commercial use, no attribution required.
- Wikimedia Commons — free, but most images require crediting the
  photographer, so read each one's licence.

## Parked: automatic confirmations to the customer

Written, tested, and deliberately switched off — it needs paid accounts.

**Where it stands.** `twilio-function/confirm.js` is a complete Twilio
Function that texts the customer, emails them, and forwards the booking to
dispatch. It is not deployed. `CONFIRM.endpoint` in `app.js` is empty, so
bookings go to Formspree exactly as before and the customer receives nothing
automatic. The wording on the site matches that: it promises only that we
come back to them before the pick-up time, and never mentions a text, an
email, or a number of minutes.

**Do not put a firmer promise back on the page until this is live.**

**What switching it on costs.**

| | |
|---|---|
| Twilio account, upgraded off trial | from about EUR 20 credit |
| SMS | about EUR 0.08 each |
| SendGrid email | free to 3,000 a month, included with Twilio |
| Twilio phone number | not needed — see below |
| Hosting the function | free, inside Twilio |

So roughly EUR 8 a month at 100 bookings, plus the initial credit.

**To switch it on.**

1. Twilio → Functions and Assets → Services → Create Service, name it `goaktaa`
2. Add Function at `/confirm`, paste `twilio-function/confirm.js`, Deploy All
3. Environment variables: `TWILIO_FROM=GoAktaa`,
   `DISPATCH_EMAIL=taxiservice.goaktaa@gmail.com`,
   `SITE_ORIGIN=https://taxiservicegoaktaa.nl`, and `SENDGRID_KEY` for email
4. Set the function's visibility to Public
5. Put its URL in `CONFIRM.endpoint` in `app.js`

The Function needs no Twilio credentials at all — running inside the account,
`context.getTwilioClient()` is already authenticated. There is nothing to
copy and nothing to leak.

**Two facts that will otherwise waste an afternoon.**

Sender `GoAktaa` is an alphanumeric sender ID: free, no number to buy, 11
characters, and one-way. It does **not** work on a trial account, and the US
and Canada do not carry it at all. A `+1` customer gets no SMS unless
`TWILIO_NUMBER` is set to a real Twilio number; the Function refuses that
send with a clear reason rather than failing quietly.

On a trial account Twilio only texts numbers verified in the console and
stamps "Sent from your Twilio trial account" on every message.

## The €20 booking fee

Every booking pays €20 online before the ride is held. The metered fare is
separate and still settled in the car. The €20 is **not refunded** if the
customer cancels — that is said on the booking form, in the terms, and on
the button itself before anyone pays.

### Switching it on

The site needs one thing: a payment link for a fixed €20. Because the amount
never changes, no API key and no server are involved.

1. In Stripe (or Mollie), create a **payment link** for €20 EUR.
2. Set its success URL to `https://taxiservicegoaktaa.nl/?paid=1`.
3. Put the link in `app.js`:

   ```js
   var FEE = { amount: 20, currency: 'EUR', payUrl: 'https://buy.stripe.com/xxxx' };
   ```

4. Commit and push.

### What happens then

`Continue to payment` sends the booking to Formspree first, so the request is
safely in the inbox even if the customer abandons the payment. Then it hands
them to the payment page with `?client_reference_id=GA-XXXX`, so the payment
arrives labelled with the ride it belongs to, and their email prefilled.
After paying they come back to `/?paid=1` and see the confirmation.

**While `payUrl` is empty** the site does not promise a payment screen: the
button reads *Request this ride* again and the booking ends on the paper
slip, exactly as before. Nothing half-built is shown to a customer.

### Before you charge anyone

Check the fee against your KIWA permit and the Dutch maximum-tariff rules
(`maximumtarief`). A charge on top of a metered fare can breach permit
conditions. Worth one call to your permit contact.

## Not included: payments

Mollie is deliberately absent — there is nothing to sell yet, and a static
host has nowhere to keep a secret API key. A Mollie key in `app.js` would be
readable by every visitor, i.e. a leaked credential.

If you sell packages later, two safe routes:

- **Mollie payment links.** One link per package, made in the Mollie
  dashboard; the buttons on the site open them. No key in the code.
- **A serverless function** on a second host (Cloudflare Workers, Vercel)
  that holds the key and creates payments with real order details.

## The one thing not to translate

The taximeter face is Dutch hardware and stays Dutch in every language:
`TAXAMETER`, `VRIJ`, `Tarief`, `Afstand`, `Tijd`, and the tariff row reading
`1 · dag` or `2 · nacht`. Terminal signage inside the illustrations
(`TAXI`, `ARRIVALS 4`) stays as it is on the actual signs, and addresses stay
in Latin script in all three languages because a Dutch driver has to read
them.

The wordmark is also never translated: **Go Aktaa** keeps its Latin letters
and its Archivo face in Arabic, the way a wordmark should.
