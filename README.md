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

The form runs in **demo mode** until the Formspree endpoint is set: it
validates, prints the slip, and sends nothing. Each demo submission logs a
console warning naming the reference that was not sent, so this state is
never silent.

## 1. Formspree — the booking mail

1. Create a form at [formspree.io](https://formspree.io) — the *Send emails
   to* dropdown only offers verified addresses, so add the destination under
   **Account → Linked Emails** and click the confirmation mail first.
2. Copy the form's endpoint. It looks like `https://formspree.io/f/abcdwxyz`.
3. Open `app.js`, find the `MAIL` block at the top, and replace
   `https://formspree.io/f/mkjwqpkk` with your endpoint.

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
