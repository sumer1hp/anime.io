// subtitle-loader.js
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('subtitleFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const items = parseSrt(content);
      window.dispatchEvent(new CustomEvent('subtitlesLoaded', { detail: { items } }));
    };
    reader.readAsText(file, 'utf-8');
  });
});

function parseSrt(text) {
  const lines = text.split('\n');
  const items = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line === '' || !/^\d+$/.test(line)) {
      i++;
      continue;
    }

    i++;
    if (i >= lines.length) break;

    const timeLine = lines[i].trim();
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    if (!timeMatch) {
      i++;
      continue;
    }

    const start = timeToSeconds(timeMatch[1]);
    const end = timeToSeconds(timeMatch[2]);
    i++;

    let textLines = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i].trim());
      i++;
    }

    items.push({
      id: parseInt(line),
      start,
      end,
      text: textLines.join('\n')
    });
  }

  return items;
}

function timeToSeconds(timeStr) {
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!match) return 0;
  const [, h, m, s, ms] = match.map(Number);
  return h * 3600 + m * 60 + s + ms / 1000;
}