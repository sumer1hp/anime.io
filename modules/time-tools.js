// modules/time-tools.js
class TimeTools {
    // Сдвиг всех временных меток
    shiftAllTimestamps(seconds) {
        if (!window.getSubtitleItems) return [];
        
        const items = window.getSubtitleItems();
        return items.map(item => ({
            ...item,
            start: Math.max(0, item.start + seconds),
            end: Math.max(0, item.end + seconds)
        }));
    }

    // Сдвиг от определенного времени
    shiftFromTime(startFrom, seconds) {
        if (!window.getSubtitleItems) return [];
        
        const items = window.getSubtitleItems();
        return items.map(item => ({
            ...item,
            start: item.start >= startFrom ? Math.max(0, item.start + seconds) : item.start,
            end: item.end >= startFrom ? Math.max(0, item.end + seconds) : item.end
        }));
    }

    // Растяжение/сжатие времени
    stretchTimestamps(factor) {
        if (!window.getSubtitleItems) return [];
        
        const items = window.getSubtitleItems();
        return items.map(item => ({
            ...item,
            start: item.start * factor,
            end: item.end * factor
        }));
    }

    // Автоматическое исправление отрицательных длительностей
    fixNegativeDurations() {
        if (!window.getSubtitleItems) return [];
        
        const items = window.getSubtitleItems();
        return items.map(item => ({
            ...item,
            end: Math.max(item.start + 1, item.end) // Минимум 1 секунда
        }));
    }
}

window.timeTools = new TimeTools();

// UI функции
function showTimeShiftModal() {
    const modalHTML = `
        <div class="mb-3">
            <label class="form-label">Сдвиг всех временных меток (секунды):</label>
            <div class="input-group">
                <button class="btn btn-outline-secondary" type="button" onclick="quickTimeShift(-1)">-1с</button>
                <input type="number" id="timeShiftValue" class="form-control" value="0" step="0.5">
                <button class="btn btn-outline-secondary" type="button" onclick="quickTimeShift(1)">+1с</button>
            </div>
            <div class="mt-2">
                <button class="btn btn-sm btn-outline-secondary" onclick="quickTimeShift(-5)">-5с</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="quickTimeShift(5)">+5с</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="quickTimeShift(-10)">-10с</button>
                <button class="btn btn-sm btn-outline-secondary" onclick="quickTimeShift(10)">+10с</button>
            </div>
        </div>
        <div class="mb-3">
            <label class="form-label">Или растяжение времени (коэффициент):</label>
            <input type="number" id="timeStretchValue" class="form-control" value="1.0" step="0.1" min="0.1">
        </div>
        <div class="form-check">
            <input class="form-check-input" type="checkbox" id="fixDurations">
            <label class="form-check-label" for="fixDurations">
                Исправить отрицательные длительности
            </label>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('timeShiftModal'));
    document.getElementById('timeShiftModal').querySelector('.modal-body').innerHTML = modalHTML;
    
    const footer = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
        <button type="button" class="btn btn-primary" onclick="applyTimeShift()">Применить</button>
    `;
    document.getElementById('timeShiftModal').querySelector('.modal-footer')?.remove();
    document.getElementById('timeShiftModal').querySelector('.modal-content').innerHTML += `<div class="modal-footer">${footer}</div>`;
    
    modal.show();
}

function quickTimeShift(seconds) {
    document.getElementById('timeShiftValue').value = seconds;
}

function applyTimeShift() {
    const shiftValue = parseFloat(document.getElementById('timeShiftValue').value) || 0;
    const stretchValue = parseFloat(document.getElementById('timeStretchValue').value) || 1;
    const fixDurations = document.getElementById('fixDurations')?.checked;
    
    let newItems = window.getSubtitleItems();
    
    // Применяем сдвиг
    if (shiftValue !== 0) {
        newItems = timeTools.shiftAllTimestamps(shiftValue);
    }
    
    // Применяем растяжение
    if (stretchValue !== 1) {
        newItems = timeTools.stretchTimestamps(stretchValue);
    }
    
    // Исправляем длительности
    if (fixDurations) {
        newItems = timeTools.fixNegativeDurations();
    }
    
    // Обновляем субтитры
    window.dispatchEvent(new CustomEvent('subtitlesLoaded', { detail: { items: newItems } }));
    
    bootstrap.Modal.getInstance(document.getElementById('timeShiftModal')).hide();
    showNotification(`Временные метки обновлены`, 'success');
}
