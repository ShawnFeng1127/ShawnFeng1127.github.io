/**
 * Shawn Feng Portfolio — Minimalist Liquid Glass Editorial
 * Physics-Based Interactive Drone, Infinite Ring Gallery, A/B Dual Toggle & Whole-Site Scroll Navigation (site.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  initSiteEntranceAnimation();
  initAmbientGlow();
  initDepthParallax();
  initInteractiveDrone();
  initInfiniteRingGallery();
  initScrollAndKeyGuidance();
});

let galleryWasDragged = false;
let droneController = null;
let isNavigatingPage = false;

/**
 * Navigate to another page (triggers drone departure choreography if leaving About Page)
 */
function navigateToPage(targetUrl, clickEvent, scrollDirection) {
  if (!targetUrl || targetUrl.startsWith('#') || isNavigatingPage) return;
  isNavigatingPage = true;

  try {
    sessionStorage.setItem('shawn_internal_nav', '1');
    if (scrollDirection) {
      sessionStorage.setItem('shawn_nav_direction', scrollDirection);
    }
  } catch (_) {}

  const isAboutPage = document.body.getAttribute('data-page') === 'about';
  if (isAboutPage && droneController && droneController.isDockedOrDocking()) {
    droneController.departFromPerchAndNavigate(targetUrl, clickEvent);
    return;
  }

  if (droneController) {
    droneController.saveStateToSession();
  }
  document.body.classList.add('page-leaving');
  setTimeout(() => {
    window.location.href = targetUrl;
  }, 240);
}

/**
 * 0. Complex Multi-Stage Website Entrance Animation & 3-Layer Depth Parallax
 *    - Stage 1: Aerial Gimbal & Optical Viewfinder Telemetry Calibration (ISO / Shutter / Altitude / GPS)
 *    - Stage 2: 8-Blade Mechanical Camera Aperture Focus Lock & Kinetic Typography Reveal
 *    - Stage 3: Split Liquid-Glass Shutter Curtain Opening & Staggered Page Choreography
 */
function initSiteEntranceAnimation() {
  if (window.location.search.includes('nointro')) return;
  let isInternalNav = false;
  try {
    if (sessionStorage.getItem('shawn_internal_nav') === '1') {
      isInternalNav = true;
      sessionStorage.removeItem('shawn_internal_nav');
    }
  } catch (_) {}

  // Add a subtle "REPLAY INTRO" button in the footer of every page so the user can replay anytime
  const footer = document.querySelector('.page-footer');
  if (footer && !footer.querySelector('.footer-replay-btn')) {
    const replayBtn = document.createElement('button');
    replayBtn.type = 'button';
    replayBtn.className = 'footer-replay-btn';
    replayBtn.textContent = '◎ REPLAY INTRO';
    replayBtn.title = '重新播放网站开场动画';
    replayBtn.addEventListener('click', () => {
      playFullEntranceSequence(true);
    });
    footer.appendChild(replayBtn);
  }

  if (isInternalNav) {
    return;
  }

  playFullEntranceSequence(false);
}

