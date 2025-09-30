// editor.js
let subtitleItems = [];
let currentVideo = null;

document.addEventListener('DOMContentLoaded', () => {
  initializeEditor();
});

function initializeEditor() {
  const video = document.getElementById('videoPlayer');
  currentVideo = video;
  
  // Инициализация позиции субтитров
  initializePositionButtons();
  
  // Обработчики кнопок
  document.getElementById('addSubtitleRow')?.addEventListener('click', addSubtitleRow);
  document.getElementById('autoNumber')?.addEventListener('click', autoNumberSubtitles);
  document.getElementById('sortByTime')?.addEventListener('click', sortByTime);
  document.getElementById('importText')?.addEventListener('click', showImportModal);
  document.getElementById('confirmImport')?.addEventListener('click', importText);
  document.getElementById('exportSrt')?.addEventListener('click', exportSrt);
  document.getElementById('exportAss')?.addEventListener('click', exportAss);
  
  // Обработчики видео
  if (video) {
    video.addEventListener('timeupdate', highlightCurrentRow);
    video.addEventListener('timeupdate', updateCurrentTime);
    video.addEventListener('loadedmetadata', updateDuration);
  }
  
  // Загрузка субтитров
  window.addEventListener('subtitlesLoaded', (e) => {
    subtitleItems = e.detail.items;
    // Автоматически извлекаем говорящих при загрузке
    extractSpeakersOnLoad();
    renderTable();
    updateStats();
  });
  
  // Изменение субтитров
  window.addEventListener('subtitlesChanged', updateStats);
  
  // Автосохранение в LocalStorage
  setInterval(autoSave, 30000);
  
  // Попытка восстановить из автосохранения
  tryRestoreFromAutoSave();
}

function extractSpeakersOnLoad() {
  subtitleItems.forEach(item => {
    const detected = detectSpeakerInText(item.text);
    if (detected) {
      item.speaker = detected.speaker;
      item.text = detected.text;
    }
  });
}

function detectSpeakerInText(text) {
  const patterns = [
    /^([А-ЯЁA-Z][а-яёa-z]+):\s*(.+)/, // Иван: текст
    /^([А-ЯЁA-Z][а-яёa-z]+)\s*:\s*(.+)/, // Иван : текст
    /^([А-ЯЁA-Z][а-яёa-z]+)\s+говорит:\s*(.+)/i, // Иван говорит: текст
    /^([А-ЯЁA-Z][а-яёa-z]+)\s*-\s*(.+)/, // Иван - текст
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        speaker: match[1].trim(),
        text: match[2].trim()
      };
    }
  }
  return null;
}

function initializePositionButtons() {
  document.querySelectorAll('[data-pos]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pos = e.currentTarget.dataset.pos;
      setSubtitlePosition(pos);
    });
  });
  
  // Восстановить сохраненную позицию
  const savedPos = localStorage.getItem('subtitlePosition') || 'bottom';
  setSubtitlePosition(savedPos, true);
}

