// player.js
document.getElementById('videoFile').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  const video = document.getElementById('videoPlayer');
  video.src = url;
  document.getElementById('playerContainer').classList.remove('d-none');

  video.addEventListener('timeupdate', () => {
    const items = window.getSubtitleItems ? window.getSubtitleItems() : [];
    const currentTime = video.currentTime;
    const current = items.find(item => currentTime >= item.start && currentTime <= item.end);
    document.getElementById('subtitleOverlay').textContent = current ? current.text : '';
  });
});