// layout.js
document.addEventListener('DOMContentLoaded', () => {
  const playerContainer = document.getElementById('playerContainer');
  let isSticky = false;

  function checkSticky() {
    if (window.innerWidth >= 992) return;

    const rect = playerContainer.getBoundingClientRect();
    const shouldBeSticky = rect.top <= 0;

    if (shouldBeSticky && !isSticky) {
      playerContainer.classList.add('sticky-video');
      isSticky = true;
    } else if (!shouldBeSticky && isSticky) {
      playerContainer.classList.remove('sticky-video');
      isSticky = false;
    }
  }

  window.addEventListener('scroll', () => {
    if (window.innerWidth < 992) checkSticky();
  });

  window.addEventListener('resize', checkSticky);
  checkSticky();
});