function playFullEntranceSequence(isManualReplay) {
  const existing = document.getElementById('site-intro-overlay');
  if (existing) existing.remove();

  document.body.classList.add('is-intro-stage-hold');

  // Generate 9 curved mechanical camera aperture blades
  const bladesMarkup = Array.from({ length: 9 })
    .map((_, i) => {
      const angle = i * 40;
      return `<g transform="rotate(${angle} 250 250)">
        <path d="M 250 76 C 308 82, 360 124, 376 184 L 296 206 C 280 166, 264 126, 250 76 Z"
              fill="rgba(16, 20, 26, 0.86)"
              stroke="rgba(255, 255, 255, 0.18)"
              stroke-width="1" />
      </g>`;
    })
    .join('');

  const overlay = document.createElement('div');
  overlay.id = 'site-intro-overlay';
  overlay.className = 'site-intro-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="intro-shutter intro-shutter--top"></div>
    <div class="intro-shutter intro-shutter--bottom"></div>
    <div class="intro-shutter-flash"></div>

    <div class="intro-lens-stage">
      <svg class="intro-aperture-svg" viewBox="0 0 500 500" aria-hidden="true">
        <defs>
          <linearGradient id="lens-coating-amber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(196, 122, 69, 0.55)" />
            <stop offset="50%" stop-color="rgba(255, 255, 255, 0.08)" />
            <stop offset="100%" stop-color="rgba(120, 175, 215, 0.32)" />
          </linearGradient>
        </defs>

        <!-- Outer Camera Lens Barrel Ring -->
        <circle cx="250" cy="250" r="204" fill="none" stroke="rgba(255, 255, 255, 0.14)" stroke-width="1" />
        <circle cx="250" cy="250" r="184" fill="none" stroke="url(#lens-coating-amber)" stroke-width="1.5" />

        <!-- 9-Blade Mechanical Camera Aperture Diaphragm -->
        <g class="intro-aperture-blades">
          ${bladesMarkup}
          <circle cx="250" cy="250" r="144" fill="none" stroke="rgba(196, 122, 69, 0.42)" stroke-width="1.2" />
        </g>
      </svg>

      <!-- Center Camera Autofocus Frame ([ + ]) & Optical Focus Pull -->
      <div class="intro-af-box">
        <div class="intro-af-corner intro-af-corner--tl"></div>
        <div class="intro-af-corner intro-af-corner--tr"></div>
        <div class="intro-af-corner intro-af-corner--bl"></div>
        <div class="intro-af-corner intro-af-corner--br"></div>
        <div class="intro-title-cn">冯靖翔</div>
        <div class="intro-title-en">SHAWN FENG</div>
      </div>
    </div>

    <!-- Minimalist Photography Exposure Bar -->
    <div class="intro-exposure-bar">
      <span>35MM</span>
      <span><strong class="intro-exposure-val" id="intro-exp-aperture">f/2.8</strong></span>
      <span><strong class="intro-exposure-val" id="intro-exp-shutter">1/250s</strong></span>
      <span>ISO <strong class="intro-exposure-val">100</strong></span>
      <span class="intro-af-indicator"><span class="intro-af-dot"></span>AF-S</span>
    </div>

    <button type="button" class="intro-skip-btn" id="intro-skip-btn">SKIP</button>
  `;

  document.body.appendChild(overlay);

  const apertureEl = document.getElementById('intro-exp-aperture');
  const shutterEl = document.getElementById('intro-exp-shutter');
  const skipBtn = document.getElementById('intro-skip-btn');

  const apertureSteps = ['f/5.6', 'f/4.0', 'f/2.8', 'f/2.0', 'f/1.4'];
  const shutterSteps = ['1/1000s', '1/500s', '1/250s'];
  const duration = isManualReplay ? 1750 : 1650;
  const startTime = performance.now();
  let finished = false;
  let focusLocked = false;

  function completeIntro() {
    if (finished) return;
    finished = true;
    overlay.classList.add('is-shutter-flash');
    overlay.classList.add('is-opening');
    document.body.classList.remove('is-intro-stage-hold');

    setTimeout(() => {
      overlay.classList.remove('is-shutter-flash');
    }, 220);

    setTimeout(() => {
      overlay.classList.add('is-hidden');
      setTimeout(() => {
        if (overlay.parentNode) overlay.remove();
      }, 450);
    }, 880);
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', completeIntro);
  }

  function stepExposure(now) {
    if (finished) return;
    const elapsed = now - startTime;
    const rawProgress = Math.min(1, elapsed / duration);
    const eased = 1 - Math.pow(1 - rawProgress, 3);

    if (apertureEl) {
      apertureEl.textContent =
        apertureSteps[Math.min(apertureSteps.length - 1, Math.floor(eased * apertureSteps.length))];
    }
    if (shutterEl) {
      shutterEl.textContent =
        shutterSteps[Math.min(shutterSteps.length - 1, Math.floor(eased * shutterSteps.length))];
    }

    if (rawProgress > 0.56 && !focusLocked) {
      focusLocked = true;
      overlay.classList.add('is-focus-locked');
    }

    if (rawProgress < 1) {
      requestAnimationFrame(stepExposure);
    } else {
      setTimeout(completeIntro, 160);
    }
  }

  requestAnimationFrame(stepExposure);
}

/**
 * 0b. Subtle Multi-Plane 3D Depth Parallax on Home Page & Card Tilt on About Page
 *     (Uses CSS custom properties --px and --py so layout stays 100% untouched)
 */
function initDepthParallax() {
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  window.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    targetX = nx * 12;
    targetY = ny * 9;
  });

  function updateParallax() {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    document.body.style.setProperty('--px', `${currentX.toFixed(2)}px`);
    document.body.style.setProperty('--py', `${currentY.toFixed(2)}px`);
    requestAnimationFrame(updateParallax);
  }
  requestAnimationFrame(updateParallax);
}

/**
 * 1. Physics-Based Interactive Drone Simulation
 *    - Flies & orbits around the mouse cursor with realistic 3D Pitch / Roll / Yaw attitude
 *    - Automatically flies back to its original top-left perch when arriving at About Page
 *    - Automatically takes off and flies away from its perch when leaving About Page
 */
function initInteractiveDrone() {
  const droneEl = document.getElementById('interactive-drone');
  if (!droneEl) {
    initPageTransitions();
    return;
  }

  // Upgrade drone DOM with clean airborne body + 4 3D perspective spinning propellers
  const existingImg = droneEl.querySelector('.interactive-drone-img');
  if (existingImg && !droneEl.querySelector('.drone-rotors-layer')) {
    existingImg.classList.add('interactive-drone-img-docked');

    const airborneImg = document.createElement('img');
    airborneImg.className = 'interactive-drone-img-airborne';
    airborneImg.src = 'Project pictures/about page无人机_airborne.png';
    airborneImg.alt = '';
    droneEl.appendChild(airborneImg);

    const rotorBladeSvg = `
      <svg class="drone-rotor-svg" viewBox="0 0 200 200" aria-hidden="true">
        <!-- Secondary phase-shifted motion blur ghost blades -->
        <g opacity="0.34" transform="rotate(28 100 100)">
          <path d="M 100 96 C 64 90, 26 93, 6 98 L 6 103 C 26 106, 64 104, 100 104 Z" fill="#23272B" />
          <path d="M 100 104 C 136 110, 174 107, 194 102 L 194 97 C 174 94, 136 96, 100 96 Z" fill="#23272B" />
          <rect x="4" y="97" width="11" height="6" rx="2" fill="#F07B32" />
          <rect x="185" y="97" width="11" height="6" rx="2" fill="#F07B32" />
        </g>
        <!-- Primary carbon-fiber twin propeller blades with DJI orange tips -->
        <g>
          <path d="M 100 95 C 62 88, 24 92, 4 97.5 L 4 103.5 C 24 107, 62 105, 100 105 Z" fill="#181B1E" stroke="rgba(255,255,255,0.22)" stroke-width="0.8" />
          <path d="M 100 105 C 138 112, 176 108, 196 102.5 L 196 96.5 C 176 93, 138 95, 100 95 Z" fill="#181B1E" stroke="rgba(255,255,255,0.22)" stroke-width="0.8" />
          <!-- Orange blade tips -->
          <path d="M 4 97.5 L 16 95.8 L 16 105.2 L 4 103.5 Z" fill="#F07B32" />
          <path d="M 196 102.5 L 184 104.2 L 184 94.8 L 196 96.5 Z" fill="#F07B32" />
          <!-- Center motor hub cap -->
          <circle cx="100" cy="100" r="10.5" fill="#121417" stroke="rgba(255,255,255,0.28)" stroke-width="1.2" />
          <circle cx="100" cy="100" r="4" fill="#8C9398" />
        </g>
      </svg>
    `;

    const rotorsLayer = document.createElement('div');
    rotorsLayer.className = 'drone-rotors-layer';
    rotorsLayer.innerHTML = `
      <div class="drone-rotor drone-rotor--rr drone-rotor--ccw">
        <div class="drone-rotor-spinner">
          <div class="drone-rotor-disc"></div>
          ${rotorBladeSvg}
        </div>
      </div>
      <div class="drone-rotor drone-rotor--fr drone-rotor--cw">
        <div class="drone-rotor-spinner">
          <div class="drone-rotor-disc"></div>
          ${rotorBladeSvg}
        </div>
      </div>
      <div class="drone-rotor drone-rotor--fl drone-rotor--ccw">
        <div class="drone-rotor-spinner">
          <div class="drone-rotor-disc"></div>
          ${rotorBladeSvg}
        </div>
      </div>
      <div class="drone-rotor drone-rotor--rl drone-rotor--cw">
        <div class="drone-rotor-spinner">
          <div class="drone-rotor-disc"></div>
          ${rotorBladeSvg}
        </div>
      </div>
    `;
    droneEl.appendChild(rotorsLayer);
  }

  const pageType = document.body.getAttribute('data-page') || 'home';
  const perchTarget = document.getElementById('drone-perch-target');

  const PIVOT_X = 147;
  const PIVOT_Y = 151;
  const FLY_SCALE = 0.31;
  const PERCH_SCALE = 1.0;

  let saved = null;
  try {
    const raw = sessionStorage.getItem('shawn_drone_state');
    if (raw) saved = JSON.parse(raw);
  } catch (_) {}

  let mouseX = saved ? saved.mouseX : window.innerWidth * 0.55;
  let mouseY = saved ? saved.mouseY : window.innerHeight * 0.45;
  let droneX = saved ? saved.x : window.innerWidth * 0.5;
  let droneY = saved ? saved.y : window.innerHeight * 0.35;
  let vx = saved ? saved.vx || 0 : 0;
  let vy = saved ? saved.vy || 0 : 0;
  let currentScale = saved ? saved.scale || FLY_SCALE : FLY_SCALE;

  let roll = 0;
  let pitch = 0;
  let yaw = 0;
  let orbitPhase = Math.random() * Math.PI * 2;

  let mode = pageType === 'about' ? 'RETURN_TO_PERCH' : 'CURSOR_ORBIT';
  let hasSettledOnPerch = false;
  let departTargetX = window.innerWidth * 0.55;
  let departTargetY = window.innerHeight * 0.65;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  droneEl.addEventListener('click', () => {
    if (pageType === 'about') {
      if (mode === 'RETURN_TO_PERCH') {
        mode = 'CURSOR_ORBIT';
        hasSettledOnPerch = false;
        droneEl.classList.remove('is-perched-behind-nav');
        droneEl.classList.add('is-airborne');
      } else {
        mode = 'RETURN_TO_PERCH';
      }
    }
  });

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function getPerchCenter() {
    if (!perchTarget) return { x: PIVOT_X, y: PIVOT_Y };
    const rect = perchTarget.getBoundingClientRect();
    return {
      x: rect.left + PIVOT_X,
      y: rect.top + PIVOT_Y
    };
  }

  let lastTime = performance.now();

  function tick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    orbitPhase += dt * 2.1;

    let targetX = mouseX;
    let targetY = mouseY;
    let targetScale = FLY_SCALE;
    let stiffness = 26;
    let damping = 7.2;

    if (mode === 'CURSOR_ORBIT') {
      droneEl.classList.add('is-airborne');
      const orbitOffsetX = Math.cos(orbitPhase) * 56;
      const orbitOffsetY = Math.sin(orbitPhase * 2) * 26 - 16;
      targetX = mouseX + orbitOffsetX;
      targetY = mouseY + orbitOffsetY;
      targetScale = FLY_SCALE + Math.sin(orbitPhase * 1.8) * 0.012;
    } else if (mode === 'RETURN_TO_PERCH') {
      const perch = getPerchCenter();
      const hoverFloatY = Math.sin(orbitPhase * 1.2) * 2.5;
      targetX = perch.x;
      targetY = perch.y + hoverFloatY;
      targetScale = PERCH_SCALE;
      stiffness = 22;
      damping = 6.8;

      const distToPerch = Math.hypot(targetX - droneX, targetY - droneY);
      const currentSpeed = Math.hypot(vx, vy);
      if (distToPerch < 10 && currentSpeed < 18 && !hasSettledOnPerch) {
        hasSettledOnPerch = true;
        droneEl.style.zIndex = '4';
        droneEl.classList.remove('is-airborne');
      } else if (distToPerch >= 22 && hasSettledOnPerch) {
        hasSettledOnPerch = false;
        droneEl.style.zIndex = '45';
        droneEl.classList.add('is-airborne');
      }
    } else if (mode === 'DEPART_FROM_PERCH') {
      droneEl.style.zIndex = '45';
      droneEl.classList.add('is-airborne');
      targetX = departTargetX;
      targetY = departTargetY;
      targetScale = FLY_SCALE;
      stiffness = 38;
      damping = 6.2;
    }

    const ax = (targetX - droneX) * stiffness - vx * damping;
    const ay = (targetY - droneY) * stiffness - vy * damping;

    vx += ax * dt;
    vy += ay * dt;
    droneX += vx * dt;
    droneY += vy * dt;

    currentScale += (targetScale - currentScale) * Math.min(1, dt * 6.5);

    // Modulate propeller spin RPM dynamically based on flight velocity
    const flightSpeed = Math.hypot(vx, vy);
    const spinDuration = clamp(0.095 - flightSpeed * 0.00008, 0.048, 0.095);
    droneEl.style.setProperty('--rotor-spin-speed', `${spinDuration.toFixed(3)}s`);

    const attitudeFactor =
      mode === 'RETURN_TO_PERCH'
        ? clamp(Math.hypot(targetX - droneX, targetY - droneY) / 90, 0.06, 1)
        : 1;

    const desiredRoll = clamp((vx * 0.055 + ax * 0.012) * attitudeFactor, -32, 32);
    const desiredPitch = clamp((-vy * 0.048 - ay * 0.010) * attitudeFactor, -26, 26);
    const desiredYaw = clamp(vx * 0.024 * attitudeFactor, -15, 15);

    roll += (desiredRoll - roll) * Math.min(1, dt * 12);
    pitch += (desiredPitch - pitch) * Math.min(1, dt * 12);
    yaw += (desiredYaw - yaw) * Math.min(1, dt * 10);

    const tx = droneX - PIVOT_X;
    const ty = droneY - PIVOT_Y;

    droneEl.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) perspective(700px) rotateZ(${roll.toFixed(2)}deg) rotateX(${pitch.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg) scale(${currentScale.toFixed(3)})`;

    const shadowX = (-roll * 0.45).toFixed(1);
    const shadowY = (14 + currentScale * 10).toFixed(1);
    const shadowBlur = (16 + currentScale * 12).toFixed(1);
    droneEl.style.filter = `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlur}px rgba(0, 0, 0, 0.48))`;

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  function saveStateToSession() {
    try {
      sessionStorage.setItem(
        'shawn_drone_state',
        JSON.stringify({
          x: droneX,
          y: droneY,
          vx,
          vy,
          scale: currentScale,
          mouseX,
          mouseY
        })
      );
    } catch (_) {}
  }

  droneController = {
    isDockedOrDocking: () => mode === 'RETURN_TO_PERCH',
    saveStateToSession,
    departFromPerchAndNavigate: (targetUrl, clickEvent) => {
      mode = 'DEPART_FROM_PERCH';
      hasSettledOnPerch = false;

      if (clickEvent && typeof clickEvent.clientX === 'number' && clickEvent.clientX > 0) {
        departTargetX = clickEvent.clientX;
        departTargetY = clickEvent.clientY;
      } else {
        departTargetX = Math.max(mouseX, window.innerWidth * 0.55);
        departTargetY = Math.max(mouseY, window.innerHeight * 0.62);
      }

      vx += 260;
      vy += 190;

      setTimeout(() => {
        document.body.classList.add('page-leaving');
      }, 320);

      setTimeout(() => {
        saveStateToSession();
        window.location.href = targetUrl;
      }, 560);
    }
  };

  initPageTransitions();
}

