let subtitleItems = [];

// Проверяем, что DOM загружен
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEditor);
} else {
  initEditor();
}

function initEditor() {
document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('videoPlayer');
  const addBtn = document.getElementById('addSubtitleRow');

  document.querySelectorAll('[data-pos]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-pos]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const overlay = document.getElementById('subtitleOverlay');
      overlay.className = 'subtitle-overlay';
      if (btn.dataset.pos !== 'bottom') {
        overlay.classList.add('pos-' + btn.dataset.pos);
      }
      localStorage.setItem('subtitlePosition', btn.dataset.pos);
    });
  });

  const savedPos = localStorage.getItem('subtitlePosition') || 'bottom';
  document.querySelector(`[data-pos="${savedPos}"]`)?.classList.add('active');
  if (savedPos !== 'bottom') {
    document.getElementById('subtitleOverlay').classList.add('pos-' + savedPos);
  }

  addBtn?.addEventListener('click', () => {
    addSubtitleRow();
    window.dispatchEvent(new CustomEvent('subtitlesChanged'));
  });

  if (video) {
    video.addEventListener('timeupdate', highlightCurrentRow);
  }

  window.addEventListener('subtitlesLoaded', (e) => {
    subtitleItems = e.detail.items;
    renderTable();
  });
});

function addSubtitleRow() {
  const newItem = {
    id: subtitleItems.length > 0 ? Math.max(...subtitleItems.map(s => s.id)) + 1 : 1,
    start: 0,
    end: 5,
    text: ''
  };
  subtitleItems.push(newItem);
  renderTable();
}

function renderTable() {
  const tableBody = document.getElementById('subtitleTableBody');
  if (!tableBody) return;

  if (subtitleItems.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Загрузите субтитры</td></tr>`;
    return;
  }

  let html = '';
  subtitleItems.forEach((item, index) => {
    if (index > 0) {
      html += `<tr><td colspan="5" class="p-0 insert-hint" data-index="${index}"></td></tr>`;
    }

    html += `
      <tr data-index="${index}">
        <td class="text-nowrap fw-medium cursor-pointer" data-action="jump" data-index="${index}">${item.id}</td>
        <td><input type="text" class="form-control form-control-sm time-input start" value="${secondsToTime(item.start)}" data-index="${index}"></td>
        <td><input type="text" class="form-control form-control-sm time-input end" value="${secondsToTime(item.end)}" data-index="${index}"></td>
        <td><textarea class="form-control form-control-sm text-input" rows="1" data-index="${index}">${item.text}</textarea></td>
        <td>
          <div class="d-flex gap-1">
            <button class="btn btn-outline-danger action-btn delete-row" data-index="${index}" title="Удалить">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });

  html += `<tr><td colspan="5" class="p-0 insert-hint" data-index="${subtitleItems.length}"></td></tr>`;
  tableBody.innerHTML = html;

  tableBody.querySelectorAll('[data-action="jump"]').forEach(cell => {
    cell.addEventListener('click', jumpToTime);
    cell.addEventListener('dblclick', jumpAndPlay);
  });

  tableBody.querySelectorAll('.time-input').forEach(input => {
    input.addEventListener('change', handleTimeChange);
  });

  tableBody.querySelectorAll('.text-input').forEach(input => {
    input.addEventListener('input', handleTextChange);
  });

  tableBody.querySelectorAll('.delete-row').forEach(btn => {
    btn.addEventListener('click', handleDeleteRow);
  });

  tableBody.querySelectorAll('.insert-hint').forEach(el => {
    el.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      addSubtitleRowAt(index);
      window.dispatchEvent(new CustomEvent('subtitlesChanged'));
    });
  });
}

function addSubtitleRowAt(index) {
  const before = subtitleItems[index - 1] || { end: 0 };
  const after = subtitleItems[index] || { start: before.end + 10 };
  const newItem = {
    id: subtitleItems.length > 0 ? Math.max(...subtitleItems.map(s => s.id)) + 1 : 1,
    start: before.end,
    end: Math.min(before.end + 5, after.start),
    text: ''
  };
  subtitleItems.splice(index, 0, newItem);
  subtitleItems.forEach((item, i) => item.id = i + 1);
  renderTable();
}

function jumpToTime(e) {
  const index = parseInt(e.currentTarget.dataset.index);
  const video = document.getElementById('videoPlayer');
  if (video) video.currentTime = subtitleItems[index].start;
}

function jumpAndPlay(e) {
  const index = parseInt(e.currentTarget.dataset.index);
  const video = document.getElementById('videoPlayer');
  if (video) {
    video.currentTime = subtitleItems[index].start;
    video.play();
  }
}

function handleTimeChange(e) {
  const index = parseInt(e.target.dataset.index);
  const seconds = timeToSeconds(e.target.value.trim());
  if (isNaN(seconds) || seconds < 0) {
    alert('Неверный формат времени. Пример: 00:01:23,450');
    e.target.value = secondsToTime(subtitleItems[index][e.target.classList.contains('start') ? 'start' : 'end']);
    return;
  }
  if (e.target.classList.contains('start')) {
    subtitleItems[index].start = seconds;
  } else {
    subtitleItems[index].end = seconds;
  }
  subtitleItems.sort((a, b) => a.start - b.start);
  subtitleItems.forEach((item, i) => item.id = i + 1);
  renderTable();
  window.dispatchEvent(new CustomEvent('subtitlesChanged'));
}

function handleTextChange(e) {
  const index = parseInt(e.target.dataset.index);
  subtitleItems[index].text = e.target.value;
  window.dispatchEvent(new CustomEvent('subtitlesChanged'));
}

function handleDeleteRow(e) {
  const index = parseInt(e.target.dataset.index);
  subtitleItems.splice(index, 1);
  subtitleItems.forEach((item, i) => item.id = i + 1);
  renderTable();
  window.dispatchEvent(new CustomEvent('subtitlesChanged'));
}

function highlightCurrentRow() {
  const video = document.getElementById('videoPlayer');
  if (!video) return;
  const currentTime = video.currentTime;
  document.querySelectorAll('#subtitleTable tr').forEach(tr => tr.classList.remove('table-warning'));
  const current = subtitleItems.find(item => currentTime >= item.start && currentTime <= item.end);
  if (current) {
    const row = document.querySelector(`#subtitleTable tr[data-index="${subtitleItems.indexOf(current)}"]`);
    if (row) row.classList.add('table-warning');
  }
}

function secondsToTime(sec) {
  if (isNaN(sec) || sec < 0) return '00:00:00,000';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function timeToSeconds(timeStr) {
  const match = timeStr.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!match) return NaN;
  const [, h, m, s, ms] = match.map(Number);
  return h * 3600 + m * 60 + s + ms / 1000;
}

window.getSubtitleItems = () => subtitleItems;