function setSubtitlePosition(pos, initial = false) {
  const overlay = document.getElementById('subtitleOverlay');
  const buttons = document.querySelectorAll('[data-pos]');
  
  if (!overlay) return;
  
  // Обновляем классы
  overlay.className = 'subtitle-overlay';
  if (pos !== 'bottom') {
    overlay.classList.add('pos-' + pos);
  }
  
  // Обновляем кнопки
  buttons.forEach(btn => {
    btn.classList.remove('active', 'btn-primary');
    btn.classList.add('btn-outline-light');
  });
  
  const activeBtn = document.querySelector(`[data-pos="${pos}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active', 'btn-primary');
    activeBtn.classList.remove('btn-outline-light');
  }
  
  if (!initial) {
    localStorage.setItem('subtitlePosition', pos);
  }
}

function addSubtitleRow() {
  const newItem = {
    id: subtitleItems.length > 0 ? Math.max(...subtitleItems.map(s => s.id)) + 1 : 1,
    start: currentVideo ? currentVideo.currentTime : 0,
    end: currentVideo ? currentVideo.currentTime + 3 : 3,
    speaker: '',
    text: ''
  };
  subtitleItems.push(newItem);
  renderTable();
  window.dispatchEvent(new CustomEvent('subtitlesChanged'));
}

function addSubtitleRowAt(index) {
  const before = subtitleItems[index - 1] || { end: 0 };
  const after = subtitleItems[index] || { start: before.end + 5 };
  const newItem = {
    id: Math.max(...subtitleItems.map(s => s.id)) + 1,
    start: before.end,
    end: Math.min(before.end + 3, after.start - 0.5),
    speaker: '',
    text: ''
  };
  subtitleItems.splice(index, 0, newItem);
  autoNumberSubtitles();
  renderTable();
  window.dispatchEvent(new CustomEvent('subtitlesChanged'));
}

function renderTable() {
  const tableBody = document.getElementById('subtitleTableBody');
  if (!tableBody) return;

  if (subtitleItems.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">
      <i class="bi bi-cloud-arrow-up display-4 d-block mb-2"></i>
      Загрузите файл субтитров или создайте новый
    </td></tr>`;
    return;
  }

  let html = '';
  subtitleItems.forEach((item, index) => {
    const duration = item.end - item.start;
    
    if (index > 0) {
      html += `<tr><td colspan="7" class="p-0 insert-hint" data-index="${index}"></td></tr>`;
    }

    // Получаем уникальных говорящих для автодополнения
    const uniqueSpeakers = Array.from(new Set(subtitleItems
      .map(item => item.speaker)
      .filter(speaker => speaker && speaker.trim())
    )).sort();

    html += `
      <tr data-index="${index}">
        <td class="text-center fw-bold cursor-pointer" data-action="jump" data-index="${index}">${item.id}</td>
        <td>
          <input type="text" class="form-control form-control-sm time-input start" 
                 value="${secondsToTime(item.start)}" data-index="${index}"
                 title="Начальное время">
        </td>
        <td>
          <input type="text" class="form-control form-control-sm time-input end" 
                 value="${secondsToTime(item.end)}" data-index="${index}"
                 title="Конечное время">
        </td>
        <td class="text-center text-muted small" title="Длительность">
          ${secondsToSimpleTime(duration)}
        </td>
        <td>
          <input type="text" class="form-control form-control-sm speaker-input" 
                 value="${item.speaker || ''}" data-index="${index}"
                 placeholder="Имя говорящего" list="speakersList">
        </td>
        <td>
          <textarea class="form-control form-control-sm text-input" rows="1" 
                    data-index="${index}" placeholder="Текст субтитра...">${item.text}</textarea>
        </td>
        <td>
          <div class="d-flex gap-1 justify-content-center">
            <button class="btn btn-outline-primary action-btn set-start" data-index="${index}" 
                    title="Установить начало из видео">
              <i class="bi bi-play-fill"></i>
            </button>
            <button class="btn btn-outline-primary action-btn set-end" data-index="${index}" 
                    title="Установить конец из видео">
              <i class="bi bi-stop-fill"></i>
            </button>
            <button class="btn btn-outline-danger action-btn delete-row" data-index="${index}" 
                    title="Удалить">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  // Добавляем datalist для подсказок имен говорящих
  const uniqueSpeakers = Array.from(new Set(subtitleItems
    .map(item => item.speaker)
    .filter(speaker => speaker && speaker.trim())
  )).sort();

  html += `
    <datalist id="speakersList">
      ${uniqueSpeakers.map(speaker => `<option value="${speaker}">`).join('')}
    </datalist>
  `;

  tableBody.innerHTML = html;

  // Назначаем обработчики
  attachEventHandlers();
}

function attachEventHandlers() {
  const tableBody = document.getElementById('subtitleTableBody');
  if (!tableBody) return;
  
  tableBody.querySelectorAll('[data-action="jump"]').forEach(cell => {
    cell.addEventListener('click', jumpToTime);
    cell.addEventListener('dblclick', jumpAndPlay);
  });

  tableBody.querySelectorAll('.time-input').forEach(input => {
    input.addEventListener('change', handleTimeChange);
    input.addEventListener('blur', handleTimeChange);
  });

  tableBody.querySelectorAll('.text-input').forEach(input => {
    input.addEventListener('input', handleTextChange);
    input.addEventListener('blur', handleTextChange);
  });

  tableBody.querySelectorAll('.speaker-input').forEach(input => {
    input.addEventListener('input', handleSpeakerChange);
    input.addEventListener('blur', handleSpeakerChange);
  });

  tableBody.querySelectorAll('.delete-row').forEach(btn => {
    btn.addEventListener('click', handleDeleteRow);
  });

  tableBody.querySelectorAll('.set-start').forEach(btn => {
    btn.addEventListener('click', setTimeFromVideo);
  });

  tableBody.querySelectorAll('.set-end').forEach(btn => {
    btn.addEventListener('click', setTimeFromVideo);
  });

  tableBody.querySelectorAll('.insert-hint').forEach(el => {
    el.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      addSubtitleRowAt(index);
    });
  });
}

function jumpToTime(e) {
  const index = parseInt(e.currentTarget.dataset.index);
  if (currentVideo && subtitleItems[index]) {
    currentVideo.currentTime = subtitleItems[index].start;
  }
}

function jumpAndPlay(e) {
  const index = parseInt(e.currentTarget.dataset.index);
  if (currentVideo && subtitleItems[index]) {
    currentVideo.currentTime = subtitleItems[index].start;
    currentVideo.play();
  }
}

function handleTimeChange(e) {
  const index = parseInt(e.target.dataset.index);
  const seconds = timeToSeconds(e.target.value.trim());
  
  if (isNaN(seconds) || seconds < 0) {
    alert('Неверный формат времени. Пример: 00:01:23,450 или 00:01:23.456');
    e.target.value = secondsToTime(subtitleItems[index][e.target.classList.contains('start') ? 'start' : 'end']);
    return;
  }
  
  if (e.target.classList.contains('start')) {
    subtitleItems[index].start = seconds;
  } else {
    subtitleItems[index].end = seconds;
  }
  
  // Проверяем чтобы начало не было больше конца
  if (subtitleItems[index].start > subtitleItems[index].end) {
    if (e.target.classList.contains('start')) {
      subtitleItems[index].end = subtitleItems[index].start + 3;
    } else {
      subtitleItems[index].start = subtitleItems[index].end - 3;
    }
  }
  
  renderTable();
  window.dispatchEvent(new CustomEvent('subtitlesChanged'));
}

function handleTextChange(e) {
  const index = parseInt(e.target.dataset.index);
  subtitleItems[index].text = e.target.value;
  window.dispatchEvent(new CustomEvent('subtitlesChanged'));
}

function handleSpeakerChange(e) {
  const index = parseInt(e.target.dataset.index);
  const newSpeaker = e.target.value.trim();
  subtitleItems[index].speaker = newSpeaker;
  
  // Обновляем datalist если добавили нового говорящего
  if (newSpeaker) {
    updateSpeakersDatalist();
  }
  
  window.dispatchEvent(new CustomEvent('subtitlesChanged'));
}

function updateSpeakersDatalist() {
  const uniqueSpeakers = Array.from(new Set(subtitleItems
    .map(item => item.speaker)
    .filter(speaker => speaker && speaker.trim())
  )).sort();

  const datalist = document.getElementById('speakersList');
  if (datalist) {
    datalist.innerHTML = uniqueSpeakers.map(speaker => 
      `<option value="${speaker}">`
    ).join('');
  }
}

function handleDeleteRow(e) {
  const index = parseInt(e.currentTarget.dataset.index);
  if (confirm('Удалить этот субтитр?')) {
    subtitleItems.splice(index, 1);
    autoNumberSubtitles();
    renderTable();
    window.dispatchEvent(new CustomEvent('subtitlesChanged'));
  }
}

function setTimeFromVideo(e) {
  if (!currentVideo) {
    alert('Сначала загрузите видео');
    return;
  }
  
  const index = parseInt(e.currentTarget.dataset.index);
  const currentTime = currentVideo.currentTime;
  
  if (e.currentTarget.classList.contains('set-start')) {
    subtitleItems[index].start = currentTime;
    // Если начало стало больше конца, корректируем конец
    if (subtitleItems[index].start > subtitleItems[index].end) {
      subtitleItems[index].end = subtitleItems[index].start + 3;
    }
  } else {
    subtitleItems[index].end = currentTime;
    // Если конец стал меньше начала, корректируем начало
    if (subtitleItems[index].end < subtitleItems[index].start) {
      subtitleItems[index].start = subtitleItems[index].end - 3;
    }
  }
  
  renderTable();
  window.dispatchEvent(new CustomEvent('subtitlesChanged'));
}

function autoNumberSubtitles() {
  subtitleItems.forEach((item, index) => {
    item.id = index + 1;
  });
  renderTable();
  window.dispatchEvent(new CustomEvent('subtitlesChanged'));
}

function sortByTime() {
  subtitleItems.sort((a, b) => a.start - b.start);
  autoNumberSubtitles();
}

function showImportModal() {
  const modal = new bootstrap.Modal(document.getElementById('importModal'));
  modal.show();
}

function importText() {
  const text = document.getElementById('importTextArea').value;
  const startTime = parseFloat(document.getElementById('startTimeInput').value) || 0;
  const duration = parseFloat(document.getElementById('durationInput').value) || 3;
  
  if (!text.trim()) {
    alert('Введите текст для импорта');
    return;
  }
  
  const lines = text.split('\n').filter(line => line.trim());
  const newItems = lines.map((line, index) => {
    // Автоматически определяем говорящего при импорте
    const detected = detectSpeakerInText(line);
    
    return {
      id: subtitleItems.length + index + 1,
      start: startTime + (index * duration),
      end: startTime + (index * duration) + duration,
      speaker: detected ? detected.speaker : '',
      text: detected ? detected.text : line.trim()
    };
  });
  
  subtitleItems.push(...newItems);
  sortByTime();
  
  const modal = bootstrap.Modal.getInstance(document.getElementById('importModal'));
  modal.hide();
  
  document.getElementById('importTextArea').value = '';
  showAlert(`Импортировано ${lines.length} субтитров`, 'success');
}

function highlightCurrentRow() {
  if (!currentVideo) return;
  
  const currentTime = currentVideo.currentTime;
  document.querySelectorAll('#subtitleTable tr').forEach(tr => tr.classList.remove('table-warning'));
  
  const current = subtitleItems.find(item => currentTime >= item.start && currentTime <= item.end);
  if (current) {
    const row = document.querySelector(`#subtitleTable tr[data-index="${subtitleItems.indexOf(current)}"]`);
    if (row) {
      row.classList.add('table-warning');
      // Прокручиваем к текущему субтитру
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

function updateStats() {
  const total = subtitleItems.length;
  const totalDuration = subtitleItems.reduce((sum, item) => sum + (item.end - item.start), 0);
  const averageDuration = total > 0 ? totalDuration / total : 0;
  const totalCharacters = subtitleItems.reduce((sum, item) => sum + item.text.length, 0);
  
  const totalElement = document.getElementById('totalSubtitles');
  const durationElement = document.getElementById('totalDuration');
  const averageElement = document.getElementById('averageDuration');
  const charactersElement = document.getElementById('totalCharacters');
  
  if (totalElement) totalElement.textContent = total;
  if (durationElement) durationElement.textContent = secondsToSimpleTime(totalDuration);
  if (averageElement) averageElement.textContent = secondsToSimpleTime(averageDuration);
  if (charactersElement) charactersElement.textContent = totalCharacters.toLocaleString();
  
  const stats = document.getElementById('stats');
  if (stats) {
    if (total > 0) {
      stats.classList.remove('d-none');
    } else {
      stats.classList.add('d-none');
    }
  }
}

function updateCurrentTime() {
  const current = document.getElementById('currentTime');
  const duration = document.getElementById('duration');
  
  if (current && currentVideo) {
    current.textContent = secondsToTime(currentVideo.currentTime).substring(0, 8);
  }
  if (duration && currentVideo && !isNaN(currentVideo.duration)) {
    duration.textContent = secondsToTime(currentVideo.duration).substring(0, 8);
  }
}

function updateDuration() {
  updateCurrentTime();
}

function autoSave() {
  if (subtitleItems.length > 0) {
    const autoSaveData = {
      items: subtitleItems,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('subtitleEditor_autoSave', JSON.stringify(autoSaveData));
  }
}

function tryRestoreFromAutoSave() {
  try {
    const saved = localStorage.getItem('subtitleEditor_autoSave');
    if (saved) {
      const data = JSON.parse(saved);
      const now = new Date();
      const savedTime = new Date(data.timestamp);
      const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        if (confirm('Найдено автосохранение от ' + savedTime.toLocaleString() + '. Восстановить?')) {
          subtitleItems = data.items;
          renderTable();
          updateStats();
          showAlert('Автосохранение восстановлено', 'success');
        }
      }
    }
  } catch (e) {
    console.warn('Не удалось восстановить автосохранение:', e);
  }
}

function showAlert(message, type = 'info') {
  // Создаем простое уведомление
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} position-fixed`;
  alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  alert.innerHTML = `
    <div class="d-flex align-items-center">
      <div>${message}</div>
      <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove();
    }
  }, 3000);
}