/**
 * 2. Ambient Liquid Glass Glow Orb following mouse cursor
 */
function initAmbientGlow() {
  const orb = document.querySelector('.liquid-glow-orb');
  if (!orb) return;

  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.35;
  let currentX = mouseX;
  let currentY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateOrb() {
    currentX += (mouseX - currentX) * 0.06;
    currentY += (mouseY - currentY) * 0.06;
    orb.style.transform = `translate3d(${currentX - 280}px, ${currentY - 280}px, 0)`;
    requestAnimationFrame(animateOrb);
  }
  requestAnimationFrame(animateOrb);
}

/**
 * 3. Smooth transitions on Guidance Bars, Nav Links & Footer Links
 */
function initPageTransitions() {
  const interactiveLinks = document.querySelectorAll(
    '.guidance-bar, .nav-link, .nav-brand, .page-footer a'
  );
  interactiveLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || e.ctrlKey || e.metaKey || e.shiftKey) return;

      const currentFile = decodeURIComponent(window.location.pathname.split('/').pop() || '');
      if (currentFile && currentFile.toLowerCase() === href.toLowerCase()) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      navigateToPage(href, e, 'down');
    });
  });
}

/**
 * 4. Infinite Ring Gallery Exhibition + High-Sensitivity Silky Wheel + Dual A/B Click Switch
 */
