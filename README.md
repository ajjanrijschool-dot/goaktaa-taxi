# Meterline — Schiphol taxi transfers

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

1. Sign up at [formspree.io](https://formspree.io) and create a form that
   delivers to `taxiservice.goaktaa@gmail.com`.
2. Copy its endpoint. It looks like `https://formspree.io/f/abcdwxyz`.
3. Open `app.js`, find the `MAIL` block at the top, and replace
   `https://formspree.io/f/YOUR-FORMSPREE-ID` with your endpoint.

That is the only place it appears — the `<form action>` is set from it on
load, so there is nothing to keep in sync.

Each booking arrives as one message, always in English regardless of the
visitor's language, with a `Reply in` line telling you which language to
answer in:

```
Subject: Ride request ML-33MC — 2026-08-19 14:30

Reference    ML-33MC          Passengers   2
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

1. Create a repository on github.com and push this folder to it:

   ```
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```

2. In the repository: **Settings → Pages**.
3. Under *Build and deployment*, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`. Save.
4. A minute later the site is live at
   `https://<you>.github.io/<repo>/`.

Every asset path in `index.html` is relative, so the site works both at a
repository subpath and at a domain root — no changes needed between them.

## 3. TransIP — the custom domain

Once the domain is registered, two things have to line up.

**On GitHub.** Settings → Pages → *Custom domain*: enter the domain and
save. GitHub commits a file named `CNAME` to the repository containing just
the domain, e.g.

```
meterline.nl
```

There is deliberately no `CNAME` file in this folder yet. Adding one for a
domain that does not resolve makes Pages report a domain error, so let
GitHub create it when you enter the real domain.

**On TransIP.** Control panel → your domain → **DNS**. TransIP ships default
records pointing at its own parking page — delete or overwrite the existing
`@` and `www` entries, then add:

| Type  | Name | TTL  | Value                  |
|-------|------|------|------------------------|
| A     | @    | 3600 | 185.199.108.153        |
| A     | @    | 3600 | 185.199.109.153        |
| A     | @    | 3600 | 185.199.110.153        |
| A     | @    | 3600 | 185.199.111.153        |
| CNAME | www  | 3600 | `<you>.github.io.`     |

All four A records are needed; they are GitHub's Pages edge addresses.
Confirm them against GitHub's *Managing a custom domain* documentation
before you save, since these addresses do change occasionally. IPv6 is
optional — add `AAAA` records for `2606:50c0:8000::153` through
`2606:50c0:8003::153` if you want it.

DNS takes anywhere from minutes to a few hours. When it resolves, return to
Settings → Pages and tick **Enforce HTTPS**; GitHub issues the certificate
itself.

## Not included: payments

Mollie is deliberately absent. Creating a Mollie payment requires a secret
API key, and on a static host there is nowhere to keep one — a key in
`app.js` is readable by every visitor and would be a leaked credential.

If you sell packages later, there are two safe routes:

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