// Вспомогательные функции времени
function secondsToTime(sec) {
  if (isNaN(sec) || sec < 0) return '00:00:00,000';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function secondsToSimpleTime(sec) {
  if (isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function timeToSeconds(timeStr) {
  // Пробуем разные форматы времени
  let match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (match) {
    return (+match[1]) * 3600 + (+match[2]) * 60 + (+match[3]) + (+match[4]) / 1000;
  }
  
  match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
  if (match) {
    return (+match[1]) * 3600 + (+match[2]) * 60 + (+match[3]) + (+match[4]) / 1000;
  }
  
  match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    return (+match[1]) * 3600 + (+match[2]) * 60 + (+match[3]);
  }
  
  match = timeStr.match(/(\d{2}):(\d{2})/);
  if (match) {
    return (+match[1]) * 60 + (+match[2]);
  }
  
  return NaN;
}

// Функции экспорта
function exportSrt() {
  const items = window.getSubtitleItems();
  if (items.length === 0) {
    alert('Нет субтитров для экспорта');
    return;
  }
  
  const srt = items.map((item, i) => {
    let text = item.text;
    // Добавляем говорящего перед текстом если есть
    if (item.speaker && item.speaker.trim()) {
      text = `${item.speaker}: ${text}`;
    }
    return `${i + 1}\n${secondsToTime(item.start)} --> ${secondsToTime(item.end)}\n${text}\n`;
  }).join('\n');
  
  downloadFile('subtitles.srt', srt);
}

function exportAss() {
  const items = window.getSubtitleItems();
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
    let text = item.text;
    // Добавляем говорящего перед текстом если есть
    if (item.speaker && item.speaker.trim()) {
      text = `${item.speaker}: ${text}`;
    }
    ass += `Dialogue: 0,${secondsToAssTime(item.start)},${secondsToAssTime(item.end)},Default,,0,0,0,,${text.replace(/\n/g, '\\N')}\n`;
  });
  
  downloadFile('subtitles.ass', ass);
}

function secondsToAssTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.floor((sec % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
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

// Экспортируем функцию для доступа из других скриптов
window.getSubtitleItems = () => subtitleItems;
window.showAlert = showAlert;
