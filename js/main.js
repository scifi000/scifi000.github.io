const parallaxLayers = document.querySelectorAll('[data-depth]');
const introOverlay = document.getElementById('intro');
const introTilesContainer = document.getElementById('introTiles');
const introContent = document.getElementById('introContent');
const enterButton = document.getElementById('enter-btn');

const playButton = document.getElementById('play-btn');
const introReveal = document.getElementById('introReveal');
const bgAudio = document.getElementById('bg-audio');

playButton.addEventListener('click', function() {
    bgAudio.play();
    playButton.classList.add('fading');
    introReveal.classList.add('visible');
});

const TILE_COLS = 16;
const TILE_ROWS = 10;
const MAX_DELAY = 0.7;
const TILE_ANIM_DURATION = 1100;

function buildIntroTiles() {
    const centerX = (TILE_COLS - 1) / 2;
    const centerY = (TILE_ROWS - 1) / 2;
    const maxDist = Math.hypot(centerX, centerY);

    for (let row = 0; row < TILE_ROWS; row++) {
        for (let col = 0; col < TILE_COLS; col++) {
            const tile = document.createElement('div');
            tile.className = 'tile';

            const xPercent = (col / (TILE_COLS - 1)) * 100;
            const yPercent = (row / (TILE_ROWS - 1)) * 100;

            tile.style.backgroundImage = "linear-gradient(rgba(23, 16, 23, 0.65), rgba(23, 16, 23, 0.65)), url('BACKGROUND.webp')";
            tile.style.backgroundSize = `cover, ${TILE_COLS * 100}% ${TILE_ROWS * 100}%`;
            tile.style.backgroundPosition = `center, ${xPercent}% ${yPercent}%`;

            const dist = Math.hypot(col - centerX, row - centerY);
            const delay = (dist / maxDist) * MAX_DELAY;
            tile.style.transitionDelay = `${delay}s`;

            introTilesContainer.appendChild(tile);
        }
    }
}

buildIntroTiles();

enterButton.addEventListener('click', function() {
    introContent.classList.add('fading');

    const tiles = introTilesContainer.querySelectorAll('.tile');
    tiles.forEach(tile => tile.classList.add('tile--out'));

    setTimeout(function() {
        introOverlay.classList.add('hidden');
    }, TILE_ANIM_DURATION + MAX_DELAY * 1000);
});

function handleParallax(event) {
    const offsetX = event.clientX - (window.innerWidth / 2);
    const offsetY = event.clientY - (window.innerHeight / 2);

    parallaxLayers.forEach((el) => {
        const depth = parseFloat(el.dataset.depth) || 0;
        const moveX = offsetX * depth;
        const moveY = offsetY * depth;
        el.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
}

window.addEventListener('mousemove', handleParallax);

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

    requestAnimationFrame(function() {
        pixel.classList.add('fade');
    });

    setTimeout(function() {
        pixel.remove();
    }, 700);
}

window.addEventListener('mousemove', function(event) {
    spawnTrailPixel(event.clientX, event.clientY);
});