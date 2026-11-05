/**
 * Shawn Feng Portfolio — Minimalist Liquid Glass Editorial
 * Physics-Based Interactive Drone, Infinite Ring Gallery, A/B Dual Toggle & Whole-Site Scroll Navigation (site.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  initGlobalLanguageSwitcher();
  initSiteEntranceAnimation();
  initAmbientGlow();
  initDepthParallax();
  initInteractiveDrone();
  initDroneFpvCard();
  initInfiniteRingGallery();
  initHelpPageInteractions();
  initScrollAndKeyGuidance();
});

let galleryWasDragged = false;
let droneController = null;
let isNavigatingPage = false;
let openDroneFpvCardFn = null;

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

  function triggerAboutDroneFpv(e) {
    if (pageType === 'about' && typeof openDroneFpvCardFn === 'function') {
      if (e) e.stopPropagation();
      openDroneFpvCardFn();
    }
  }

  droneEl.addEventListener('click', triggerAboutDroneFpv);
  droneEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerAboutDroneFpv(e);
    }
  });

  if (perchTarget && pageType === 'about') {
    perchTarget.addEventListener('click', triggerAboutDroneFpv);
    perchTarget.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerAboutDroneFpv(e);
      }
    });
    perchTarget.addEventListener('mouseenter', () => {
      droneEl.classList.add('is-drone-hovered');
    });
    perchTarget.addEventListener('mouseleave', () => {
      droneEl.classList.remove('is-drone-hovered');
    });
  }

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
        droneEl.style.zIndex = '15';
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

  // Horizontal wheel / trackpad swipe / Shift + Wheel scrolls the gallery horizontally;
  // Vertical wheel bubbles up to window to seamlessly browse between website pages!
  const modal = document.getElementById('project-lightbox');
  viewport.addEventListener(
    'wheel',
    (e) => {
      if (modal && modal.classList.contains('is-active')) return;

      const isHorizontalScroll = Math.abs(e.deltaX) > Math.abs(e.deltaY) * 0.7 || e.shiftKey;
      if (isHorizontalScroll) {
        e.preventDefault();
        e.stopPropagation();

        let rawDelta = e.shiftKey ? e.deltaY : e.deltaX;
        if (e.deltaMode === 1) {
          rawDelta *= 36;
        } else if (e.deltaMode === 2) {
          rawDelta *= 360;
        }

        targetOffset += rawDelta * 2.8;
      }
    },
    { passive: false }
  );

  // Keyboard Left / Right Arrows to slide the gallery when lightbox is closed
  window.addEventListener('keydown', (e) => {
    if (modal && modal.classList.contains('is-active')) return;
    if (e.key === 'ArrowRight') {
      targetOffset += buttonStep;
    } else if (e.key === 'ArrowLeft') {
      targetOffset -= buttonStep;
    }
  });

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
      if (performance.now() - pageLoadTime < 500 || isNavigatingPage) return;
      if (modal && modal.classList.contains('is-active')) return;
      const helpModal = document.getElementById('help-detail-modal');
      if (helpModal && helpModal.classList.contains('is-active')) return;
      const helpPhotoLightbox = document.getElementById('help-photo-lightbox');
      if (helpPhotoLightbox && helpPhotoLightbox.classList.contains('is-active')) return;
      const droneFpvModal = document.getElementById('drone-fpv-modal');
      if (droneFpvModal && droneFpvModal.classList.contains('is-active')) return;
      if (document.getElementById('site-intro-overlay')) return;

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
        setGuidanceCharge(downOverflowAccum / 100);
        if (downOverflowAccum >= 100 && nextPage) {
          downOverflowAccum = 0;
          setGuidanceCharge(1);
          navigateToPage(nextPage, null, 'down');
        }
      }
      // At the top of the current page + scrolling up -> go to previous page
      else if (dy < 0 && scrollTop <= 4) {
        upOverflowAccum += Math.abs(dy);
        downOverflowAccum = 0;
        setGuidanceCharge(upOverflowAccum / 100);
        if (upOverflowAccum >= 100 && prevPage) {
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

/**
 * 6. Global Language Switcher (中文 / EN) Across All Pages
 *    - Persists selection in localStorage ('shawn_site_lang')
 *    - Updates all elements with data-i18n-zh / data-i18n-en & data-i18n-html-zh / data-i18n-html-en
 */
function getSiteLanguage() {
  try {
    return localStorage.getItem('shawn_site_lang') || 'zh';
  } catch (_) {
    return 'zh';
  }
}

function applySiteLanguage(lang) {
  const normalized = lang === 'en' ? 'en' : 'zh';
  document.documentElement.setAttribute('data-site-lang', normalized);
  try {
    localStorage.setItem('shawn_site_lang', normalized);
  } catch (_) {}

  document.querySelectorAll('.nav-lang-btn .lang-opt').forEach((opt) => {
    opt.classList.toggle('is-active', opt.getAttribute('data-lang') === normalized);
  });

  document.querySelectorAll('[data-i18n-zh][data-i18n-en]').forEach((el) => {
    const val = el.getAttribute(normalized === 'en' ? 'data-i18n-en' : 'data-i18n-zh');
    if (val !== null) {
      el.textContent = val;
    }
  });

  document.querySelectorAll('[data-i18n-html-zh][data-i18n-html-en]').forEach((el) => {
    const val = el.getAttribute(normalized === 'en' ? 'data-i18n-html-en' : 'data-i18n-html-zh');
    if (val !== null) {
      el.innerHTML = val;
    }
  });

  window.dispatchEvent(new CustomEvent('shawn:langchange', { detail: { lang: normalized } }));
}

function initGlobalLanguageSwitcher() {
  const currentLang = getSiteLanguage();
  applySiteLanguage(currentLang);

  document.querySelectorAll('.nav-lang-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nextLang = getSiteLanguage() === 'zh' ? 'en' : 'zh';
      applySiteLanguage(nextLang);
    });
  });
}

/**
 * 7. Interactive Operations on "How Can I Help" Page (help.html)
 *    - Top horizontal bar switches which single proposal card is displayed (.help-filter-btn)
 *    - "了解更多 / Learn More" button opens the Liquid Glass Full Details Modal (#help-detail-modal)
 *    - One-click copy email address (shawnfeng@moonshotacademy.cn) + open mailto
 */
