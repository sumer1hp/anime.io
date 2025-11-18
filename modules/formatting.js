// modules/enhanced-formatting.js
class EnhancedFormatting {
    constructor() {
        this.formats = {
            bold: { 
                ass: '{\\b1}', srt: '<b>', 
                end: { ass: '{\\b0}', srt: '</b>' } 
            },
            italic: { 
                ass: '{\\i1}', srt: '<i>', 
                end: { ass: '{\\i0}', srt: '</i>' } 
            },
            underline: { 
                ass: '{\\u1}', srt: '<u>', 
                end: { ass: '{\\u0}', srt: '</u>' } 
            },
            strike: { 
                ass: '{\\s1}', srt: '<s>', 
                end: { ass: '{\\s0}', srt: '</s>' } 
            }
        };
        
        this.colors = {
            red: '&H0000FF&',
            green: '&H00FF00&',
            blue: '&HFF0000&',
            yellow: '&H00FFFF&',
            white: '&HFFFFFF&',
            black: '&H000000&'
        };
        
        this.currentFormat = null;
        this.currentColor = null;
    }

    // Применение форматирования к тексту
    applyFormatToText(text, formatType, color = null) {
        if (!text) return text;
        
        let formattedText = text;
        
        if (color && this.colors[color]) {
            formattedText = `{\\c${this.colors[color]}}${formattedText}{\\c}`;
        }
        
        if (formatType && this.formats[formatType]) {
            const format = this.formats[formatType];
            formattedText = `${format.ass}${formattedText}${format.end.ass}`;
        }
        
        return formattedText;
    }

    // Быстрое форматирование выделенного текста в поле ввода
    quickFormat(formatType, color = null) {
        const activeElement = document.activeElement;
        if (!activeElement || !activeElement.classList.contains('text-input')) {
            // Если поле не активно, устанавливаем формат для следующего ввода
            this.currentFormat = formatType;
            this.currentColor = color;
            
            const formatName = this.getFormatName(formatType, color);
            showNotification(`Установлен формат: ${formatName}. Теперь вводите текст.`, 'info');
            return;
        }

        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const text = activeElement.value;
        
        if (start === end) {
            // Если нет выделения, вставляем теги форматирования
            const format = this.formats[formatType];
            const formattedText = color ? 
                `{\\c${this.colors[color]}}${format.ass}${format.end.ass}{\\c}` :
                `${format.ass}${format.end.ass}`;
            
            const newText = text.substring(0, start) + formattedText + text.substring(end);
            activeElement.value = newText;
            
            // Устанавливаем курсор между тегами
            const cursorPos = start + (color ? 15 : format.ass.length);
            activeElement.setSelectionRange(cursorPos, cursorPos);
        } else {
            // Если есть выделение, форматируем выделенный текст
            const selectedText = text.substring(start, end);
            const formattedText = this.applyFormatToText(selectedText, formatType, color);
            
            const newText = text.substring(0, start) + formattedText + text.substring(end);
            activeElement.value = newText;
            
            // Выделяем отформатированный текст
            activeElement.setSelectionRange(start, start + formattedText.length);
        }
        
        // Триггерим изменение
        const event = new Event('input', { bubbles: true });
        activeElement.dispatchEvent(event);
        
        const formatName = this.getFormatName(formatType, color);
        showNotification(`Форматирование применено: ${formatName}`, 'success');
    }

    // Автоматическое применение форматирования при вводе
    setupAutoFormatting() {
        document.addEventListener('focusin', (e) => {
            if (e.target.classList.contains('text-input')) {
                this.setupCurrentFormatListener(e.target);
            }
        });
    }

    setupCurrentFormatListener(input) {
        if (this.currentFormat || this.currentColor) {
            const originalValue = input.value;
            const cursorPos = input.selectionStart;
            
            input.addEventListener('input', (e) => {
                if (this.currentFormat || this.currentColor) {
                    const newText = this.applyFormatToText(input.value, this.currentFormat, this.currentColor);
                    if (newText !== input.value) {
                        input.value = newText;
                        // Восстанавливаем позицию курсора
                        input.setSelectionRange(cursorPos + newText.length - originalValue.length, 
                                              cursorPos + newText.length - originalValue.length);
                    }
                }
            }, { once: true });
        }
    }

