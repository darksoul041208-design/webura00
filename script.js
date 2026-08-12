/* =========================================================
   WEBURA — interactions
   Vanilla JS, no dependencies.
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse  = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // The preloader plays from the top, so never let the browser restore a
  // previous scroll position on reload.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* Collapse bursts of scroll events down to one call per animation frame.
     Scroll fires far faster than the screen repaints, and doing layout work
     on every event is what makes phones stutter. */
  function onFrame(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  }

  /* ---------------------------------------------------
     Preloader — counts to 100, then releases the hero
     --------------------------------------------------- */
  function bootLoader() {
    var loader = document.getElementById('loader');
    var numEl  = document.getElementById('loaderNum');
    var barEl  = loader.querySelector('.loader__bar i');

    function release() {
      loader.classList.add('is-done');
      document.body.classList.add('is-ready');
      setTimeout(function () { loader.remove(); }, 900);
    }

    if (reduced) { release(); return; }

    var n = 0;
    var tick = setInterval(function () {
      n += Math.random() * 9 + 3;
      if (n >= 100) { n = 100; clearInterval(tick); setTimeout(release, 380); }
      numEl.textContent = String(Math.floor(n)).padStart(2, '0');
      barEl.style.width = n + '%';
    }, 90);
  }

  window.addEventListener('load', bootLoader);
  // Safety net: never leave the site behind a stuck loader.
  setTimeout(function () {
    var l = document.getElementById('loader');
    if (l && !l.classList.contains('is-done')) {
      l.classList.add('is-done');
      document.body.classList.add('is-ready');
    }
  }, 4500);

  /* ---------------------------------------------------
     Custom cursor
     --------------------------------------------------- */
  if (!coarse && !reduced) {
    var cursor = document.querySelector('.cursor');
    var dot    = cursor.querySelector('.cursor__dot');
    var ring   = cursor.querySelector('.cursor__ring');
    var mx = innerWidth / 2, my = innerHeight / 2;
    var rx = mx, ry = my;

    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
    });

    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('[data-cursor], a, button, summary').forEach(function (el) {
      var mode = el.getAttribute('data-cursor') === 'view' ? 'is-view' : 'is-hover';
      el.addEventListener('mouseenter', function () { cursor.classList.add(mode); });
      el.addEventListener('mouseleave', function () { cursor.classList.remove('is-hover', 'is-view'); });
    });
  }

  /* ---------------------------------------------------
     Sticky nav
     --------------------------------------------------- */
  var nav = document.getElementById('nav');
  var onScroll = function () { nav.classList.toggle('is-stuck', scrollY > 40); };
  addEventListener('scroll', onFrame(onScroll), { passive: true });
  onScroll();

  /* ---------------------------------------------------
     Mobile menu
     --------------------------------------------------- */
  var burger = document.getElementById('burger');
  var menu   = document.getElementById('menu');

  function closeMenu() {
    burger.classList.remove('is-open');
    menu.classList.remove('is-open');
    document.body.classList.remove('is-locked');
    burger.setAttribute('aria-expanded', 'false');
  }

  burger.addEventListener('click', function () {
    var open = !menu.classList.contains('is-open');
    burger.classList.toggle('is-open', open);
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
    burger.setAttribute('aria-expanded', String(open));
  });

  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------------------------------------------------
     Scroll reveal
     --------------------------------------------------- */
  var revealables = document.querySelectorAll('.reveal');

  if (!('IntersectionObserver' in window) || reduced) {
    revealables.forEach(function (el) { el.classList.add('on'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var group = entry.target.parentElement;
        var sibs  = group ? Array.prototype.filter.call(group.children, function (c) {
          return c.classList.contains('reveal');
        }) : [];
        var i = Math.max(0, sibs.indexOf(entry.target));
        entry.target.style.transitionDelay = Math.min(i, 6) * 90 + 'ms';
        entry.target.classList.add('on');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------
     Count-up numbers
     --------------------------------------------------- */
  var counters = document.querySelectorAll('.count');

  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-to')) || 0;
    if (reduced) { el.textContent = target; return; }
    var dur = 1500, t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);            // easeOutQuart
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ---------------------------------------------------
     Manifesto — word-by-word fade on scroll
     --------------------------------------------------- */
  var manifesto = document.querySelector('.reveal-words');
  if (manifesto) {
    // Wrap each word, preserving inline <em> emphasis.
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    })(manifesto);

    var words = manifesto.querySelectorAll('.w');

    if (reduced) {
      words.forEach(function (w) { w.classList.add('on'); });
    } else {
      var lastCut = -1;
      var paint = function () {
        var r = manifesto.getBoundingClientRect();
        var start = innerHeight * 0.85;
        var end   = innerHeight * 0.25;
        var p = (start - r.top) / (start - end);
        p = Math.max(0, Math.min(1, p));
        var cut = Math.floor(p * words.length);
        // Only touch the DOM when the boundary actually moves.
        if (cut === lastCut) return;
        lastCut = cut;
        words.forEach(function (w, i) { w.classList.toggle('on', i < cut); });
      };
      addEventListener('scroll', onFrame(paint), { passive: true });
      paint();
    }
  }

  /* ---------------------------------------------------
     Service card — cursor-tracked glow
     --------------------------------------------------- */
  if (!coarse) {
    document.querySelectorAll('.svc').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------------------------------------------------
     Magnetic buttons
     --------------------------------------------------- */
  if (!coarse && !reduced) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.32;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------
     Hero parallax
     --------------------------------------------------- */
  var heroTitle = document.querySelector('.hero__title');
  var heroGrid  = document.querySelector('.hero__grid');
  if (heroTitle && !reduced) {
    addEventListener('scroll', onFrame(function () {
      var y = scrollY;
      if (y > innerHeight) return;
      heroTitle.style.transform = 'translateY(' + y * 0.16 + 'px)';
      heroTitle.style.opacity = String(Math.max(0, 1 - y / (innerHeight * 0.8)));
      if (heroGrid) heroGrid.style.transform = 'translateY(' + y * 0.06 + 'px)';
    }), { passive: true });
  }

  /* ---------------------------------------------------
     FAQ — one panel open at a time
     --------------------------------------------------- */
  var faqs = document.querySelectorAll('.fq');
  faqs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      faqs.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------------------------------------------------
     Call links

     On a phone the tel: href already opens the dialler with the number
     filled in, so we leave that alone. On desktop tel: usually does
     nothing at all, which reads as a broken button — so there we copy the
     number to the clipboard and say so.
     --------------------------------------------------- */
  var toast = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  var toastTimer;

  function showToast(msg) {
    if (!toast) return;
    toastMsg.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-on'); }, 2800);
  }

  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      // Phones and tablets: let the dialler handle it.
      if (coarse) return;

      e.preventDefault();

      // Copy the dialable form, but show the readable one.
      var dialable = link.getAttribute('href').slice(4);
      var shown = link.getAttribute('data-display') || dialable;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(dialable).then(function () {
          showToast(shown + ' copied to clipboard');
        }, function () {
          showToast('Call us on ' + shown);
        });
      } else {
        showToast('Call us on ' + shown);
      }
    });
  });

  /* ---------------------------------------------------
     Footer year
     --------------------------------------------------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