function initHelpPageInteractions() {
  const filterBtns = document.querySelectorAll('.help-filter-btn');
  const copyBtns = document.querySelectorAll('.help-copy-btn');
  const helpItems = document.querySelectorAll('[data-help-category]');
  const openModalTriggers = document.querySelectorAll('[data-open-help-modal]');
  const helpModal = document.getElementById('help-detail-modal');
  const helpModalTag = document.getElementById('help-modal-tag');
  const helpModalTitle = document.getElementById('help-modal-title');
  const helpModalBody = document.getElementById('help-modal-body');
  const helpModalClose = document.getElementById('help-modal-close');
  const toastEl = document.getElementById('help-copy-toast');
  let toastTimer = null;
  let activeModalKey = null;

  const HELP_DETAILS_DATA = {
    photo: {
      tag: 'PROPOSAL 01 / PHOTOGRAPHY & COLOR GRADING',
      titleZh: '摄影与后期调色 · 线上指导详情',
      titleEn: 'Photography & Color Grading · Full Details',
      rows: [
        {
          labelZh: '帮谁 WHO',
          labelEn: 'WHO I HELP',
          valZh: '想提升拍照构图、想拍出有氛围感的城市风光或人像，或拍完照片不知道如何用 Lightroom / Camera Raw 调出干净冷暖色调的同学与摄影新手（手机或相机拍照均可）。',
          valEn: 'Students and beginners who want to improve photo framing, master twilight exposure, or learn clean Lightroom / Camera Raw color grading (phone or camera welcome).'
        },
        {
          labelZh: '做什么 WHAT',
          labelEn: 'WHAT WE DO',
          valZh: '提供线上摄影与修图指导：解答你在拍摄构图、曝光参数（ISO/快门/光圈）与后期修图上的疑问；你可以把原片发到我邮箱，我在线上为你分析取景构图并做调色修改示范。',
          valEn: 'Online photography & grading guidance: send your photos to my email for framing critique, exposure parameter Q&A (ISO/shutter/aperture), and step-by-step Lightroom grading demos.'
        },
        {
          labelZh: '相关经历 EXP',
          labelEn: 'EXPERIENCE',
          valZh: '持续 2 年个人摄影项目，走过北京、郑州、西安、上海、重庆、甘肃、九寨沟等地，独立完成 10 余组建筑、风光与人文纪实系列的拍摄、选片与后期调色。',
          valEn: '2-year personal photography project across Beijing, Zhengzhou, Xi’an, Shanghai, Chongqing, Gansu, and Jiuzhaigou—independently shooting and grading 10+ architectural and landscape series.'
        },
        {
          labelZh: '投入时间 TIME',
          labelEn: 'TIME COMMIT',
          valZh: '每周末可投入 1.5 – 2 小时提供线上看片与调色指导，平时收到提问邮件后也会在当天或次日详细回复。',
          valEn: '1.5–2 hours every weekend for online photo critique and grading walkthroughs, plus email replies within 24–48 hours on school days.'
        },
        {
          labelZh: '怎样开始 START',
          labelEn: 'HOW TO START',
          valZh: '直接发送邮件至 shawnfeng@moonshotacademy.cn，附上 1–3 张你拍的原片或你想请教的摄影/调色问题即可开始！',
          valEn: 'Send an email to shawnfeng@moonshotacademy.cn with 1–3 of your photos or your specific photography/color grading question.'
        }
      ],
      topics: [
        {
          num: 'TOPIC 01 · FRAMING',
          zh: '线上构图评析：分析三分法、引导线、画面裁剪比例与长焦空间压缩技巧。',
          en: 'Online Framing Critique: Rule of thirds, leading lines, aspect crops, and telephoto compression.'
        },
        {
          num: 'TOPIC 02 · EXPOSURE',
          zh: '光线与参数答疑：解答日落与蓝调时刻如何避免高光过曝或暗部死黑。',
          en: 'Exposure & Twilight Q&A: How to balance sunset highlights and blue-hour shadow detail.'
        },
        {
          num: 'TOPIC 03 · GRADING',
          zh: '后期调色示范：演示色温校准、暗部细节提亮与冷暖色调分离。',
          en: 'RAW Color Grading: White balance calibration, shadow recovery, and cool-warm color separation.'
        }
      ],
      checks: [
        {
          zh: '你想请教的具体问题（例如：怎么构图更有层次 / 夜景怎么去噪点 / 怎么调出蓝调冷暖对比）',
          en: 'Your specific question (e.g., how to improve framing depth, reduce night noise, or grade blue-hour tones)'
        },
        {
          zh: '1–3 张你拍的原片（RAW 或 JPG 均可）或参考图，直接作为邮件附件发送',
          en: '1–3 original photos (RAW or JPG) or reference images attached to your email'
        },
        {
          zh: '你目前使用的拍摄设备（手机型号 / 微单或单反相机均可）',
          en: 'Your shooting device (smartphone model or mirrorless/DSLR camera)'
        }
      ]
    },
    drone: {
      tag: 'PROPOSAL 02 / DRONE AERIAL & SAFE FLIGHT',
      titleZh: '无人机航拍与安全飞行 · 线上指导详情',
      titleEn: 'Drone Aerial & Safe Flight · Full Details',
      rows: [
        {
          labelZh: '帮谁 WHO',
          labelEn: 'WHO I HELP',
          valZh: '对大疆（DJI）无人机感兴趣想咨询选购、刚买无人机不敢独自起飞、不清楚 2025 空域政策与实名登记流程，或想学习高空俯拍（Top-Down）构图的同学。',
          valEn: 'Students curious about choosing a DJI drone, nervous about their first flight, unsure about 2025 airspace registration rules, or learning top-down aerial composition.'
        },
        {
          labelZh: '做什么 WHAT',
          labelEn: 'WHAT WE DO',
          valZh: '提供无人机航拍全流程线上指导：为你解答 UOM 实名登记、适飞空域查询、返航高度与避障设置等安全问题，并在线上指导航拍运镜方法、高空俯视构图与全景合成。',
          valEn: 'Online drone guidance covering UOM real-name registration, legal airspace checks, RTH/obstacle safety settings, top-down composition, and aerial panorama stitching.'
        },
        {
          labelZh: '相关经历 EXP',
          labelEn: 'EXPERIENCE',
          valZh: '4 年无人机航拍经验，曾赴甘肃苦水丹霞、川西九寨沟、西安中轴线与永宁门、郑州龙湖湿地等地航拍创作，熟悉北京 2025 新规下的合规安全飞行操作。',
          valEn: '4 years of DJI drone aerial experience across Gansu Danxia, Jiuzhaigou, Xi’an Central Axis, and Zhengzhou wetlands, well-versed in Beijing’s 2025 airspace regulations.'
        },
        {
          labelZh: '投入时间 TIME',
          labelEn: 'TIME COMMIT',
          valZh: '每周末可投入 1 – 1.5 小时提供线上航拍构图与后期指导，平时随时通过邮件解答机型选购、空域申报与飞行设置问题。',
          valEn: '1–1.5 hours every weekend for online aerial composition and post-processing guidance, plus anytime email Q&A on gear and airspace rules.'
        },
        {
          labelZh: '怎样开始 START',
          labelEn: 'HOW TO START',
          valZh: '哪怕你还没有买无人机，也可以直接发邮件至 shawnfeng@moonshotacademy.cn 告诉我你想了解“选购/申报”还是“航拍构图与后期”！',
          valEn: 'Even if you do not own a drone yet, email shawnfeng@moonshotacademy.cn and let me know whether you want advice on gear/airspace rules or aerial composition.'
        }
      ],
      topics: [
        {
          num: 'TOPIC 01 · SAFE & LEGAL',
          zh: '空域与合规指导：查询适飞空域、UOM 实名登记，以及起飞前 GPS 与返航高度设置。',
          en: 'Airspace & Safety: Checking legal fly zones, UOM registration, and pre-flight RTH settings.'
        },
        {
          num: 'TOPIC 02 · COMPOSITION',
          zh: '高空俯拍构图：如何利用道路、河流与建筑几何轴线拍出有秩序感的航拍画面。',
          en: 'Aerial Composition: Using roads, shorelines, and architectural axes for striking top-down frames.'
        },
        {
          num: 'TOPIC 03 · AERIAL EDIT',
          zh: '航拍后期与接片：解答 D-Log M 色彩还原、广角畸变校正与高空全景合成。',
          en: 'Aerial Post-Processing: D-Log M color recovery, distortion correction, and panorama stitching.'
        }
      ],
      checks: [
        {
          zh: '了解北京及出游目的地如何查询合法适飞空域与 UOM 实名登记流程',
          en: 'How to check legal flight zones in Beijing/travel destinations and complete UOM registration'
        },
        {
          zh: '新手选购哪款大疆无人机更合适，或第一次起飞前需要做哪些安全参数设置',
          en: 'Which DJI drone model suits beginners best and essential pre-flight safety settings'
        },
        {
          zh: '如何对航拍照片或视频进行俯视构图裁剪与 D-Log 色彩还原',
          en: 'How to frame top-down aerial shots and grade D-Log aerial footage'
        }
      ]
    },
    digital: {
      tag: 'PROPOSAL 03 / VIBE CODING & AI WEB CREATION',
      titleZh: 'Vibe Coding 个人建站 · 线上指导详情',
      titleEn: 'Vibe Coding & Web Creation · Full Details',
      rows: [
        {
          labelZh: '帮谁 WHO',
          labelEn: 'WHO I HELP',
          valZh: '没有深厚编程基础，但想通过 Figma + AI (Vibe Coding) 把自己的设计想法变成可交互的个人网站，并发布上线到 GitHub Pages 的同学。',
          valEn: 'Students without heavy coding backgrounds who want to turn a Figma design or concept into a live interactive website using AI (Vibe Coding).'
        },
        {
          labelZh: '做什么 WHAT',
          labelEn: 'WHAT WE DO',
          valZh: '提供 Vibe Coding 建站全流程线上指导：教你如何把 Figma 布局转化为结构化 AI 提示词（Prompt）、一步步调试 HTML/CSS/JS 视觉效果与交互动画，并部署到 GitHub Pages。',
          valEn: 'Online Vibe Coding guidance: writing structured AI prompts from Figma designs, refining HTML/CSS/JS visual hierarchy and animations, and deploying to GitHub Pages.'
        },
        {
          labelZh: '相关经历 EXP',
          labelEn: 'EXPERIENCE',
          valZh: '独立使用 Figma 进行多页面视觉与组件设计，并通过 Vibe Coding（AI 协同编程）完成了当前这个包含液态玻璃光学折射、3D 无人机物理交互与双语切换的个人作品集网站。',
          valEn: 'Independently designed in Figma and built this Liquid Glass portfolio website through Vibe Coding—featuring SVG optical refraction, 3D drone physics, and bilingual i18n.'
        },
        {
          labelZh: '投入时间 TIME',
          labelEn: 'TIME COMMIT',
          valZh: '每周可投入 45 – 60 分钟在线上帮你看提示词、调网页样式或排查部署问题，平时收到提问邮件后也会及时回复。',
          valEn: '45–60 minutes weekly for online prompt review, CSS layout debugging, or GitHub Pages troubleshooting, plus timely email replies.'
        },
        {
          labelZh: '怎样开始 START',
          labelEn: 'HOW TO START',
          valZh: '直接发邮件到 shawnfeng@moonshotacademy.cn 把你的 Figma 设计截图、想实现的页面效果或遇到的报错发给我，即可获取线上指导！',
          valEn: 'Email your Figma screenshot, desired webpage interaction, or bug to shawnfeng@moonshotacademy.cn to get started.'
        }
      ],
      topics: [
        {
          num: 'TOPIC 01 · FIGMA TO PROMPT',
          zh: '结构化提示词编写：如何向 AI 清晰交代现有文件、视觉层级、修改范围与保留内容。',
          en: 'Structured AI Prompting: Clearly specifying files, visual hierarchy, scope, and constraints.'
        },
        {
          num: 'TOPIC 02 · UI & INTERACTION',
          zh: '页面排版与交互精修：如何用自然语言引导 AI 调整照片比例、弹窗交互与中英双语切换。',
          en: 'UI & Interaction Refinement: Guiding AI to fine-tune aspect ratios, modals, and bilingual toggles.'
        },
        {
          num: 'TOPIC 03 · GITHUB PAGES',
          zh: '个人网站发布上线：如何把本地 HTML/CSS/JS 文件夹上传到 GitHub 仓库并生成公开链接。',
          en: 'GitHub Pages Publishing: Uploading local HTML/CSS/JS files to GitHub for a live public URL.'
        }
      ],
      checks: [
        {
          zh: '你想制作的个人网站草图、Figma 页面截图或参考网站风格',
          en: 'A sketch, Figma screenshot, or reference style for the personal website you want to build'
        },
        {
          zh: '你在 Vibe Coding 时遇到的具体卡点（如：布局错位 / 照片被裁切 / GitHub Pages 链接打不开）',
          en: 'Specific Vibe Coding blockers you hit (e.g., layout shifts, cropped images, or GitHub Pages setup)'
        },
        {
          zh: '直接发邮件至 shawnfeng@moonshotacademy.cn，我通过邮件为你提供一步步的线上指导',
          en: 'Send directly to shawnfeng@moonshotacademy.cn for step-by-step online guidance'
        }
      ]
    }
  };

  function renderHelpDetailModal(key) {
    const data = HELP_DETAILS_DATA[key];
    if (!data || !helpModalBody) return;
    activeModalKey = key;
    const isEn = getSiteLanguage() === 'en';

    if (helpModalTag) helpModalTag.textContent = data.tag;
    if (helpModalTitle) helpModalTitle.textContent = isEn ? data.titleEn : data.titleZh;

    const rowsHtml = data.rows
      .map(
        (r) => `
        <div class="modal-meta-row">
          <span class="modal-meta-label">${isEn ? r.labelEn : r.labelZh}</span>
          <span class="modal-meta-value">${isEn ? r.valEn : r.valZh}</span>
        </div>`
      )
      .join('');

    const topicsHtml = data.topics
      .map(
        (t) => `
        <div class="drawer-step-box">
          <div class="drawer-step-num">${t.num}</div>
          <div class="drawer-step-text">${isEn ? t.en : t.zh}</div>
        </div>`
      )
      .join('');

    const checksHtml = data.checks
      .map(
        (c, i) => `
        <label class="drawer-check-item">
          <input type="checkbox" ${i === 0 ? 'checked' : ''}>
          <span>${isEn ? c.en : c.zh}</span>
        </label>`
      )
      .join('');

    helpModalBody.innerHTML = `
      <div class="modal-meta-list">${rowsHtml}</div>
      <div>
        <div class="drawer-section-title">${
          isEn
            ? 'ONLINE GUIDANCE TOPICS · 3 AREAS I CAN HELP WITH'
            : 'ONLINE GUIDANCE TOPICS · 我能在线上为你指导与解答的 3 件事'
        }</div>
        <div class="drawer-steps">${topicsHtml}</div>
      </div>
      <div>
        <div class="drawer-section-title">${
          isEn
            ? 'INTERACTIVE CHECKLIST · WHAT TO INCLUDE IN YOUR EMAIL'
            : 'INTERACTIVE CHECKLIST · 发邮件获取线上指导时可以附上（可点击勾选）'
        }</div>
        <div class="drawer-checklist">${checksHtml}</div>
      </div>
    `;
  }

  function openHelpModal(key) {
    if (!helpModal) return;
    renderHelpDetailModal(key);
    helpModal.classList.add('is-active');
    helpModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeHelpModal() {
    if (!helpModal) return;
    helpModal.classList.remove('is-active');
    helpModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    activeModalKey = null;
  }

  openModalTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const key = trigger.getAttribute('data-open-help-modal') || 'photo';
      openHelpModal(key);
    });
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const key = trigger.getAttribute('data-open-help-modal') || 'photo';
        openHelpModal(key);
      }
    });
  });

  if (helpModalClose) {
    helpModalClose.addEventListener('click', closeHelpModal);
  }
  if (helpModal) {
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) closeHelpModal();
    });
  }

  // Photo Lightbox on Help Page (Clicking Any Image Opens the Image Itself, Not Details Modal)
  const photoTriggers = document.querySelectorAll('[data-open-help-photo]');
  const photoLightbox = document.getElementById('help-photo-lightbox');
  const photoLightboxImg = document.getElementById('help-photo-lightbox-img');
  const photoLightboxCaption = document.getElementById('help-photo-lightbox-caption');
  const photoLightboxClose = document.getElementById('help-photo-lightbox-close');

  function openHelpPhotoLightbox(src, caption) {
    if (!photoLightbox || !photoLightboxImg) return;
    photoLightboxImg.src = src;
    photoLightboxImg.alt = caption || 'Preview';
    if (photoLightboxCaption) {
      photoLightboxCaption.textContent = caption || '';
    }
    photoLightbox.classList.add('is-active');
    photoLightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeHelpPhotoLightbox() {
    if (!photoLightbox) return;
    photoLightbox.classList.remove('is-active');
    photoLightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  photoTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const src = trigger.getAttribute('data-open-help-photo');
      const caption = trigger.getAttribute('data-photo-caption') || '';
      if (src) openHelpPhotoLightbox(src, caption);
    });
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        const src = trigger.getAttribute('data-open-help-photo');
        const caption = trigger.getAttribute('data-photo-caption') || '';
        if (src) openHelpPhotoLightbox(src, caption);
      }
    });
  });

  if (photoLightboxClose) {
    photoLightboxClose.addEventListener('click', closeHelpPhotoLightbox);
  }
  if (photoLightbox) {
    photoLightbox.addEventListener('click', (e) => {
      if (e.target === photoLightbox || e.target.id === 'help-photo-lightbox-inner') {
        closeHelpPhotoLightbox();
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (photoLightbox && photoLightbox.classList.contains('is-active')) {
        closeHelpPhotoLightbox();
      } else if (helpModal && helpModal.classList.contains('is-active')) {
        closeHelpModal();
      }
    }
  });

  window.addEventListener('shawn:langchange', () => {
    if (activeModalKey && helpModal && helpModal.classList.contains('is-active')) {
      renderHelpDetailModal(activeModalKey);
    }
  });

  // Top Horizontal Switcher Bar: Only Show 1 Help Proposal at a Time
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedFilter =
        btn.getAttribute('data-help-filter') || btn.getAttribute('data-filter') || 'photo';
      filterBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });

      helpItems.forEach((item) => {
        const cat = item.getAttribute('data-help-category');
        const isMatch = cat === selectedFilter;
        item.classList.toggle('is-active-panel', isMatch);
        item.hidden = !isMatch;
      });
    });
  });

  // One-Click Copy Email (shawnfeng@moonshotacademy.cn) + Toast Notification
  function showCopyToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 3200);
  }

  copyBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const textToCopy = btn.getAttribute('data-copy-text') || 'shawnfeng@moonshotacademy.cn';
      const mailtoUrl = btn.getAttribute('data-mailto') || '';
      const isEn = getSiteLanguage() === 'en';

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          const tempArea = document.createElement('textarea');
          tempArea.value = textToCopy;
          tempArea.style.position = 'fixed';
          tempArea.style.opacity = '0';
          document.body.appendChild(tempArea);
          tempArea.select();
          document.execCommand('copy');
          document.body.removeChild(tempArea);
        }
      } catch (_) {}

      const originalText = btn.textContent;
      btn.classList.add('is-copied');
      btn.textContent = isEn
        ? '✓ Copied: shawnfeng@moonshotacademy.cn'
        : '✓ 已复制邮箱：shawnfeng@moonshotacademy.cn';
      showCopyToast(
        isEn
          ? '✓ Copied shawnfeng@moonshotacademy.cn to clipboard! Feel free to email me anytime.'
          : '✓ 已复制邮箱 shawnfeng@moonshotacademy.cn 到剪贴板！欢迎随时发邮件获取线上指导。'
      );

      if (mailtoUrl) {
        window.location.href = mailtoUrl;
      }

      setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.textContent = originalText;
      }, 2600);
    });
  });
}

/**
 * 8. DJI Fly 3D Third-Person Minimalist Geometric Flight Simulator (#drone-fpv-modal)
 *    - Opens when clicking the DJI Drone on the About Page
 *    - Real-time 3D perspective flat-shaded geometric engine on #fpv-3d-canvas
 *    - Third-person chase camera following a 3D geometric DJI quadcopter with 4 spinning 3D rotors
 *    - 3 Minimalist 3D Geometric Scenes:
 *        * 01 · 几何城市 (city)      — Architectural 3D skyscrapers, stepped towers, avenues & twin monuments
 *        * 02 · 几何山川 (mountain)  — Low-poly faceted snow-capped peaks, danxia ridges & winding river canyon
 *        * 03 · 几何草原 (grassland) — Rolling faceted emerald hills, geometric pine trees, stream & white yurts
 *    - Controls:
 *        * W / A / S / D -> Forward / Backward / Strafe Left / Strafe Right (前后左右)
 *        * Q / E         -> Yaw Rotate Left / Right (左右转向)
 *        * ↑ / ↓ Arrows  -> Climb / Descend Altitude (控制高低)
 *        * Bottom-right button (#fpv-help-btn) opens the Drone Control Guide (#fpv-controls-modal)
 */
