// modules/text-formatting.js
class TextFormatting {
    constructor() {
        this.formats = {
            bold: { ass: '\\b1', srt: '<b>', end: { ass: '\\b0', srt: '</b>' } },
            italic: { ass: '\\i1', srt: '<i>', end: { ass: '\\i0', srt: '</i>' } },
            underline: { ass: '\\u1', srt: '<u>', end: { ass: '\\u0', srt: '</u>' } },
            strike: { ass: '\\s1', srt: '<s>', end: { ass: '\\s0', srt: '</s>' } }
        };
        this.colors = {
            red: '&H0000FF&',
            green: '&H00FF00&',
            blue: '&HFF0000&',
            yellow: '&H00FFFF&',
            white: '&HFFFFFF&',
            black: '&H000000&'
        };
    }

    // Применение форматирования к выделенному тексту
    applyFormat(formatType, color = null) {
        const activeElement = document.activeElement;
        if (!activeElement || !activeElement.classList.contains('text-input')) {
            if (window.showAlert) window.showAlert('Выделите текстовое поле для форматирования', 'warning');
            return;
        }

        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const text = activeElement.value;
        
        if (start === end) {
            if (window.showAlert) window.showAlert('Выделите текст для форматирования', 'warning');
            return;
        }

        const selectedText = text.substring(start, end);
        let formattedText = '';

        if (color) {
            // Цветное форматирование для ASS
            formattedText = '{\\c' + this.colors[color] + '}' + selectedText + '{\\c}';
        } else if (this.formats[formatType]) {
            // Обычное форматирование
            const format = this.formats[formatType];
            formattedText = '{' + format.ass + '}' + selectedText + '{' + format.end.ass + '}';
        }

        const newText = text.substring(0, start) + formattedText + text.substring(end);
        activeElement.value = newText;
        
        // Триггерим изменение
        const event = new Event('input', { bubbles: true });
        activeElement.dispatchEvent(event);

        if (window.showAlert) {
            window.showAlert('Форматирование применено: ' + formatType + (color ? ' ' + color : ''), 'success');
        }
    }

    // Очистка всего форматирования
    clearFormatting(text) {
        return text
            .replace(/\{.*?\}/g, '') // Удаляем ASS теги
            .replace(/<[^>]*>/g, '') // Удаляем HTML теги
            .trim();
    }

    // Преобразование между форматами
    convertFormat(text, fromFormat, toFormat) {
        let converted = text;
        
        if (fromFormat === 'ass' && toFormat === 'srt') {
            converted = converted
                .replace(/\{\\b1\}/g, '<b>').replace(/\{\\b0\}/g, '</b>')
                .replace(/\{\\i1\}/g, '<i>').replace(/\{\\i0\}/g, '</i>')
                .replace(/\{\\u1\}/g, '<u>').replace(/\{\\u0\}/g, '</u>')
                .replace(/\{\\s1\}/g, '<s>').replace(/\{\\s0\}/g, '</s>')
                .replace(/\{\\c[0-9A-F&]+\}/g, '') // Удаляем цвета
                .replace(/\{\\/?\w+\}/g, ''); // Удаляем остальные теги
        } else if (fromFormat === 'srt' && toFormat === 'ass') {
            converted = converted
                .replace(/<b>/gi, '{\\b1}').replace(/<\/b>/gi, '{\\b0}')
                .replace(/<i>/gi, '{\\i1}').replace(/<\/i>/gi, '{\\i0}')
                .replace(/<u>/gi, '{\\u1}').replace(/<\/u>/gi, '{\\u0}')
                .replace(/<s>/gi, '{\\s1}').replace(/<\/s>/gi, '{\\s0}');
        }
        
        return converted;
    }
}

window.textFormatting = new TextFormatting();

// Глобальные функции
function formatText(formatType, color = null) {
    textFormatting.applyFormat(formatType, color);
}

function showFormattingModal() {
    const modalHTML = '<div class="mb-3">' +
        '<h6>Форматирование текста</h6>' +
        '<div class="btn-group w-100 mb-2">' +
            '<button class="btn btn-outline-dark" onclick="formatText(\'bold\')">' +
                '<i class="bi bi-type-bold"></i> Жирный' +
            '</button>' +
            '<button class="btn btn-outline-dark" onclick="formatText(\'italic\')">' +
                '<i class="bi bi-type-italic"></i> Курсив' +
            '</button>' +
            '<button class="btn btn-outline-dark" onclick="formatText(\'underline\')">' +
                '<i class="bi bi-type-underline"></i> Подчеркивание' +
            '</button>' +
        '</div>' +
        '<h6 class="mt-3">Цвета</h6>' +
        '<div class="btn-group w-100">' +
            '<button class="btn btn-outline-danger" onclick="formatText(\'color\', \'red\')">Красный</button>' +
            '<button class="btn btn-outline-success" onclick="formatText(\'color\', \'green\')">Зеленый</button>' +
            '<button class="btn btn-outline-primary" onclick="formatText(\'color\', \'blue\')">Синий</button>' +
            '<button class="btn btn-outline-warning" onclick="formatText(\'color\', \'yellow\')">Желтый</button>' +
        '</div>' +
        '<div class="mt-3">' +
            '<button class="btn btn-outline-secondary w-100" onclick="clearAllFormatting()">' +
                '<i class="bi bi-eraser"></i> Очистить все форматирование' +
            '</button>' +
        '</div>' +
    '</div>';

    // Создаем модальное окно
    const modalId = 'formattingModal';
    let modalElement = document.getElementById(modalId);
    
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.id = modalId;
        modalElement.className = 'modal fade';
        modalElement.tabIndex = -1;
        modalElement.innerHTML = 
            '<div class="modal-dialog">' +
                '<div class="modal-content">' +
                    '<div class="modal-header">' +
                        '<h5 class="modal-title">Форматирование текста</h5>' +
                        '<button type="button" class="btn-close" data-bs-dismiss="modal"></button>' +
                    '</div>' +
                    '<div class="modal-body">' + modalHTML + '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(modalElement);
    } else {
        modalElement.querySelector('.modal-body').innerHTML = modalHTML;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function clearAllFormatting() {
    if (!window.getSubtitleItems) return;
    
    const items = window.getSubtitleItems();
    items.forEach(item => {
        item.text = textFormatting.clearFormatting(item.text);
    });
    
    if (window.renderTable) renderTable();
    window.dispatchEvent(new CustomEvent('subtitlesChanged'));
    if (window.showAlert) window.showAlert('Все форматирование очищено', 'success');
}
