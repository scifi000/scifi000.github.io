const parallaxLayers = document.querySelectorAll('[data-depth]');
const introOverlay = document.getElementById('intro');
const enterButton = document.getElementById('enter-btn');

enterButton.addEventListener('click', function() {
    introOverlay.classList.add('hidden');
});

function handleParallax(event) {
  // convert cursor position into a -1..1 range from the screen center
  const offsetX = event.clientX - (window.innerWidth/2);
  const offsetY = event.clientY - (window.innerHeight/2);

  parallaxLayers.forEach((el) => {
    const depth = parseFloat(el.dataset.depth) || 0;
    const moveX = offsetX * depth;
    const moveY = offsetY * depth;
    el.style.transform = `translate(${moveX}px, ${moveY}px)`;
  });
}

window.addEventListener('mousemove', handleParallax);