function initInfiniteRingGallery() {
  const viewport = document.getElementById('projects-gallery-viewport');
  const track = document.getElementById('projects-gallery-track');
  if (!viewport || !track) return;

  const originalCards = Array.from(track.querySelectorAll('.project-card'));
  if (!originalCards.length) return;

  const beforeClones = originalCards.map((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute('data-clone', 'before');
    return clone;
  });
  const afterClones = originalCards.map((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute('data-clone', 'after');
    return clone;
  });

  beforeClones.forEach((clone) => track.insertBefore(clone, originalCards[0]));
  afterClones.forEach((clone) => track.appendChild(clone));

  const allCards = Array.from(track.querySelectorAll('.project-card'));
  const firstBeforeCard = beforeClones[0];
  const firstPrimaryCard = originalCards[0];

  function getSingleRingWidth() {
    const w = firstPrimaryCard.offsetLeft - firstBeforeCard.offsetLeft;
    return w > 0 ? w : 4200;
  }

  let ringInitialized = false;
  let currentOffset = 0;
  let targetOffset = 0;

  function ensureInitialPosition() {
    const w = getSingleRingWidth();
    if (!ringInitialized && w > 500) {
      currentOffset = w;
      targetOffset = w;
      ringInitialized = true;
    }
  }

  allCards.forEach((card) => {
    const img = card.querySelector('.project-card-image');
    if (img && !img.complete) {
      img.addEventListener('load', ensureInitialPosition, { once: true });
    }
  });
  ensureInitialPosition();

  function animateRing() {
    ensureInitialPosition();
    const ringWidth = getSingleRingWidth();

    currentOffset += (targetOffset - currentOffset) * 0.14;

    if (ringWidth > 500) {
      while (currentOffset >= ringWidth * 2) {
        currentOffset -= ringWidth;
        targetOffset -= ringWidth;
      }
      while (currentOffset < ringWidth * 0.5) {
        currentOffset += ringWidth;
        targetOffset += ringWidth;
      }
    }

    track.style.transform = `translate3d(${-currentOffset.toFixed(2)}px, 0, 0)`;
    requestAnimationFrame(animateRing);
  }
  requestAnimationFrame(animateRing);

  const prevBtn = document.querySelector('.gallery-prev-btn');
  const nextBtn = document.querySelector('.gallery-next-btn');
  const buttonStep = 560;

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      targetOffset -= buttonStep;
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      targetOffset += buttonStep;
    });
  }

  // High-Sensitivity Mouse Wheel -> Silky Horizontal Ring Switching (ONLY when cursor is over the gallery)
  const modal = document.getElementById('project-lightbox');
  viewport.addEventListener(
    'wheel',
    (e) => {
      if (modal && modal.classList.contains('is-active')) return;
      e.preventDefault();
      e.stopPropagation();

      let rawDelta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) {
        rawDelta *= 36;
      } else if (e.deltaMode === 2) {
        rawDelta *= 360;
      }

      targetOffset += rawDelta * 3.2;
    },
    { passive: false }
  );

  // Mouse Drag with Release Momentum
  let isDragging = false;
  let lastDragX = 0;
  let dragVelocity = 0;
  let totalDragDistance = 0;

  viewport.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    galleryWasDragged = false;
    totalDragDistance = 0;
    lastDragX = e.clientX;
    dragVelocity = 0;
    viewport.classList.add('is-dragging');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastDragX;
    lastDragX = e.clientX;
    totalDragDistance += Math.abs(dx);

    if (totalDragDistance > 5) {
      galleryWasDragged = true;
    }

    dragVelocity = -dx * 1.65;
    targetOffset += dragVelocity;
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    viewport.classList.remove('is-dragging');
    targetOffset += dragVelocity * 5.5;
  });

  // Hover Spotlight Effect across all ring cards
  function activateCardHover(hoveredCard) {
    document.body.classList.add('is-gallery-dimmed');
    allCards.forEach((card) => {
      if (card === hoveredCard) {
        card.classList.add('is-active-hover');
        card.classList.remove('is-sibling-shrunk');
      } else {
        card.classList.add('is-sibling-shrunk');
        card.classList.remove('is-active-hover');
      }
    });
  }

  function clearCardHover() {
    document.body.classList.remove('is-gallery-dimmed');
    allCards.forEach((card) => {
      card.classList.remove('is-active-hover', 'is-sibling-shrunk');
    });
  }

  allCards.forEach((card) => {
    card.addEventListener('mouseenter', () => activateCardHover(card));
    card.addEventListener('mouseleave', () => clearCardHover());
    card.addEventListener('focus', () => activateCardHover(card));
    card.addEventListener('blur', () => clearCardHover());
  });

  // Editorial Database for All 12 Photographs (Bilingual CN/EN + Orientation-Adaptive Popup Window)
  const PHOTO_CATALOG = [
    {
      id: '1',
      series: '1',
      orientation: 'horizontal', // 横版：上方照片，下方简介（照片长 = 简介长）
      ratio: 3936 / 2624,
      src: 'Project pictures/Project 1.png',
      title: '郑州 · 黑川纪章纪念馆',
      subtitle: 'KISHO KUROKAWA MEMORIAL HALL · ZHENGZHOU',
      tag: 'SERIES 01 · 横幅构图',
      location: 'HENAN · ZHENGZHOU / ARCHITECTURE',
      bio: '坐落于郑州郑东新区龙湖之畔的黑川纪章纪念馆，承载着建筑大师“共生思想”与环形城市规划的哲思。暮色四合之际，冷峻的几何玻璃幕墙与湖面残存的暖调天光相互映照，环形建筑体量在黄昏静谧的空气中呈现出纯粹的秩序感与空间张力，仿佛一座连接城市未来与自然生态的静默坐标。',
      bioEn:
        'Situated along the shore of Longhu Lake in Zhengzhou, the Kisho Kurokawa Memorial Hall embodies the late master architect’s philosophy of symbiosis and ring-shaped urbanism. At dusk, crisp geometric glass facades mirror the warm lingering twilight across the water, projecting a quiet sense of spatial order and architectural tension between the city’s future and its natural ecology.'
    },
    {
      id: '2',
      series: '2',
      orientation: 'horizontal',
      ratio: 8192 / 4608,
      src: 'Project pictures/Project 2.jpg',
      title: '甘肃 · 苦水丹霞',
      subtitle: 'KUSHU DANXIA LANDFORM · GANSU',
      tag: 'SERIES 02 · 航拍横幅',
      location: 'GANSU · YONGDENG / AERIAL LANDSCAPE',
      bio: '以高空航拍视角俯瞰甘肃永登苦水丹霞，亿万年地质运动雕琢出的赤红与赭黄岩层，如大地隆起的脉搏般在荒原上层叠延展。侧逆光勾勒出沟壑纵横的肌理与山脊阴影，苍茫而炽烈的色彩在广袤大地上交织成一幅未经人工修饰的自然抽象画卷，展现出西北大地原始而磅礴的生命力。',
      bioEn:
        'Captured from an aerial vantage point over Yongdeng, Gansu, the Kushu Danxia landforms unfold in stratified waves of crimson and ochre sculpted by millions of years of geological movement. Low-angle side lighting carves out labyrinthine ravines and sharp ridge shadows, transforming the vast northwestern wilderness into an untamed canvas of natural abstraction.'
    },
    {
      id: '3',
      series: '3',
      orientation: 'horizontal',
      ratio: 5855 / 3293,
      src: 'Project pictures/Project 3.png',
      title: '北京 · CBD 核心区夜色',
      subtitle: 'BEIJING CBD · AFTER DARK',
      tag: 'SERIES 03 · 都市横幅',
      location: 'BEIJING · CHAOYANG / URBAN NIGHT',
      bio: '夜幕降临后的北京中央商务区（CBD），中国尊与林立的摩天楼群化作刺破夜空的垂直光柱。纵横交错的城市主干道上，川流不息的车灯汇聚成金色与绯红的光轨动脉，在深邃冷冽的夜色映衬下，定格下当代超大都市昼夜不息的律动、秩序与繁华锋芒。',
      bioEn:
        'After nightfall in Beijing’s Central Business District, CITIC Tower (China Zun) and surrounding skyscrapers rise like vertical pillars of light against the dark sky. Below, intersecting avenues carry relentless streams of golden and crimson traffic trails, capturing the ceaseless pulse, geometry, and kinetic energy of a modern megacity.'
    },
    {
      id: '4a',
      series: '4',
      variant: 'a',
      orientation: 'horizontal',
      ratio: 6510 / 3864,
      src: 'Project pictures/project 4a.jpg',
      title: '西安 · 中轴线航拍',
      subtitle: "XI'AN CENTRAL AXIS · BLUE HOUR AERIAL",
      tag: 'SERIES 04A · 航拍横幅',
      location: "SHAANXI · XI'AN / CENTRAL AXIS",
      bio: '蓝调时刻自高空沿着十三朝古都的千年长安中轴线遥望，钟楼居中而立，南北大街与东西轴线在暮色中笔直延展。古典重檐的璀璨灯火与四周现代都市街区的冷暖光影严丝合缝地交织，对称而庄严的空间格局将千年盛唐的礼序文脉与今日西安的都会烟火浓缩于同一画幅之中。',
      bioEn:
        'Looking down the millennial central axis of Xi’an during blue hour, the historic Bell Tower stands at the exact geometric heart where the north-south and east-west avenues converge. Warm golden illumination on traditional飛檐 (flying eaves) interweaves seamlessly with the cool neon grid of the modern metropolis, uniting ancient imperial symmetry with contemporary urban life.'
    },
    {
      id: '4b',
      series: '4',
      variant: 'b',
      orientation: 'horizontal',
      ratio: 8192 / 4608,
      src: 'Project pictures/project 4b.jpg',
      title: '西安 · 永宁门航拍',
      subtitle: "XI'AN YONGNING GATE · NIGHT AERIAL",
      tag: 'SERIES 04B · 航拍横幅',
      location: "SHAANXI · XI'AN / ANCIENT CITY WALL",
      bio: '俯瞰夜色中的西安明城墙南门——永宁门，厚重的青砖城垣在金黄暖光勾勒下宛如一条盘踞于城市中心的金色巨龙。瓮城、箭楼与城墙内外奔涌的现代环形车流形成跨越六百年的时空对话：城墙之内是古朴深沉的历史印记，城墙之外是生机勃勃的当代长夜。',
      bioEn:
        'An aerial view of Yongning Gate, the southern ceremonial entrance of Xi’an’s Ming Dynasty City Wall. Bathed in warm amber light, the fortified barbican and ancient ramparts stand in striking dialogue with the swirling rings of modern nighttime traffic—bridging six centuries of history and the vibrant rhythm of the present day.'
    },
    {
      id: '5',
      series: '5',
      orientation: 'horizontal',
      ratio: 3990 / 2244,
      src: 'Project pictures/project 5.jpg',
      title: '川西 · 九寨沟航拍',
      subtitle: 'JIUZHAIGOU VALLEY · TOP-DOWN AERIAL',
      tag: 'SERIES 05 · 航拍横幅',
      location: 'SICHUAN · JIUZHAIGOU / NATURE AERIAL',
      bio: '采用垂直上帝视角俯拍九寨沟的高山海子与原始森林交界处。富含碳酸钙沉积的湖水由岸边的浅翠、琥珀黄渐变为深邃的孔雀蓝，钙华滩流与水下枯木清晰可见；岸畔苍翠茂密的针叶林与碧水形成极致的冷暖与明暗对比，宛如大地镶嵌在川西群山深处的一块天然翡翠。',
      bioEn:
        'Shot straight down from above, this top-down aerial frame captures the meeting edge between an alpine lake and primeval coniferous forest in Jiuzhaigou Valley. Mineral-rich waters transition from translucent amber and jade along the travertine shore to deep peacock blue, revealing submerged ancient trunks in crystalline detail.'
    },
    {
      id: '6',
      series: '6',
      orientation: 'vertical', // 竖版：左侧照片，右侧简介（简介高 = 照片高）
      ratio: 3072 / 4096,
      src: 'Project pictures/project 6.jpg',
      title: '上海 · 陆家嘴 CBD',
      subtitle: 'SHANGHAI LUJIAZUI CBD · VERTICAL SKYLINE',
      tag: 'SERIES 06 · 竖幅构图',
      location: 'SHANGHAI · PUDONG / SKYLINE',
      bio: '以竖幅构图仰望黄浦江畔的上海陆家嘴金融中心，上海中心大厦、环球金融中心、金茂大厦与东方明珠在暮色苍穹下构成极具压迫感与未来感的垂直天际线。玻璃幕墙折射着黄昏最后一抹冷冽金属光泽，向上延伸的建筑线条展现出魔都直抵云霄的野心与现代建筑几何之美。',
      bioEn:
        'Framed in a towering vertical composition, the financial skyline of Lujiazui rises above the Huangpu River as Shanghai Tower, the Shanghai World Financial Center, Jin Mao Tower, and the Oriental Pearl Tower pierce the twilight sky. Cool metallic reflections across glass curtain walls emphasize the geometric ambition and vertical momentum of the city.'
    },
    {
      id: '7',
      series: '7',
      orientation: 'horizontal',
      ratio: 9755 / 3500,
      src: 'Project pictures/project 7.jpg',
      title: '郑州 · 龙湖湿地公园',
      subtitle: 'ZHENGZHOU LONGHU WETLAND PARK · PANORAMA',
      tag: 'SERIES 07 · 全景横幅',
      location: 'HENAN · ZHENGZHOU / WETLAND PANORAMA',
      bio: '超宽画幅下的郑州龙湖湿地公园，横跨湖面的桥体与远方城市天际线在平静如镜的水面上投射出近乎完美的上下对称倒影。黄昏暖金与紫灰交融的暮霭笼罩着开阔水域，飞鸟掠过之处水波轻漾，在繁华都市腹地辟出一片静谧、开阔而富有诗意的自然呼吸空间。',
      bioEn:
        'Presented in an ultra-wide panoramic format, Zhengzhou’s Longhu Wetland Park stretches across mirror-still waters that cast a near-perfect symmetrical reflection of the spanning bridge and distant skyline. Soft golden and violet dusk mist settles over the open lake, offering a poetic sanctuary of stillness within the urban core.'
    },
    {
      id: '8',
      series: '8',
      orientation: 'vertical',
      ratio: 2624 / 3936,
      src: 'Project pictures/project 8.jpg',
      title: '重庆 · 朝天门与千佛寺',
      subtitle: 'CHONGQING CHAOTIANMEN & QIANFO TEMPLE',
      tag: 'SERIES 08 · 竖幅构图',
      location: 'CHONGQING · NANAN / HERITAGE & FUTURE',
      bio: '站在江畔隔水相望，近处是明代古刹千佛寺古朴沉静的飞檐翘角与青瓦暖灯，紧贴其后的则是拔地而起、宛如巨型未来风帆的朝天门来福士广场摩天建筑群。传统巴渝古建的温润肌理与赛博朋克式的庞大现代玻璃巨构在同一竖幅取景框中剧烈碰撞，定格下山城重庆独有的魔幻空间折叠感。',
      bioEn:
        'Viewed across the river, the warm lantern-lit tiled eaves of Ming-era Qianfo Temple sit directly beneath the monumental glass sails of Raffles City Chaotianmen. This vertical frame compresses centuries of Bayu architectural heritage against a cyberpunk megastructure, distilling Chongqing’s surreal, multi-layered urban topography.'
    },
    {
      id: '9',
      series: '9',
      orientation: 'horizontal',
      ratio: 3936 / 2624,
      src: 'Project pictures/project 9.jpg',
      title: '北京 · CBD 漫天晚霞',
      subtitle: 'BEIJING CBD · SUNSET AFTERGLOW',
      tag: 'SERIES 09 · 横幅构图',
      location: 'BEIJING · CHAOYANG / SUNSET HORIZON',
      bio: '日落时分的北京CBD迎来一场绚烂至极的漫天晚霞，炽烈的金橙、玫红与紫罗兰色云层在天际翻涌铺陈。远方中国尊与摩天楼群化作深邃挺拔的剪影，将钢筋森林的坚硬冷峻柔化于温柔而壮丽的暮色余晖之中，记录下北方都市天空最浪漫的片刻燃烧。',
      bioEn:
        'At sunset, the sky above Beijing’s CBD erupts into a dramatic canopy of burnished gold, magenta, and deep violet clouds. Against this fiery horizon, CITIC Tower and the surrounding skyline stand in crisp silhouette—softening the steel-and-glass metropolis in a fleeting moment of atmospheric grandeur.'
    },
    {
      id: '10a',
      series: '10',
      variant: 'a',
      orientation: 'vertical',
      ratio: 2326 / 3486,
      src: 'Project pictures/project 10a.jpg',
      title: '郑州 · 二七塔与大玉米（蓝调）',
      subtitle: 'ERQI TOWER & MILLENNIUM PLAZA · BLUE HOUR',
      tag: 'SERIES 10A · 竖幅构图',
      location: 'HENAN · ZHENGZHOU / BLUE HOUR',
      bio: '在深邃静谧的蓝调时刻（Blue Hour），通过长焦镜头压缩空间，将承载着郑州百年铁路记忆与红色历史的二七纪念塔，与郑东新区CBD地标千玺广场（“大玉米”）同框定格。澄澈的深蓝天幕下，双塔晶莹的白色灯光与远方“大玉米”璀璨的暖金光泽遥相呼应，串联起这座中原城市从历史走向现代的时空坐标。',
      bioEn:
        'Compressed through a telephoto lens during blue hour, Zhengzhou’s historic Erqi Memorial Tower aligns in a single vertical frame with the glowing golden spire of Millennium Royal Plaza (“Big Corn”) in Zhengdong New Area. Crisp white lights on the twin commemorative tower echo the warm amber beacon in the distance, linking the city’s railway heritage with its modern skyline.'
    },
    {
      id: '10b',
      series: '10',
      variant: 'b',
      orientation: 'vertical',
      ratio: 2288 / 3428,
      src: 'Project pictures/project 10b.jpg',
      title: '郑州 · 二七塔与大玉米（黄昏）',
      subtitle: 'ERQI TOWER & MILLENNIUM PLAZA · GOLDEN DUSK',
      tag: 'SERIES 10B · 竖幅构图',
      location: 'HENAN · ZHENGZHOU / GOLDEN DUSK',
      bio: '黄昏暖调时刻下的郑州新老地标同框：夕阳余晖将城市天际染成温润的琥珀金色，近处的二七纪念塔与远方高耸的千玺广场（“大玉米”）在层叠的楼宇与暮霭中隔空相望。相比蓝调时刻的清冷深邃，黄昏时分的漫射暖光赋予了整座城市浓郁的烟火气息与温暖厚重的时代质感。',
      bioEn:
        'Captured at golden dusk, the same iconic alignment of Erqi Memorial Tower and Millennium Royal Plaza takes on a warm amber glow. Diffused sunset light bathes the layered residential blocks and civic landmarks in a nostalgic atmospheric haze, contrasting the cool serenity of blue hour with the lived-in warmth of evening twilight.'
    }
  ];

  // Adaptive Detail Modal Setup (Vertical -> Left Photo / Right Bio; Horizontal -> Top Photo / Bottom Bio)
  const modalContent = document.getElementById('lightbox-content');
  const modalImg = modal ? modal.querySelector('.lightbox-img') : null;
  const modalDetails = modal ? modal.querySelector('.lightbox-details') : null;
  const modalTitle = modal ? modal.querySelector('.lightbox-title') : null;
  const modalSubtitle = modal ? modal.querySelector('.lightbox-subtitle') : null;
  const modalBio = document.getElementById('lightbox-bio');
  const modalBioEn = document.getElementById('lightbox-bio-en');
  const modalBioScroll = document.getElementById('lightbox-bio-scroll');
  const modalSeriesTag = document.getElementById('lightbox-series-tag');
  const modalLocationMeta = document.getElementById('lightbox-location-meta');
  const modalDualSwitcher = document.getElementById('lightbox-dual-switcher');
  const modalVariantBtnA = document.getElementById('lightbox-variant-a');
  const modalVariantBtnB = document.getElementById('lightbox-variant-b');
  const prevLightboxBtn = modal ? modal.querySelector('.lightbox-prev') : null;
  const nextLightboxBtn = modal ? modal.querySelector('.lightbox-next') : null;
  const closeLightboxBtn = modal ? modal.querySelector('.lightbox-close') : null;

  let activePhotoIndex = 0;

  // Preload secondary A/B variant high-res photos in idle time so modal A/B switching is instant
  setTimeout(() => {
    ['Project pictures/project 4b.jpg', 'Project pictures/project 10b.jpg'].forEach((src) => {
      const preloadImg = new Image();
      preloadImg.src = src;
    });
  }, 900);

  // Inject subtle wheel scroll hint pill into the Liquid Glass modal header
  const headerRight = modal ? modal.querySelector('.lightbox-header-right') : null;
  let wheelHintPill = null;
  if (headerRight && !headerRight.querySelector('.lightbox-wheel-pill')) {
    wheelHintPill = document.createElement('span');
    wheelHintPill.className = 'lightbox-wheel-pill';
    wheelHintPill.textContent = '↕ 滚轮阅读简介';
    headerRight.insertBefore(wheelHintPill, headerRight.firstChild);
  }

  if (modalBioScroll) {
    modalBioScroll.addEventListener('scroll', () => {
      if (wheelHintPill) {
        wheelHintPill.classList.toggle('is-scrolled', modalBioScroll.scrollTop > 18);
      }
    });
  }

  /**
   * Synchronize Photo & Liquid Glass Bio Dimensions WITHOUT changing photo aspect ratio:
   * - Horizontal Photo: Photo width === Bottom Bio width (height is auto from native aspect ratio)
   * - Vertical Photo: Right Bio height === Left Vertical Photo height (width is auto from native aspect ratio)
   */
  function syncModalDimensions() {
    const item = PHOTO_CATALOG[activePhotoIndex];
    if (!item || !modalImg || !modalDetails) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const ratio =
      modalImg.complete && modalImg.naturalWidth > 0 && modalImg.naturalHeight > 0
        ? modalImg.naturalWidth / modalImg.naturalHeight
        : item.ratio || 1.5;

    if (item.orientation === 'horizontal') {
      const gap = 10;
      const verticalPadding = 20;
      const bioHeight = Math.min(235, Math.max(188, Math.round(vh * 0.235)));
      const maxPhotoH = Math.max(320, Math.round(vh - bioHeight - gap - verticalPadding));
      const maxW = Math.min(1600, Math.round(vw * 0.96));

      // Exact width W so that photo (W x W/ratio) fits within maxPhotoH and maxW while keeping 100% native aspect ratio
      const matchedWidth = Math.round(Math.min(maxW, maxPhotoH * ratio));

      modalImg.style.width = `${matchedWidth}px`;
      modalImg.style.height = 'auto';
      modalImg.style.maxWidth = 'none';
      modalImg.style.maxHeight = 'none';

      modalDetails.style.width = `${matchedWidth}px`;
      modalDetails.style.height = `${bioHeight}px`;

      requestAnimationFrame(() => {
        const renderedW = Math.round(modalImg.getBoundingClientRect().width);
        if (renderedW > 0) {
          modalDetails.style.width = `${renderedW}px`;
        }
      });
    } else {
      // Vertical Photo: Left Photo height === Right Bio height
      const gap = 14;
      const verticalPadding = 20;
      const bioWidth = Math.min(700, Math.max(400, Math.round(vw * 0.48)));
      const maxPhotoW = Math.max(320, Math.round(vw * 0.96 - bioWidth - gap));
      const maxH = Math.min(960, Math.round(vh - verticalPadding));

      // Exact height H so that photo (H*ratio x H) fits within maxPhotoW and maxH while keeping 100% native aspect ratio
      const matchedHeight = Math.round(Math.min(maxH, maxPhotoW / ratio));

      modalImg.style.height = `${matchedHeight}px`;
      modalImg.style.width = 'auto';
      modalImg.style.maxWidth = 'none';
      modalImg.style.maxHeight = 'none';

      modalDetails.style.height = `${matchedHeight}px`;
      modalDetails.style.width = `${bioWidth}px`;

      requestAnimationFrame(() => {
        const renderedH = Math.round(modalImg.getBoundingClientRect().height);
        if (renderedH > 0) {
          modalDetails.style.height = `${renderedH}px`;
        }
      });
    }
  }

  if (modalImg) {
    modalImg.addEventListener('load', () => {
      modalImg.classList.remove('is-switching-photo');
      syncModalDimensions();
    });
  }
  window.addEventListener('resize', () => {
    if (modal && modal.classList.contains('is-active')) {
      syncModalDimensions();
    }
  });

  function renderModalByCatalogIndex(index) {
    activePhotoIndex = (index + PHOTO_CATALOG.length) % PHOTO_CATALOG.length;
    const item = PHOTO_CATALOG[activePhotoIndex];
    if (!item || !modal) return;

    // Switch layout between Vertical (Left=Photo, Right=Bio) and Horizontal (Top=Photo, Bottom=Bio)
    if (modalContent) {
      modalContent.classList.toggle('is-vertical', item.orientation === 'vertical');
      modalContent.classList.toggle('is-horizontal', item.orientation !== 'vertical');
    }

    if (modalImg) {
      if (modal.classList.contains('is-active') && modalImg.getAttribute('src') !== item.src) {
        modalImg.classList.add('is-switching-photo');
      }
      modalImg.src = item.src;
      modalImg.alt = item.title;
    }
    if (modalTitle) modalTitle.textContent = item.title;
    if (modalSubtitle) modalSubtitle.textContent = item.subtitle;
    if (modalBio) modalBio.textContent = item.bio;
    if (modalBioEn) modalBioEn.textContent = item.bioEn || '';
    if (modalBioScroll) modalBioScroll.scrollTop = 0;
    if (wheelHintPill) wheelHintPill.classList.remove('is-scrolled');
    if (modalSeriesTag) modalSeriesTag.textContent = item.tag;
    if (modalLocationMeta) modalLocationMeta.textContent = item.location;

    // Show A/B switcher buttons ONLY inside the detail popup when viewing Series 4 or Series 10
    if (modalDualSwitcher && modalVariantBtnA && modalVariantBtnB) {
      if (item.series === '4' || item.series === '10') {
        modalDualSwitcher.hidden = false;
        const num = item.series.padStart(2, '0');
        modalVariantBtnA.textContent = item.series === '4' ? `${num}A · 中轴线` : `${num}A · 蓝调时刻`;
        modalVariantBtnB.textContent = item.series === '4' ? `${num}B · 永宁门` : `${num}B · 黄昏时刻`;
        modalVariantBtnA.classList.toggle('is-active', item.variant === 'a');
        modalVariantBtnB.classList.toggle('is-active', item.variant === 'b');
      } else {
        modalDualSwitcher.hidden = true;
      }
    }

    syncModalDimensions();
  }

  function openLightboxByPhotoId(photoId) {
    if (!modal) return;
    const idx = PHOTO_CATALOG.findIndex((p) => p.id === photoId);
    renderModalByCatalogIndex(idx >= 0 ? idx : 0);
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (modalBioScroll) {
      modalBioScroll.focus({ preventScroll: true });
    }
  }

  function closeLightbox() {
    if (!modal) return;
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // When the detail modal is open, rolling the mouse wheel anywhere scrolls the bilingual bio smoothly
  window.addEventListener(
    'wheel',
    (e) => {
      if (!modal || !modal.classList.contains('is-active')) return;
      e.preventDefault();
      e.stopPropagation();
      if (!modalBioScroll) return;

      let delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) delta *= 36;
      else if (e.deltaMode === 2) delta *= 360;
      modalBioScroll.scrollTop += delta;
    },
    { passive: false, capture: true }
  );

  if (modalVariantBtnA) {
    modalVariantBtnA.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = PHOTO_CATALOG[activePhotoIndex];
      if (current && (current.series === '4' || current.series === '10')) {
        openLightboxByPhotoId(`${current.series}a`);
      }
    });
  }

  if (modalVariantBtnB) {
    modalVariantBtnB.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = PHOTO_CATALOG[activePhotoIndex];
      if (current && (current.series === '4' || current.series === '10')) {
        openLightboxByPhotoId(`${current.series}b`);
      }
    });
  }

  // Clicking ANY card on the main gallery page ONLY opens the detail popup (never switches A/B on the gallery card)
  allCards.forEach((card) => {
    card.addEventListener('click', (e) => {
      if (galleryWasDragged) {
        e.preventDefault();
        galleryWasDragged = false;
        return;
      }

      const photoId = card.getAttribute('data-photo-id') || card.getAttribute('data-series');
      openLightboxByPhotoId(photoId);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const photoId = card.getAttribute('data-photo-id') || card.getAttribute('data-series');
        openLightboxByPhotoId(photoId);
      }
    });
  });

  if (prevLightboxBtn) {
    prevLightboxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderModalByCatalogIndex(activePhotoIndex - 1);
    });
  }
  if (nextLightboxBtn) {
    nextLightboxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderModalByCatalogIndex(activePhotoIndex + 1);
    });
  }
  if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener('click', closeLightbox);
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target === modalContent) closeLightbox();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('is-active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') renderModalByCatalogIndex(activePhotoIndex - 1);
    if (e.key === 'ArrowRight') renderModalByCatalogIndex(activePhotoIndex + 1);
    if (e.key === 'ArrowDown' && modalBioScroll) {
      e.preventDefault();
      modalBioScroll.scrollTop += 48;
    }
    if (e.key === 'ArrowUp' && modalBioScroll) {
      e.preventDefault();
      modalBioScroll.scrollTop -= 48;
    }
  });
}

