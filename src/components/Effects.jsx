'use client';

// The behaviours the original site got from jQuery + Elementor Pro + GSAP +
// ScrollTrigger + SplitType, reimplemented with plain browser APIs.
//
//  1. sticky header       - Elementor Pro sticky ("elementor-sticky--effects")
//  2. side-menu popup     - Elementor Pro popup (elementor-141)
//  3. text splitting      - SplitType: words + chars spans on [text-split] etc.
//  4. word/letter reveals - the GSAP timeline library (words-slide-up,
//                           words-rotate-in, words-slide-from-right, letters-*)
//                           as CSS transitions + IntersectionObserver, with the
//                           original replay-on-re-enter behaviour
//  5. circle grow scrub   - the home-page .sticky_circle_wrap GSAP scrub,
//                           as position:sticky (CSS) + rAF interpolation
//  6. scroll reveal       - card/image/icon-box entrances with stagger
//
// CSS states live in src/styles/app.css under `html.js` so a JS failure can
// never hide content.

import { useEffect } from 'react';

// GSAP stagger {amount} semantics: total delay spread across n items.
const staggerDelay = (amount, i, n) => (n > 1 ? (amount * i) / (n - 1) : 0);

// Directive -> how the original timeline animated it. `unit` picks word/char,
// `amount` is the GSAP stagger amount, `cls` the CSS state pair in app.css.
const TEXT_FX = [
  { attr: 'words-slide-up', unit: 'word', amount: 0.5, cls: 'fx-words-up' },
  { attr: 'words-rotate-in', unit: 'word', amount: 0.6, cls: 'fx-words-rotate' },
  { attr: 'words-slide-from-right', unit: 'word', amount: 0.2, cls: 'fx-words-right' },
  { attr: 'letters-slide-up', unit: 'char', amount: 0.6, cls: 'fx-chars-up' },
  { attr: 'letters-slide-down', unit: 'char', amount: 0.7, cls: 'fx-chars-down' },
  { attr: 'letters-fade-in', unit: 'char', amount: 0.8, cls: 'fx-chars-fade' },
  { attr: 'letters-fade-in-random', unit: 'char', amount: 0.4, cls: 'fx-chars-fade', random: true },
  { attr: 'scrub-each-word', unit: 'word', amount: 0.8, cls: 'fx-words-dim' },
];
const SPLIT_SELECTOR = ['[text-split]', ...TEXT_FX.map((f) => `[${f.attr}]`)].join(', ');

/** SplitType replacement: wrap words (and chars when needed) in spans,
    recursing through inline markup so styled fragments keep their styling. */
function splitElement(el, withChars) {
  if (el.dataset.split) return;
  el.dataset.split = '';
  const wrap = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (/^(SCRIPT|STYLE|SVG|IMG|BR)$/.test(node.tagName)) return;
      [...node.childNodes].forEach(wrap);
      return;
    }
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    for (const chunk of node.textContent.split(/(\s+)/)) {
      if (!chunk) continue;
      if (!chunk.trim()) { frag.appendChild(document.createTextNode(chunk)); continue; }
      const w = document.createElement('span');
      w.className = 'word';
      if (withChars) {
        for (const ch of chunk) {
          const c = document.createElement('span');
          c.className = 'char';
          c.textContent = ch;
          w.appendChild(c);
        }
      } else {
        w.textContent = chunk;
      }
      frag.appendChild(w);
    }
    node.replaceWith(frag);
  };
  [...el.childNodes].forEach(wrap);
}

// power2.inOut — the circle scrub's easing in the original timeline.
const easeInOut = (p) => (p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2);

// The original script's responsive value table, verbatim.
function circleValues() {
  const w = window.innerWidth;
  if (w <= 480) return { width: '90%', height: '33em', radius: '1em', finalHeight: '68vh' };
  if (w <= 768) return { width: '90%', height: '40em', radius: '4em', finalHeight: '88vh' };
  if (w <= 1200) return { width: '45em', height: '35em', radius: '4.5em', finalHeight: '100vh' };
  return { width: '60em', height: '40em', radius: '5em', finalHeight: '90vh' };
}