function initDroneFpvCard() {
  const modal = document.getElementById('drone-fpv-modal');
  if (!modal) return;

  const cardEl = document.getElementById('drone-fpv-card');
  const canvas = document.getElementById('fpv-3d-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;

  const closeBtn = document.getElementById('fpv-close-btn');
  const statusTextEl = document.getElementById('fpv-status-text');
  const viewBtn = document.getElementById('fpv-view-btn');
  const viewLabel = document.getElementById('fpv-view-label');

  const horizonGroup = document.getElementById('fpv-horizon-group');
  const compassTrack = document.getElementById('fpv-compass-track');
  const headingVal = document.getElementById('fpv-heading-val');

  const spdVal = document.getElementById('fpv-spd-val');
  const vsVal = document.getElementById('fpv-vs-val');
  const altVal = document.getElementById('fpv-alt-val');
  const distVal = document.getElementById('fpv-dist-val');
  const pitchReadout = document.getElementById('fpv-pitch-readout');
  const rollReadout = document.getElementById('fpv-roll-readout');
  const gimbalReadout = document.getElementById('fpv-gimbal-readout');
  const gimbalAngleBadge = document.getElementById('fpv-gimbal-angle-badge');
  const gimbalThumb = document.getElementById('fpv-gimbal-thumb');

  const radarCompass = document.getElementById('fpv-radar-compass');
  const radarHorizon = document.getElementById('fpv-radar-horizon');

  const crashTitleEl = document.getElementById('fpv-crash-title');
  const crashDescEl = document.getElementById('fpv-crash-desc');
  const crashRetryBtn = document.getElementById('fpv-crash-retry-btn');

  const shutterFlash = document.getElementById('fpv-shutter-flash');
  const captureBadge = document.getElementById('fpv-capture-badge');

  const stickLeft = document.getElementById('fpv-stick-left');
  const knobLeft = document.getElementById('fpv-knob-left');
  const stickRight = document.getElementById('fpv-stick-right');
  const knobRight = document.getElementById('fpv-knob-right');

  const modeBtns = modal.querySelectorAll('.fpv-mode-btn');
  const sceneBtns = modal.querySelectorAll('.fpv-scene-btn');
  const timeBtns = modal.querySelectorAll('[data-env-time]');
  const weatherBtns = modal.querySelectorAll('[data-env-weather]');
  const seasonBtns = modal.querySelectorAll('[data-env-season]');

  const envDropdownWrap = document.getElementById('fpv-env-dropdown-wrap');
  const envToggleBtn = document.getElementById('fpv-env-toggle-btn');
  const envSummaryEl = document.getElementById('fpv-env-summary');
  const envPopover = document.getElementById('fpv-env-popover');
  const envRandomBtn = document.getElementById('fpv-env-random-btn');

  const rthBtn = document.getElementById('fpv-rth-btn');
  const gimbalBtn = document.getElementById('fpv-gimbal-btn');
  const shutterBtn = document.getElementById('fpv-shutter-btn');

  const helpBtn = document.getElementById('fpv-help-btn');
  const controlsModal = document.getElementById('fpv-controls-modal');
  const controlsCloseBtn = document.getElementById('fpv-controls-close');
  const controlsOkBtn = document.getElementById('fpv-controls-ok');

  let isActive = false;
  let activeSceneKey = 'city'; // 'city' | 'mountain' | 'grassland'
  let flightMode = 'normal';   // 'cine' | 'normal' | 'sport'
  const modeMultipliers = { cine: 0.6, normal: 1.0, sport: 1.65 };

  // Environment & Lighting State (Time / Weather / Season)
  let envTime = 'sunset';     // 'day' | 'sunset' | 'night'
  let envWeather = 'clear';   // 'clear' | 'rain' | 'snow' | 'fog'
  let envSeason = 'summer';   // 'spring' | 'summer' | 'autumn' | 'winter'

  // Camera View State (3rd-Person vs 1st-Person toggled via 'C')
  let isFirstPerson = false;

  // Gimbal Pitch Angle (-90° top-down to +20° upward, controlled via Mouse Wheel)
  let gimbalAngleDeg = -22;
  const gimbalPresets = [-22, -45, -90, 0];
  let gimbalPresetIdx = 0;

  // Crash & Collision State
  let isCrashed = false;
  let crashShakeTime = 0;
  let crashDebris = [];

  // Normalized joystick inputs (-1 to +1)
  let leftX = 0;  // Yaw rate (Q/E)
  let leftY = 0;  // Throttle / Altitude (↑/↓)
  let rightX = 0; // Roll / Strafe Left-Right (A/D)
  let rightY = 0; // Pitch / Forward-Backward (W/S)

  // 3D Drone World State & Inertial Physics
  const WRAP_SIZE = 760;
  const HALF_WRAP = WRAP_SIZE / 2;
  let droneX = 0;
  let droneY = 45; // Altitude H (m)
  let droneZ = 0;
  let vxWorld = 0;
  let vzWorld = 0;
  let vyWorld = 0;
  let yawVel = 0;  // Rotational angular velocity (deg/s) for smooth yaw inertia

  let headingDeg = 0;
  let currentRoll = 0;  // degrees
  let currentPitch = 0; // degrees
  let rotorPhase = 0;

  let captureTimer = null;
  const keysPressed = {};

  // =========================================================================
  // High-Density 3D Weather Particles (520 Snowflakes / Raindrops) & Starfield
  // =========================================================================
  const weatherParticles = Array.from({ length: 520 }, () => ({
    x: (Math.random() - 0.5) * 210,
    y: Math.random() * 125,
    z: (Math.random() - 0.5) * 210,
    speed: 24 + Math.random() * 22,
    drift: Math.random() * Math.PI * 2,
    driftZ: Math.random() * Math.PI * 2,
    sizeScale: 0.65 + Math.random() * 1.15
  }));

  const starField = Array.from({ length: 110 }, () => ({
    az: Math.random() * Math.PI * 2,
    el: 0.08 + Math.random() * 0.72,
    size: 1 + Math.random() * 1.7,
    phase: Math.random() * Math.PI * 2
  }));

  // =========================================================================
  // 3D Geometry Builders (Minimalist Low-Poly Architectural & Natural Meshes)
  // =========================================================================
  function createBoxFaces(cx, baseY, cz, w, h, d, sideRgb, topRgb, accentRoof, emissiveSide, alphaVal) {
    const hw = w / 2;
    const hd = d / 2;
    const y0 = baseY;
    const y1 = baseY + h;

    const v000 = [cx - hw, y0, cz - hd];
    const v100 = [cx + hw, y0, cz - hd];
    const v101 = [cx + hw, y0, cz + hd];
    const v001 = [cx - hw, y0, cz + hd];

    const v010 = [cx - hw, y1, cz - hd];
    const v110 = [cx + hw, y1, cz - hd];
    const v111 = [cx + hw, y1, cz + hd];
    const v011 = [cx - hw, y1, cz + hd];

    const em = emissiveSide || 0;
    const al = alphaVal !== undefined ? alphaVal : 1;
    const faces = [
      { verts: [v001, v101, v111, v011], rgb: sideRgb, emissive: em, alpha: al }, // +Z Front
      { verts: [v100, v000, v010, v110], rgb: sideRgb, emissive: em, alpha: al }, // -Z Back
      { verts: [v101, v100, v110, v111], rgb: sideRgb, emissive: em, alpha: al }, // +X Right
      { verts: [v000, v001, v011, v010], rgb: sideRgb, emissive: em, alpha: al }, // -X Left
      { verts: [v011, v111, v110, v010], rgb: topRgb || sideRgb, emissive: em * 0.5, alpha: al } // +Y Top
    ];
    if (al < 1) {
      // Include underside for translucent volumetric clouds
      faces.push({
        verts: [v000, v100, v101, v001],
        rgb: [
          Math.max(0, sideRgb[0] - 28),
          Math.max(0, sideRgb[1] - 28),
          Math.max(0, sideRgb[2] - 24)
        ],
        emissive: em * 0.2,
        alpha: al * 0.92
      });
    }

    if (accentRoof) {
      const rw = hw * 0.66;
      const rd = hd * 0.66;
      const ry = y1 + 0.35;
      faces.push({
        verts: [
          [cx - rw, ry, cz + rd],
          [cx + rw, ry, cz + rd],
          [cx + rw, ry, cz - rd],
          [cx - rw, ry, cz - rd]
        ],
        rgb: accentRoof,
        emissive: 0.48,
        doubleSided: true
      });
    }
    return faces;
  }

  function createPyramidFaces(cx, baseY, cz, radius, h, sides, baseRgb, capRgb, capRatio, rotOffset, emissiveCap) {
    const faces = [];
    const rot = rotOffset || 0;
    const ring0 = [];
    for (let i = 0; i < sides; i++) {
      const a = rot + (i / sides) * Math.PI * 2;
      ring0.push([cx + Math.cos(a) * radius, baseY, cz + Math.sin(a) * radius]);
    }
    const apex = [cx, baseY + h, cz];

    if (capRgb && capRatio && capRatio > 0 && capRatio < 1) {
      const splitRatio = 1 - capRatio;
      const ringMid = ring0.map((v) => [
        v[0] + (apex[0] - v[0]) * splitRatio,
        v[1] + (apex[1] - v[1]) * splitRatio,
        v[2] + (apex[2] - v[2]) * splitRatio
      ]);
      for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides;
        faces.push({
          verts: [ring0[next], ring0[i], ringMid[i], ringMid[next]],
          rgb: baseRgb
        });
        faces.push({
          verts: [ringMid[next], ringMid[i], apex],
          rgb: capRgb,
          emissive: emissiveCap || 0
        });
      }
    } else {
      for (let i = 0; i < sides; i++) {
        const next = (i + 1) % sides;
        faces.push({
          verts: [ring0[next], ring0[i], apex],
          rgb: baseRgb,
          emissive: emissiveCap || 0
        });
      }
    }
    return faces;
  }

  function createPrismFaces(cx, baseY, cz, radius, h, sides, sideRgb, topRgb, emissiveVal, alphaVal) {
    const faces = [];
    const bot = [];
    const top = [];
    const em = emissiveVal || 0;
    const al = alphaVal !== undefined ? alphaVal : 1;
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const x = cx + Math.cos(a) * radius;
      const z = cz + Math.sin(a) * radius;
      bot.push([x, baseY, z]);
      top.push([x, baseY + h, z]);
    }
    for (let i = 0; i < sides; i++) {
      const next = (i + 1) % sides;
      faces.push({
        verts: [bot[next], bot[i], top[i], top[next]],
        rgb: sideRgb,
        emissive: em,
        alpha: al
      });
    }
    faces.push({
      verts: top,
      rgb: topRgb || sideRgb,
      emissive: em * 0.7,
      alpha: al
    });
    return faces;
  }

  function createGroundShadowQuad(cx, cz, rx, rz, sunOffsetX, sunOffsetZ, alpha) {
    const sx = cx + sunOffsetX;
    const sz = cz + sunOffsetZ;
    return {
      verts: [
        [sx - rx, 0.12, sz + rz],
        [sx + rx, 0.12, sz + rz],
        [sx + rx, 0.12, sz - rz],
        [sx - rx, 0.12, sz - rz]
      ],
      rgb: [4, 7, 12],
      alpha: alpha || 0.28,
      doubleSided: true,
      emissive: 0
    };
  }

  // Multi-Layered 3D Volumetric Cumulus Cloud Cluster (体积云)
  function createVolumetricCloudCluster(cx, cy, cz, scale, timeOfDay, rng) {
    let sideCol = [206, 222, 238];
    let topCol = [248, 252, 255];
    let underCol = [162, 182, 206];
    let em = 0.08;

    if (timeOfDay === 'sunset') {
      sideCol = [232, 156, 124];
      topCol = [255, 214, 172];
      underCol = [138, 96, 114];
      em = 0.24;
    } else if (timeOfDay === 'night') {
      sideCol = [48, 66, 92];
      topCol = [84, 108, 142];
      underCol = [28, 40, 58];
      em = 0.12;
    }

    const w0 = (38 + rng() * 26) * scale;
    const d0 = (26 + rng() * 18) * scale;
    const h0 = (9 + rng() * 6) * scale;

    const faces = [
      // 1. Wide Lower Cumulus Anvil Base
      ...createBoxFaces(cx, cy - h0 * 0.35, cz, w0 * 1.25, h0 * 0.55, d0 * 1.2, underCol, sideCol, null, em * 0.6, 0.72),
      // 2. Main Central Volumetric Core
      ...createBoxFaces(cx, cy, cz, w0, h0, d0, sideCol, topCol, null, em, 0.84),
      // 3. Upper Sunlit Cumulus Dome
      ...createBoxFaces(cx - w0 * 0.08, cy + h0 * 0.75, cz + d0 * 0.05, w0 * 0.62, h0 * 0.72, d0 * 0.62, topCol, [255, 255, 255], null, em * 1.3, 0.88),
      // 4. Flanking Billow Lobe Left
      ...createBoxFaces(cx - w0 * 0.48, cy + h0 * 0.12, cz - d0 * 0.15, w0 * 0.58, h0 * 0.68, d0 * 0.66, sideCol, topCol, null, em * 0.9, 0.78),
      // 5. Flanking Billow Lobe Right
      ...createBoxFaces(cx + w0 * 0.46, cy + h0 * 0.08, cz + d0 * 0.18, w0 * 0.54, h0 * 0.62, d0 * 0.6, sideCol, topCol, null, em * 0.9, 0.78),
      // 6. Soft Outer Mist Halo Skirt
      {
        verts: [
          [cx - w0 * 0.85, cy - h0 * 0.1, cz + d0 * 0.8],
          [cx + w0 * 0.85, cy - h0 * 0.1, cz + d0 * 0.8],
          [cx + w0 * 0.85, cy - h0 * 0.1, cz - d0 * 0.8],
          [cx - w0 * 0.85, cy - h0 * 0.1, cz - d0 * 0.8]
        ],
        rgb: topCol,
        alpha: 0.34,
        doubleSided: true,
        emissive: em
      }
    ];

    return {
      cx,
      cz,
      isCloud: true,
      driftSpeed: 2.2 + rng() * 2.4,
      colliders: [],
      faces
    };
  }

  // 3D Low-Altitude Volumetric Mist Sheet (体积雾层)
  function createVolumetricMistLayer(cx, y, cz, w, d, rgb, alpha) {
    const hw = w / 2;
    const hd = d / 2;
    return {
      cx,
      cz,
      isMist: true,
      colliders: [],
      faces: [
        {
          verts: [
            [cx - hw, y, cz + hd],
            [cx + hw, y, cz + hd],
            [cx + hw, y, cz - hd],
            [cx - hw, y, cz - hd]
          ],
          rgb,
          alpha,
          doubleSided: true,
          emissive: 0.18
        }
      ]
    };
  }

  function makeRng(seed) {
    let s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  // =========================================================================
  // Build the 3 Minimalist 3D Scenes (Landmarks, Ultra-High Snow Peaks, Volumetric Clouds)
  // =========================================================================
  function buildScenes(season, timeOfDay) {
    const scenes = {};
    const isWinter = season === 'winter';
    const isAutumn = season === 'autumn';
    const isSpring = season === 'spring';
    const isNight = timeOfDay === 'night';

    // =======================================================================
    // SCENE 01: 几何城市 (Minimalist Architectural 3D Metropolis + 3 Iconic Landmarks)
    // =======================================================================
    const cityObjects = [];
    const rngCity = makeRng(104729);
    const cityPalettes = [
      {
        side: [56, 74, 96],
        top: isWinter ? [225, 235, 246] : [88, 112, 140],
        accent: [240, 123, 50]
      },
      {
        side: [72, 86, 104],
        top: isWinter ? [232, 240, 250] : [110, 128, 150],
        accent: [56, 189, 248]
      },
      {
        side: [44, 58, 76],
        top: isWinter ? [218, 228, 240] : [74, 94, 118],
        accent: isNight ? [250, 204, 21] : null
      },
      {
        side: [92, 102, 116],
        top: isWinter ? [238, 244, 252] : [138, 150, 166],
        accent: [245, 185, 135]
      }
    ];

    // Glowing boulevard light strips along X=0 and Z=0
    for (let bz = -340; bz <= 340; bz += 48) {
      cityObjects.push({
        cx: 0,
        cz: bz,
        colliders: [],
        faces: [
          {
            verts: [
              [-2.2, 0.18, bz - 14],
              [2.2, 0.18, bz - 14],
              [2.2, 0.18, bz + 14],
              [-2.2, 0.18, bz + 14]
            ],
            rgb: isNight ? [255, 170, 85] : [240, 123, 50],
            emissive: isNight ? 0.85 : 0.35,
            doubleSided: true
          }
        ]
      });
    }

    // -----------------------------------------------------------------------
    // ICONIC CITY LANDMARK 01: 双子星云端连廊大厦 (Nexus Twin Skybridge Towers)
    // Distinct turquoise-cyan & radiant gold glass towers connected by a high skybridge
    // -----------------------------------------------------------------------
    {
      const lx = -72;
      const lz = -86;
      const t1x = lx - 17;
      const t2x = lx + 17;
      const twinSide = [34, 126, 176];
      const twinTop = [148, 226, 255];
      const goldBand = [255, 192, 78];
      const cyanGlow = [56, 218, 255];

      const twinFaces = [
        createGroundShadowQuad(lx, lz, 38, 24, -26, 20, 0.36),
        // Grand Podium Base
        ...createBoxFaces(lx, 0, lz, 58, 14, 30, [42, 64, 92], [88, 132, 176], goldBand, 0.25),
        // West Tower & East Tower (148m main shafts)
        ...createBoxFaces(t1x, 14, lz, 18, 134, 18, twinSide, twinTop, null, isNight ? 0.42 : 0.22),
        ...createBoxFaces(t2x, 14, lz, 18, 134, 18, twinSide, twinTop, null, isNight ? 0.42 : 0.22),
        // Glowing Horizon Light Rings along both towers
        ...createBoxFaces(t1x, 56, lz, 19.2, 3, 19.2, cyanGlow, cyanGlow, null, 0.88),
        ...createBoxFaces(t2x, 56, lz, 19.2, 3, 19.2, cyanGlow, cyanGlow, null, 0.88),
        ...createBoxFaces(t1x, 126, lz, 19.2, 3, 19.2, goldBand, goldBand, null, 0.88),
        ...createBoxFaces(t2x, 126, lz, 19.2, 3, 19.2, goldBand, goldBand, null, 0.88),
        // High-Altitude Suspended Skybridge Observation Deck at Y=96..105m
        ...createBoxFaces(lx, 96, lz, 54, 9, 12, [240, 123, 50], [255, 208, 128], cyanGlow, 0.72),
        // Twin Diamond Crystal Crowns & Spires (reaching 178m!)
        ...createPyramidFaces(t1x, 148, lz, 11.5, 30, 4, cyanGlow, [255, 255, 255], 0.45, Math.PI / 4, 0.85),
        ...createPyramidFaces(t2x, 148, lz, 11.5, 30, 4, cyanGlow, [255, 255, 255], 0.45, Math.PI / 4, 0.85)
      ];

      const twinColliders = [
        { type: 'box', cx: t1x, cz: lz, hw: 9.5, hd: 9.5, y0: 0, y1: 178, labelZh: '城市地标·双子星西塔', labelEn: 'Landmark Twin West Tower' },
        { type: 'box', cx: t2x, cz: lz, hw: 9.5, hd: 9.5, y0: 0, y1: 178, labelZh: '城市地标·双子星东塔', labelEn: 'Landmark Twin East Tower' },
        { type: 'box', cx: lx, cz: lz, hw: 27, hd: 6, y0: 96, y1: 105, labelZh: '城市地标·双子星百米空中连廊', labelEn: 'Landmark Skybridge' }
      ];
      cityObjects.push({ cx: lx, cz: lz, faces: twinFaces, colliders: twinColliders });
    }

    // -----------------------------------------------------------------------
    // ICONIC CITY LANDMARK 02: 凌云水晶方尖碑巨塔 (The Spire / Neo-Crystal Megatower)
    // 220m tall 5-tier stepped hexagonal gold-amber & pearl monument
    // -----------------------------------------------------------------------
    {
      const sx = 78;
      const sz = -88;
      const goldSide = [196, 132, 54];
      const pearlTop = [252, 236, 198];
      const neonAmber = [255, 168, 52];

      const spireFaces = [
        createGroundShadowQuad(sx, sz, 34, 34, -36, 26, 0.38),
        // Tier 1: Hexagonal Megabase (0..58m)
        ...createPrismFaces(sx, 0, sz, 25, 58, 6, [142, 96, 48], pearlTop, 0.24),
        ...createPrismFaces(sx, 56, sz, 26.2, 3.2, 6, neonAmber, neonAmber, 0.9),
        // Tier 2: Mid Hexagonal Shaft (58..112m)
        ...createPrismFaces(sx, 58, sz, 19.5, 54, 6, goldSide, pearlTop, 0.32),
        ...createPrismFaces(sx, 110, sz, 20.6, 3.2, 6, [56, 218, 255], [56, 218, 255], 0.92),
        // Tier 3: Upper Crystal Sanctuary (112..158m)
        ...createPrismFaces(sx, 112, sz, 14, 46, 6, [224, 164, 78], [255, 246, 220], 0.42),
        ...createPrismFaces(sx, 156, sz, 15.2, 3, 6, neonAmber, neonAmber, 0.95),
        // Tier 4: Crown Lantern & 220m Obelisk Needle (158..220m)
        ...createPyramidFaces(sx, 158, sz, 13.5, 62, 6, neonAmber, [255, 255, 255], 0.52, 0, 0.92)
      ];

      const spireColliders = [
        { type: 'cone', cx: sx, cz: sz, rBase: 24, rTop: 2.5, y0: 0, y1: 220, labelZh: '城市地标·凌云水晶方尖碑巨塔', labelEn: 'Landmark Crystal Megatower' }
      ];
      cityObjects.push({ cx: sx, cz: sz, faces: spireFaces, colliders: spireColliders });
    }

    // -----------------------------------------------------------------------
    // ICONIC CITY LANDMARK 03: 天穹双球观景塔 (Celestial Dual-Sphere Observation Tower)
    // 196m futuristic needle tower with two giant glowing geometric spheres
    // -----------------------------------------------------------------------
    {
      const ox = 76;
      const oz = 84;
      const coralSphere = [236, 88, 112];
      const coralLight = [255, 148, 168];
      const cyanRing = [56, 224, 255];

      const pearlFaces = [
        createGroundShadowQuad(ox, oz, 30, 30, -30, 22, 0.35),
        // Base Podium
        ...createPrismFaces(ox, 0, oz, 22, 18, 6, [62, 78, 104], [118, 146, 182], 0.2),
        // Central Core Column (18..162m)
        ...createPrismFaces(ox, 18, oz, 5.8, 144, 6, [168, 186, 210], [235, 242, 252], 0.28),
        // Lower Giant Observation Sphere Pod (Y=62..88m)
        ...createPyramidFaces(ox, 62, oz, 18.5, 13, 8, coralSphere, coralLight, 0.5, 0, 0.55),
        ...createPrismFaces(ox, 73, oz, 19.8, 3.2, 8, cyanRing, cyanRing, 0.95),
        ...createPrismFaces(ox, 65, oz, 16.5, 18, 8, coralSphere, coralLight, 0.48),
        // Upper Observation Sphere Pod (Y=118..138m)
        ...createPrismFaces(ox, 120, oz, 13.2, 14, 8, coralSphere, coralLight, 0.56),
        ...createPrismFaces(ox, 125.5, oz, 14.6, 2.8, 8, [255, 206, 72], [255, 206, 72], 0.95),
        // High-Altitude Beacon Spire (162..196m)
        ...createPyramidFaces(ox, 162, oz, 4.5, 34, 6, cyanRing, [255, 255, 255], 0.6, 0, 0.95)
      ];

      const pearlColliders = [
        { type: 'cone', cx: ox, cz: oz, rBase: 20, rTop: 6, y0: 0, y1: 62, labelZh: '城市地标·天穹观景塔基座', labelEn: 'Landmark Observation Tower Base' },
        { type: 'cone', cx: ox, cz: oz, rBase: 19.5, rTop: 14, y0: 62, y1: 140, labelZh: '城市地标·天穹观景太空舱', labelEn: 'Landmark Observation Sphere' },
        { type: 'cone', cx: ox, cz: oz, rBase: 5.5, rTop: 1.5, y0: 140, y1: 196, labelZh: '城市地标·天穹观景塔天线', labelEn: 'Landmark Tower Spire' }
      ];
      cityObjects.push({ cx: ox, cz: oz, faces: pearlFaces, colliders: pearlColliders });
    }

    // Grid of regular architectural towers (skipping the 3 landmark plazas)
    for (let gx = -320; gx <= 320; gx += 64) {
      for (let gz = -320; gz <= 320; gz += 64) {
        if (Math.abs(gx) < 42 || Math.abs(gz) < 42) continue;
        // Leave open plaza space around the 3 Landmarks
        if (
          Math.hypot(gx - -72, gz - -86) < 58 ||
          Math.hypot(gx - 78, gz - -88) < 56 ||
          Math.hypot(gx - 76, gz - 84) < 56
        ) {
          continue;
        }

        const jx = gx + (rngCity() - 0.5) * 14;
        const jz = gz + (rngCity() - 0.5) * 14;
        const w = 18 + rngCity() * 16;
        const d = 18 + rngCity() * 16;
        const distCenter = Math.hypot(gx, gz);
        const h =
          distCenter < 160
            ? 32 + rngCity() * 48
            : 18 + rngCity() * 38;
        const pal = cityPalettes[Math.floor(rngCity() * cityPalettes.length)];
        const faces = [
          createGroundShadowQuad(jx, jz, w * 0.65, d * 0.65, -h * 0.18, h * 0.14, isNight ? 0.18 : 0.32),
          ...createBoxFaces(jx, 0, jz, w, h, d, pal.side, pal.top, pal.accent, isNight ? 0.12 : 0)
        ];

        if (isNight || timeOfDay === 'sunset') {
          const bandH = h * 0.62;
          faces.push(
            ...createBoxFaces(
              jx,
              bandH,
              jz,
              w + 0.3,
              2.2,
              d + 0.3,
              [255, 196, 112],
              [255, 196, 112],
              null,
              isNight ? 0.88 : 0.45
            )
          );
        }

        const colliders = [
          { type: 'box', cx: jx, cz: jz, hw: w / 2, hd: d / 2, y0: 0, y1: h, labelZh: '城市摩天大楼', labelEn: 'Skyscraper' }
        ];

        if (h > 54) {
          const h2 = 10 + rngCity() * 16;
          faces.push(
            ...createBoxFaces(
              jx,
              h,
              jz,
              w * 0.62,
              h2,
              d * 0.62,
              pal.top,
              isWinter ? [242, 247, 255] : [175, 190, 208],
              [240, 123, 50],
              isNight ? 0.25 : 0
            )
          );
          colliders.push({
            type: 'box',
            cx: jx,
            cz: jz,
            hw: (w * 0.62) / 2,
            hd: (d * 0.62) / 2,
            y0: h,
            y1: h + h2,
            labelZh: '摩天楼塔冠',
            labelEn: 'Tower Crown'
          });
        }
        cityObjects.push({ cx: jx, cz: jz, faces, colliders });
      }
    }

    // Central Boulevard Geometric Ring Gateways
    [-180, 0, 180].forEach((zp) => {
      const gateFaces = [
        ...createBoxFaces(-26, 0, zp, 7, 54, 7, [215, 125, 65], [245, 175, 120], null, isNight ? 0.35 : 0.1),
        ...createBoxFaces(26, 0, zp, 7, 54, 7, [215, 125, 65], [245, 175, 120], null, isNight ? 0.35 : 0.1),
        ...createBoxFaces(0, 48, zp, 60, 7, 7, [235, 145, 80], [255, 200, 150], [56, 189, 248], isNight ? 0.45 : 0.15)
      ];
      const gateColliders = [
        { type: 'box', cx: -26, cz: zp, hw: 3.5, hd: 3.5, y0: 0, y1: 54, labelZh: '中央大道门廊立柱', labelEn: 'Gateway Pillar' },
        { type: 'box', cx: 26, cz: zp, hw: 3.5, hd: 3.5, y0: 0, y1: 54, labelZh: '中央大道门廊立柱', labelEn: 'Gateway Pillar' },
        { type: 'box', cx: 0, cz: zp, hw: 30, hd: 3.5, y0: 48, y1: 55, labelZh: '中央大道门廊横梁', labelEn: 'Gateway Beam' }
      ];
      cityObjects.push({ cx: 0, cz: zp, faces: gateFaces, colliders: gateColliders });
    });

    // 3D Volumetric Cumulus Cloud Clusters & Low-Altitude Mist Layers
    for (let i = 0; i < 16; i++) {
      const cx = (rngCity() - 0.5) * 680;
      const cz = (rngCity() - 0.5) * 680;
      const cy = 128 + rngCity() * 44;
      cityObjects.push(createVolumetricCloudCluster(cx, cy, cz, 0.95 + rngCity() * 0.45, timeOfDay, rngCity));
    }
    for (let mz = -280; mz <= 280; mz += 140) {
      cityObjects.push(
        createVolumetricMistLayer(0, 14, mz, 92, 110, isNight ? [42, 68, 98] : [188, 208, 228], 0.18)
      );
    }

    scenes.city = {
      groundFill: isWinter ? '#233040' : '#0F1824',
      gridStroke: isWinter ? 'rgba(200, 225, 250, 0.22)' : 'rgba(120, 165, 210, 0.16)',
      objects: cityObjects
    };

    // =======================================================================
    // SCENE 02: 几何山川 (Ultra-High Snow Mountains, Canyon Terraces, Alpine Lake & Forests)
    // =======================================================================
    const mountainObjects = [];
    const rngMtn = makeRng(202605);
    const mtnPalettes = isWinter
      ? [
          { base: [110, 130, 154], cap: [245, 250, 255] },
          { base: [128, 144, 166], cap: [248, 252, 255] },
          { base: [92, 114, 138], cap: [240, 246, 255] }
        ]
      : isAutumn
      ? [
          { base: [168, 92, 58], cap: [242, 210, 175] },
          { base: [142, 78, 56], cap: [235, 185, 142] },
          { base: [86, 94, 110], cap: [242, 246, 252] }
        ]
      : isSpring
      ? [
          { base: [64, 108, 92], cap: [240, 248, 252] },
          { base: [82, 118, 104], cap: [232, 244, 248] },
          { base: [138, 92, 76], cap: [238, 205, 188] }
        ]
      : [
          { base: [58, 78, 102], cap: [238, 244, 252] },
          { base: [158, 86, 62], cap: [232, 188, 156] },
          { base: [72, 92, 114], cap: [242, 247, 255] },
          { base: [122, 78, 70], cap: [218, 165, 138] }
        ];

    const riverRgb = isWinter ? [165, 215, 242] : [42, 156, 198];

    // Winding River Tiles + Expanded Highland Glacial Lake Basin
    for (let rz = -360; rz < 360; rz += 40) {
      const curveX = Math.sin(rz * 0.012) * 28;
      const nextCurveX = Math.sin((rz + 40) * 0.012) * 28;
      const isLakeBasin = Math.abs(rz + 120) < 65;
      const rw = isLakeBasin ? 52 : 26;
      mountainObjects.push({
        cx: curveX,
        cz: rz + 20,
        colliders: [],
        faces: [
          {
            verts: [
              [curveX - rw, 0.25, rz],
              [curveX + rw, 0.25, rz],
              [nextCurveX + rw, 0.25, rz + 40],
              [nextCurveX - rw, 0.25, rz + 40]
            ],
            rgb: isLakeBasin ? [64, 192, 232] : riverRgb,
            emissive: isNight ? 0.42 : 0.28,
            doubleSided: true
          }
        ]
      });
    }

    // -----------------------------------------------------------------------
    // ULTRA-HIGH SNOW-CAPPED ALPINE MASSIFS (特别高的雪山群: 205m - 268m!)
    // Towering far above regular hills and piercing the volumetric cloud layer
    // -----------------------------------------------------------------------
    const alpineSummitSpots = [
      { cx: -148, cz: -145, r: 74, h: 266, subR: 48, subH: 176 },
      { cx: 152, cz: -128, r: 70, h: 248, subR: 46, subH: 164 },
      { cx: -158, cz: 118, r: 68, h: 236, subR: 44, subH: 158 },
      { cx: 146, cz: 142, r: 72, h: 254, subR: 46, subH: 168 },
      { cx: -245, cz: -10, r: 66, h: 222, subR: 42, subH: 148 },
      { cx: 242, cz: 12, r: 68, h: 228, subR: 44, subH: 152 }
    ];

    alpineSummitSpots.forEach((sp, idx) => {
      const graniteBase = [64, 82, 106];
      const glacierBlue = [186, 224, 252];
      const pureSnow = [248, 252, 255];
      const rot = idx * 0.7;

      const massifFaces = [
        createGroundShadowQuad(sp.cx, sp.cz, sp.r * 0.85, sp.r * 0.85, -sp.h * 0.16, sp.h * 0.12, 0.34),
        // Main Colossal Summit Pyramid (205m - 266m tall with deep eternal snow cap!)
        ...createPyramidFaces(sp.cx, 0, sp.cz, sp.r, sp.h, 6, graniteBase, pureSnow, 0.56, rot, 0.18),
        // Upper Glacial Ice Crest Overlay
        ...createPyramidFaces(sp.cx, sp.h * 0.52, sp.cz, sp.r * 0.46, sp.h * 0.48, 6, glacierBlue, pureSnow, 0.68, rot + 0.52, 0.25),
        // Flanking Jagged Ridge Peak 1
        ...createPyramidFaces(
          sp.cx + sp.r * 0.52,
          0,
          sp.cz - sp.r * 0.32,
          sp.subR,
          sp.subH,
          5,
          [76, 94, 118],
          pureSnow,
          0.48,
          rot + 0.3,
          0.14
        ),
        // Flanking Jagged Ridge Peak 2
        ...createPyramidFaces(
          sp.cx - sp.r * 0.48,
          0,
          sp.cz + sp.r * 0.36,
          sp.subR * 0.88,
          sp.subH * 0.86,
          5,
          [58, 76, 98],
          glacierBlue,
          0.44,
          rot + 1.1,
          0.14
        )
      ];

      const massifColliders = [
        {
          type: 'cone',
          cx: sp.cx,
          cz: sp.cz,
          rBase: sp.r * 0.82,
          rTop: 3.5,
          y0: 0,
          y1: sp.h,
          labelZh: '极高雪山主峰',
          labelEn: 'Ultra-High Snow Peak'
        },
        {
          type: 'cone',
          cx: sp.cx + sp.r * 0.52,
          cz: sp.cz - sp.r * 0.32,
          rBase: sp.subR * 0.78,
          rTop: 3,
          y0: 0,
          y1: sp.subH,
          labelZh: '雪山冰川侧峰',
          labelEn: 'Glacier Ridge Peak'
        }
      ];

      mountainObjects.push({ cx: sp.cx, cz: sp.cz, faces: massifFaces, colliders: massifColliders });
    });

    // Varied Mountain Terrain: Mid-altitude peaks, Stepped Canyon Mesas & Alpine Conifer Groves
    for (let gx = -330; gx <= 330; gx += 66) {
      for (let gz = -330; gz <= 330; gz += 66) {
        const riverCenter = Math.sin(gz * 0.012) * 28;
        const distFromRiver = Math.abs(gx - riverCenter);
        if (distFromRiver < 46) continue;

        // Skip spots occupied by the 6 colossal snow massifs
        const nearMassif = alpineSummitSpots.some(
          (sp) => Math.hypot(gx - sp.cx, gz - sp.cz) < sp.r * 0.92
        );
        if (nearMassif) continue;

        const mx = gx + (rngMtn() - 0.5) * 20;
        const mz = gz + (rngMtn() - 0.5) * 20;

        if (distFromRiver < 86 && rngMtn() < 0.58) {
          // Riverbank Terrain Variety: Stepped Canyon Terrace Mesa + Alpine Pine Trees
          const mesaR = 20 + rngMtn() * 14;
          const mesaH = 18 + rngMtn() * 22;
          const mesaTop = isWinter ? [232, 242, 252] : [112, 134, 118];
          const pineColor = isWinter ? [168, 198, 218] : [38, 96, 72];
          const pineCap = isWinter ? [245, 250, 255] : [76, 148, 104];

          const mesaFaces = [
            createGroundShadowQuad(mx, mz, mesaR * 0.8, mesaR * 0.8, -mesaH * 0.2, mesaH * 0.15, 0.25),
            ...createPrismFaces(mx, 0, mz, mesaR, mesaH, 6, [84, 96, 112], mesaTop),
            ...createPrismFaces(mx - 3, mesaH, mz + 2, mesaR * 0.58, mesaH * 0.45, 6, [98, 110, 126], mesaTop),
            // Alpine pine atop the canyon terrace
            ...createPyramidFaces(mx + 4, mesaH, mz - 3, 6.5, 18, 5, pineColor, pineCap, 0.45, 0.2)
          ];
          mountainObjects.push({
            cx: mx,
            cz: mz,
            faces: mesaFaces,
            colliders: [
              {
                type: 'cone',
                cx: mx,
                cz: mz,
                rBase: mesaR * 0.85,
                rTop: mesaR * 0.55,
                y0: 0,
                y1: mesaH * 1.45,
                labelZh: '峡谷断崖台地',
                labelEn: 'Canyon Cliff Mesa'
              }
            ]
          });
        } else {
          // Faceted Mid-Altitude & High Mountain Peaks
          const radius = 30 + rngMtn() * 28;
          const height = 52 + rngMtn() * 108;
          const sides = rngMtn() > 0.45 ? 5 : 4;
          const pal = mtnPalettes[Math.floor(rngMtn() * mtnPalettes.length)];
          const capRatio = isWinter ? 0.62 : height > 95 ? 0.44 : height > 68 ? 0.26 : 0;

          const faces = [
            createGroundShadowQuad(mx, mz, radius * 0.72, radius * 0.72, -height * 0.16, height * 0.12, 0.26),
            ...createPyramidFaces(
              mx,
              0,
              mz,
              radius,
              height,
              sides,
              pal.base,
              pal.cap,
              capRatio,
              rngMtn() * Math.PI
            )
          ];
          const colliders = [
            {
              type: 'cone',
              cx: mx,
              cz: mz,
              rBase: radius * 0.78,
              rTop: 2.5,
              y0: 0,
              y1: height,
              labelZh: '山川岩峰',
              labelEn: 'Mountain Peak'
            }
          ];
          mountainObjects.push({ cx: mx, cz: mz, faces, colliders });
        }
      }
    }

    // Volumetric Mountain Clouds (Drifting around mid-summit altitude Y=115..165m while 266m snow peaks tower above!)
    for (let i = 0; i < 18; i++) {
      const cx = (rngMtn() - 0.5) * 680;
      const cz = (rngMtn() - 0.5) * 680;
      const cy = 116 + rngMtn() * 48;
      mountainObjects.push(createVolumetricCloudCluster(cx, cy, cz, 1.05 + rngMtn() * 0.5, timeOfDay, rngMtn));
    }
    // Canyon River Volumetric Mist Layers
    for (let mz = -300; mz <= 300; mz += 120) {
      const mx = Math.sin(mz * 0.012) * 28;
      mountainObjects.push(
        createVolumetricMistLayer(mx, 12, mz, 96, 110, isNight ? [48, 72, 102] : [205, 225, 245], 0.22)
      );
    }

    scenes.mountain = {
      groundFill: isWinter ? '#2A3948' : isAutumn ? '#241E22' : '#17222D',
      gridStroke: isWinter ? 'rgba(210, 230, 250, 0.22)' : 'rgba(155, 190, 215, 0.13)',
      objects: mountainObjects
    };

    // =======================================================================
    // SCENE 03: 几何草原 (Minimalist 3D Steppe, Rolling Hills, Pines & Yurts)
    // =======================================================================
    const grassObjects = [];
    const rngGrass = makeRng(309187);

    const streamColor = isWinter ? [175, 222, 248] : [56, 178, 216];
    for (let sz = -360; sz < 360; sz += 40) {
      const sx1 = Math.cos(sz * 0.01) * 36;
      const sx2 = Math.cos((sz + 40) * 0.01) * 36;
      const sw = 16;
      grassObjects.push({
        cx: sx1,
        cz: sz + 20,
        colliders: [],
        faces: [
          {
            verts: [
              [sx1 - sw, 0.22, sz],
              [sx1 + sw, 0.22, sz],
              [sx2 + sw, 0.22, sz + 40],
              [sx2 - sw, 0.22, sz + 40]
            ],
            rgb: streamColor,
            emissive: isNight ? 0.38 : 0.22,
            doubleSided: true
          }
        ]
      });
    }

    for (let gx = -320; gx <= 320; gx += 64) {
      for (let gz = -320; gz <= 320; gz += 64) {
        const streamX = Math.cos(gz * 0.01) * 36;
        if (Math.abs(gx - streamX) < 36) continue;

        const px = gx + (rngGrass() - 0.5) * 20;
        const pz = gz + (rngGrass() - 0.5) * 20;
        const roll = rngGrass();

        if (roll < 0.36) {
          const r = 34 + rngGrass() * 26;
          const h = 16 + rngGrass() * 26;
          const hillBase = isWinter
            ? [188, 206, 224]
            : isAutumn
            ? [176, 128, 56]
            : isSpring
            ? [64, 152, 98]
            : [52, 118, 82];
          const hillCap = isWinter
            ? [242, 248, 255]
            : isAutumn
            ? [218, 162, 74]
            : isSpring
            ? [112, 196, 132]
            : [96, 162, 108];

          grassObjects.push({
            cx: px,
            cz: pz,
            faces: [
              createGroundShadowQuad(px, pz, r * 0.7, r * 0.7, -h * 0.15, h * 0.12, 0.22),
              ...createPyramidFaces(px, 0, pz, r, h, 6, hillBase, hillCap, 0.38, rngGrass())
            ],
            colliders: [
              { type: 'cone', cx: px, cz: pz, rBase: r * 0.76, rTop: 3, y0: 0, y1: h, labelZh: '草原丘陵', labelEn: 'Steppe Hill' }
            ]
          });
        } else if (roll < 0.78) {
          const foliageLow = isWinter
            ? [150, 178, 196]
            : isAutumn
            ? [198, 92, 46]
            : isSpring
            ? [76, 156, 102]
            : [42, 106, 74];
          const foliageCap = isWinter
            ? [240, 247, 255]
            : isAutumn
            ? [238, 158, 62]
            : isSpring
            ? [242, 168, 188]
            : [88, 166, 112];

          const treeFaces = [
            createGroundShadowQuad(px, pz, 7.5, 7.5, -4, 3, 0.25),
            ...createBoxFaces(px, 0, pz, 2.6, 5, 2.6, [102, 74, 52], [102, 74, 52]),
            ...createPyramidFaces(px, 4.5, pz, 8.5, 16, 5, foliageLow, foliageCap, 0.42, 0.3),
            ...createPyramidFaces(px, 13, pz, 6.2, 13, 5, foliageLow, foliageCap, 0.48, 0.8)
          ];
          grassObjects.push({
            cx: px,
            cz: pz,
            faces: treeFaces,
            colliders: [
              { type: 'cone', cx: px, cz: pz, rBase: 7.5, rTop: 1.5, y0: 0, y1: 26, labelZh: '草原树林', labelEn: 'Steppe Tree' }
            ]
          });
        } else {
          const yurtFaces = [
            createGroundShadowQuad(px, pz, 9.8, 9.8, -3.5, 2.5, 0.26),
            ...createPrismFaces(px, 0, pz, 9.5, 6.5, 6, [232, 236, 240], [245, 247, 250]),
            ...createPyramidFaces(
              px,
              6.5,
              pz,
              10.2,
              6.2,
              6,
              [242, 244, 248],
              isNight ? [255, 195, 95] : [240, 123, 50],
              0.34,
              0,
              isNight ? 0.85 : 0.15
            )
          ];
          grassObjects.push({
            cx: px,
            cz: pz,
            faces: yurtFaces,
            colliders: [
              { type: 'cone', cx: px, cz: pz, rBase: 9.5, rTop: 2.5, y0: 0, y1: 12.7, labelZh: '草原蒙古包', labelEn: 'Steppe Yurt' }
            ]
          });
        }
      }
    }

    for (let i = 0; i < 16; i++) {
      const cx = (rngGrass() - 0.5) * 680;
      const cz = (rngGrass() - 0.5) * 680;
      const cy = 108 + rngGrass() * 42;
      grassObjects.push(createVolumetricCloudCluster(cx, cy, cz, 0.95 + rngGrass() * 0.45, timeOfDay, rngGrass));
    }
    for (let mz = -280; mz <= 280; mz += 140) {
      const sx = Math.cos(mz * 0.01) * 36;
      grassObjects.push(
        createVolumetricMistLayer(sx, 8, mz, 88, 100, isNight ? [42, 68, 88] : [215, 235, 225], 0.18)
      );
    }

    scenes.grassland = {
      groundFill: isWinter
        ? '#2C3C4B'
        : isAutumn
        ? '#332818'
        : isSpring
        ? '#1D3E2B'
        : '#183424',
      gridStroke: isWinter
        ? 'rgba(210, 232, 250, 0.20)'
        : isAutumn
        ? 'rgba(225, 180, 110, 0.15)'
        : 'rgba(130, 205, 150, 0.14)',
      objects: grassObjects
    };

    return scenes;
  }

  let SCENES_3D = buildScenes(envSeason, envTime);

  function rebuildScenesForEnv() {
    SCENES_3D = buildScenes(envSeason, envTime);
  }

  // =========================================================================
  // Build 3D Third-Person DJI Quadcopter Mesh (No Rotor Disc Overlay Effect)
  // =========================================================================
  function buildDrone3DFaces(dx, dy, dz, yawRad, pitchRad, rollRad, spinPhase, crashed) {
    const cy = Math.cos(yawRad);
    const sy = Math.sin(yawRad);
    const cp = Math.cos(pitchRad);
    const sp = Math.sin(pitchRad);
    const cr = Math.cos(rollRad);
    const sr = Math.sin(rollRad);

    function toWorld(lx, ly, lz) {
      const rx = lx * cr - ly * sr;
      const ry = lx * sr + ly * cr;
      const rz = lz;
      const px = rx;
      const py = ry * cp - rz * sp;
      const pz = ry * sp + rz * cp;
      const wx = dx + px * cy + pz * sy;
      const wy = dy + py;
      const wz = dz - px * sy + pz * cy;
      return [wx, wy, wz];
    }

    function makeLocalBox(cx, cy0, cz, w, h, d, sideRgb, topRgb, emissive) {
      const hw = w / 2;
      const hh = h / 2;
      const hd = d / 2;
      const p000 = toWorld(cx - hw, cy0 - hh, cz - hd);
      const p100 = toWorld(cx + hw, cy0 - hh, cz - hd);
      const p101 = toWorld(cx + hw, cy0 - hh, cz + hd);
      const p001 = toWorld(cx - hw, cy0 - hh, cz + hd);
      const p010 = toWorld(cx - hw, cy0 + hh, cz - hd);
      const p110 = toWorld(cx + hw, cy0 + hh, cz - hd);
      const p111 = toWorld(cx + hw, cy0 + hh, cz + hd);
      const p011 = toWorld(cx - hw, cy0 + hh, cz + hd);

      return [
        { verts: [p001, p101, p111, p011], rgb: sideRgb, emissive, isDrone: true },
        { verts: [p100, p000, p010, p110], rgb: sideRgb, emissive, isDrone: true },
        { verts: [p101, p100, p110, p111], rgb: sideRgb, emissive, isDrone: true },
        { verts: [p000, p001, p011, p010], rgb: sideRgb, emissive, isDrone: true },
        { verts: [p011, p111, p110, p010], rgb: topRgb || sideRgb, emissive, isDrone: true },
        { verts: [p000, p100, p101, p001], rgb: [24, 28, 34], emissive, isDrone: true }
      ];
    }

    const faces = [];
    const statusLedRgb = crashed ? [239, 68, 68] : [74, 222, 128];

    // 1. Central Aerodynamic DJI Fuselage Core
    faces.push(...makeLocalBox(0, 0, 0, 1.85, 0.72, 3.3, [58, 66, 78], [108, 118, 132]));
    faces.push(...makeLocalBox(0, 0.44, -0.1, 1.32, 0.34, 2.3, [78, 88, 102], [142, 152, 166]));
    faces.push(...makeLocalBox(0, -0.12, 1.72, 1.05, 0.56, 0.55, [240, 123, 50], [255, 155, 85], 0.35));
    faces.push(...makeLocalBox(0, 0.08, -1.68, 1.15, 0.28, 0.18, statusLedRgb, statusLedRgb, 0.9));

    // 2. Four Outrigger Motor Arms + Clean 3D Propeller Blades (No Rotor Disc Effect)
    const motors = [
      { x: -2.45, y: 0.15, z: 2.15, dir: 1, front: true },
      { x: 2.45, y: 0.15, z: 2.15, dir: -1, front: true },
      { x: -2.25, y: 0.05, z: -2.05, dir: -1, front: false },
      { x: 2.25, y: 0.05, z: -2.05, dir: 1, front: false }
    ];

    motors.forEach((m) => {
      const armMidX = m.x * 0.55;
      const armMidZ = m.z * 0.55;
      faces.push(
        ...makeLocalBox(armMidX, m.y * 0.6, armMidZ, Math.abs(m.x) * 0.78, 0.22, 0.34, [46, 52, 62], [82, 92, 104])
      );
      const ledColor = m.front ? [240, 123, 50] : [68, 76, 88];
      faces.push(...makeLocalBox(m.x, m.y, m.z, 0.52, 0.42, 0.52, ledColor, [120, 130, 142], m.front ? 0.3 : 0));

      // Clean 3D Propeller Blades Only (Translucent rotor disc effect removed)
      const rY = m.y + 0.24;
      const bladeRadius = 1.42;
      for (let b = 0; b < 2; b++) {
        const ang = spinPhase * m.dir + b * (Math.PI / 2);
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const bw = 0.14;
        const p1 = toWorld(m.x + c * bladeRadius - s * bw, rY, m.z + s * bladeRadius + c * bw);
        const p2 = toWorld(m.x + c * bladeRadius + s * bw, rY, m.z + s * bladeRadius - c * bw);
        const p3 = toWorld(m.x - c * bladeRadius + s * bw, rY, m.z - s * bladeRadius - c * bw);
        const p4 = toWorld(m.x - c * bladeRadius - s * bw, rY, m.z - s * bladeRadius + c * bw);
        faces.push({
          verts: [p1, p2, p3, p4],
          rgb: [32, 36, 42],
          doubleSided: true,
          emissive: 0.12,
          isDrone: true
        });
      }
    });

    // 3. Projected Ground Shadow directly under the drone
    const shadowScale = Math.max(0.22, Math.min(1.0, 48 / (dy + 18)));
    const sr0 = 2.6 * shadowScale;
    faces.push({
      verts: [
        [dx - sr0, 0.28, dz + sr0],
        [dx + sr0, 0.28, dz + sr0],
        [dx + sr0, 0.28, dz - sr0],
        [dx - sr0, 0.28, dz - sr0]
      ],
      rgb: [4, 7, 11],
      alpha: 0.36 * shadowScale,
      doubleSided: true,
      emissive: 0
    });

    return faces;
  }

  // =========================================================================
  // 3D Obstacle Collision Detection & Crash State Handler
  // =========================================================================
  function wrapCoord(val, center) {
    let diff = ((val - center + HALF_WRAP) % WRAP_SIZE);
    if (diff < 0) diff += WRAP_SIZE;
    return center + diff - HALF_WRAP;
  }

  function triggerCrash(obstacleZh, obstacleEn) {
    if (isCrashed) return;
    isCrashed = true;
    crashShakeTime = 0.55;
    if (cardEl) cardEl.classList.add('is-crashed');

    const isEn = getSiteLanguage() === 'en';
    if (statusTextEl) {
      statusTextEl.textContent = isEn ? 'CRASHED (MOTORS LOCKED)' : '⚠ 碰撞坠毁 (电机锁死)';
    }
    if (crashTitleEl) {
      crashTitleEl.textContent = isEn
        ? `COLLISION · HIT ${obstacleEn.toUpperCase()}`
        : `发生碰撞 · 撞击${obstacleZh}坠毁`;
    }
    if (crashDescEl) {
      crashDescEl.textContent = isEn
        ? 'Impact detected. Press R or click Relaunch to take off again.'
        : '机身与障碍物发生剧烈碰撞，动力已切断。按 R 键或点击右侧按钮重新起飞。';
    }

    // Spawn 3D geometric crash sparks & debris shards
    crashDebris = Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2 + Math.random() * 0.4;
      const spd = 8 + Math.random() * 18;
      return {
        x: droneX,
        y: droneY,
        z: droneZ,
        vx: Math.cos(a) * spd,
        vy: 5 + Math.random() * 12,
        vz: Math.sin(a) * spd,
        size: 0.45 + Math.random() * 0.55,
        rgb: i % 2 === 0 ? [240, 123, 50] : [239, 68, 68]
      };
    });
  }

  function resetDroneToSafeHover() {
    isCrashed = false;
    crashShakeTime = 0;
    crashDebris = [];
    if (cardEl) cardEl.classList.remove('is-crashed');

    const isEn = getSiteLanguage() === 'en';
    if (statusTextEl) {
      statusTextEl.textContent = isEn ? 'In Flight (GPS)' : '正常飞行 (GPS)';
    }

    droneX = 0;
    droneZ = 0;
    droneY = activeSceneKey === 'mountain' ? 68 : activeSceneKey === 'grassland' ? 36 : 45;
    vxWorld = 0;
    vzWorld = 0;
    vyWorld = 0;
    yawVel = 0;
    currentRoll = 0;
    currentPitch = 0;
    headingDeg = 0;
  }

  function checkObstacleCollisions(scene) {
    if (isCrashed) return;
    const droneRadius = 2.05;

    // 1. Check Ground Impact
    if (droneY <= 1.55) {
      droneY = 1.2;
      triggerCrash('地面', 'Ground');
      return;
    }

    // 2. Check Scene 3D Solid Obstacles
    const objs = scene.objects;
    for (let i = 0; i < objs.length; i++) {
      const obj = objs[i];
      if (!obj.colliders || !obj.colliders.length) continue;

      const shiftX = wrapCoord(obj.cx, droneX) - obj.cx;
      const shiftZ = wrapCoord(obj.cz, droneZ) - obj.cz;

      for (let c = 0; c < obj.colliders.length; c++) {
        const col = obj.colliders[c];
        if (droneY + 0.65 < col.y0 || droneY - 0.65 > col.y1) continue;

        const wx = col.cx + shiftX;
        const wz = col.cz + shiftZ;

        if (col.type === 'box') {
          if (
            Math.abs(droneX - wx) < col.hw + droneRadius &&
            Math.abs(droneZ - wz) < col.hd + droneRadius
          ) {
            triggerCrash(col.labelZh || '建筑障碍物', col.labelEn || 'Building');
            return;
          }
        } else if (col.type === 'cone') {
          const t = Math.max(0, Math.min(1, (droneY - col.y0) / Math.max(1, col.y1 - col.y0)));
          const rAtHeight = col.rBase + (col.rTop - col.rBase) * t;
          const distH = Math.hypot(droneX - wx, droneZ - wz);
          if (distH < rAtHeight + droneRadius * 0.85) {
            triggerCrash(col.labelZh || '山体/树木', col.labelEn || 'Terrain Obstacle');
            return;
          }
        }
      }
    }
  }

  // =========================================================================
  // View Mode Switcher (Press C -> Toggle 3rd-Person / 1st-Person)
  // =========================================================================
  function updateViewModeUI() {
    if (cardEl) {
      cardEl.classList.toggle('is-first-person', isFirstPerson);
    }
    const isEn = getSiteLanguage() === 'en';
    if (viewLabel) {
      const zhText = isFirstPerson ? '第一人称' : '第三人称';
      const enText = isFirstPerson ? '1ST PERSON' : '3RD PERSON';
      viewLabel.setAttribute('data-i18n-zh', zhText);
      viewLabel.setAttribute('data-i18n-en', enText);
      viewLabel.textContent = isEn ? enText : zhText;
    }
  }

  function toggleCameraViewMode() {
    isFirstPerson = !isFirstPerson;
    updateViewModeUI();
  }

  if (viewBtn) {
    viewBtn.addEventListener('click', toggleCameraViewMode);
  }

  // =========================================================================
  // Gimbal Pitch Angle Control (Mouse Wheel & Preset Button: -90° to +20°)
  // =========================================================================
  function setGimbalAngle(deg) {
    gimbalAngleDeg = Math.max(-90, Math.min(20, Math.round(deg)));
    const isEn = getSiteLanguage() === 'en';
    const labelStr = `${gimbalAngleDeg > 0 ? '+' : ''}${gimbalAngleDeg}°`;

    if (gimbalReadout) {
      gimbalReadout.textContent = `GIMBAL ${labelStr}`;
    }
    if (gimbalAngleBadge) {
      gimbalAngleBadge.textContent = labelStr;
    }
    if (gimbalThumb) {
      // +20° is top (0%), -90° is bottom (100%)
      const pct = ((20 - gimbalAngleDeg) / 110) * 100;
      gimbalThumb.style.top = `${Math.max(0, Math.min(100, pct)).toFixed(1)}%`;
    }
    if (gimbalBtn) {
      const zhLabel = `云台 ${labelStr}`;
      const enLabel = `GIMBAL ${labelStr}`;
      gimbalBtn.setAttribute('data-i18n-zh', zhLabel);
      gimbalBtn.setAttribute('data-i18n-en', enLabel);
      gimbalBtn.textContent = isEn ? enLabel : zhLabel;
    }
  }
  setGimbalAngle(gimbalAngleDeg);

  if (gimbalBtn) {
    gimbalBtn.addEventListener('click', () => {
      gimbalPresetIdx = (gimbalPresetIdx + 1) % gimbalPresets.length;
      setGimbalAngle(gimbalPresets[gimbalPresetIdx]);
    });
  }

  // Mouse Wheel Smoothly Adjusts Gimbal Pitch Angle (-90° ~ +20°)
  modal.addEventListener(
    'wheel',
    (e) => {
      if (!isActive) return;
      if (controlsModal && controlsModal.classList.contains('is-open')) return;
      e.preventDefault();
      e.stopPropagation();
      const step = e.deltaY > 0 ? -3 : 3;
      setGimbalAngle(gimbalAngleDeg + step);
    },
    { passive: false }
  );

  // =========================================================================
  // Consolidated Environment Popover + Random Weather & Time Switcher
  // =========================================================================
  function updateEnvSummaryUI() {
    timeBtns.forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-env-time') === envTime));
    weatherBtns.forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-env-weather') === envWeather));
    seasonBtns.forEach((b) => b.classList.toggle('is-active', b.getAttribute('data-env-season') === envSeason));

    if (envSummaryEl) {
      const timeZhMap = { day: '☀ 白昼', sunset: '🌇 黄昏', night: '🌙 夜晚' };
      const timeEnMap = { day: '☀ DAY', sunset: '🌇 SUNSET', night: '🌙 NIGHT' };
      const weatherZhMap = { clear: '晴', rain: '雨', snow: '雪', fog: '雾' };
      const weatherEnMap = { clear: 'CLEAR', rain: 'RAIN', snow: 'SNOW', fog: 'FOG' };

      const zhSummary = `${timeZhMap[envTime] || '🌇 黄昏'} · ${weatherZhMap[envWeather] || '晴'} ▾`;
      const enSummary = `${timeEnMap[envTime] || '🌇 SUNSET'} · ${weatherEnMap[envWeather] || 'CLEAR'} ▾`;
      envSummaryEl.setAttribute('data-i18n-zh', zhSummary);
      envSummaryEl.setAttribute('data-i18n-en', enSummary);
      envSummaryEl.textContent = getSiteLanguage() === 'en' ? enSummary : zhSummary;
    }
  }

  function toggleEnvPopover(forceState) {
    if (!envPopover || !envToggleBtn) return;
    const nextOpen =
      typeof forceState === 'boolean' ? forceState : !envPopover.classList.contains('is-open');
    envPopover.classList.toggle('is-open', nextOpen);
    envToggleBtn.classList.toggle('is-open', nextOpen);
    envToggleBtn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
    envPopover.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');
  }

  if (envToggleBtn) {
    envToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEnvPopover();
    });
  }

  // Close popover when clicking outside
  modal.addEventListener('click', (e) => {
    if (
      envPopover &&
      envPopover.classList.contains('is-open') &&
      envDropdownWrap &&
      !envDropdownWrap.contains(e.target)
    ) {
      toggleEnvPopover(false);
    }
  });

  // Random Weather & Time Button: Randomly switches Weather, Time, and Season together
  function randomizeEnvironment() {
    const times = ['day', 'sunset', 'night'];
    const weathers = ['clear', 'rain', 'snow', 'fog'];
    const seasons = ['spring', 'summer', 'autumn', 'winter'];

    // Pick a distinct weather & time so every click produces a visible atmospheric change
    const otherWeathers = weathers.filter((w) => w !== envWeather);
    const otherTimes = times.filter((t) => t !== envTime);

    envWeather = otherWeathers[Math.floor(Math.random() * otherWeathers.length)];
    envTime = otherTimes[Math.floor(Math.random() * otherTimes.length)];

    if (envWeather === 'snow') {
      envSeason = Math.random() < 0.7 ? 'winter' : seasons[Math.floor(Math.random() * seasons.length)];
    } else {
      envSeason = seasons[Math.floor(Math.random() * seasons.length)];
    }

    updateEnvSummaryUI();
    rebuildScenesForEnv();
  }

  if (envRandomBtn) {
    envRandomBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      randomizeEnvironment();
    });
  }

  timeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      envTime = btn.getAttribute('data-env-time') || 'sunset';
      updateEnvSummaryUI();
      rebuildScenesForEnv();
    });
  });

  weatherBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      envWeather = btn.getAttribute('data-env-weather') || 'clear';
      updateEnvSummaryUI();
    });
  });

  seasonBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      envSeason = btn.getAttribute('data-env-season') || 'summer';
      updateEnvSummaryUI();
      rebuildScenesForEnv();
    });
  });

  updateEnvSummaryUI();

  // =========================================================================
  // Controls Guide Modal & Buttons
  // =========================================================================
  function openControlsGuide() {
    if (!controlsModal) return;
    controlsModal.classList.add('is-open');
    controlsModal.setAttribute('aria-hidden', 'false');
  }

  function closeControlsGuide() {
    if (!controlsModal) return;
    controlsModal.classList.remove('is-open');
    controlsModal.setAttribute('aria-hidden', 'true');
  }

  if (helpBtn) {
    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openControlsGuide();
    });
  }
  if (controlsCloseBtn) {
    controlsCloseBtn.addEventListener('click', closeControlsGuide);
  }
  if (controlsOkBtn) {
    controlsOkBtn.addEventListener('click', closeControlsGuide);
  }
  if (controlsModal) {
    controlsModal.addEventListener('click', (e) => {
      if (e.target === controlsModal) closeControlsGuide();
    });
  }

  function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  }

  window.addEventListener('resize', () => {
    if (isActive) resizeCanvas();
  });

  function openModal() {
    isActive = true;
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    resizeCanvas();
  }

  function closeModal() {
    isActive = false;
    closeControlsGuide();
    toggleEnvPopover(false);
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    Object.keys(keysPressed).forEach((k) => delete keysPressed[k]);
  }

  openDroneFpvCardFn = openModal;

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (rthBtn) {
    rthBtn.addEventListener('click', resetDroneToSafeHover);
  }
  if (crashRetryBtn) {
    crashRetryBtn.addEventListener('click', resetDroneToSafeHover);
  }

  // Flight Mode Switcher (CINE / NORMAL / SPORT)
  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      flightMode = btn.getAttribute('data-fpv-mode') || 'normal';
      modeBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
    });
  });

  // 3 Minimalist 3D Geometric Scenes Switcher (City / Mountain / Grassland)
  sceneBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sceneKey = btn.getAttribute('data-fpv-scene') || 'city';
      activeSceneKey = SCENES_3D[sceneKey] ? sceneKey : 'city';
      sceneBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
      resetDroneToSafeHover();
    });
  });

  // Shutter Button Capture
  if (shutterBtn) {
    shutterBtn.addEventListener('click', () => {
      if (shutterFlash) {
        shutterFlash.classList.add('is-flashing');
        setTimeout(() => shutterFlash.classList.remove('is-flashing'), 140);
      }
      if (captureBadge) {
        captureBadge.classList.add('is-visible');
        clearTimeout(captureTimer);
        captureTimer = setTimeout(() => {
          captureBadge.classList.remove('is-visible');
        }, 2200);
      }
    });
  }

  // Virtual Joystick Helper
  function bindVirtualStick(padEl, knobEl, onMove) {
    if (!padEl || !knobEl) return;
    let dragging = false;
    const maxRadius = 20;

    function updateFromPointer(clientX, clientY) {
      const rect = padEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      knobEl.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      onMove(dx / maxRadius, dy / maxRadius);
    }

    function resetStick() {
      dragging = false;
      knobEl.style.transform = 'translate3d(0px, 0px, 0)';
      onMove(0, 0);
    }

    padEl.addEventListener('pointerdown', (e) => {
      dragging = true;
      padEl.setPointerCapture(e.pointerId);
      updateFromPointer(e.clientX, e.clientY);
    });
    padEl.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      updateFromPointer(e.clientX, e.clientY);
    });
    padEl.addEventListener('pointerup', resetStick);
    padEl.addEventListener('pointercancel', resetStick);
  }

  bindVirtualStick(stickLeft, knobLeft, (nx, ny) => {
    leftX = nx;
    leftY = ny;
  });

  bindVirtualStick(stickRight, knobRight, (nx, ny) => {
    rightX = nx;
    rightY = ny;
  });

  // Keyboard Flight Controls:
  //   W / A / S / D -> Forward / Left / Backward / Right (前后左右)
  //   Q / E         -> Yaw Rotate Left / Right (转向)
  //   ArrowUp / Down-> Altitude Up / Down (高低)
  //   C             -> Toggle 1st-Person / 3rd-Person View
  //   R             -> Relaunch / Reset Drone
  window.addEventListener('keydown', (e) => {
    if (!isActive) return;
    if (e.key === 'Escape') {
      if (controlsModal && controlsModal.classList.contains('is-open')) {
        closeControlsGuide();
      } else {
        closeModal();
      }
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'c' && !e.repeat) {
      e.preventDefault();
      toggleCameraViewMode();
      return;
    }
    if (k === 'r' && !e.repeat) {
      e.preventDefault();
      resetDroneToSafeHover();
      return;
    }
    if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown'].includes(k)) {
      e.preventDefault();
      keysPressed[k] = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    delete keysPressed[k];
  });

  // =========================================================================
  // Dynamic Time / Weather / Season Lighting & Volumetric 3D Renderer
  // =========================================================================
  function getEnvironmentLighting() {
    let skyTop = '#0A1320';
    let skyMid = '#182C46';
    let skyHorizon = '#C47B54';
    let fogRgb = [42, 62, 84];
    let sunDir = [0.46, 0.76, 0.45];
    let celestialColor = [255, 200, 130];
    let ambient = 0.52;
    let diffuse = 0.58;

    if (envTime === 'day') {
      skyTop = envSeason === 'winter' ? '#2A547E' : '#1B4B7A';
      skyMid = envSeason === 'winter' ? '#5E8FB8' : '#4584B6';
      skyHorizon = envSeason === 'winter' ? '#CFE2F2' : '#A9D6E5';
      fogRgb = envSeason === 'winter' ? [185, 205, 225] : [135, 178, 210];
      sunDir = [0.35, 0.84, 0.41];
      celestialColor = [255, 248, 220];
      ambient = 0.64;
      diffuse = 0.56;
    } else if (envTime === 'sunset') {
      skyTop = '#0C1626';
      skyMid = '#263E5C';
      skyHorizon = '#E28754';
      fogRgb = [112, 82, 84];
      sunDir = [0.52, 0.34, 0.78];
      celestialColor = [255, 148, 72];
      ambient = 0.48;
      diffuse = 0.64;
    } else {
      skyTop = '#040810';
      skyMid = '#0A1322';
      skyHorizon = '#16263B';
      fogRgb = [14, 24, 38];
      sunDir = [-0.38, 0.68, 0.62];
      celestialColor = [200, 225, 255];
      ambient = 0.28;
      diffuse = 0.36;
    }

    let fogStart = 88;
    let fogSpan = 260;
    let heightFogDensity = 0.24;

    if (envWeather === 'fog') {
      fogStart = 18;
      fogSpan = 108;
      heightFogDensity = 0.68;
      fogRgb = envTime === 'night' ? [28, 42, 58] : [176, 190, 204];
      skyHorizon = envTime === 'night' ? '#1E2A3A' : '#B8C6D4';
    } else if (envWeather === 'rain') {
      fogStart = 48;
      fogSpan = 175;
      heightFogDensity = 0.42;
      fogRgb = envTime === 'night' ? [16, 26, 38] : [68, 84, 102];
      skyTop = '#0A1018';
      skyMid = '#1E2B3A';
      skyHorizon = '#46586C';
      ambient *= 0.82;
    } else if (envWeather === 'snow') {
      fogStart = 42;
      fogSpan = 165;
      heightFogDensity = 0.48;
      fogRgb = envTime === 'night' ? [34, 48, 68] : [186, 202, 218];
    }

    return {
      skyTop,
      skyMid,
      skyHorizon,
      fogRgb,
      sunDir,
      celestialColor,
      ambient,
      diffuse,
      fogStart,
      fogSpan,
      heightFogDensity
    };
  }

  function render3DScene(scene, nowMs) {
    if (!ctx || !canvas) return;
    const W = canvas.width;
    const H = canvas.height;
    if (W < 2 || H < 2) return;

    const env = getEnvironmentLighting();
    const sunDir = env.sunDir;

    const yawRad = (headingDeg * Math.PI) / 180;
    const fwdX = Math.sin(yawRad);
    const fwdZ = Math.cos(yawRad);

    const effectivePitchDeg = isFirstPerson ? gimbalAngleDeg : gimbalAngleDeg * 0.65;
    const thetaDown = (-effectivePitchDeg * Math.PI) / 180;

    let camX;
    let camY;
    let camZ;

    if (isFirstPerson) {
      camX = droneX + fwdX * 1.85;
      camY = droneY + 0.1;
      camZ = droneZ + fwdZ * 1.85;
    } else {
      const camDist = 15.5;
      const camElev = 4.2 + Math.max(-2, -gimbalAngleDeg * 0.11);
      camX = droneX - fwdX * camDist;
      camY = Math.max(1.5, droneY + camElev);
      camZ = droneZ - fwdZ * camDist;
    }

    if (crashShakeTime > 0) {
      const shakeMag = crashShakeTime * 1.8;
      camX += (Math.random() - 0.5) * shakeMag;
      camY += (Math.random() - 0.5) * shakeMag;
      camZ += (Math.random() - 0.5) * shakeMag;
    }

    const cosYaw = Math.cos(yawRad);
    const sinYaw = Math.sin(yawRad);
    const cosPitch = Math.cos(thetaDown);
    const sinPitch = Math.sin(thetaDown);

    const fovScale = H * 0.88;
    const cxScreen = W * 0.5;
    const cyScreen = H * 0.5;

    // 1. Draw Sky & Ground Horizon Background
    const horizonY = cyScreen - Math.tan(thetaDown) * fovScale;
    const clampedHorizon = Math.max(0, Math.min(H, horizonY));

    const skyGrad = ctx.createLinearGradient(0, 0, 0, Math.max(10, clampedHorizon));
    skyGrad.addColorStop(0, env.skyTop);
    skyGrad.addColorStop(0.66, env.skyMid);
    skyGrad.addColorStop(1, env.skyHorizon);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, clampedHorizon + 2);

    ctx.fillStyle =
      envSeason === 'winter' ? '#2B3A4A' : scene.groundFill;
    ctx.fillRect(0, clampedHorizon, W, H - clampedHorizon);

    function worldToCam(wx, wy, wz) {
      const dx = wx - camX;
      const dy = wy - camY;
      const dz = wz - camZ;

      const x1 = dx * cosYaw - dz * sinYaw;
      const z1 = dx * sinYaw + dz * cosYaw;
      const y1 = dy;

      const y2 = y1 * cosPitch + z1 * sinPitch;
      const z2 = -y1 * sinPitch + z1 * cosPitch;
      return [x1, y2, z2];
    }

    function camToScreen(pt) {
      const invZ = fovScale / pt[2];
      return [cxScreen + pt[0] * invZ, cyScreen - pt[1] * invZ];
    }

    // 1B. Night Twinkling Starfield & Celestial Sun/Moon Volumetric Bloom Halo
    if (envTime === 'night' && clampedHorizon > 5) {
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < starField.length; i++) {
        const st = starField[i];
        const sxWorld = camX + Math.sin(st.az) * Math.cos(st.el) * 400;
        const syWorld = camY + Math.sin(st.el) * 400;
        const szWorld = camZ + Math.cos(st.az) * Math.cos(st.el) * 400;
        const sc = worldToCam(sxWorld, syWorld, szWorld);
        if (sc[2] > 2) {
          const sp = camToScreen(sc);
          if (sp[1] < clampedHorizon - 4) {
            const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(nowMs * 0.002 + st.phase));
            ctx.globalAlpha = twinkle;
            ctx.fillRect(sp[0], sp[1], st.size, st.size);
          }
        }
      }
      ctx.globalAlpha = 1;
    }

    const celWorld = [
      camX + sunDir[0] * 500,
      camY + sunDir[1] * 500,
      camZ + sunDir[2] * 500
    ];
    const celCam = worldToCam(celWorld[0], celWorld[1], celWorld[2]);
    if (celCam[2] > 10 && envWeather !== 'rain') {
      const celScreen = camToScreen(celCam);
      const haloRadius = envTime === 'sunset' ? H * 0.36 : H * 0.25;
      const [cr, cg, cb] = env.celestialColor;
      const haloGrad = ctx.createRadialGradient(
        celScreen[0],
        celScreen[1],
        4,
        celScreen[0],
        celScreen[1],
        haloRadius
      );
      haloGrad.addColorStop(0, `rgba(255, 255, 245, 0.95)`);
      haloGrad.addColorStop(0.12, `rgba(${cr}, ${cg}, ${cb}, 0.65)`);
      haloGrad.addColorStop(0.45, `rgba(${cr}, ${cg}, ${cb}, 0.18)`);
      haloGrad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(celScreen[0], celScreen[1], haloRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    const NEAR_Z = 1.1;
    function clipPolygonNear(camVerts) {
      const out = [];
      const n = camVerts.length;
      for (let i = 0; i < n; i++) {
        const cur = camVerts[i];
        const prev = camVerts[(i + n - 1) % n];
        const curIn = cur[2] >= NEAR_Z;
        const prevIn = prev[2] >= NEAR_Z;

        if (curIn !== prevIn) {
          const t = (NEAR_Z - prev[2]) / (cur[2] - prev[2]);
          out.push([
            prev[0] + (cur[0] - prev[0]) * t,
            prev[1] + (cur[1] - prev[1]) * t,
            NEAR_Z
          ]);
        }
        if (curIn) {
          out.push(cur);
        }
      }
      return out;
    }

    // 2. Draw 3D Perspective Ground Grid Lines
    ctx.strokeStyle = scene.gridStroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const gridStep = 32;
    const gridRadius = 320;
    const baseGX = Math.floor(droneX / gridStep) * gridStep;
    const baseGZ = Math.floor(droneZ / gridStep) * gridStep;

    for (let gx = baseGX - gridRadius; gx <= baseGX + gridRadius; gx += gridStep) {
      const c0 = worldToCam(gx, 0, baseGZ - gridRadius);
      const c1 = worldToCam(gx, 0, baseGZ + gridRadius);
      const clipped = clipPolygonNear([c0, c1]);
      if (clipped.length === 2) {
        const s0 = camToScreen(clipped[0]);
        const s1 = camToScreen(clipped[1]);
        ctx.moveTo(s0[0], s0[1]);
        ctx.lineTo(s1[0], s1[1]);
      }
    }
    for (let gz = baseGZ - gridRadius; gz <= baseGZ + gridRadius; gz += gridStep) {
      const c0 = worldToCam(baseGX - gridRadius, 0, gz);
      const c1 = worldToCam(baseGX + gridRadius, 0, gz);
      const clipped = clipPolygonNear([c0, c1]);
      if (clipped.length === 2) {
        const s0 = camToScreen(clipped[0]);
        const s1 = camToScreen(clipped[1]);
        ctx.moveTo(s0[0], s0[1]);
        ctx.lineTo(s1[0], s1[1]);
      }
    }
    ctx.stroke();

    // 3. Collect & Project Visible 3D Faces (with Volumetric Height + Distance Fog)
    const renderList = [];
    const MAX_DIST_SQ = 365 * 365;

    function pushFace(face, shiftX, shiftZ) {
      const verts = face.verts;
      const n = verts.length;
      const wVerts = new Array(n);
      const cVerts = new Array(n);
      let sumX = 0;
      let sumY = 0;
      let sumZ = 0;
      let sumWorldY = 0;
      let anyInFront = false;

      for (let i = 0; i < n; i++) {
        const wx = verts[i][0] + shiftX;
        const wy = verts[i][1];
        const wz = verts[i][2] + shiftZ;
        wVerts[i] = [wx, wy, wz];
        const cv = worldToCam(wx, wy, wz);
        cVerts[i] = cv;
        if (cv[2] >= NEAR_Z) anyInFront = true;
        sumX += cv[0];
        sumY += cv[1];
        sumZ += cv[2];
        sumWorldY += wy;
      }
      if (!anyInFront) return;

      const v0 = wVerts[0];
      const v1 = wVerts[1];
      const v2 = wVerts[2];
      const ux = v1[0] - v0[0];
      const uy = v1[1] - v0[1];
      const uz = v1[2] - v0[2];
      const vx = v2[0] - v0[0];
      const vy = v2[1] - v0[1];
      const vz = v2[2] - v0[2];

      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;
      const len = Math.hypot(nx, ny, nz) || 1;
      nx /= len;
      ny /= len;
      nz /= len;

      const viewDot =
        nx * (v0[0] - camX) + ny * (v0[1] - camY) + nz * (v0[2] - camZ);
      if (!face.doubleSided) {
        if (viewDot >= 0) return;
      } else if (viewDot > 0) {
        nx = -nx;
        ny = -ny;
        nz = -nz;
      }

      const clipped = clipPolygonNear(cVerts);
      if (clipped.length < 3) return;

      const screenPts = clipped.map(camToScreen);

      const sunDot = Math.max(0, nx * sunDir[0] + ny * sunDir[1] + nz * sunDir[2]);
      const emissive = face.emissive || 0;
      const light = Math.min(1.32, env.ambient + sunDot * env.diffuse + emissive);

      const avgDepth = Math.hypot(sumX / n, sumY / n, sumZ / n);
      const avgWorldY = sumWorldY / n;

      // Volumetric Fog = Distance Scattering + Low-Altitude Valley Mist
      let fogFactor = 0;
      if (!face.isDrone) {
        const distFog = Math.max(0, Math.min(0.88, (avgDepth - env.fogStart) / env.fogSpan));
        const lowAltMist =
          avgWorldY < 34
            ? (1 - avgWorldY / 34) * env.heightFogDensity * Math.min(1, avgDepth / 95)
            : 0;
        fogFactor = Math.max(0, Math.min(0.9, distFog + lowAltMist * (1 - distFog)));
      }

      const base = face.rgb;
      const fog = env.fogRgb;
      const r = Math.min(255, Math.round((base[0] * light) * (1 - fogFactor) + fog[0] * fogFactor));
      const g = Math.min(255, Math.round((base[1] * light) * (1 - fogFactor) + fog[1] * fogFactor));
      const b = Math.min(255, Math.round((base[2] * light) * (1 - fogFactor) + fog[2] * fogFactor));

      const alpha = face.alpha !== undefined ? face.alpha : 1;
      const fillStyle =
        alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;

      renderList.push({
        pts: screenPts,
        depth: face.isDrone ? avgDepth * 0.45 : avgDepth,
        fillStyle,
        isDrone: !!face.isDrone,
        alpha
      });
    }

    // Add Scene 3D Objects (with slow wind drift for Volumetric Clouds!)
    const objs = scene.objects;
    const cloudWindSec = nowMs * 0.001;
    for (let i = 0; i < objs.length; i++) {
      const obj = objs[i];
      const baseCx = obj.isCloud ? obj.cx + cloudWindSec * (obj.driftSpeed || 2.5) : obj.cx;
      const wrappedX = wrapCoord(baseCx, droneX);
      const wrappedZ = wrapCoord(obj.cz, droneZ);
      const dSq =
        (wrappedX - droneX) * (wrappedX - droneX) +
        (wrappedZ - droneZ) * (wrappedZ - droneZ);
      if (dSq > MAX_DIST_SQ) continue;

      const shiftX = wrappedX - obj.cx;
      const shiftZ = wrappedZ - obj.cz;
      const faces = obj.faces;
      for (let j = 0; j < faces.length; j++) {
        pushFace(faces[j], shiftX, shiftZ);
      }
    }

    // Add 3D Third-Person DJI Quadcopter Drone (Hidden in 1st-Person Mode!)
    if (!isFirstPerson) {
      const dronePitchRad = (currentPitch * Math.PI) / 180;
      const droneRollRad = (-currentRoll * Math.PI) / 180;
      const droneFaces = buildDrone3DFaces(
        droneX,
        droneY,
        droneZ,
        yawRad,
        dronePitchRad,
        droneRollRad,
        rotorPhase,
        isCrashed
      );
      for (let i = 0; i < droneFaces.length; i++) {
        pushFace(droneFaces[i], 0, 0);
      }
    }

    // Add 3D Crash Debris Shards when crashed
    if (isCrashed && crashDebris.length) {
      for (let i = 0; i < crashDebris.length; i++) {
        const d = crashDebris[i];
        const shardFaces = createBoxFaces(
          d.x,
          d.y,
          d.z,
          d.size,
          d.size,
          d.size,
          d.rgb,
          [255, 200, 120],
          null,
          0.75
        );
        for (let k = 0; k < shardFaces.length; k++) {
          shardFaces[k].isDrone = true;
          pushFace(shardFaces[k], 0, 0);
        }
      }
    }

    // Painter's Algorithm: Sort back-to-front by depth
    renderList.sort((a, b) => b.depth - a.depth);

    for (let i = 0; i < renderList.length; i++) {
      const item = renderList[i];
      const pts = item.pts;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) {
        ctx.lineTo(pts[k][0], pts[k][1]);
      }
      ctx.closePath();
      ctx.fillStyle = item.fillStyle;
      ctx.fill();

      if (item.alpha === 1) {
        ctx.strokeStyle = item.isDrone
          ? 'rgba(255, 255, 255, 0.22)'
          : 'rgba(255, 255, 255, 0.11)';
        ctx.lineWidth = item.isDrone ? 1.1 : 0.75;
        ctx.stroke();
      }
    }

    // 4. Multi-Layered Volumetric Fog & Atmospheric Mist Bands (体积雾)
    {
      const [fr, fg, fb] = env.fogRgb;
      const baseFogPeak =
        envWeather === 'fog'
          ? 0.56
          : envWeather === 'snow'
          ? 0.32
          : envWeather === 'rain'
          ? 0.28
          : 0.15;

      // Horizon Volumetric Mist Band
      const fogGrad = ctx.createLinearGradient(
        0,
        clampedHorizon - H * 0.26,
        0,
        clampedHorizon + H * 0.36
      );
      fogGrad.addColorStop(0, `rgba(${fr},${fg},${fb},0)`);
      fogGrad.addColorStop(0.48, `rgba(${fr},${fg},${fb},${baseFogPeak.toFixed(2)})`);
      fogGrad.addColorStop(0.75, `rgba(${fr},${fg},${fb},${(baseFogPeak * 0.6).toFixed(2)})`);
      fogGrad.addColorStop(1, `rgba(${fr},${fg},${fb},0)`);
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, W, H);

      // Drifting Volumetric Fog Puffs when in Fog / Snow / Rain or inside Cloud Deck
      const cloudDeckProximity = Math.max(0, 1 - Math.abs(camY - 135) / 38);
      if (envWeather === 'fog' || cloudDeckProximity > 0.05) {
        const puffAlpha = Math.min(0.48, (envWeather === 'fog' ? 0.26 : 0) + cloudDeckProximity * 0.34);
        for (let b = 0; b < 3; b++) {
          const driftX = ((nowMs * 0.025 * (b + 1) + b * 240) % (W + 400)) - 200;
          const bandY = clampedHorizon + (b - 1) * H * 0.11;
          const radG = ctx.createRadialGradient(driftX, bandY, 10, driftX, bandY, W * 0.42);
          radG.addColorStop(0, `rgba(${fr},${fg},${fb},${puffAlpha.toFixed(2)})`);
          radG.addColorStop(1, `rgba(${fr},${fg},${fb},0)`);
          ctx.fillStyle = radG;
          ctx.fillRect(0, 0, W, H);
        }
      }
    }

    // 5. Render High-Density 3D Weather Particles (Rain Streaks & Dense Swirling 3D Snowflakes)
    if (envWeather === 'rain' || envWeather === 'snow') {
      ctx.save();
      if (envWeather === 'rain') {
        ctx.strokeStyle = 'rgba(185, 220, 255, 0.54)';
        ctx.lineWidth = 1.35;
        ctx.beginPath();
        for (let i = 0; i < weatherParticles.length; i++) {
          const p = weatherParticles[i];
          const wx = camX + p.x;
          const wy = camY + p.y - 42;
          const wz = camZ + p.z;
          const c0 = worldToCam(wx, wy, wz);
          const c1 = worldToCam(wx + 0.7, wy - 4.5, wz);
          if (c0[2] > 1.8 && c1[2] > 1.8) {
            const s0 = camToScreen(c0);
            const s1 = camToScreen(c1);
            ctx.moveTo(s0[0], s0[1]);
            ctx.lineTo(s1[0], s1[1]);
          }
        }
        ctx.stroke();
      } else if (envWeather === 'snow') {
        // High-density 520 3D snowflakes with 3D turbulence & multi-scale depth
        ctx.fillStyle = 'rgba(248, 252, 255, 0.88)';
        ctx.beginPath();
        for (let i = 0; i < weatherParticles.length; i++) {
          const p = weatherParticles[i];
          const swirlX = Math.sin(nowMs * 0.0022 + p.drift) * 4.2;
          const swirlZ = Math.cos(nowMs * 0.0018 + p.driftZ) * 4.2;
          const wx = camX + p.x + swirlX;
          const wy = camY + p.y - 45;
          const wz = camZ + p.z + swirlZ;
          const c0 = worldToCam(wx, wy, wz);
          if (c0[2] > 1.6) {
            const s0 = camToScreen(c0);
            if (s0[0] >= -10 && s0[0] <= W + 10 && s0[1] >= -10 && s0[1] <= H + 10) {
              const sz = Math.max(1.2, Math.min(6.2, (105 / c0[2]) * p.sizeScale));
              ctx.moveTo(s0[0] + sz, s0[1]);
              ctx.arc(s0[0], s0[1], sz, 0, Math.PI * 2);
            }
          }
        }
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // =========================================================================
  // Main 60fps Inertial Flight Physics, Collision Check & 3D Render Loop
  // =========================================================================
  let lastFrame = performance.now();

  function stepFpvSimulation(now) {
    const dt = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;

    if (isActive) {
      const activeScene = SCENES_3D[activeSceneKey] || SCENES_3D.city;

      // Update High-Density 3D Weather Particle Positions
      if (envWeather === 'rain' || envWeather === 'snow') {
        const fallMul = envWeather === 'rain' ? 2.4 : 0.62;
        for (let i = 0; i < weatherParticles.length; i++) {
          const p = weatherParticles[i];
          p.y -= p.speed * fallMul * dt;
          if (p.y < 0) {
            p.y = 125;
            p.x = (Math.random() - 0.5) * 210;
            p.z = (Math.random() - 0.5) * 210;
          }
        }
      }

      if (!isCrashed) {
        const mult = modeMultipliers[flightMode] || 1.0;

        // Up/Down Arrows = Altitude (高低), Q/E = Yaw (转向)
        const keyAltY = (keysPressed['arrowdown'] ? 1 : 0) - (keysPressed['arrowup'] ? 1 : 0);
        const keyYawX = (keysPressed['e'] ? 1 : 0) - (keysPressed['q'] ? 1 : 0);

        // W/S = Forward/Back (前后), A/D = Left/Right (左右)
        const keyMoveY = (keysPressed['s'] ? 1 : 0) - (keysPressed['w'] ? 1 : 0);
        const keyMoveX = (keysPressed['d'] ? 1 : 0) - (keysPressed['a'] ? 1 : 0);

        const effLeftX = Math.max(-1, Math.min(1, leftX + keyYawX));
        const effLeftY = Math.max(-1, Math.min(1, leftY + keyAltY));
        const effRightX = Math.max(-1, Math.min(1, rightX + keyMoveX));
        const effRightY = Math.max(-1, Math.min(1, rightY + keyMoveY));

        // 1. Rotational Yaw Inertia (Q/E accelerates angular velocity, releasing coasts smoothly)
        const targetYawRate = effLeftX * 72 * mult;
        const yawResponse = Math.abs(effLeftX) > 0.01 ? 3.8 : 2.1;
        yawVel += (targetYawRate - yawVel) * Math.min(1, dt * yawResponse);
        headingDeg = (headingDeg + yawVel * dt + 360) % 360;

        const yawRad = (headingDeg * Math.PI) / 180;
        const fwdX = Math.sin(yawRad);
        const fwdZ = Math.cos(yawRad);
        const rightVecX = Math.cos(yawRad);
        const rightVecZ = -Math.sin(yawRad);

        // 2. 3D Translational Momentum & Aerodynamic Drag Inertia (WASD + ↑↓)
        const forwardSpeed = -effRightY * 46 * mult;
        const strafeSpeed = effRightX * 36 * mult;
        const targetVx = fwdX * forwardSpeed + rightVecX * strafeSpeed;
        const targetVz = fwdZ * forwardSpeed + rightVecZ * strafeSpeed;
        const targetVy = -effLeftY * 26 * mult;

        const hasHorizInput = Math.abs(effRightX) > 0.01 || Math.abs(effRightY) > 0.01;
        const hasVertInput = Math.abs(effLeftY) > 0.01;
        const horizInertiaRate = hasHorizInput ? 2.5 : 1.38; // Smooth glide/coast on key release
        const vertInertiaRate = hasVertInput ? 2.8 : 1.75;

        vxWorld += (targetVx - vxWorld) * Math.min(1, dt * horizInertiaRate);
        vzWorld += (targetVz - vzWorld) * Math.min(1, dt * horizInertiaRate);
        vyWorld += (targetVy - vyWorld) * Math.min(1, dt * vertInertiaRate);

        // 3. Inertial Pitch & Roll Attitude Banking (Tilts with thrust & counter-tilts when braking)
        const localVelFwd = vxWorld * fwdX + vzWorld * fwdZ;
        const localVelRight = vxWorld * rightVecX + vzWorld * rightVecZ;
        const accelFwd = forwardSpeed - localVelFwd;
        const accelRight = strafeSpeed - localVelRight;

        const targetPitch = Math.max(-28, Math.min(28, -effRightY * 16 * mult + accelFwd * 0.22));
        const targetRoll = Math.max(-28, Math.min(28, effRightX * 20 * mult + accelRight * 0.25));
        currentRoll += (targetRoll - currentRoll) * Math.min(1, dt * 5.4);
        currentPitch += (targetPitch - currentPitch) * Math.min(1, dt * 5.4);

        droneX += vxWorld * dt;
        droneZ += vzWorld * dt;
        droneY = Math.min(340, droneY + vyWorld * dt);

        const horizontalSpeed = Math.hypot(vxWorld, vzWorld);
        rotorPhase += dt * (26 + horizontalSpeed * 0.45);

        // 4. Check 3D Collisions against Landmarks, Buildings, Snow Peaks, Trees, Yurts & Ground
        checkObstacleCollisions(activeScene);
      } else {
        // Crashed Physics: Tumble & Fall to Ground + Update Debris Shards
        crashShakeTime = Math.max(0, crashShakeTime - dt);
        vxWorld *= 0.92;
        vzWorld *= 0.92;
        yawVel *= 0.9;
        if (droneY > 1.1) {
          vyWorld -= 38 * dt;
          droneY = Math.max(1.0, droneY + vyWorld * dt);
          currentRoll += 160 * dt;
          currentPitch -= 110 * dt;
        } else {
          vyWorld = 0;
          currentRoll += (38 - currentRoll) * Math.min(1, dt * 6);
          currentPitch += (-24 - currentPitch) * Math.min(1, dt * 6);
        }

        for (let i = 0; i < crashDebris.length; i++) {
          const d = crashDebris[i];
          d.x += d.vx * dt;
          d.z += d.vz * dt;
          d.vy -= 28 * dt;
          d.y = Math.max(0.4, d.y + d.vy * dt);
          if (d.y <= 0.45) {
            d.vx *= 0.85;
            d.vz *= 0.85;
          }
        }
      }

      const horizontalSpeed = isCrashed ? 0 : Math.hypot(vxWorld, vzWorld);
      const homeDistance = Math.hypot(droneX, droneZ);

      // Render 3D Minimalist Geometric World & Drone
      render3DScene(activeScene, now);

      // Update HUD Elements
      if (horizonGroup) {
        horizonGroup.style.transform = `translate3d(0, ${(currentPitch * 2.2).toFixed(1)}px, 0) rotate(${(-currentRoll).toFixed(2)}deg)`;
      }
      if (compassTrack) {
        const compassShift = -((headingDeg / 360) * 320);
        compassTrack.style.transform = `translate3d(${compassShift.toFixed(1)}px, 0, 0)`;
      }
      if (headingVal) {
        headingVal.textContent = `${Math.round(headingDeg).toString().padStart(3, '0')}°`;
      }
      if (radarCompass) {
        radarCompass.style.transform = `rotate(${(-headingDeg).toFixed(1)}deg)`;
      }
      if (radarHorizon) {
        radarHorizon.style.transform = `translateY(${(currentPitch * 0.9).toFixed(1)}px) rotate(${(-currentRoll).toFixed(1)}deg)`;
      }

      if (altVal) altVal.textContent = droneY.toFixed(1);
      if (vsVal) vsVal.textContent = (isCrashed ? 0 : vyWorld).toFixed(1);
      if (distVal) distVal.textContent = homeDistance.toFixed(1);
      if (spdVal) spdVal.textContent = horizontalSpeed.toFixed(1);
      if (pitchReadout) pitchReadout.textContent = `PITCH ${currentPitch.toFixed(1)}°`;
      if (rollReadout) rollReadout.textContent = `ROLL ${currentRoll.toFixed(1)}°`;
    }

    requestAnimationFrame(stepFpvSimulation);
  }

  requestAnimationFrame(stepFpvSimulation);
}
