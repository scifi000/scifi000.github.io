const parallaxLayers = document.querySelectorAll('[data-depth]');
const introOverlay = document.getElementById('intro');
const introTilesContainer = document.getElementById('introTiles');
const introContent = document.getElementById('introContent');
const enterButton = document.getElementById('enter-btn');

const playButton = document.getElementById('play-btn');
const introReveal = document.getElementById('introReveal');
const bgAudio = document.getElementById('bg-audio');
const muteButton = document.getElementById('mute-btn');
const newsletterForm = document.getElementById('newsletter-form');
const vignette = document.getElementById('vignette');
const cursorDot = document.getElementById('cursorDot');

/* ============================================================
   Sound engine — everything is synthesized with the Web Audio
   API, so the intro/UI sounds work with no audio assets beyond
   the background track itself. Created lazily on first user
   gesture (browsers block audio before that anyway).
   ============================================================ */
let audioCtx = null;
let sfxMuted = false;

function ensureAudioCtx() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTone({ freq = 880, duration = 0.08, type = 'sine', peak = 0.06, sweepTo = null, delay = 0, pan = 0 } = {}) {
    if (sfxMuted) return;
    const ctx = ensureAudioCtx();
    const start = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (sweepTo) {
        osc.frequency.exponentialRampToValueAtTime(sweepTo, start + duration);
    }

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    let lastNode = gain;
    if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), start);
        gain.connect(panner);
        lastNode = panner;
    }

    osc.connect(gain);
    lastNode.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
}

/* Stereo position derived from where on screen the triggering element sits,
   so a click on the far-left Spotify button ticks slightly left, etc. */
function panFromEvent(event) {
    const el = event.currentTarget;
    if (!el || !el.getBoundingClientRect) return 0;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    return (centerX / window.innerWidth) * 2 - 1;
}

function playClickTick(pan = 0) {
    playTone({ freq: 1180, sweepTo: 980, duration: 0.09, type: 'square', peak: 0.22, pan });
}

function playHoverTick(pan = 0) {
    playTone({ freq: 1500, duration: 0.05, type: 'square', peak: 0.12, pan });
}

function playEnterWhoosh() {
    playTone({ freq: 220, sweepTo: 1400, duration: 0.5, type: 'sawtooth', peak: 0.22 });
    playTone({ freq: 660, sweepTo: 1760, duration: 0.35, type: 'square', peak: 0.16, delay: 0.05 });
}

function playPowerOn() {
    playTone({ freq: 140, sweepTo: 520, duration: 0.4, type: 'sawtooth', peak: 0.2 });
}

function playConfirmChime() {
    playTone({ freq: 880, duration: 0.12, type: 'square', peak: 0.2 });
    playTone({ freq: 1320, duration: 0.18, type: 'square', peak: 0.2, delay: 0.09 });
}

document.querySelectorAll('[data-sfx="tick"]').forEach((el) => {
    el.addEventListener('click', (event) => playClickTick(panFromEvent(event)));
});

document.querySelectorAll('.link-button, #enter-btn').forEach((el) => {
    el.addEventListener('mouseenter', (event) => playHoverTick(panFromEvent(event)));
});

/* ============================================================
   Scramble-in text: letters resolve out of noise into the real
   word. Used once, on the intro logo reveal.
   ============================================================ */
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&$+=';

function scrambleInto(el, finalText, totalDuration = 650) {
    const revealEvery = totalDuration / finalText.length;
    let frame = 0;
    el.classList.add('is-scrambling');

    const interval = setInterval(() => {
        frame += 16;
        let out = '';
        for (let i = 0; i < finalText.length; i++) {
            const revealAt = i * revealEvery;
            if (finalText[i] === ' ' ) {
                out += ' ';
            } else if (frame >= revealAt + revealEvery) {
                out += finalText[i];
            } else if (frame >= revealAt) {
                out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            } else {
                out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            }
        }
        el.textContent = out;

        if (frame >= totalDuration + revealEvery) {
            clearInterval(interval);
            el.textContent = finalText;
            el.classList.remove('is-scrambling');
        }
    }, 16);
}

/* ============================================================
   Intro: play track, then reveal the logo + Enter control
   ============================================================ */
