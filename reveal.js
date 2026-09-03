/* Sections arriving as you scroll.
 *
 * Lives in its own file because it used to sit inside app.js, which only
 * the home page loads — so About, the FAQ and the three route pages had
 * no movement at all.
 *
 * Nothing is ever hidden by CSS alone: the .reveal-on class that arms the
 * hiding is added here, by script. No script, or a script that throws,
 * and every section is simply visible. A page that hides its own content
 * and then fails to bring it back is worse than a page with no animation.
 */
(function () {
  'use strict';

  var calm = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !('IntersectionObserver' in window)) return;

  /* Blocks, not individual words. Anything that reads as one thought
     should arrive as one thought. */
  var targets = document.querySelectorAll([
    /* home */
    '.hero__copy > *', '.shot', '.band',
    '.bookcard', '.svcs__title', '.svc', '.routelinks',
    '.board__title', '.board__panel', '.fare__title', '.state',
    '.reviews__title', '.point', '.gbadge__row', '.askrev',
    '.meet__copy > *', '.plaza',
    '.legal__title', '.legal__item',
    /* the other pages */
    '.citypage__inner > *', '.qa',
    /* every page */
    '.foot__grid > *'
  ].join(','));

  if (!targets.length) return;

  document.documentElement.classList.add('reveal-on');

  [].forEach.call(targets, function (el, i) {
    el.classList.add('reveal');
    /* Neighbours follow each other in. The stagger resets every fourth
       element so a long row never leaves the last card lagging behind
       the scroll — by then the reader has moved on. */
    el.style.setProperty('--reveal-delay', Math.min(i % 4, 3) * 80 + 'ms');
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);      /* each element arrives once */
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

  [].forEach.call(targets, function (el) { io.observe(el); });

  /* Anything already on screen at load should not wait for a scroll that
     may never come — on a short page, or when someone lands mid-document
     from a link with a #hash. */
  requestAnimationFrame(function () {
    [].forEach.call(targets, function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        el.classList.add('is-in');
        io.unobserve(el);
      }
    });
  });
}());
