// export.js
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('exportSrt').addEventListener('click', exportSrt);
  document.getElementById('exportAss').addEventListener('click', exportAss);
});

function exportSrt() {
  const items = window.getSubtitleItems ? window.getSubtitleItems() : [];
  if (items.length === 0) {
    alert('Нет субтитров для экспорта');
    return;
  }
  
  const srt = items.map((item, i) => 
    `${i + 1}\n${secondsToTime(item.start)} --> ${secondsToTime(item.end)}\n${item.text}\n`
  ).join('\n');
  
  downloadFile('subtitles.srt', srt);
}

function exportAss() {
  const items = window.getSubtitleItems ? window.getSubtitleItems() : [];
  if (items.length === 0) {
    alert('Нет субтитров для экспорта');
    return;
  }
  
  let ass = `[Script Info]
Title: Экспортированные субтитры
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 384
PlayResY: 288

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  
  items.forEach(item => {
    ass += `Dialogue: 0,${secondsToAssTime(item.start)},${secondsToAssTime(item.end)},Default,,0,0,0,,${item.text.replace(/\n/g, '\\N')}\n`;
  });
  
  downloadFile('subtitles.ass', ass);
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
