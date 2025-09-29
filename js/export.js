// export.js
document.getElementById('exportSrt').addEventListener('click', () => {
  const items = window.getSubtitleItems ? window.getSubtitleItems() : [];
  const srt = items.map((item, i) => 
    `${i + 1}\n${secondsToTime(item.start)} --> ${secondsToTime(item.end)}\n${item.text}\n`
  ).join('\n');
  downloadFile('subtitles.srt', srt);
});

document.getElementById('exportAss').addEventListener('click', () => {
  const items = window.getSubtitleItems ? window.getSubtitleItems() : [];
  let ass = `[Script Info]
Title: Exported
ScriptType: v4.00+
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,16,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,1,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  items.forEach(item => {
    ass += `Dialogue: 0,${secondsToAssTime(item.start)},${secondsToAssTime(item.end)},Default,,0,0,0,,${item.text.replace(/\n/g, '\\N')}\n`;
  });
  downloadFile('subtitles.ass', ass);
});

function secondsToTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function secondsToAssTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${h.toString().padStart(1, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}