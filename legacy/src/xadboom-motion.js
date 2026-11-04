/* ==========================================================================
   Xadboom Motion Loader
   Central animation bootstrap for the Xadboom product. Classic script (no ES
   modules) so it works over http(s) and file:// alike.

   Responsibilities:
     - Load the vendored Motion build (src/vendor/motion.js) on demand.
     - Scroll reveals for [data-reveal] / [data-reveal-group].
     - Header scroll state for [data-motion-header].
     - Modal / drawer open-close timelines for [data-modal].
     - Expose window.XadboomMotion for other scripts (e.g. the cart drawer).

   Everything degrades gracefully: if Motion is unavailable, if
   prefers-reduced-motion is set, or if JS is disabled, content is simply shown.
   ========================================================================== */
(function () {
  'use strict';

  var EASE = [0.22, 1, 0.36, 1];
  var doc = document;
  var root = doc.documentElement;

  var REDUCE =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var motion = window.Motion || null;
  var ready = false;

  // Resolve sibling vendor file relative to this script's own URL.
  function vendorUrl() {
    var s = doc.currentScript;
    if (s && s.src) return s.src.replace(/[^/]*$/, '') + 'vendor/motion.js';
    var scripts = doc.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      if (src.indexOf('xadboom-motion.js') !== -1) {
        return src.replace(/[^/]*$/, '') + 'vendor/motion.js';
      }
    }
    return 'vendor/motion.js';
  }

  function revealAll() {
    root.classList.remove('motion-enabled');
    var els = doc.querySelectorAll('[data-reveal], [data-reveal-item]');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('is-revealed');
      els[i].style.opacity = '';
      els[i].style.transform = '';
    }
  }

  function loadMotion(done) {
    if (motion) return done(motion);
    var s = doc.createElement('script');
    s.src = vendorUrl();
    s.async = true;
    s.onload = function () {
      motion = window.Motion || null;
      done(motion);
    };
    s.onerror = function () {
      done(null);
    };
    doc.head.appendChild(s);
  }

  /* ---------------------------------------------------------------- reveals */
  function initReveals() {
    var items = [].slice.call(
      doc.querySelectorAll('[data-reveal], [data-reveal-item]')
    );
    if (!items.length) return;

    var ticking = false;

    function reveal(el, delay) {
      if (delay) el.style.transitionDelay = delay + 's';
      el.classList.add('is-revealed');
      el.addEventListener('transitionend', function done(e) {
        if (e.propertyName !== 'opacity') return;
        el.style.transitionDelay = '';
        el.style.willChange = '';
        el.removeEventListener('transitionend', done);
      });
    }

    function check() {
      ticking = false;
      var vh = window.innerHeight || root.clientHeight;
      var batch = [];
      items = items.filter(function (el) {
        var r = el.getBoundingClientRect();
        // Start only once the section is meaningfully entering the viewport.
        // A later threshold keeps the reveal visible during ordinary scrolling.
        var visible = r.top < vh * 0.82 && r.bottom > vh * -0.05;
        if (visible) {
          batch.push(el);
          return false;
        }
        return true;
      });

      // Stagger elements that reveal in the same batch and share a parent.
      var counters = [];
      for (var i = 0; i < batch.length; i++) {
        var el = batch[i];
        var p = el.parentNode;
        var idx = counters.indexOf(p);
        if (idx === -1) {
          counters.push(p);
          counters.push(1);
          idx = counters.length - 2;
        }
        var n = counters[idx + 1];
        counters[idx + 1] = n + 1;
        var explicit = el.getAttribute('data-reveal-delay');
        reveal(
          el,
          explicit != null ? parseFloat(explicit) : Math.min(n - 1, 5) * 0.06
        );
      }

      if (!items.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      }
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(check);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);
    window.requestAnimationFrame(check);
  }

  /* ---------------------------------------------------------------- header */
  function initHeader() {
    var header =
      doc.querySelector('[data-motion-header]') || doc.querySelector('header');
    if (!header) return;
    var threshold = parseInt(
      header.getAttribute('data-motion-threshold') || '24',
      10
    );
    var ticking = false;

    function update() {
      header.classList.toggle('is-scrolled', window.pageYOffset > threshold);
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  /* ---------------------------------------------------------------- modals */
  function modalCard(modal) {
    return modal.querySelector('[data-modal-card]') || modal.firstElementChild;
  }

  function showModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    if (modal.style.display === 'none') modal.style.display = '';
    if (!motion || REDUCE) return;
    var card = modalCard(modal);
    motion.animate(modal, { opacity: [0, 1] }, { duration: 0.2, ease: EASE });
    if (card) {
      motion.animate(
        card,
        { opacity: [0, 1], y: [10, 0], scale: [0.97, 1] },
        { duration: 0.32, ease: EASE }
      );
    }
  }

  function finishHide(modal) {
    modal.classList.add('hidden');
    if (modal.getAttribute('data-modal-display') === 'true') {
      modal.style.display = 'none';
    }
    modal.style.opacity = '';
    var card = modalCard(modal);
    if (card) {
      card.style.opacity = '';
      card.style.transform = '';
    }
  }

  function hideModal(modal) {
    if (!modal) return;
    if (!motion || REDUCE) return finishHide(modal);
    var card = modalCard(modal);
    motion.animate(modal, { opacity: 0 }, { duration: 0.18, ease: EASE });
    var controls = card
      ? motion.animate(
          card,
          { opacity: 0, y: 6, scale: 0.97 },
          { duration: 0.18, ease: EASE }
        )
      : null;
    var done = function () {
      finishHide(modal);
    };
    if (controls && controls.finished && controls.finished.then) {
      controls.finished.then(done, done);
    } else {
      window.setTimeout(done, 200);
    }
  }

  function initModals() {
    var openers = doc.querySelectorAll('[data-modal-open]');
    for (var i = 0; i < openers.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function (e) {
          var target = doc.getElementById(btn.getAttribute('data-modal-open'));
          if (!target) return;
          e.preventDefault();
          showModal(target);
        });
      })(openers[i]);
    }

    var modals = doc.querySelectorAll('[data-modal]');
    for (var j = 0; j < modals.length; j++) {
      (function (modal) {
        var closers = modal.querySelectorAll(
          '[data-modal-close], [data-modal-dismiss]'
        );
        for (var k = 0; k < closers.length; k++) {
          closers[k].addEventListener('click', function (e) {
            e.preventDefault();
            hideModal(modal);
          });
        }
        modal.addEventListener('click', function (e) {
          if (e.target === modal) hideModal(modal);
        });
      })(modals[j]);
    }

    doc.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      var open = doc.querySelector('[data-modal]:not(.hidden)');
      if (!open) {
        var visible = doc.querySelectorAll('[data-modal]');
        for (var m = 0; m < visible.length; m++) {
          if (visible[m].style.display && visible[m].style.display !== 'none') {
            open = visible[m];
            break;
          }
        }
      }
      if (open) hideModal(open);
    });
  }

  /* ---------------------------------------------------- micro-interactions */
  var ARROW_END = { '\u2197': 1, '\u2198': 1, '\u2192': 1, '\u27a1': 1 };

  function innermostLast(el) {
    var n = el;
    while (n && n.lastElementChild) n = n.lastElementChild;
    return n;
  }

  var TEXT_CHAR = /[A-Za-z0-9\u0600-\u06ff]/;

  function isButtonLike(el) {
    if (el.tagName === 'BUTTON') return true;
    if (el.tagName !== 'A') return false;
    var cls = typeof el.className === 'string' ? el.className : '';
    return /(?:^|\s)rounded-(?:full|lg|md|xl|DEFAULT)(?:\s|$)/.test(cls);
  }

  function makeRoll(label) {
    var roll = doc.createElement('span');
    var track = doc.createElement('span');
    var original = doc.createElement('span');
    var clone = doc.createElement('span');
    roll.className = 'xdm-roll';
    track.className = 'xdm-roll__track';
    original.className = 'xdm-roll__label';
    clone.className = 'xdm-roll__label xdm-roll__label--clone';
    original.textContent = label;
    clone.textContent = label;
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(original);
    track.appendChild(clone);
    roll.appendChild(track);
    return roll;
  }

  function rollTextNode(node) {
    var raw = node.nodeValue || '';
    if (!TEXT_CHAR.test(raw)) return false;
    var label = raw.replace(/\s+/g, ' ').trim();
    var arrow = null;
    var match = label.match(/^(.*?)\s*[\u2197\u2198\u2192\u27a1]$/);
    if (match) {
      label = match[1];
      arrow = '\u2192';
    }
    if (!TEXT_CHAR.test(label)) return false;

    var fragment = doc.createDocumentFragment();
    if (/^\s/.test(raw)) fragment.appendChild(doc.createTextNode(' '));
    fragment.appendChild(makeRoll(label));
    if (arrow) {
      var icon = doc.createElement('span');
      icon.className = 'xdm-arrow-icon';
      icon.textContent = arrow;
      fragment.appendChild(doc.createTextNode(' '));
      fragment.appendChild(icon);
    } else if (/\s$/.test(raw)) {
      fragment.appendChild(doc.createTextNode(' '));
    }
    node.parentNode.replaceChild(fragment, node);
    return true;
  }

  function rollControl(el) {
    if (el.querySelector('.xdm-roll')) return;
    var rolled = false;
    var textNodes = [];
    for (var i = 0; i < el.childNodes.length; i++) {
      var node = el.childNodes[i];
      if (node.nodeType === 3 && TEXT_CHAR.test(node.nodeValue || '')) {
        textNodes.push(node);
      }
    }
    for (var j = 0; j < textNodes.length; j++) {
      if (rollTextNode(textNodes[j])) rolled = true;
    }

    // Labels are frequently wrapped in a single span. Roll that text while
    // leaving Material Symbols, arrow icons, and nested interactive markup alone.
    if (!rolled) {
      var candidates = el.querySelectorAll('span, strong, em, div');
      for (var k = 0; k < candidates.length; k++) {
        var candidate = candidates[k];
        if (
          candidate.children.length ||
          candidate.classList.contains('material-symbols-outlined') ||
          candidate.classList.contains('xdm-arrow-icon') ||
          !TEXT_CHAR.test(candidate.textContent || '')
        ) {
          continue;
        }
        for (var m = 0; m < candidate.childNodes.length; m++) {
          var child = candidate.childNodes[m];
          if (child.nodeType === 3 && rollTextNode(child)) {
            rolled = true;
            break;
          }
        }
        if (rolled) break;
      }
    }

    if (rolled) el.classList.add('xdm-roll-control');
  }

  function initRollingText() {
    var controls = doc.querySelectorAll('button, a');
    for (var i = 0; i < controls.length; i++) {
      var el = controls[i];
      if (
        el.hasAttribute('data-no-motion') ||
        el.hasAttribute('data-no-roll') ||
        !isButtonLike(el)
      ) {
        continue;
      }
      rollControl(el);
    }
  }

  function initInteractions() {
    var nodes = doc.querySelectorAll('a, button');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.hasAttribute('data-no-motion')) continue;

      var text = (el.textContent || '').trim();
      var lastChar = text.slice(-1);
      if (ARROW_END[lastChar]) {
        el.classList.add('xdm-arrow');
        var icon = innermostLast(el);
        if (icon && icon !== el && (icon.textContent || '').trim() === lastChar) {
          icon.classList.add('xdm-arrow-icon');
        }
      } else {
        var lastEl = el.lastElementChild;
        if (
          lastEl &&
          lastEl.classList.contains('material-symbols-outlined') &&
          /arrow|north_east|east|chevron_right|trending/.test(
            lastEl.textContent || ''
          )
        ) {
          el.classList.add('xdm-arrow', 'xdm-arrow--right');
          lastEl.classList.add('xdm-arrow-icon');
        }
      }

      var cls = typeof el.className === 'string' ? el.className : '';
      if (
        cls.indexOf('transition') !== -1 &&
        cls.indexOf('active:scale') === -1 &&
        cls.indexOf(' scale-') === -1
      ) {
        el.classList.add('xdm-press');
      }
    }

    var cards = doc.querySelectorAll(
      '[data-purpose="product-card"], .group, article'
    );
    for (var g = 0; g < cards.length; g++) {
      if (cards[g].querySelector('img')) {
        cards[g].setAttribute('data-motion-hover', '');
      }
    }
  }

  /* ------------------------------------------------------------------ boot */
  function boot(M) {
    ready = !!M;
  }

  window.XadboomMotion = {
    get ready() {
      return ready;
    },
    reduce: REDUCE,
    open: showModal,
    close: hideModal,
  };

  function start() {
    try {
      initInteractions();
      initRollingText();
      initHeader();
      initModals();
      if (!REDUCE) initReveals();
      root.classList.add('motion-loaded');
    } catch (error) {
      revealAll();
    }
    loadMotion(boot);
    // Failsafe: never leave content hidden if the loader stalls.
    window.setTimeout(function () {
      if (!root.classList.contains('motion-loaded')) revealAll();
    }, 2500);
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
