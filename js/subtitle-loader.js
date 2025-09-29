// subtitle-loader.js
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('subtitleFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      let items;
      
      if (file.name.endsWith('.srt')) {
        items = parseSrt(content);
      } else if (file.name.endsWith('.vtt')) {
        items = parseVtt(content);
      } else if (file.name.endsWith('.ass')) {
        items = parseAss(content);
      } else {
        alert('Неподдерживаемый формат файла');
        return;
      }
      
      window.dispatchEvent(new CustomEvent('subtitlesLoaded', { detail: { items } }));
    };
    reader.readAsText(file, 'utf-8');
  });
});

function parseSrt(text) {
  const blocks = text.split(/\n\s*\n/);
  const items = [];
  let idCounter = 1;

  blocks.forEach(block => {
    const lines = block.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 3) return;

    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    if (!timeMatch) return;

    const start = (+timeMatch[1]) * 3600 + (+timeMatch[2]) * 60 + (+timeMatch[3]) + (+timeMatch[4]) / 1000;
    const end = (+timeMatch[5]) * 3600 + (+timeMatch[6]) * 60 + (+timeMatch[7]) + (+timeMatch[8]) / 1000;
    
    const textLines = lines.slice(2);
    
    items.push({
      id: idCounter++,
      start,
      end,
      text: textLines.join('\n')
    });
  });

  return items;
}

function parseVtt(content) {
  // Базовая реализация для VTT
  const lines = content.split('\n');
  const items = [];
  let i = 0;
  let idCounter = 1;

  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
      if (timeMatch) {
        const start = (+timeMatch[1]) * 3600 + (+timeMatch[2]) * 60 + (+timeMatch[3]) + (+timeMatch[4]) / 1000;
        const end = (+timeMatch[5]) * 3600 + (+timeMatch[6]) * 60 + (+timeMatch[7]) + (+timeMatch[8]) / 1000;
        
        i++;
        const textLines = [];
        while (i < lines.length && lines[i].trim() !== '') {
          textLines.push(lines[i].trim());
          i++;
        }
        
        items.push({
          id: idCounter++,
          start,
          end,
          text: textLines.join('\n')
        });
      }
    }
    i++;
  }

  return items;
}

function parseAss(content) {
  // Базовая реализация для ASS (только диалоги)
  const items = [];
  const lines = content.split('\n');
  let inEvents = false;
  let idCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '[Events]') {
      inEvents = true;
      continue;
    }
    
    if (inEvents && line.startsWith('Dialogue:')) {
      const parts = line.split(',');
      if (parts.length >= 10) {
        const start = assTimeToSeconds(parts[1]);
        const end = assTimeToSeconds(parts[2]);
        const text = parts.slice(9).join(',').replace(/\\N/g, '\n');
        
        items.push({
          id: idCounter++,
          start,
          end,
          text: text
        });
      }
    }
    
    if (inEvents && line.startsWith('[')) {
      break;
    }
  }

  return items;
}

function assTimeToSeconds(assTime) {
  const match = assTime.match(/(\d+):(\d{2}):(\d{2})\.(\d{2})/);
  if (!match) return 0;
  return (+match[1]) * 3600 + (+match[2]) * 60 + (+match[3]) + (+match[4]) / 100;
}

function timeToSeconds(timeStr) {
  // Универсальная функция для разных форматов времени
  let match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (match) {
    return (+match[1]) * 3600 + (+match[2]) * 60 + (+match[3]) + (+match[4]) / 1000;
  }
  
  match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{2})/);
  if (match) {
    return (+match[1]) * 3600 + (+match[2]) * 60 + (+match[3]) + (+match[4]) / 100;
  }
  
  return 0;
}
