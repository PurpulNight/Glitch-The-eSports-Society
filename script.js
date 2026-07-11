/* ═══════════════════════════════════════════════
   GLITCH ESPORTS — script.js
   Smooth scroll, navbar, reveal, stats, form
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* LENIS SMOOTH SCROLL */
  let lenis;
  try {
    lenis = new Lenis({
      duration: 1.6,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothTouch: false,
    });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } catch (e) {
    // Lenis CDN failed — create a minimal stub so nothing else breaks
    lenis = { scroll: 0, on: () => {}, scrollTo: (t) => { document.querySelector(t)?.scrollIntoView({ behavior: 'smooth' }); } };
    console.warn('Lenis failed to load, using native scroll.');
  }


  /* NAVBAR SCROLL STATE */
  const navbar = document.getElementById('navbar');

  function updateNavbar() {
    if (lenis.scroll > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  lenis.on('scroll', updateNavbar);
  updateNavbar();


  /* HAMBURGER MENU */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      navLinks.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    // Close menu on nav link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }


  /* ACTIVE NAV LINK ON SCROLL */
  const sections  = document.querySelectorAll('section[id]');
  const navAnchors = document.querySelectorAll('.nav-link');

  function setActiveLink() {
    let current = '';
    sections.forEach(sec => {
      const top = sec.offsetTop - 100;
      if (window.scrollY >= top) current = sec.id;
    });
    navAnchors.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });
  }
  lenis.on('scroll', setActiveLink);
  setActiveLink();


  /* ANCHOR CLICKS → LENIS */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    });
  });


  /* REVEAL ON SCROLL */
  const reveals = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger siblings
          const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.revealed)')];
          const delay = siblings.indexOf(entry.target) * 80;
          setTimeout(() => {
            entry.target.classList.add('revealed');
          }, delay);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach(el => revealObserver.observe(el));


  /* ANIMATED COUNTERS */
  const statValues = document.querySelectorAll('.stat-value[data-target]');

  function animateCounter(el) {
    const target  = parseInt(el.dataset.target, 10);
    const prefix  = el.dataset.prefix  || '';
    const suffix  = el.dataset.suffix  || '';
    const duration = 1800;
    const start    = performance.now();

    function update(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value    = Math.round(eased * target);
      el.textContent = prefix + value + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  statValues.forEach(el => statsObserver.observe(el));


  /* CONTACT FORM */
  const form        = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const name    = document.getElementById('form-name').value.trim();
      const email   = document.getElementById('form-email').value.trim();
      const message = document.getElementById('form-message').value.trim();

      if (!name || !email || !message) {
        // Simple shake on missing fields
        [document.getElementById('form-name'),
         document.getElementById('form-email'),
         document.getElementById('form-message')].forEach(input => {
          if (!input.value.trim()) {
            input.style.borderColor = '#ff3d4e';
            input.style.boxShadow   = '0 0 0 3px rgba(255,61,78,0.25)';
            setTimeout(() => {
              input.style.borderColor = '';
              input.style.boxShadow   = '';
            }, 1500);
          }
        });
        return;
      }

      // Simulate async submit
      const btn = form.querySelector('#contact-submit');
      btn.textContent = 'Sending…';
      btn.disabled = true;

      setTimeout(() => {
        form.reset();
        btn.textContent = 'Send Message ⚡';
        btn.disabled = false;
        formSuccess.classList.add('visible');
        setTimeout(() => formSuccess.classList.remove('visible'), 5000);
      }, 1200);
    });
  }
  /* WHAT WE DO SCROLL ANIMATION */
  (function () {
    const track   = document.getElementById('wwd-track');
    const text    = document.querySelector('.wwd-text');
    const cards   = Array.from(document.querySelectorAll('.wwd-card'));
    if (!track || !cards.length) return;

    // Read target offsets from data-attributes (unitless vw/vh multipliers)
    const targets = cards.map(card => ({
      el:    card,
      tx:    parseFloat(card.dataset.tx) || 0,   // vw
      ty:    parseFloat(card.dataset.ty) || 0,   // vh
      tr:    parseFloat(card.dataset.tr) || 0,   // deg
      ts:    parseFloat(card.dataset.ts) || 1.0, // scale target
      lead:  card.classList.contains('wwd-card--lead'),
    }));

    const vw = () => window.innerWidth  / 100;
    const vh = () => window.innerHeight / 100;

    function tick() {
      requestAnimationFrame(tick);

      // Progress: 0 when track top enters viewport, 1 when track bottom exits
      const rect  = track.getBoundingClientRect();
      const total = track.offsetHeight - window.innerHeight;
      // When rect.top <= 0 the sticky panel is active
      let p = -rect.top / total;
      p = Math.max(0, Math.min(1, p));

      targets.forEach(({ el, tx, ty, tr, ts, lead }) => {
        const x = tx * p * vw();  // px
        let y = ty * p * vh();  // px
        const r = tr * p;
        const s = 1 + (ts - 1) * p;
        const o = lead ? 1 : Math.min(1, p * 2.5);

        // Move the final position of the F1 logo 40px higher
        if (lead) {
          y -= 40 * p;
        }

        el.style.opacity   = o;
        el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${s}) rotate(${r}deg)`;
      });

      if (text) {
        const tp = Math.max(0, (p - 0.2) / 0.8);
        text.style.opacity   = tp;
        text.style.transform = `translateY(${20 - 20 * tp}px)`;
      }
    }
    tick();
  })();


  /* TOURNAMENT ITEM HOVER SOUND EFFECT (visual pulse) */
  document.querySelectorAll('.tournament-item.live').forEach(item => {
    item.addEventListener('mouseenter', () => {
      item.style.boxShadow = '0 0 32px rgba(16,185,129,0.25)';
    });
    item.addEventListener('mouseleave', () => {
      item.style.boxShadow = '';
    });
  });

  /* EVENT CARD VIDEO HOVER */
  document.querySelectorAll('.ev-card').forEach(card => {
    const video = card.querySelector('.ev-video');
    if (!video) return;

    card.addEventListener('mouseenter', () => {
      video.currentTime = 0;
      video.play().catch(() => {});
    });

    card.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
  });

});

