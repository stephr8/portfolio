
window.addEventListener('DOMContentLoaded', () => {

  // ── Hero image — tutorial000-style inertia hover effect ──────────────────
  //
  // Replicates the MadeWithGSAP tutorial000 effect without InertiaPlugin:
  //
  //  • deltaX/deltaY track how fast the mouse is moving across the hero section
  //  • On mouseenter over an opaque pixel, a GSAP timeline fires:
  //      1. Fly: image displaces in the direction of mouse travel, distance
  //         proportional to speed (mimics inertia velocity * 40)
  //      2. Snap: image springs back to its CSS-defined origin (x:0, y:0)
  //      3. Rotate yoyo: image tilts a random amount and snaps back
  //         (runs simultaneously with the fly/snap, same as the tutorial)
  //
  //  The CSS-defined left/top/width/rotation of each image is NEVER touched —
  //  GSAP only ever writes x/y/rotation offsets on top of those values.

  const heroSection = document.querySelector('.hero-section');

  if (heroSection) {
    // Rolling velocity window — average delta over the last ~80ms of mousemove
    // events. A single frame delta (1-3px) is too noisy; averaging over the
    // window gives a stable read of actual mouse speed so swift movements
    // register even when the cursor only travels a short distance.
    const VELOCITY_WINDOW_MS = 80;
    const velocityHistory = [];
    let velX = 0, velY = 0;
    let lastMX = 0, lastMY = 0;

    heroSection.addEventListener('mousemove', (e) => {
      const now = performance.now();
      const dx = e.clientX - lastMX;
      const dy = e.clientY - lastMY;
      lastMX = e.clientX;
      lastMY = e.clientY;

      velocityHistory.push({ t: now, dx, dy });

      // Drop samples older than the window
      const cutoff = now - VELOCITY_WINDOW_MS;
      while (velocityHistory.length > 1 && velocityHistory[0].t < cutoff) {
        velocityHistory.shift();
      }

      // Accumulated delta over the window = effective velocity
      velX = velocityHistory.reduce((s, v) => s + v.dx, 0);
      velY = velocityHistory.reduce((s, v) => s + v.dy, 0);
    });

    const isMobile = () => window.innerWidth <= 768;

    // ── Desktop hover effect ────────────────────────────────────────────────
    // Uses gsap.quickTo for smooth continuous tracking — fires on every
    // mousemove frame so it's reliable regardless of how the mouse enters.
    // Amplitude scales with windowed velocity: slow hover → gentle tilt,
    // fast swipe → bigger recoil. Returns to origin on mouseleave.
    //
    // quickTo(target, prop, options) returns a function you call with the
    // destination value; GSAP interpolates to it on every call.
    function attachHover(img) {
      const quickX = gsap.quickTo(img, 'x', { duration: 0.4, ease: 'power2.out' });
      const quickY = gsap.quickTo(img, 'y', { duration: 0.4, ease: 'power2.out' });
      const quickRot = gsap.quickTo(img, 'rotation', { duration: 0.4, ease: 'power2.out' });

      // Reusable canvas for hit-testing — allocated once per image
      const hitCanvas = document.createElement('canvas');
      const hitCtx = hitCanvas.getContext('2d');
      function opaque(e) {
        const rect = img.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return false;
        hitCanvas.width = rect.width; hitCanvas.height = rect.height;
        hitCtx.clearRect(0, 0, hitCanvas.width, hitCanvas.height);
        try { hitCtx.drawImage(img, 0, 0, hitCanvas.width, hitCanvas.height); }
        catch { return true; } // cross-origin fallback — treat as opaque
        return hitCtx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data[3] >= 10;
      }

      img.addEventListener('mousemove', (e) => {
        if (isMobile() || !img._gsapReady) return;

        if (!opaque(e)) {
          img.style.pointerEvents = 'none';
          const el = document.elementFromPoint(e.clientX, e.clientY);
          if (el && el !== img) el.dispatchEvent(new MouseEvent('mousemove',
            { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY }));
          setTimeout(() => { img.style.pointerEvents = 'auto'; }, 0);
          quickX(0); quickY(0); quickRot(0);
          return;
        }

        // Kill any idle tween so it doesn't fight quickTo
        if (img._tl) { img._tl.kill(); delete img._tl; }

        // speed / 15 → full strength at a comfortable 15px/80ms swipe
        const speed = Math.sqrt(velX * velX + velY * velY);
        const strength = Math.min(1, Math.max(0.3, speed / 15));

        const rect = img.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;  // -1…1
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

        quickX(-nx * 40 * strength);
        quickY(-ny * 40 * strength);
        quickRot(-nx * 18 * strength);
      });

      img.addEventListener('mouseleave', () => {
        if (isMobile()) return;
        quickX(0); quickY(0); quickRot(0);
      });
    }

    // The 5 smallest images by CSS width — these are the only ones that
    // auto-animate (intro hint + mobile idle).
    const SMALL_IMG_ALTS = new Set([
      'favourites', 'watchlist', 'pink star', 'yellow star', 'smiley face'
    ]);

    // fireIdle — gentle ambient wobble for auto-animation on all breakpoints.
    // Rotation-dominant, barely any translation, always rotates from image centre.
    function fireIdle(img) {
      if (img._tl) img._tl.kill();

      // Very subtle drift: 1–5px only
      const angle = Math.random() * Math.PI * 2;
      const dist = 1 + Math.random() * 4;
      const driftX = Math.cos(angle) * dist;
      const driftY = Math.sin(angle) * dist;

      // Rotation: ±12–20° on desktop, ±8–15° on mobile
      const range = isMobile() ? [8, 7] : [12, 8];
      const rot = (Math.random() < 0.5 ? -1 : 1) * (range[0] + Math.random() * range[1]);

      const tl = gsap.timeline({
        onComplete: () => { tl.kill(); delete img._tl; }
      });
      img._tl = tl;

      tl.to(img, {
        x: driftX, y: driftY, rotation: rot,
        transformOrigin: '50% 50%',
        duration: 0.7,
        ease: 'power1.inOut'
      });
      tl.to(img, {
        x: 0, y: 0, rotation: 0,
        transformOrigin: '50% 50%',
        duration: 0.7,
        ease: 'power1.inOut'
      });
    }

    const allImgs = Array.from(heroSection.querySelectorAll('img.drawn-img'));
    const smallImgs = allImgs.filter(img => SMALL_IMG_ALTS.has(img.alt));

    // ── Idle loop — runs on both desktop and mobile ─────────────────────────
    // Each small image has its own independent timer so wobbles never feel
    // sequential. On desktop the loop pauses after mouse interaction and
    // resumes after a 3s quiet period.
    let lastInteractionTime = 0;
    let idlePaused = false;

    heroSection.addEventListener('mousemove', () => {
      lastInteractionTime = performance.now();
      idlePaused = true;
    });

    function isIdlePaused() {
      if (!idlePaused) return false;
      if (performance.now() - lastInteractionTime > 3000) {
        idlePaused = false;
        return false;
      }
      return true;
    }

    function scheduleSingleImg(img) {
      const delay = 1200 + Math.random() * 2800;
      setTimeout(() => {
        if (!img._gsapReady || isIdlePaused()) {
          // Skip this cycle but keep rescheduling
          scheduleSingleImg(img);
          return;
        }
        fireIdle(img);
        // Reschedule after animation finishes (0.7+0.7 = 1.4s) + random gap
        setTimeout(() => scheduleSingleImg(img), 1500 + Math.random() * 2000);
      }, delay);
    }

    allImgs.forEach((img, index) => {

      // Staggered entrance animation
      img.style.animationDelay = `${index * 0.05}s`;

      // Hand off transform ownership to GSAP after the entrance animation.
      // We use both animationend AND a timer fallback (in case the event
      // doesn't fire — e.g. lazy-loaded images, background tabs, etc.)
      const animDuration = 800 + index * 50 + 100; // ms: 0.8s anim + delay + buffer

      function handOffToGSAP() {
        if (img._gsapReady) return;
        img._gsapReady = true;
        img.style.animation = 'none';
        img.style.opacity = '1';
        gsap.set(img, { x: 0, y: 0, rotation: 0, scale: 1, transformOrigin: '50% 50%' });

        // Count how many images have handed off; when all are done, fire
        // the intro hint (desktop) or start the mobile loop.
        heroSection._gsapReadyCount = (heroSection._gsapReadyCount || 0) + 1;
        if (heroSection._gsapReadyCount === allImgs.length) {
          // Start idle loop for all breakpoints — each image gets a random
          // initial offset so they don't all fire at the same time
          smallImgs.forEach(si => {
            setTimeout(() => scheduleSingleImg(si), 500 + Math.random() * 2000);
          });
        }
      }

      img.addEventListener('animationend', handOffToGSAP, { once: true });
      setTimeout(handOffToGSAP, animDuration);

      // Attach continuous magnetic hover (desktop only — mobile uses idle loop)
      attachHover(img);
    });
  }

  // ── Simplified project tabs ───────────────────────────────────────────────
  const newTabs = document.querySelectorAll('.tab-btn');
  const projectsContent = document.querySelector('.projects-content');
  const projectCards = document.querySelectorAll('.project-card');

  newTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      newTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (projectsContent) projectsContent.setAttribute('data-active-tab', tabName);

      if (tabName === 'projects') {
        projectCards.forEach(card => card.setAttribute('data-visible', 'true'));
      } else {
        const filterMap = { skills: 'design', about: 'code', contact: 'weiteres' };
        const filterType = filterMap[tabName];
        projectCards.forEach(card => {
          const tags = card.getAttribute('data-tags');
          card.setAttribute('data-visible', tags && tags.includes(filterType) ? 'true' : 'false');
        });
      }

      if (window.resetProjectPagination) window.resetProjectPagination();
    });
  });

  // ── GIF hover on project cards ────────────────────────────────────────────
  document.querySelectorAll('.project-card').forEach(card => {
    const gifImage = card.querySelector('.gif-image');
    if (gifImage) {
      const staticSrc = gifImage.dataset.static;
      const animatedSrc = gifImage.dataset.animated;
      card.addEventListener('mouseenter', () => { gifImage.src = animatedSrc; });
      card.addEventListener('mouseleave', () => { gifImage.src = staticSrc; });
    }
  });

  const pageLanguage = (() => {
    const path = window.location.pathname.toLowerCase();
    const language = (document.documentElement.lang || document.body?.lang || '').toLowerCase();
    // The English page can use a German default html[lang] value, so let an
    // explicit language marker in its URL take precedence.
    if (/(?:^|[\/_-])(en|english)(?:[\/.?_-]|$)/.test(path)) return 'en';
    if (/(?:^|[\/_-])(de|german|deutsch)(?:[\/.?_-]|$)/.test(path)) return 'de';
    return language.startsWith('de') ? 'de' : 'en';
  })();
  const isGerman = pageLanguage === 'de';

  const aboutRoles = [
    {
      name: isGerman ? 'ux/ui designerin' : 'ux/ui designer',
      color: '#C5D77A',
      description: 'From first sketches and user flows to prototypes and frontend builds: I design interfaces that make sense and look good.',
      skills: ['user research', 'user flows', 'wireframes', 'prototyping', 'UI design'],
      tools: ['Figma', 'HTML', 'CSS', 'JavaScript', 'Vue'],
    },
    {
      name: isGerman ? 'graphic designerin' : 'graphic designer',
      color: '#FDC8EE',
      description: 'Layout, typography, colour and illustration that make a project feel like one world.',
      skills: ['layout & typography', 'colour', 'illustration', 'visual identity'],
      tools: ['Illustrator', 'InDesign', 'Figma'],
    },
    {
      name: isGerman ? 'filmproduzentin' : 'filmmaker',
      color: '#F2E8BE',
      description: 'From first idea to final cut: I direct and edit short films and series.',
      skills: ['directing', 'editing', 'motion graphics', 'storytelling'],
      tools: ['Premiere Pro', 'After Effects'],
    },
    {
      name: isGerman ? 'multimedia produzentin' : 'multimedia producer',
      color: '#DDE3F5',
      description: 'Where it all comes together: planning, producing and managing digital content across video, web and social.',
      skills: ['production assistance', 'content management', 'content planning', 'post-production'],
      tools: ['Premiere Pro', 'Figma']
    }
  ];

  const aboutSection = document.querySelector('.about-section');
  if (aboutSection) {
    const heading = aboutSection.querySelector('.about-heading');
    const roleMark = heading.querySelector('mark');
    const roleText = heading.querySelector('.about-role-text');
    const introduction = aboutSection.querySelector('.about-introduction');
    const details = aboutSection.querySelector('.about-role-details');
    const tools = aboutSection.querySelector('.about-tools');
    const roleSelector = aboutSection.querySelector('.about-role-selector');
    const photoCard = aboutSection.querySelector('.about-photo-card');
    const toolItems = aboutSection.querySelectorAll('.tool-item[data-tool]');
    const roleButtons = aboutSection.querySelectorAll('[data-about-role]');

    let activeRoleIndex = -1;

    const setMarkWidth = () => {
      if (activeRoleIndex >= 0) roleMark.style.setProperty('--mw', (roleText.offsetWidth + 22) + 'px');
    };

    // measure natural widths so CSS can transition to/from them
    const measureHeading = () => {
      heading.querySelectorAll('.about-x').forEach(el => {
        el.style.transition = 'none';
        el.style.width = 'auto';
        const w = el.offsetWidth;
        el.style.width = '';
        void el.offsetWidth;
        el.style.transition = '';
        el.style.setProperty('--w', (w + 1) + 'px');
      });
      setMarkWidth();
    };

    const body = aboutSection.querySelector('.about-body');
    const slides = Array.from(aboutSection.querySelectorAll('.about-slide'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let ready = false;
    let swapTimer;

    // image slider: new slide enters from the right (dir 1) or left (dir -1)
    const slideTo = (roleIndex, dir = 1) => {
      const next = slides.find(s => s.dataset.slide === String(roleIndex));
      const prev = slides.find(s => s.classList.contains('is-active'));
      if (!next || next === prev) return;

      slides.forEach(s => {
        s.getAnimations().forEach(a => a.cancel());
        s.classList.remove('is-leaving');
      });
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      next.classList.add('is-active');
      if (reduceMotion || !ready) { prev.classList.remove('is-leaving'); return; }

      const opts = { duration: 600, easing: 'cubic-bezier(.65,0,.25,1)', fill: 'both' };
      next.animate(
        [{ transform: `translateX(${dir * 100}%)` }, { transform: 'translateX(0)' }], opts);
      const out = prev.animate(
        [{ transform: 'translateX(0)' }, { transform: `translateX(${-dir * 100}%)` }], opts);
      out.finished
        .then(() => { prev.classList.remove('is-leaving'); out.cancel(); })
        .catch(() => { });   // cancelled by a newer change
    };

    // text area: fade out → swap content → fade in
    const swapContent = fn => {
      clearTimeout(swapTimer);
      if (!ready || reduceMotion) { fn(); return; }
      body.classList.add('is-swapping');
      swapTimer = setTimeout(() => {
        fn();
        body.classList.remove('is-swapping');
      }, 200);
    };

    const showAboutRole = (roleIndex, dir = 1) => {
      const role = aboutRoles[roleIndex];
      roleButtons.forEach(button => {
        button.setAttribute('aria-pressed', button.dataset.aboutRole === String(roleIndex));
      });
      slideTo(roleIndex, dir);
      photoCard.dataset.role = roleIndex;

      if (!role) {
        heading.classList.add('is-default');
        photoCard.classList.add('is-me');
        activeRoleIndex = -1;
        swapContent(() => {
          introduction.hidden = false;
          details.classList.remove('is-visible');
          tools.classList.remove('is-visible');
          roleSelector.classList.remove('is-hidden');
          toolItems.forEach(item => { item.hidden = true; });
        });
        return;
      }

      roleText.textContent = role.name;
      roleMark.style.setProperty('--role-color', role.color);
      roleText.style.animation = 'none'; void roleText.offsetWidth; roleText.style.animation = '';
      activeRoleIndex = roleIndex;
      setMarkWidth();
      heading.classList.remove('is-default');
      photoCard.classList.remove('is-me');

      swapContent(() => {
        introduction.hidden = true;
        roleSelector.classList.add('is-hidden');
        details.innerHTML = `<div><p>${role.description}</p><span class="about-skills-label">skills</span><div class="about-role-skills">${role.skills
          .map(skill => `<span class="about-role-skill">${skill}</span>`).join('')}</div></div>`;
        details.classList.add('is-visible');
        tools.classList.add('is-visible');
        toolItems.forEach(item => { item.hidden = !role.tools.includes(item.dataset.tool); });
      });
    };

    roleButtons.forEach(button => {
      button.addEventListener('click', () => {
        const target = Number(button.dataset.aboutRole);
        showAboutRole(target, target < activeRoleIndex ? -1 : 1);
      });
    });
    showAboutRole(-1);
    ready = true;   // from here on, changes animate

    showAboutRole(-1);
    measureHeading();
    document.fonts?.ready.then(measureHeading);
    window.addEventListener('resize', measureHeading);
    // ── Auto-cycle through roles ──────────────────────────────────────────
    const AUTO_DELAY = 5500;
    const ROLE_ORDER = [-1, 0, 1, 2, 3];
    const autoBtn = aboutSection.querySelector('.about-autoplay');
    const layout = aboutSection.querySelector('.about-layout');
    const progress = aboutSection.querySelector('.about-progress');
    progress.style.setProperty('--auto-ms', AUTO_DELAY + 'ms');

    let userPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let hoverPaused = false;
    let focusPaused = false;
    let inView = false;
    let autoTimer = null;
    let hoverOverride = false;

    const autoRunning = () =>
      !userPaused && (!hoverPaused || hoverOverride) && !focusPaused && inView && !document.hidden;

    const updateAutoBtn = () => {
      autoBtn.textContent = userPaused ? '▶ play' : '❚❚ pause';
      autoBtn.setAttribute('aria-label',
        userPaused ? 'Play automatic slideshow' : 'Pause automatic slideshow');
    };

    let remaining = AUTO_DELAY;   // ms left in the current cycle
    let startedAt = 0;            // when the current run segment began
    let running = false;

    // Pause/resume in place. Does NOT reset the cycle.
    const scheduleAuto = () => {
      const shouldRun = autoRunning();

      if (shouldRun && !running) {
        running = true;
        startedAt = performance.now();
        progress.classList.remove('is-paused');
        autoTimer = setTimeout(advance, remaining);
      } else if (!shouldRun && running) {
        running = false;
        clearTimeout(autoTimer);
        remaining -= performance.now() - startedAt;   // remember where we stopped
        progress.classList.add('is-paused');
      }
    };

    // Start a fresh cycle (new role shown): empty bar, full time
    const resetCycle = () => {
      clearTimeout(autoTimer);
      running = false;
      remaining = AUTO_DELAY;
      progress.classList.remove('is-running');
      void progress.offsetWidth;                      // restart the CSS animation
      progress.classList.add('is-running', 'is-paused');
      scheduleAuto();                                 // starts it if conditions allow
    };

    const advance = () => {
      const i = ROLE_ORDER.indexOf(activeRoleIndex);
      showAboutRole(ROLE_ORDER[(i + 1) % ROLE_ORDER.length]);
      resetCycle();
    };

    // manual choice: new role shown, so start a fresh (paused) cycle
    roleButtons.forEach(b => b.addEventListener('click', () => {
      userPaused = true;
      updateAutoBtn();
      resetCycle();
    }));

    autoBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      if (!userPaused && hoverPaused) hoverOverride = true;   // explicit "play" beats hover
      updateAutoBtn();
      scheduleAuto();
    });

    // hover only pauses on real mouse movement, not on content scrolling under the cursor
    layout.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || (!e.movementX && !e.movementY)) return;
      if (!hoverPaused) { hoverPaused = true; scheduleAuto(); }
    });

    // scrolling = navigating, not reading: release the hover-pause
    addEventListener('scroll', () => {
      if (hoverPaused) { hoverPaused = false; scheduleAuto(); }
    }, { passive: true });
    layout.addEventListener('pointerleave', () => {
      hoverPaused = false;
      hoverOverride = false;
      scheduleAuto();
    });
    layout.addEventListener('focusin', e => {
      focusPaused = !e.target.closest('.about-autoplay');
      scheduleAuto();
    });
    layout.addEventListener('focusout', () => { focusPaused = false; scheduleAuto(); });

    document.addEventListener('visibilitychange', scheduleAuto);
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      scheduleAuto();
    }, { threshold: 0.35 }).observe(aboutSection);

    updateAutoBtn();
    resetCycle();
  }

  const envelope = document.querySelector('.envelope-wrapper');
  if (envelope) {
    const copyLabel = envelope.querySelector('.envelope-copy');
    const email = envelope.dataset.email;
    let resetTimer;

    const copyEmail = async () => {
      try {
        await navigator.clipboard.writeText(email);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = email;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch { }
        ta.remove();
      }
      copyLabel.textContent = isGerman ? 'kopiert ✓' : 'copied ✓';
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copyLabel.textContent = isGerman ? 'email-adresse kopieren' : 'click to copy';
      }, 1800);
    };

    // Opens once when scrolled into view; clicking never toggles it
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      envelope.classList.add('is-open');
    } else {
      new IntersectionObserver((entries, obs) => {
        if (entries.some(e => e.isIntersecting)) {
          envelope.classList.add('is-open');
          obs.disconnect();
        }
      }, { threshold: 0.6 }).observe(envelope);
    }

    envelope.addEventListener('click', copyEmail);
    envelope.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyEmail(); }
    });
  }
});
