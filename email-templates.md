# Confirmation emails

The customer pays €20 and is left on SumUp's page — nothing on the site
reaches them afterwards. These are the replies that close that gap.

Send one as soon as you have checked the payment in SumUp. The booking
email tells you which language to write in: look for the **Reply in**
line at the bottom of it (`en`, `nl` or `ar`).

Everything in `[SQUARE BRACKETS]` is yours to fill in. The rest matches
what the website already promises, so nothing here can contradict it.

---

## English

**Subject:** Your taxi is confirmed — [REF]

```
Dear [NAME],

Your ride is confirmed and your €20 booking fee has been received.

  Reference    [REF]
  Pick-up      [PICKUP]
  Destination  [DESTINATION]
  Date & time  [DATE] at [TIME]

Your driver
  [DRIVER NAME], +31 6 1333 1111
  [CAR MAKE AND COLOUR], licence plate [PLATE]

Where we meet
  [ARRIVALS 1 / 2 / 3 / 4]. Your driver will be standing there with a
  card showing your name. We track your flight, so if you land early or
  late the pick-up moves with you. The first 30 minutes of waiting after
  landing are free.

What you pay in the car
  The ride runs on the taximeter, within the Dutch maximum tariff. You
  pay what it reads when we arrive — card, cash or company invoice. No
  surge pricing and nothing extra for night, luggage or the airport. The
  €20 booking fee is separate and is not deducted from the fare.

Changes
  Call or WhatsApp +31 6 1333 1111, day or night. Changing the time is
  free up to 2 hours before pick-up. The €20 is not refunded if you
  cancel.

See you at [DATE].

Taxi Service Go Aktaa
+31 6 1333 1111 · taxiservice.goaktaa@gmail.com
KIWA taxi permit · KvK 93594909
https://taxiservicegoaktaa.nl
```

---

## Nederlands

**Subject:** Je taxi staat vast — [REF]

```
Beste [NAAM],

Je rit staat vast en we hebben je boekingskost van €20 ontvangen.

  Referentie   [REF]
  Ophalen      [OPHAALADRES]
  Bestemming   [BESTEMMING]
  Datum & tijd [DATUM] om [TIJD]

Je chauffeur
  [NAAM CHAUFFEUR], +31 6 1333 1111
  [MERK EN KLEUR AUTO], kenteken [KENTEKEN]

Waar we elkaar treffen
  [Aankomst 1 / 2 / 3 / 4]. Je chauffeur staat daar met een bordje met
  je naam erop. We volgen je vlucht, dus land je eerder of later, dan
  schuift de ophaaltijd mee. De eerste 30 minuten wachten na de landing
  zijn gratis.

Wat je in de auto betaalt
  De rit gaat op de taxameter, binnen het landelijke maximumtarief. Je
  betaalt wat er bij aankomst op staat — pin, cash of op factuur. Geen
  piektarief en niets extra voor de nacht, de bagage of de luchthaven.
  De boekingskost van €20 staat daar los van en wordt er niet van
  afgetrokken.

Wijzigen
  Bel of app +31 6 1333 1111, dag en nacht. Het tijdstip wijzigen is
  kosteloos tot 2 uur voor de ophaaltijd. De €20 wordt bij annulering
  niet terugbetaald.

Tot [DATUM].

Taxi Service Go Aktaa
+31 6 1333 1111 · taxiservice.goaktaa@gmail.com
KIWA-taxivergunning · KvK 93594909
https://taxiservicegoaktaa.nl
```

---

## العربية

**Subject:** تم تثبيت رحلتك — [REF]

```
عزيزي [الاسم]،

تم تثبيت رحلتك ووصلتنا رسوم الحجز 20 يورو.

  المرجع        [REF]
  مكان الانطلاق [العنوان]
  الوجهة        [الوجهة]
  التاريخ والوقت [التاريخ] الساعة [الوقت]

سائقك
  [اسم السائق]، ‎+31 6 1333 1111
  [نوع السيارة ولونها]، لوحة رقم [اللوحة]

أين نلتقي
  [الوصول 1 / 2 / 3 / 4]. سيقف سائقك هناك حاملاً لوحة تحمل اسمك. نحن
  نتابع رحلتك، فإذا هبطت مبكراً أو متأخراً تحرّك موعد الاستقبال معك.
  وأول 30 دقيقة انتظار بعد الهبوط مجانية.

ما تدفعه في السيارة
  الرحلة على العدّاد، ضمن الحد الأقصى للتعريفة الهولندية. تدفع القراءة
  التي تظهر عند الوصول — ببطاقة أو نقداً أو على فاتورة شركة. بلا أسعار
  مضاعفة وبلا أي إضافة لليل أو الأمتعة أو المطار. أما رسوم الحجز 20
  يورو فمنفصلة ولا تُخصم من الأجرة.

التعديل
  اتصل أو راسلنا على واتساب ‎+31 6 1333 1111، ليلاً أو نهاراً. تعديل
  الموعد مجاني حتى ساعتين قبل الانطلاق. أما الـ20 يورو فلا تُسترد عند
  الإلغاء.

نراك في [التاريخ].

Taxi Service Go Aktaa
‎+31 6 1333 1111 · taxiservice.goaktaa@gmail.com
تصريح تاكسي KIWA · رقم غرفة التجارة 93594909
https://taxiservicegoaktaa.nl
```

---

## The Formspree autoresponse

