/* The 404 page shares the site's chrome but none of its booking logic.
   app.js expects the booking form to exist and would throw here, so this
   runs the few things the page actually needs. */
(function () {
  'use strict';
  var t = window.I18N.t;

  /* WhatsApp opens with a line already typed, in the reader's language. */
  function paintWhatsApp() {
    var wa = document.getElementById('waBtn');
    if (!wa) return;
    wa.href = 'https://wa.me/31613331111?text=' + encodeURIComponent(t('wa.text'));
  }
  paintWhatsApp();
  document.addEventListener('ml:lang', paintWhatsApp);

  /* The menu button, same behaviour as the main page. */
  var nav = document.getElementById('mainnav');
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (!nav || !toggle || !links) return;

  function setOpen(on) {
    nav.classList.toggle('is-open', on);
    toggle.setAttribute('aria-expanded', String(on));
  }
  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 760) setOpen(false); });
}());