playButton.addEventListener('click', function () {
    ensureAudioCtx();
    setUpAudioAnalyser();
    bgAudio.play();
    playButton.classList.add('fading');
    introReveal.classList.add('visible');

    const introScript = introReveal.querySelector('.logo-script');
    if (introScript) {
        scrambleInto(introScript, introScript.textContent.trim());
    }
});

/* ============================================================
   Intro tile grid. The dissolve on Enter radiates outward from
   the point where the logo actually sits (--title-x / --title-y
   in the stylesheet), not the middle of the screen, so the
   reveal appears to originate from the wordmark itself and
   lands exactly where the hero logo is waiting underneath.
   ============================================================ */
const TILE_COLS = 16;
const TILE_ROWS = 10;
const MAX_DELAY = 0.7;
const TILE_ANIM_DURATION = 1100;

function getOriginFraction() {
    const styles = getComputedStyle(document.documentElement);
    const xVw = parseFloat(styles.getPropertyValue('--title-x')) || 50;
    const yVh = parseFloat(styles.getPropertyValue('--title-y')) || 50;
    return { xFrac: xVw / 100, yFrac: yVh / 100 };
}

function buildIntroTiles() {
    const { xFrac, yFrac } = getOriginFraction();
    const originX = xFrac * (TILE_COLS - 1);
    const originY = yFrac * (TILE_ROWS - 1);

    const corners = [
        Math.hypot(originX, originY),
        Math.hypot((TILE_COLS - 1) - originX, originY),
        Math.hypot(originX, (TILE_ROWS - 1) - originY),
        Math.hypot((TILE_COLS - 1) - originX, (TILE_ROWS - 1) - originY),
    ];
    const maxDist = Math.max(...corners);

    for (let row = 0; row < TILE_ROWS; row++) {
        for (let col = 0; col < TILE_COLS; col++) {
            const tile = document.createElement('div');
            tile.className = 'tile';

            const xPercent = (col / (TILE_COLS - 1)) * 100;
            const yPercent = (row / (TILE_ROWS - 1)) * 100;

            tile.style.backgroundImage = "linear-gradient(rgba(7, 11, 15, 0.55), rgba(7, 11, 15, 0.55)), url('BACKGROUND.webp')";
            tile.style.backgroundSize = `cover, ${TILE_COLS * 100}% ${TILE_ROWS * 100}%`;
            tile.style.backgroundPosition = `22% 28%, ${xPercent}% ${yPercent}%`;

            const dist = Math.hypot(col - originX, row - originY);
            const delay = (dist / maxDist) * MAX_DELAY;
            tile.style.transitionDelay = `${delay}s`;

            introTilesContainer.appendChild(tile);
        }
    }
}

buildIntroTiles();

enterButton.addEventListener('click', function () {
    playEnterWhoosh();
    introContent.classList.add('fading');

    const tiles = introTilesContainer.querySelectorAll('.tile');
    tiles.forEach(tile => tile.classList.add('tile--out'));

    setTimeout(function () {
        introOverlay.classList.add('hidden');
    }, TILE_ANIM_DURATION + MAX_DELAY * 1000);
});

/* ============================================================
   Audio-reactive glow. Routes the background track through an
   AnalyserNode so the play button's ring and the logo glow
   breathe with the bass, and the hero orbs pulse gently. Runs
   once, wired up on the first play. Fails silently if the
   browser blocks it — the site is unaffected either way.
   ============================================================ */
let analyser = null;
let audioSourceConnected = false;

function setUpAudioAnalyser() {
    if (audioSourceConnected) return;
    audioSourceConnected = true;
    try {
        const ctx = ensureAudioCtx();
        const source = ctx.createMediaElementSource(bgAudio);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        startBassLoop();
    } catch (err) {
        console.warn('Audio analyser unavailable, continuing without bass-reactive glow.', err);
    }
}