This one is **not** the same as the templates above, and the difference
matters. Formspree sends it the instant the form is submitted — which is
*before* the customer reaches the payment page. So it cannot say the €20
arrived. Anyone who abandons checkout would otherwise be told their ride
was confirmed and their money taken, and neither would be true.

It says "request received, pay to hold it" instead, and carries the
payment link so the people who dropped out of checkout can finish. That
turns an honest limitation into the one email most likely to win a
booking back.

Set it on the form that receives the bookings — endpoint `mkjwqpkk` —
under **Workflow → Autoresponse**.

**From name:** `Taxi Service Go Aktaa`

**Subject:** `We have your booking request`

**Message:**

```
Thank you — your booking request has reached us.

YOUR RIDE IS HELD ONCE THE 20 EURO BOOKING FEE IS PAID
If you closed the payment page before finishing, you can still
pay here:

  https://pay.sumup.com/b2c/QVN7E8LC

WHAT HAPPENS NEXT
We come back to you with the driver's name, phone number and
licence plate before your pick-up time. Your driver waits at the
Arrivals exit you chose, holding a card with your name on it.
We track your flight, so landing early or late moves the pick-up
with you. The first 30 minutes of waiting are free.

THE FARE
The ride runs on the taximeter, within the Dutch maximum tariff.
You pay what it reads at the door - card, cash or company invoice.
No surge pricing, nothing extra for night, luggage or the airport.
The 20 euro booking fee is separate and is not deducted from it.

CHANGES
Call or WhatsApp +31 6 1333 1111, day or night. Changing the time
is free up to 2 hours before pick-up. The 20 euro is not refunded
if you cancel.

Taxi Service Go Aktaa
+31 6 1333 1111 - taxiservice.goaktaa@gmail.com
KIWA taxi permit - KvK 93594909
https://taxiservicegoaktaa.nl

--------------------------------------------------

Bedankt — je aanvraag is bij ons binnen.

JE RIT STAAT VAST ZODRA DE BOEKINGSKOST VAN 20 EURO BETAALD IS
Heb je de betaalpagina gesloten voordat je klaar was? Dan kun je
hier alsnog betalen:

  https://pay.sumup.com/b2c/QVN7E8LC

HOE NU VERDER
We laten je de naam, het telefoonnummer en het kenteken van de
chauffeur weten voor je ophaaltijd. Je chauffeur staat bij de
aankomsthal die je hebt gekozen, met een bordje met je naam erop.
We volgen je vlucht, dus eerder of later landen schuift de
ophaaltijd mee. De eerste 30 minuten wachten zijn gratis.

HET RITBEDRAG
De rit gaat op de taxameter, binnen het landelijke maximumtarief.
Je betaalt wat er bij de deur op staat - pin, cash of op factuur.
Geen piektarief, en niets extra voor de nacht, de bagage of de
luchthaven. De boekingskost van 20 euro staat daar los van.

WIJZIGEN
Bel of app +31 6 1333 1111, dag en nacht. Het tijdstip wijzigen is
kosteloos tot 2 uur voor de ophaaltijd. De 20 euro wordt bij
annulering niet terugbetaald.

--------------------------------------------------

شكراً لك — وصلنا طلب الحجز الخاص بك.

تُحجز رحلتك بمجرد دفع رسوم الحجز 20 يورو. وإذا أغلقت صفحة الدفع
قبل إتمامها، يمكنك الدفع من هنا:

  https://pay.sumup.com/b2c/QVN7E8LC

سنوافيك باسم السائق ورقم هاتفه ولوحة سيارته قبل موعد انطلاقك.
ينتظرك السائق عند مخرج الوصول الذي اخترته حاملاً لوحة تحمل اسمك،
ونتابع رحلتك فيتحرك موعد الاستقبال معك إن هبطت مبكراً أو متأخراً.
وأول 30 دقيقة انتظار مجانية.

الرحلة على العدّاد ضمن الحد الأقصى للتعريفة الهولندية، وتدفع
القراءة عند الوصول ببطاقة أو نقداً أو على فاتورة. ورسوم الحجز
منفصلة ولا تُخصم من الأجرة.

للتعديل اتصل أو راسلنا على واتساب ‎+31 6 1333 1111، ليلاً أو
نهاراً. تعديل الموعد مجاني حتى ساعتين قبل الانطلاق، أما الـ20
يورو فلا تُسترد عند الإلغاء.
```

**Once this is live**, the manual templates above are still worth
sending — but only as the *second* email, after you have seen the
payment in SumUp. That one confirms the ride and carries the driver
name and plate. The autoresponse only acknowledges the request.

**If the payment link ever changes**, it changes in two places: `FEE.payUrl`
in `app.js`, and this autoresponse.

---

## Saving these in Gmail

1. Gmail → gear icon → **See all settings** → **Advanced** → set
   **Templates** to *Enable* → **Save Changes**.
2. **Compose**, paste one of the texts above, leave the subject line in
   place.
3. In the compose window, click the **⋮** at the bottom right →
   **Templates** → **Save draft as template** → **Save as new template**.
   Name it `Bevestiging NL`, `Confirmation EN`, `Confirmation AR`.
4. Repeat for the other two.

To use one: **Compose** → **⋮** → **Templates** → pick it → fill in the
brackets → send.

## If you ever want this automatic

Formspree sends it for you on the Professional plan, $20/month. The
booking form already posts the customer's address under a lowercase
`email` key, which is what their autoresponder keys off, so switching it
on needs no change to the site.
