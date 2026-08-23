/* ==========================================================
   1. INTRO "MELT" TRANSITION
   ==========================================================
   How it works, in order:
   - The intro screen (#intro) has an SVG filter applied to it
     (see the <filter id="melt-filter"> in index.html) that can
     warp its pixels using noise (feTurbulence + feDisplacementMap).
   - It also has a CSS mask (a circle, controlled by the --r
     custom property in style.css) that we shrink from 150% down
     to 0%, which "drains" the whole layer into its center point.
   - On click we animate both of those together with a small
     requestAnimationFrame loop, then hide the intro and reveal
     the real site.
*/

const intro = document.getElementById('intro');
const enterBtn = document.getElementById('enterBtn');
const meltDisplace = document.getElementById('meltDisplace'); // <feDisplacementMap>
const meltTurbulence = document.getElementById('meltTurbulence'); // <feTurbulence>

const MELT_DURATION = 1400; // ms — keep this in sync with the CSS opacity transition delay

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function playMeltTransition() {
  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / MELT_DURATION, 1); // 0 -> 1 progress
    const eased = easeInOutCubic(t);

    // shrink the radial mask from 150% down to 0%
    const radius = 150 - eased * 150;
    intro.style.setProperty('--r', radius + '%');

    // ramp the displacement (warp) amount up, then let it fall off
    // right at the end so it doesn't look glitchy on the last frame
    const warp = Math.sin(eased * Math.PI) * 220; // peaks mid-transition
    meltDisplace.setAttribute('scale', warp.toFixed(1));

    // slowly increase noise frequency for a more "boiling" look
    const freq = 0.01 + eased * 0.04;
    meltTurbulence.setAttribute('baseFrequency', `${freq.toFixed(3)} ${(freq * 2).toFixed(3)}`);

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      // animation finished — fully remove the intro from the page
      intro.classList.add('is-hidden');
    }
  }

  requestAnimationFrame(frame);
}

enterBtn.addEventListener('click', () => {
  intro.classList.add('is-leaving'); // triggers the opacity fade in CSS
  playMeltTransition();               // drives the mask + displacement warp
});

/* ==========================================================
   2. CURSOR-REACTIVE "DEPTH FIELD" PARALLAX
   ==========================================================
   Every element with a [data-depth] attribute shifts slightly
   toward/away from the cursor. Bigger data-depth = moves more =
   feels closer to the viewer (foreground), smaller = feels
   further away (background) — same idea as real-world parallax.
*/
const parallaxLayers = document.querySelectorAll('[data-depth]');

function handleParallax(event) {
  // convert cursor position into a -1..1 range from the screen center
  const xRatio = (event.clientX / window.innerWidth - 0.5) * 2;
  const yRatio = (event.clientY / window.innerHeight - 0.5) * 2;

  parallaxLayers.forEach((el) => {
    const depth = parseFloat(el.dataset.depth) || 0;
    const moveX = xRatio * depth;
    const moveY = yRatio * depth;
    el.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
}

window.addEventListener('mousemove', handleParallax);

/* ==========================================================
   3. NEWSLETTER FORM (placeholder)
   ==========================================================
   This does NOT send the email anywhere yet — there's no
   backend here, and GitHub Pages can't run one. To make this
   real, either:
     a) point form's "action" at a hosted form service like
        Formspree, or
     b) use an embed snippet from Mailchimp/ConvertKit instead
        of this custom <form> entirely.
   For now, it just shows a confirmation message so the UI feels
   complete while you build.
*/
const newsletterForm = document.getElementById('newsletterForm');
const newsletterNote = document.getElementById('newsletterNote');

newsletterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = newsletterForm.email.value;
  newsletterNote.textContent = `(placeholder) would subscribe: ${email}`;
  newsletterForm.reset();
});
