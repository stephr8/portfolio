
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
      const dx  = e.clientX - lastMX;
      const dy  = e.clientY - lastMY;
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
      const quickX   = gsap.quickTo(img, 'x',        { duration: 0.4, ease: 'power2.out' });
      const quickY   = gsap.quickTo(img, 'y',        { duration: 0.4, ease: 'power2.out' });
      const quickRot = gsap.quickTo(img, 'rotation', { duration: 0.4, ease: 'power2.out' });

      // Reusable canvas for hit-testing — allocated once per image
      const hitCanvas = document.createElement('canvas');
      const hitCtx    = hitCanvas.getContext('2d');
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
        const speed    = Math.sqrt(velX * velX + velY * velY);
        const strength = Math.min(1, Math.max(0.3, speed / 15));

        const rect = img.getBoundingClientRect();
        const nx   = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;  // -1…1
        const ny   = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;

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
      const angle  = Math.random() * Math.PI * 2;
      const dist   = 1 + Math.random() * 4;
      const driftX = Math.cos(angle) * dist;
      const driftY = Math.sin(angle) * dist;

      // Rotation: ±12–20° on desktop, ±8–15° on mobile
      const range  = isMobile() ? [8, 7] : [12, 8];
      const rot    = (Math.random() < 0.5 ? -1 : 1) * (range[0] + Math.random() * range[1]);

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

    const allImgs   = Array.from(heroSection.querySelectorAll('img.drawn-img'));
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
        img.style.opacity   = '1';
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


  // ── Folder tab management ─────────────────────────────────────────────────
  const tabs = document.querySelectorAll('.folder-index');
  const folderPaper = document.querySelector('.folder-paper');
  if (tabs.length > 0 && folderPaper) {
    tabs[0].classList.add('active');
    folderPaper.classList.add('color-blue_light');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const color = tab.getAttribute('data-color');
        folderPaper.classList.remove('color-blue_light', 'color-pink', 'color-green', 'color-yellow');
        folderPaper.classList.add(`color-${color}`);
      });
    });
  }

  // ── Simplified folder tabs ────────────────────────────────────────────────
  const newTabs      = document.querySelectorAll('.tab-btn');
  const folderContent = document.querySelector('.folder-content');
  const projectCards  = document.querySelectorAll('.project-card');

  newTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      newTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      if (folderContent) folderContent.setAttribute('data-active-tab', tabName);

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
      const staticSrc   = gifImage.dataset.static;
      const animatedSrc = gifImage.dataset.animated;
      card.addEventListener('mouseenter', () => { gifImage.src = animatedSrc; });
      card.addEventListener('mouseleave', () => { gifImage.src = staticSrc; });
    }
  });
});