    getFormatName(formatType, color) {
        const formatNames = {
            bold: 'Жирный',
            italic: 'Курсив',
            underline: 'Подчеркнутый',
            strike: 'Зачеркнутый'
        };
        
        const colorNames = {
            red: 'Красный',
            green: 'Зеленый',
            blue: 'Синий',
            yellow: 'Желтый',
            white: 'Белый',
            black: 'Черный'
        };
        
        let name = '';
        if (color) name += colorNames[color] + ' ';
        if (formatType) name += formatNames[formatType];
        
        return name.trim();
    }

    // Очистка форматирования для текста
    clearFormatting(text) {
        return text
            .replace(/\{.*?\}/g, '') // Удаляем ASS теги
            .replace(/<[^>]*>/g, '') // Удаляем HTML теги
            .trim();
    }
}

window.enhancedFormatting = new EnhancedFormatting();

// Глобальные функции
function quickFormatText(formatType, color = null) {
    enhancedFormatting.quickFormat(formatType, color);
}

function clearCurrentFormat() {
    enhancedFormatting.currentFormat = null;
    enhancedFormatting.currentColor = null;
    showNotification('Форматирование сброшено', 'info');
}

function showEnhancedFormattingModal() {
    const modalHTML = `
        <div class="mb-3">
            <h6>Быстрое форматирование</h6>
            <div class="alert alert-info small">
                <i class="bi bi-info-circle"></i> 
                Выделите текст или установите формат для следующего ввода
            </div>
            
            <div class="btn-group w-100 mb-2">
                <button class="btn btn-outline-dark" onclick="quickFormatText('bold')" title="Жирный">
                    <i class="bi bi-type-bold"></i> Жирный
                </button>
                <button class="btn btn-outline-dark" onclick="quickFormatText('italic')" title="Курсив">
                    <i class="bi bi-type-italic"></i> Курсив
                </button>
                <button class="btn btn-outline-dark" onclick="quickFormatText('underline')" title="Подчеркивание">
                    <i class="bi bi-type-underline"></i> Подчеркивание
                </button>
            </div>
            
            <h6 class="mt-3">Цвета текста</h6>
            <div class="btn-group w-100 mb-2">
                <button class="btn btn-outline-danger" onclick="quickFormatText(null, 'red')">Красный</button>
                <button class="btn btn-outline-success" onclick="quickFormatText(null, 'green')">Зеленый</button>
                <button class="btn btn-outline-primary" onclick="quickFormatText(null, 'blue')">Синий</button>
                <button class="btn btn-outline-warning" onclick="quickFormatText(null, 'yellow')">Желтый</button>
            </div>
            
            <h6 class="mt-3">Комбинированное форматирование</h6>
            <div class="btn-group w-100 mb-2">
                <button class="btn btn-outline-danger" onclick="quickFormatText('bold', 'red')">
                    <i class="bi bi-type-bold"></i> Красный жирный
                </button>
                <button class="btn btn-outline-primary" onclick="quickFormatText('italic', 'blue')">
                    <i class="bi bi-type-italic"></i> Синий курсив
                </button>
            </div>
            
            <div class="mt-3">
                <button class="btn btn-outline-secondary w-100" onclick="clearCurrentFormat()">
                    <i class="bi bi-eraser"></i> Сбросить форматирование
                </button>
            </div>
        </div>
    `;

    const modalId = 'enhancedFormattingModal';
    let modalElement = document.getElementById(modalId);
    
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.id = modalId;
        modalElement.className = 'modal fade';
        modalElement.tabIndex = -1;
        modalElement.innerHTML = 
            `<div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Форматирование текста</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">${modalHTML}</div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modalElement);
    } else {
        modalElement.querySelector('.modal-body').innerHTML = modalHTML;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

// Инициализация автоформатирования
document.addEventListener('DOMContentLoaded', () => {
    enhancedFormatting.setupAutoFormatting();
});