export default function Effects() {
  useEffect(() => {
    const cleanups = [];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- 1. sticky header ---------------------------------------------------
    const sticky = document.querySelector('.elementor-location-header .header');
    if (sticky) {
      const offset = 100;
      const onScroll = () => {
        sticky.classList.toggle('elementor-sticky--effects', window.scrollY > offset);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener('scroll', onScroll));
    }

    // --- 2. side menu popup -------------------------------------------------
    const popup = document.querySelector('.elementor-location-popup');
    if (popup) {
      const open = () => {
        popup.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      };
      const close = () => {
        popup.classList.remove('is-open');
        document.body.style.overflow = '';
      };

      // The live site opens/closes this via Elementor action links
      // (#elementor-action%3Aaction%3Dpopup%3Aopen...). Match those, plus the
      // generic hooks.
      const triggers = document.querySelectorAll(
        'a[href^="#popup-"], a[href*="popup%3Aopen"], [data-popup-trigger], .menu-toggle, .header .elementor-widget-icon a[href="#"]'
      );
      triggers.forEach((t) => {
        const h = (e) => { e.preventDefault(); open(); };
        t.addEventListener('click', h);
        cleanups.push(() => t.removeEventListener('click', h));
      });

      const closers = popup.querySelectorAll('[data-popup-close], .popup-close, a[href^="/"], a[href^="#"]');
      closers.forEach((c) => {
        const h = (e) => {
          // Elementor close-action links must not navigate.
          if (/popup%3Aclose|popup:close|^#$/.test(c.getAttribute('href') || '')) e.preventDefault();
          close();
        };
        c.addEventListener('click', h);
        cleanups.push(() => c.removeEventListener('click', h));
      });

      const onKey = (e) => e.key === 'Escape' && close();
      document.addEventListener('keydown', onKey);
      cleanups.push(() => document.removeEventListener('keydown', onKey));
    }

    // --- 3 + 4. split text & word/letter reveals ----------------------------
    const splitTargets = [...document.querySelectorAll(SPLIT_SELECTOR)];
    if (!reduceMotion) {
      const revealIO = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add('is-revealed');
            } else if (e.boundingClientRect.top > window.innerHeight) {
              // Scrolled back up past it: reset so it replays, like the
              // original ScrollTrigger onLeaveBack.
              e.target.classList.remove('is-revealed');
            }
          }
        },
        // "top 60%" in ScrollTrigger terms.
        { rootMargin: '0px 0px -40% 0px', threshold: 0 }
      );

      for (const el of splitTargets) {
        const fx = TEXT_FX.find((f) => el.hasAttribute(f.attr));
        splitElement(el, fx ? fx.unit === 'char' : false);
        el.classList.add(fx ? fx.cls : 'fx-words-up');

        // Inline stagger delays (word/char counts vary per element).
        const units = [...el.querySelectorAll(fx?.unit === 'char' ? '.char' : '.word')];
        const order = units.map((_, i) => i);
        if (fx?.random) {
          for (let i = order.length - 1; i > 0; i--) {
            // Deterministic-enough shuffle for a decorative effect.
            const j = (i * 2654435761) % (i + 1);
            [order[i], order[j]] = [order[j], order[i]];
          }
        }
        units.forEach((u, i) => {
          u.style.transitionDelay = `${staggerDelay(fx?.amount ?? 0.3, order[i], units.length).toFixed(3)}s`;
        });

        revealIO.observe(el);
      }
      cleanups.push(() => revealIO.disconnect());
    } else {
      // Reduced motion: never hide the text.
      splitTargets.forEach((el) => el.classList.add('is-revealed'));
    }

    // --- 5. circle grow scrub (home "why maintain" section) -----------------
    const wrap = document.querySelector('.sticky_circle_wrap');
    const circle = wrap?.querySelector('.circle');
    if (wrap && circle) {
      // position:sticky dies inside any overflow:hidden ancestor (it becomes
      // the scroll container). Elementor marks page containers that way; clip
      // keeps the visual clipping without breaking the pin.
      for (let a = wrap; a && a !== document.body; a = a.parentElement) {
        if (getComputedStyle(a).overflow.includes('hidden')) a.style.overflow = 'clip';
      }
      if (reduceMotion) {
        circle.style.width = '100%';
        circle.style.height = circleValues().finalHeight;
        circle.style.borderRadius = '0px';
      } else {
        const lerp = (a, b, t) => a + (b - a) * t;
        const emPx = parseFloat(getComputedStyle(circle).fontSize) || 16;
        const toPx = (v, axis) => {
          if (v.endsWith('em')) return parseFloat(v) * emPx;
          if (v.endsWith('vh')) return (parseFloat(v) / 100) * window.innerHeight;
          if (v.endsWith('%')) return (parseFloat(v) / 100) * (axis === 'x' ? wrap.clientWidth : window.innerHeight);
          return parseFloat(v);
        };

        let current = null; // scrub smoothing state
        let raf = 0;
        let running = false;

        const frame = () => {
          const v = circleValues();
          const rect = wrap.getBoundingClientRect();
          const total = rect.height - window.innerHeight;
          const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
          const e = easeInOut(p);

          const target = {
            w: lerp(toPx(v.width, 'x'), wrap.clientWidth, e),
            h: lerp(toPx(v.height, 'y'), toPx(v.finalHeight, 'y'), e),
            r: lerp(toPx(v.radius, 'y'), 0, e),
          };
          // scrub:1 feel — chase the target instead of snapping.
          current = current
            ? { w: lerp(current.w, target.w, 0.18), h: lerp(current.h, target.h, 0.18), r: lerp(current.r, target.r, 0.18) }
            : target;

          circle.style.width = `${current.w.toFixed(1)}px`;
          circle.style.height = `${current.h.toFixed(1)}px`;
          circle.style.borderRadius = `${Math.max(0, current.r).toFixed(1)}px`;

          if (running) raf = requestAnimationFrame(frame);
        };

        // Only burn frames while the section is on screen.
        const io = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting && !running) {
            running = true;
            raf = requestAnimationFrame(frame);
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(raf);
          }
        });
        io.observe(wrap);
        frame(); // paint the initial state immediately
        cleanups.push(() => { running = false; cancelAnimationFrame(raf); io.disconnect(); });
      }
    }

    // --- 6. scroll reveal for cards, images and icon boxes ------------------
    if (!reduceMotion) {
      const candidates = document.querySelectorAll(
        '.jet-listing-grid__item, .elementor-widget-image, .elementor-widget-icon-box'
      );
      const toReveal = [];
      for (const el of candidates) {
        if (el.closest('.elementor-location-header, .elementor-location-popup')) continue;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.9) continue; // already on screen: never animate
        toReveal.push(el);
      }

      if (toReveal.length && 'IntersectionObserver' in window) {
        // Stagger siblings that reveal together (30-80ms apart, capped).
        const byParent = new Map();
        for (const el of toReveal) {
          const sibs = byParent.get(el.parentElement) || [];
          sibs.push(el);
          byParent.set(el.parentElement, sibs);
        }
        for (const sibs of byParent.values()) {
          sibs.forEach((el, i) => {
            el.style.transitionDelay = `${Math.min(i * 0.06, 0.3).toFixed(2)}s`;
            el.classList.add('fx-reveal');
          });
        }

        const io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              e.target.classList.add('in-view');
              io.unobserve(e.target);
              // Drop the stagger delay once played so hover transforms on the
              // same element respond instantly.
              const el = e.target;
              setTimeout(() => { el.style.transitionDelay = ''; }, 1000);
            }
          },
          { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
        );
        toReveal.forEach((el) => io.observe(el));
        cleanups.push(() => io.disconnect());
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
