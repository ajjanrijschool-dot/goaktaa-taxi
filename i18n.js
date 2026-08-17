/* Taxi Service Go Aktaa — language switch for English, Dutch and Arabic.
   The taximeter face is deliberately never translated: it is a Dutch
   instrument, and reads VRIJ / Tarief / Afstand / Tijd in every language. */

window.I18N = (function () {
  'use strict';

  var DICT = {

    /* ── English ─────────────────────────────────────────── */
    en: {
      'meta.title': 'Taxi Service Go Aktaa — Metered taxis at Amsterdam Schiphol',
      'meta.desc': 'Licensed metered taxis to and from Amsterdam Schiphol. Book a car, meet your driver at Arrivals 4, pay what the taximeter reads.',
      'skip': 'Skip to booking',
      'brand.sub': 'Schiphol transfers',
      'lang.label': 'Language',
      'nav.fare': 'The fare',
      'nav.meet': 'Meeting point',
      'nav.cta': 'Book a taxi',
      'cta.book': 'Book a taxi',
      'cta.call': 'Call +31 20 123 4567',
      'dock.call': 'Call',

      'hero.eyebrow': 'Amsterdam Schiphol · 24 hours',
      'hero.h1': 'A licensed taxi, already parked when you land.',
      'hero.lede': 'We drive to and from Schiphol on the meter. Your driver tracks your flight, waits at Arrivals 4, and the taximeter decides the fare — not a pop-up quote.',
      'meter.caption': 'The meter runs from pickup to drop-off. Until it starts there is no fare to show — this is what you watch instead of a checkout page.',
      'trust.label': 'Credentials',
      'trust.1': 'TX-keur certified drivers',
      'trust.2': 'KIWA taxi permit',
      'trust.3': 'Flight number tracked',
      'trust.4': 'Card, cash or invoice',

      'form.h2': 'Book a taxi',
      'form.sub': 'Takes a minute. We confirm by text within 15 minutes.',
      'form.direction': 'Direction',
      'dir.from': 'From Schiphol',
      'dir.to': 'To Schiphol',
      'dir.other': 'Other route',
      'f.pickup': 'Pick-up address',
      'f.dest': 'Destination',
      'f.dest.ph': 'Street, number, city',
      'f.date': 'Date',
      'f.time': 'Pick-up time',
      'f.time.hint': 'Local time in Amsterdam.',
      'f.pax': 'Passengers',
      'pax.1': '1 passenger',
      'pax.2': '2 passengers',
      'pax.3': '3 passengers',
      'pax.4': '4 passengers',
      'pax.5': '5 — minivan',
      'pax.6': '6 — minivan',
      'pax.7': '7 — minivan',
      'pax.8': '8 — minivan',
      'f.bags': 'Suitcases',
      'optional': 'optional',
      'bags.unsure': 'Not sure yet',
      'bags.hand': 'Hand luggage only',
      'bags.many': '4 or more',
      'f.name': 'Name',
      'f.name.ph': 'Name on the flight',
      'f.phone': 'Mobile number',
      'f.phone.hint': 'Your driver calls this number on arrival.',
      'f.flight': 'Flight number',
      'f.flight.hint': 'We watch the arrival and shift the pickup if you land late.',
      'f.notes': 'Anything the driver should know',
      'f.notes.ph': 'Child seat, wheelchair, bicycle, second stop…',
      'fare.tag': 'Fare',
      'fare.note': 'Metered. Your driver starts the taximeter at pickup and you pay what it reads at the door, within the national maximum taxi tariff. No booking fee, no surge pricing.',
      'form.submit': 'Request this ride',
      'form.sending': 'Sending…',
      'form.note': 'No payment now. Nothing is charged until the ride is finished.',
      'form.failed': 'The request didn’t reach us. Try again, or book by phone on <a href="tel:+31201234567">+31 20 123 4567</a> or by mail at <a href="mailto:taxiservice.goaktaa@gmail.com">taxiservice.goaktaa@gmail.com</a>.',

      'err.pickup': 'Tell us where to collect you.',
      'err.dest': 'Add the address you are heading to.',
      'err.name': 'Your driver needs a name for the sign.',
      'err.phone': 'A reachable mobile number, with country code.',
      'err.date': 'Pick a date from today onwards.',
      'err.time': 'Set a pick-up time.',
      'err.timeSoon': 'Same-day pickups need 30 minutes lead time. Call us for anything sooner.',

      'r.kicker': 'RIDE REQUEST RECEIVED',
      'r.ref': 'REF',
      'r.pickup': 'Pick-up',
      'r.dest': 'Drop-off',
      'r.when': 'When',
      'r.pax': 'Passengers',
      'r.bags': 'Suitcases',
      'r.flight': 'Flight',
      'r.contact': 'Contact',
      'r.fare': 'FARE',
      'r.fareval': 'ON THE TAXIMETER',
      'r.small': 'Charged on the meter at drop-off. Keep this reference — your driver’s name and licence plate arrive by text within 15 minutes.',
      'r.stamp': 'MEETING POINT · SCHIPHOL PLAZA · ARRIVALS 4',
      'r.notgiven': 'Not given',
      'r.tbc': 'To be confirmed',
      'r.confirmed': 'Booking confirmed',
      'r.h2': 'Your ride is with the dispatcher.',
      'r.lede': 'We’re matching you with the nearest licensed car. You’ll get a text with the driver’s name, phone number and licence plate — and a call when they arrive.',
      'r.next1': 'Change or cancel free of charge up to 2 hours before pickup.',
      'r.next2': 'Landing early or late? The flight number keeps the pickup in sync.',
      'r.next3': 'Something urgent: <a href="tel:+31201234567">+31 20 123 4567</a>, day or night.',
      'r.again': 'Book another ride',

      'fare.eyebrow': 'How the fare works',
      'fare.title': 'Three states of the meter.',
      'state1.flag': 'AT PICKUP',
      'state1.h': 'The meter starts',
      'state1.p': 'Your driver switches the meter to <em>bezet</em> the moment you get in. Waiting time at the terminal is on us for the first 30 minutes after landing.',
      'state2.flag': 'EN ROUTE',
      'state2.h': 'Time and distance',
      'state2.p': 'The meter counts kilometres and minutes together, at the tariff printed on the window sticker. Traffic on the A4 changes the number. Nobody changes it by hand.',
      'state3.flag': 'ON ARRIVAL',
      'state3.h': 'You pay the reading',
      'state3.p': 'Meter stops, receipt prints. Card, cash or company invoice. Tolls and parking, if any, are listed separately on the receipt.',
      'fare.foot': 'Dutch taxis run on government-set maximum tariffs, and ours sit inside them. The sticker in the rear window shows the exact rate before you step in. Need a fixed price for a long transfer instead? <a href="tel:+31201234567">Ask the dispatcher.</a>',

      'meet.eyebrow': 'Meeting point',
      'meet.h2': 'Arrivals 4, past the coffee bar.',
      'meet.body': 'Schiphol has one arrivals hall with four exits. Come out at <strong>Arrivals 4</strong> and look for a driver holding a card with your name on it. If you surface at a different exit, call the number on your confirmation text and the car moves to you.',
      'facts.dep.t': 'Departures',
      'facts.dep.d': 'Kiss & ride at P1, or the taxi rank on the departures deck.',
      'facts.wait.t': 'Waiting',
      'facts.wait.d': '30 minutes free after landing, then the standard waiting tariff.',
      'facts.night.t': 'Night rides',
      'facts.night.d': 'Dispatch is staffed 24/7, including 03:00 departures.',

      'foot.tagline': 'Metered airport transfers, Amsterdam Schiphol.<br>Dispatch open 24 hours.',
      'foot.reach': 'Reach us',
      'foot.legal': 'Small print',
      'foot.small': 'KIWA taxi permit · KvK 00000000 · TX-keur.<br>Independent taxi operator. Not affiliated with Royal Schiphol Group.'
    },

    /* ── Nederlands ──────────────────────────────────────── */
    nl: {
      'meta.title': 'Taxi Service Go Aktaa — Taxi op de meter bij Amsterdam Schiphol',
      'meta.desc': 'Taxi met vergunning van en naar Amsterdam Schiphol. Boek een auto, tref je chauffeur bij Aankomsthal 4, en betaal wat de taxameter aangeeft.',
      'skip': 'Naar het boekingsformulier',
      'brand.sub': 'Schiphol transfers',
      'lang.label': 'Taal',
      'nav.fare': 'Het tarief',
      'nav.meet': 'Ontmoetingspunt',
      'nav.cta': 'Taxi boeken',
      'cta.book': 'Taxi boeken',
      'cta.call': 'Bel +31 20 123 4567',
      'dock.call': 'Bellen',

      'hero.eyebrow': 'Amsterdam Schiphol · 24 uur',
      'hero.h1': 'Een taxi met vergunning, al geparkeerd als je landt.',
      'hero.lede': 'Wij rijden van en naar Schiphol op de meter. Je chauffeur volgt je vlucht, wacht bij Aankomsthal 4, en de taxameter bepaalt het tarief — geen prijs uit een pop-up.',
      'meter.caption': 'De meter loopt van instap tot bestemming. Tot hij start is er geen tarief om te tonen — dit is wat je ziet in plaats van een afrekenpagina.',
      'trust.label': 'Papieren',
      'trust.1': 'Chauffeurs met TX-keur',
      'trust.2': 'KIWA-taxivergunning',
      'trust.3': 'Vluchtnummer gevolgd',
      'trust.4': 'Pin, cash of op factuur',

      'form.h2': 'Taxi boeken',
      'form.sub': 'Kost een minuut. Je krijgt binnen 15 minuten een sms ter bevestiging.',
      'form.direction': 'Richting',
      'dir.from': 'Vanaf Schiphol',
      'dir.to': 'Naar Schiphol',
      'dir.other': 'Andere rit',
      'f.pickup': 'Ophaaladres',
      'f.dest': 'Bestemming',
      'f.dest.ph': 'Straat, nummer, plaats',
      'f.date': 'Datum',
      'f.time': 'Ophaaltijd',
      'f.time.hint': 'Lokale tijd in Amsterdam.',
      'f.pax': 'Passagiers',
      'pax.1': '1 passagier',
      'pax.2': '2 passagiers',
      'pax.3': '3 passagiers',
      'pax.4': '4 passagiers',
      'pax.5': '5 — busje',
      'pax.6': '6 — busje',
      'pax.7': '7 — busje',
      'pax.8': '8 — busje',
      'f.bags': 'Koffers',
      'optional': 'optioneel',
      'bags.unsure': 'Nog niet zeker',
      'bags.hand': 'Alleen handbagage',
      'bags.many': '4 of meer',
      'f.name': 'Naam',
      'f.name.ph': 'Naam op het ticket',
      'f.phone': 'Mobiel nummer',
      'f.phone.hint': 'Je chauffeur belt dit nummer bij aankomst.',
      'f.flight': 'Vluchtnummer',
      'f.flight.hint': 'Wij volgen de aankomst en schuiven de ophaaltijd op als je later landt.',
      'f.notes': 'Iets dat de chauffeur moet weten',
      'f.notes.ph': 'Kinderzitje, rolstoel, fiets, tweede stop…',
      'fare.tag': 'Tarief',
      'fare.note': 'Op de meter. Je chauffeur start de taxameter bij het instappen en je betaalt wat er bij de deur op staat, binnen het landelijke maximumtarief. Geen boekingskosten, geen piektarief.',
      'form.submit': 'Deze rit aanvragen',
      'form.sending': 'Versturen…',
      'form.note': 'Nu niets betalen. Er wordt niets afgeschreven tot de rit voorbij is.',
      'form.failed': 'De aanvraag is niet bij ons aangekomen. Probeer het opnieuw, of boek telefonisch via <a href="tel:+31201234567">+31 20 123 4567</a> of per mail via <a href="mailto:taxiservice.goaktaa@gmail.com">taxiservice.goaktaa@gmail.com</a>.',

      'err.pickup': 'Vertel ons waar we je ophalen.',
      'err.dest': 'Vul het adres in waar je naartoe gaat.',
      'err.name': 'Je chauffeur heeft een naam nodig voor het bordje.',
      'err.phone': 'Een bereikbaar mobiel nummer, met landcode.',
      'err.date': 'Kies een datum van vandaag of later.',
      'err.time': 'Kies een ophaaltijd.',
      'err.timeSoon': 'Ritten voor vandaag hebben 30 minuten voorbereiding nodig. Bel ons voor iets eerder.',

      'r.kicker': 'RITAANVRAAG ONTVANGEN',
      'r.ref': 'REF',
      'r.pickup': 'Ophalen',
      'r.dest': 'Bestemming',
      'r.when': 'Wanneer',
      'r.pax': 'Passagiers',
      'r.bags': 'Koffers',
      'r.flight': 'Vlucht',
      'r.contact': 'Contact',
      'r.fare': 'TARIEF',
      'r.fareval': 'OP DE TAXAMETER',
      'r.small': 'Wordt op de meter afgerekend bij aankomst. Bewaar deze referentie — naam en kenteken van je chauffeur volgen binnen 15 minuten per sms.',
      'r.stamp': 'ONTMOETINGSPUNT · SCHIPHOL PLAZA · AANKOMST 4',
      'r.notgiven': 'Niet opgegeven',
      'r.tbc': 'Nog te bevestigen',
      'r.confirmed': 'Boeking bevestigd',
      'r.h2': 'Je rit staat bij de centrale.',
      'r.lede': 'We koppelen je aan de dichtstbijzijnde taxi met vergunning. Je krijgt een sms met de naam, het telefoonnummer en het kenteken van de chauffeur — en een telefoontje bij aankomst.',
      'r.next1': 'Tot 2 uur voor de ophaaltijd gratis wijzigen of annuleren.',
      'r.next2': 'Eerder of later geland? Het vluchtnummer houdt de ophaaltijd gelijk.',
      'r.next3': 'Iets urgents: <a href="tel:+31201234567">+31 20 123 4567</a>, dag en nacht.',
      'r.again': 'Nog een rit boeken',

      'fare.eyebrow': 'Hoe het tarief werkt',
      'fare.title': 'Drie standen van de meter.',
      'state1.flag': 'BIJ HET INSTAPPEN',
      'state1.h': 'De meter start',
      'state1.p': 'Je chauffeur zet de meter op <em>bezet</em> zodra je instapt. Wachten bij de terminal is de eerste 30 minuten na de landing gratis.',
      'state2.flag': 'ONDERWEG',
      'state2.h': 'Tijd en afstand',
      'state2.p': 'De meter telt kilometers en minuten samen, volgens het tarief op de sticker in de ruit. Verkeer op de A4 verandert het bedrag. Niemand verandert het met de hand.',
      'state3.flag': 'BIJ AANKOMST',
      'state3.h': 'Je betaalt wat er staat',
      'state3.p': 'Meter uit, bon eruit. Pin, cash of op factuur. Tol en parkeerkosten staan apart op de bon.',
      'fare.foot': 'Nederlandse taxi’s werken met wettelijke maximumtarieven, en die van ons blijven daaronder. De sticker in de achterruit laat het exacte tarief zien voordat je instapt. Toch een vaste prijs voor een lange transfer? <a href="tel:+31201234567">Vraag het de centrale.</a>',

      'meet.eyebrow': 'Ontmoetingspunt',
      'meet.h2': 'Aankomsthal 4, voorbij de koffiebar.',
      'meet.body': 'Schiphol heeft één aankomsthal met vier uitgangen. Kom naar buiten bij <strong>Arrivals 4</strong> en zoek de chauffeur met een bordje met jouw naam. Sta je bij een andere uitgang? Bel het nummer uit je bevestiging en de auto komt naar je toe.',
      'facts.dep.t': 'Vertrek',
      'facts.dep.d': 'Kiss & ride bij P1, of de taxistandplaats op het vertrekdek.',
      'facts.wait.t': 'Wachten',
      'facts.wait.d': '30 minuten gratis na de landing, daarna het standaard wachttarief.',
      'facts.night.t': 'Nachtritten',
      'facts.night.d': 'De centrale is 24/7 bezet, ook voor vertrek om 03:00.',

      'foot.tagline': 'Taxiritten op de meter, Amsterdam Schiphol.<br>Centrale 24 uur open.',
      'foot.reach': 'Bereik ons',
      'foot.legal': 'Kleine lettertjes',
      'foot.small': 'KIWA-taxivergunning · KvK 00000000 · TX-keur.<br>Zelfstandig taxibedrijf. Niet verbonden aan Royal Schiphol Group.'
    },

    /* ── العربية ─────────────────────────────────────────── */
    ar: {
      'meta.title': 'Taxi Service Go Aktaa — تاكسي بالعدّاد في مطار أمستردام سخيبول',
      'meta.desc': 'تاكسي مرخّص من مطار أمستردام سخيبول وإليه. احجز سيارة، وقابل سائقك عند مخرج الوصول 4، وادفع ما يظهر على العدّاد.',
      'skip': 'انتقل إلى نموذج الحجز',
      'brand.sub': 'توصيل مطار سخيبول',
      'lang.label': 'اللغة',
      'nav.fare': 'الأجرة',
      'nav.meet': 'نقطة اللقاء',
      'nav.cta': 'احجز تاكسي',
      'cta.book': 'احجز تاكسي',
      'cta.call': 'اتصل ‎+31 20 123 4567',
      'dock.call': 'اتصل',

      'hero.eyebrow': 'أمستردام سخيبول · 24 ساعة',
      'hero.h1': 'تاكسي مرخّص، واقف في انتظارك قبل أن تهبط.',
      'hero.lede': 'نوصلك من سخيبول وإليه بالعدّاد. سائقك يتابع رحلتك، وينتظرك عند مخرج الوصول 4، والعدّاد هو من يحدد الأجرة — لا سعر يقفز لك في نافذة.',
      'meter.caption': 'العدّاد يعمل من لحظة الركوب حتى الوصول. وقبل أن يبدأ لا توجد أجرة لنعرضها — هذا ما تراه بدلاً من صفحة دفع.',
      'trust.label': 'التراخيص',
      'trust.1': 'سائقون بشهادة TX-keur',
      'trust.2': 'تصريح تاكسي من KIWA',
      'trust.3': 'نتابع رقم رحلتك',
      'trust.4': 'بطاقة أو نقداً أو فاتورة',

      'form.h2': 'احجز تاكسي',
      'form.sub': 'يستغرق دقيقة. نؤكد لك برسالة نصية خلال 15 دقيقة.',
      'form.direction': 'الاتجاه',
      'dir.from': 'من سخيبول',
      'dir.to': 'إلى سخيبول',
      'dir.other': 'مسار آخر',
      'f.pickup': 'عنوان الانطلاق',
      'f.dest': 'الوجهة',
      'f.dest.ph': 'الشارع، الرقم، المدينة',
      'f.date': 'التاريخ',
      'f.time': 'وقت الانطلاق',
      'f.time.hint': 'بالتوقيت المحلي في أمستردام.',
      'f.pax': 'عدد المسافرين',
      'pax.1': 'مسافر واحد',
      'pax.2': 'مسافران',
      'pax.3': '3 مسافرين',
      'pax.4': '4 مسافرين',
      'pax.5': '5 — سيارة فان',
      'pax.6': '6 — سيارة فان',
      'pax.7': '7 — سيارة فان',
      'pax.8': '8 — سيارة فان',
      'f.bags': 'الحقائب',
      'optional': 'اختياري',
      'bags.unsure': 'لم أحدد بعد',
      'bags.hand': 'حقائب يد فقط',
      'bags.many': '4 أو أكثر',
      'f.name': 'الاسم',
      'f.name.ph': 'الاسم كما في تذكرة الطيران',
      'f.phone': 'رقم الجوال',
      'f.phone.hint': 'سيتصل بك السائق على هذا الرقم عند وصوله.',
      'f.flight': 'رقم الرحلة',
      'f.flight.hint': 'نتابع موعد الهبوط ونؤجّل الانطلاق إذا تأخرت رحلتك.',
      'f.notes': 'أي شيء يحتاج السائق أن يعرفه',
      'f.notes.ph': 'كرسي أطفال، كرسي متحرك، دراجة، وقفة ثانية…',
      'fare.tag': 'الأجرة',
      'fare.note': 'بالعدّاد. يشغّل السائق العدّاد عند الركوب وتدفع القراءة التي تظهر عند الوصول، وضمن الحد الأقصى للتعريفة الوطنية. بلا رسوم حجز وبلا أسعار مضاعفة.',
      'form.submit': 'أرسل طلب الرحلة',
      'form.sending': 'جارٍ الإرسال…',
      'form.note': 'لا دفع الآن. لا يُخصم أي مبلغ قبل انتهاء الرحلة.',
      'form.failed': 'الطلب لم يصلنا. أعد المحاولة، أو احجز بالهاتف على <a href="tel:+31201234567">+31 20 123 4567</a> أو بالبريد على <a href="mailto:taxiservice.goaktaa@gmail.com">taxiservice.goaktaa@gmail.com</a>.',

      'err.pickup': 'أخبرنا من أين نأخذك.',
      'err.dest': 'أضف العنوان الذي تتوجه إليه.',
      'err.name': 'السائق يحتاج اسماً ليكتبه على اللوحة.',
      'err.phone': 'رقم جوال يمكن الوصول إليه، مع رمز الدولة.',
      'err.date': 'اختر تاريخ اليوم أو بعده.',
      'err.time': 'حدّد وقت الانطلاق.',
      'err.timeSoon': 'حجوزات اليوم نفسه تحتاج 30 دقيقة على الأقل. اتصل بنا لأي وقت أقرب.',

      'r.kicker': 'تم استلام طلب الرحلة',
      'r.ref': 'المرجع',
      'r.pickup': 'الانطلاق',
      'r.dest': 'الوصول',
      'r.when': 'الموعد',
      'r.pax': 'المسافرون',
      'r.bags': 'الحقائب',
      'r.flight': 'الرحلة',
      'r.contact': 'التواصل',
      'r.fare': 'الأجرة',
      'r.fareval': 'على العدّاد',
      'r.small': 'تُحسب على العدّاد عند الوصول. احتفظ بهذا المرجع — سيصلك اسم السائق ولوحة سيارته برسالة نصية خلال 15 دقيقة.',
      'r.stamp': 'نقطة اللقاء · سخيبول بلازا · الوصول 4',
      'r.notgiven': 'غير محدد',
      'r.tbc': 'سنؤكدها لاحقاً',
      'r.confirmed': 'تم تأكيد الحجز',
      'r.h2': 'طلبك وصل إلى غرفة التوزيع.',
      'r.lede': 'نبحث لك عن أقرب سيارة مرخّصة. ستصلك رسالة باسم السائق ورقمه ولوحة سيارته — ومكالمة عند وصوله.',
      'r.next1': 'التعديل أو الإلغاء مجاناً حتى ساعتين قبل موعد الانطلاق.',
      'r.next2': 'هبطت مبكراً أو متأخراً؟ رقم الرحلة يضبط موعد الانطلاق تلقائياً.',
      'r.next3': 'لأي أمر عاجل: <a href="tel:+31201234567" dir="ltr">+31 20 123 4567</a>، ليلاً أو نهاراً.',
      'r.again': 'احجز رحلة أخرى',

      'fare.eyebrow': 'كيف تُحسب الأجرة',
      'fare.title': 'ثلاث حالات للعدّاد.',
      'state1.flag': 'عند الركوب',
      'state1.h': 'العدّاد يبدأ',
      'state1.p': 'يحوّل السائق العدّاد إلى <em>bezet</em> بمجرد ركوبك. وأول 30 دقيقة انتظار في المطار بعد الهبوط على حسابنا.',
      'state2.flag': 'على الطريق',
      'state2.h': 'الوقت والمسافة',
      'state2.p': 'يحسب العدّاد الكيلومترات والدقائق معاً، بالتعريفة المطبوعة على ملصق النافذة. الزحام على طريق A4 يغيّر الرقم. لا أحد يغيّره بيده.',
      'state3.flag': 'عند الوصول',
      'state3.h': 'تدفع ما يظهر',
      'state3.p': 'يتوقف العدّاد وتُطبع الفاتورة. بطاقة أو نقداً أو فاتورة شركة. الرسوم ومواقف السيارات، إن وُجدت، تظهر منفصلة في الفاتورة.',
      'fare.foot': 'التاكسي في هولندا يعمل بتعريفة حد أقصى تحددها الحكومة، وتعريفتنا تبقى تحتها. والملصق على النافذة الخلفية يبيّن السعر الدقيق قبل أن تركب. تريد سعراً ثابتاً لرحلة طويلة؟ <a href="tel:+31201234567">اسأل غرفة التوزيع.</a>',

      'meet.eyebrow': 'نقطة اللقاء',
      'meet.h2': 'مخرج الوصول 4، بعد مقهى الصالة.',
      'meet.body': 'صالة الوصول في سخيبول واحدة ولها أربعة مخارج. اخرج من <strong>Arrivals 4</strong> وابحث عن سائق يحمل لوحة باسمك. وإذا خرجت من مخرج آخر، اتصل بالرقم في رسالة التأكيد وتأتي السيارة إليك.',
      'facts.dep.t': 'المغادرة',
      'facts.dep.d': 'التوصيل السريع عند P1، أو موقف التاكسي في طابق المغادرة.',
      'facts.wait.t': 'الانتظار',
      'facts.wait.d': '30 دقيقة مجاناً بعد الهبوط، ثم تعريفة الانتظار المعتادة.',
      'facts.night.t': 'رحلات الليل',
      'facts.night.d': 'غرفة التوزيع تعمل 24 ساعة، حتى لرحلات الثالثة فجراً.',

      'foot.tagline': 'نقل بالعدّاد من مطار أمستردام سخيبول وإليه.<br>غرفة التوزيع تعمل 24 ساعة.',
      'foot.reach': 'تواصل معنا',
      'foot.legal': 'بيانات رسمية',
      'foot.small': 'تصريح تاكسي KIWA · KvK 00000000 · TX-keur.<br>شركة تاكسي مستقلة، وغير تابعة لمجموعة Royal Schiphol.'
    }
  };

  var RTL = { ar: true };
  var LOCALE = { en: 'en-GB', nl: 'nl-NL', ar: 'ar-u-nu-latn' };
  var STORE = 'goaktaa.lang';
  var current = 'en';

  function t(key) {
    var d = DICT[current] || DICT.en;
    return (d[key] != null) ? d[key] : (DICT.en[key] != null ? DICT.en[key] : key);
  }

  function setText(el, value) { el.textContent = value; }

  function apply(lang) {
    if (!DICT[lang]) lang = 'en';
    current = lang;

    var root = document.documentElement;
    root.lang = lang;
    root.dir = RTL[lang] ? 'rtl' : 'ltr';

    document.title = t('meta.title');
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t('meta.desc'));

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      setText(el, t(el.dataset.i18n));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.placeholder = t(el.getAttribute('data-i18n-ph'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });

    document.querySelectorAll('.lang__b').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });

    try { localStorage.setItem(STORE, lang); } catch (e) { /* private mode */ }
    document.dispatchEvent(new CustomEvent('ml:lang', { detail: { lang: lang } }));
  }

  function preferred() {
    var saved;
    try { saved = localStorage.getItem(STORE); } catch (e) { saved = null; }
    if (saved && DICT[saved]) return saved;
    var tags = navigator.languages || [navigator.language || 'en'];
    for (var i = 0; i < tags.length; i++) {
      var code = String(tags[i]).slice(0, 2).toLowerCase();
      if (DICT[code]) return code;
    }
    return 'en';
  }

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('.lang__b');
    if (btn) apply(btn.dataset.lang);
  });

  apply(preferred());

  return {
    t: t,
    apply: apply,
    lang: function () { return current; },
    locale: function () { return LOCALE[current] || 'en-GB'; }
  };
}());