function startBassLoop() {
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const orbs = document.querySelectorAll('.hero__orb');
    const bassBins = 8;

    function loop() {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < bassBins; i++) sum += data[i];
        const bass = Math.min(1, (sum / bassBins) / 200);

        document.documentElement.style.setProperty('--bass', bass.toFixed(3));
        playButton.style.setProperty('--bass', bass.toFixed(3));

        orbs.forEach((orb, i) => {
            orb.dataset.audioScale = (1 + bass * (0.12 + i * 0.03)).toFixed(3);
        });

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

/* ============================================================
   Mute control — governs both the looping background track and
   the synthesized UI sounds, so muting is total.
   ============================================================ */
muteButton.addEventListener('click', function () {
    sfxMuted = !sfxMuted;
    bgAudio.muted = sfxMuted;
    muteButton.classList.toggle('is-muted', sfxMuted);
    muteButton.setAttribute('aria-pressed', String(sfxMuted));
    muteButton.setAttribute('aria-label', sfxMuted ? 'Unmute background audio' : 'Mute background audio');
    if (!sfxMuted) playClickTick();
});

/* ============================================================
   Newsletter — lightweight confirmation, no real backend wired
   yet, but avoids a hard page reload and gives feedback.
   ============================================================ */
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const button = newsletterForm.querySelector('button[type="submit"]');
        const input = newsletterForm.querySelector('input[type="email"]');
        if (!button || !input || !input.value) return;

        playConfirmChime();
        const originalLabel = button.textContent;
        button.textContent = 'Subscribed';
        button.classList.add('sent');
        input.value = '';

        setTimeout(function () {
            button.textContent = originalLabel;
            button.classList.remove('sent');
        }, 2200);
    });
}

/* ============================================================
   Parallax + cursor trail (unchanged behaviour)
   ============================================================ */
function handleParallax(event) {
    const offsetX = event.clientX - (window.innerWidth / 2);
    const offsetY = event.clientY - (window.innerHeight / 2);

    parallaxLayers.forEach((el) => {
        const depth = parseFloat(el.dataset.depth) || 0;
        const moveX = offsetX * depth;
        const moveY = offsetY * depth;
        const audioScale = el.dataset.audioScale ? ` scale(${el.dataset.audioScale})` : '';
        el.style.transform = `translate(${moveX}px, ${moveY}px)${audioScale}`;
    });
}

window.addEventListener('mousemove', handleParallax);

/* ============================================================
   Custom cursor — a single dot that tracks the pointer exactly
   and grows slightly over interactive elements. Disabled
   automatically on touch devices via CSS.
   ============================================================ */
if (cursorDot && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    window.addEventListener('mousemove', (event) => {
        cursorDot.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
    });

    document.querySelectorAll('a, button, input').forEach((el) => {
        el.addEventListener('mouseenter', () => cursorDot.classList.add('cursor-dot--active'));
        el.addEventListener('mouseleave', () => cursorDot.classList.remove('cursor-dot--active'));
    });
}

/* ============================================================
   Magnetic buttons — nudge toward the cursor as it approaches,
   snap back on leave.
   ============================================================ */
document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('mousemove', (event) => {
        const rect = el.getBoundingClientRect();
        const relX = event.clientX - (rect.left + rect.width / 2);
        const relY = event.clientY - (rect.top + rect.height / 2);
        el.style.transform = `translate(${relX * 0.25}px, ${relY * 0.35}px)`;
    });
    el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate(0, 0)';
    });
});

/* ============================================================
   Vignette tightens slightly as you scroll down the page.
   ============================================================ */
if (vignette) {
    function updateVignette() {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0;
        document.documentElement.style.setProperty('--vignette-intensity', (0.3 + progress * 0.25).toFixed(3));
    }
    window.addEventListener('scroll', updateVignette, { passive: true });
    updateVignette();
}

/* ============================================================
   Tab title swaps while the track plays in a backgrounded tab.
   ============================================================ */
const originalTitle = document.title;
document.addEventListener('visibilitychange', () => {
    if (document.hidden && !bgAudio.paused) {
        document.title = '◄ still playing — scifi000';
    } else {
        document.title = originalTitle;
    }
});
bgAudio.addEventListener('pause', () => {
    if (document.hidden) document.title = originalTitle;
});

let lastTrailTime = 0;

function spawnTrailPixel(x, y) {
    const now = Date.now();
    if (now - lastTrailTime < 45) return;
    lastTrailTime = now;

    const pixel = document.createElement('div');
    pixel.className = 'trail-pixel';
    const size = 4 + Math.random() * 6;
    pixel.style.width = `${size}px`;
    pixel.style.height = `${size}px`;
    pixel.style.left = `${x}px`;
    pixel.style.top = `${y}px`;

    document.body.appendChild(pixel);

    requestAnimationFrame(function () {
        pixel.classList.add('fade');
    });

    setTimeout(function () {
        pixel.remove();
    }, 700);
}

window.addEventListener('mousemove', function (event) {
    spawnTrailPixel(event.clientX, event.clientY);
});