/**
 * 5. Whole-Website Mouse Scroll Navigation & Keyboard PageDown / PageUp
 *    - Allows natural vertical scrolling within each page (to view the full portrait and content)
 *    - When reaching the bottom of a page and continuing to scroll down, smoothly transitions to the next page
 *    - When reaching the top of a page and continuing to scroll up, smoothly transitions to the previous page
 */
function initScrollAndKeyGuidance() {
  const nextPage = document.body.getAttribute('data-next-page');
  const prevPage = document.body.getAttribute('data-prev-page');
  const modal = document.getElementById('project-lightbox');
  const galleryViewport = document.getElementById('projects-gallery-viewport');
  const guidanceBar = document.querySelector('.guidance-bar');

  function setGuidanceCharge(ratio) {
    if (guidanceBar) {
      guidanceBar.style.setProperty('--scroll-charge', Math.min(1, Math.max(0, ratio)).toFixed(2));
    }
  }

  // If arriving via upward scroll from the next page, start at the bottom of the page for seamless continuity
  try {
    const dir = sessionStorage.getItem('shawn_nav_direction');
    if (dir) {
      sessionStorage.removeItem('shawn_nav_direction');
      if (dir === 'up') {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  } catch (_) {}

  let downOverflowAccum = 0;
  let upOverflowAccum = 0;
  let resetTimer = null;
  const pageLoadTime = performance.now();

  window.addEventListener(
    'wheel',
    (e) => {
      // Cooldown right after page load so leftover wheel inertia doesn't skip a page
      if (performance.now() - pageLoadTime < 650 || isNavigatingPage) return;
      if (modal && modal.classList.contains('is-active')) return;
      if (document.getElementById('site-intro-overlay')) return;
      // Ignore if cursor is inside the horizontal gallery viewport
      if (galleryViewport && galleryViewport.contains(e.target)) return;

      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 36;
      else if (e.deltaMode === 2) dy *= 360;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );

      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        downOverflowAccum = 0;
        upOverflowAccum = 0;
        setGuidanceCharge(0);
      }, 320);

      // At the bottom of the current page + scrolling down -> go to next page
      if (dy > 0 && scrollTop >= maxScroll - 4) {
        downOverflowAccum += dy;
        upOverflowAccum = 0;
        setGuidanceCharge(downOverflowAccum / 150);
        if (downOverflowAccum >= 150 && nextPage) {
          downOverflowAccum = 0;
          setGuidanceCharge(1);
          navigateToPage(nextPage, null, 'down');
        }
      }
      // At the top of the current page + scrolling up -> go to previous page
      else if (dy < 0 && scrollTop <= 4) {
        upOverflowAccum += Math.abs(dy);
        downOverflowAccum = 0;
        setGuidanceCharge(upOverflowAccum / 150);
        if (upOverflowAccum >= 150 && prevPage) {
          upOverflowAccum = 0;
          setGuidanceCharge(1);
          navigateToPage(prevPage, null, 'up');
        }
      } else {
        downOverflowAccum = 0;
        upOverflowAccum = 0;
        setGuidanceCharge(0);
      }
    },
    { passive: true }
  );

  window.addEventListener('keydown', (e) => {
    if (modal && modal.classList.contains('is-active')) return;
    if (e.key === 'PageDown' && nextPage) {
      e.preventDefault();
      navigateToPage(nextPage, null, 'down');
    } else if (e.key === 'PageUp' && prevPage) {
      e.preventDefault();
      navigateToPage(prevPage, null, 'up');
    }
  });
}
