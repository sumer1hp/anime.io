// modules/line-formatting.js
class LineFormatting {
    constructor() {
        this.formats = {
            bold: { 
                ass: '\\b1', 
                srt: '<b>',
                end: { ass: '\\b0', srt: '</b>' }
            },
            italic: { 
                ass: '\\i1', 
                srt: '<i>',
                end: { ass: '\\i0', srt: '</i>' }
            },
            underline: { 
                ass: '\\u1', 
                srt: '<u>',
                end: { ass: '\\u0', srt: '</u>' }
            },
            strike: { 
                ass: '\\s1', 
                srt: '<s>',
                end: { ass: '\\s0', srt: '</s>' }
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
        
        this.currentLineFormat = {};
    }

    // Применение форматирования к конкретной строке
    applyLineFormat(lineIndex, formatType, color = null) {
        if (!window.getSubtitleItems) return false;
        
        const items = window.getSubtitleItems();
        if (lineIndex < 0 || lineIndex >= items.length) return false;
        
        const item = items[lineIndex];
        let newText = item.text;
        
        // Сохраняем текущее форматирование для строки
        if (!this.currentLineFormat[lineIndex]) {
            this.currentLineFormat[lineIndex] = {};
        }
        
        if (color) {
            this.currentLineFormat[lineIndex].color = color;
        }
        if (formatType) {
            this.currentLineFormat[lineIndex].format = formatType;
        }
        
        // Применяем форматирование
        newText = this.applyFormatToText(newText, formatType, color);
        item.text = newText;
        
        return true;
    }

    // Применение форматирования к тексту
    applyFormatToText(text, formatType, color = null) {
        if (!text) return text;
        
        // Удаляем старое форматирование
        let cleanText = this.clearFormatting(text);
        let formattedText = cleanText;
        
        // Применяем цвет
        if (color && this.colors[color]) {
            formattedText = `{\\c${this.colors[color]}}${formattedText}{\\c}`;
        }
        
        // Применяем форматирование
        if (formatType && this.formats[formatType]) {
            const format = this.formats[formatType];
            formattedText = `{${format.ass}}${formattedText}{${format.end.ass}}`;
        }
        
        return formattedText;
    }

    // Очистка форматирования для строки
    clearLineFormat(lineIndex) {
        if (!window.getSubtitleItems) return false;
        
        const items = window.getSubtitleItems();
        if (lineIndex < 0 || lineIndex >= items.length) return false;
        
        const item = items[lineIndex];
        item.text = this.clearFormatting(item.text);
        
        // Удаляем из памяти форматирование для этой строки
        delete this.currentLineFormat[lineIndex];
        
        return true;
    }

    // Очистка форматирования текста
    clearFormatting(text) {
        return text
            .replace(/\{.*?\}/g, '') // Удаляем ASS теги
            .replace(/<[^>]*>/g, '') // Удаляем HTML теги
            .trim();
    }

    // Получение текущего форматирования строки
    getLineFormat(lineIndex) {
        return this.currentLineFormat[lineIndex] || {};
    }

    // Показ меню форматирования для строки
    showLineFormatMenu(lineIndex, event) {
        event.preventDefault();
        event.stopPropagation();
        
        const rect = event.target.getBoundingClientRect();
        const menuHTML = `
            <div class="dropdown-menu show line-format-menu" style="position: fixed; left: ${rect.left}px; top: ${rect.bottom}px; min-width: 200px;">
                <h6 class="dropdown-header">Форматирование строки</h6>
                
                <div class="dropdown-item-text small text-muted px-3 py-1">
                    Строка ${lineIndex + 1}
                </div>
                
                <div class="dropdown-divider"></div>
                
                <h6 class="dropdown-header">Стиль текста</h6>
                <button class="dropdown-item" onclick="applyLineFormatting(${lineIndex}, 'bold', null)">
                    <i class="bi bi-type-bold"></i> Жирный
                </button>
                <button class="dropdown-item" onclick="applyLineFormatting(${lineIndex}, 'italic', null)">
                    <i class="bi bi-type-italic"></i> Курсив
                </button>
                <button class="dropdown-item" onclick="applyLineFormatting(${lineIndex}, 'underline', null)">
                    <i class="bi bi-type-underline"></i> Подчеркнутый
                </button>
                
                <div class="dropdown-divider"></div>
                
                <h6 class="dropdown-header">Цвет текста</h6>
                <button class="dropdown-item" onclick="applyLineFormatting(${lineIndex}, null, 'red')">
                    <span class="text-danger">●</span> Красный
                </button>
                <button class="dropdown-item" onclick="applyLineFormatting(${lineIndex}, null, 'green')">
                    <span class="text-success">●</span> Зеленый
                </button>
                <button class="dropdown-item" onclick="applyLineFormatting(${lineIndex}, null, 'blue')">
                    <span class="text-primary">●</span> Синий
                </button>
                <button class="dropdown-item" onclick="applyLineFormatting(${lineIndex}, null, 'yellow')">
                    <span class="text-warning">●</span> Желтый
                </button>
                <button class="dropdown-item" onclick="applyLineFormatting(${lineIndex}, null, 'white')">
                    <span class="text-light">●</span> Белый
                </button>
                
                <div class="dropdown-divider"></div>
                
                <h6 class="dropdown-header">Комбинированное</h6>
                <button class="dropdown-item" onclick="applyLineFormatting(${lineIndex}, 'bold', 'red')">
                    <i class="bi bi-type-bold text-danger"></i> Красный жирный
                </button>
                <button class="dropdown-item" onclick="applyLineFormatting(${lineIndex}, 'italic', 'blue')">
                    <i class="bi bi-type-italic text-primary"></i> Синий курсив
                </button>
                
                <div class="dropdown-divider"></div>
                
                <button class="dropdown-item text-danger" onclick="clearLineFormatting(${lineIndex})">
                    <i class="bi bi-eraser"></i> Очистить форматирование
                </button>
            </div>
        `;
        
        // Удаляем старое меню
        const oldMenu = document.querySelector('.line-format-menu');
        if (oldMenu) oldMenu.remove();
        
        const menu = document.createElement('div');
        menu.innerHTML = menuHTML;
        document.body.appendChild(menu);
        
        // Закрытие меню при клике вне его
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    // Обновление отображения форматирования в таблице
    updateFormatDisplay(lineIndex) {
        const row = document.querySelector(`#subtitleTable tr[data-index="${lineIndex}"]`);
        if (!row) return;
        
        const format = this.getLineFormat(lineIndex);
        const formatIndicator = row.querySelector('.format-indicator');
        
        if (formatIndicator) {
            let indicatorHTML = '';
            
            if (format.format) {
                const icons = {
                    bold: 'bi-type-bold',
                    italic: 'bi-type-italic', 
                    underline: 'bi-type-underline',
                    strike: 'bi-type-strikethrough'
                };
                indicatorHTML += `<i class="bi ${icons[format.format]} me-1"></i>`;
            }
            
            if (format.color) {
                const colorClasses = {
                    red: 'text-danger',
                    green: 'text-success',
                    blue: 'text-primary',
                    yellow: 'text-warning',
                    white: 'text-light',
                    black: 'text-dark'
                };
                indicatorHTML += `<span class="${colorClasses[format.color]}">●</span>`;
            }
            
            formatIndicator.innerHTML = indicatorHTML;
            formatIndicator.title = this.getFormatDescription(format);
        }
    }

    getFormatDescription(format) {
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
        
        let description = '';
        if (format.color) description += colorNames[format.color] + ' ';
        if (format.format) description += formatNames[format.format];
        
        return description.trim() || 'Без форматирования';
    }
}

window.lineFormatting = new LineFormatting();

// Глобальные функции
function applyLineFormatting(lineIndex, formatType, color) {
    if (lineFormatting.applyLineFormat(lineIndex, formatType, color)) {
        if (window.renderTable) renderTable();
        window.dispatchEvent(new CustomEvent('subtitlesChanged'));
        
        const formatDesc = lineFormatting.getFormatDescription({
            format: formatType,
            color: color
        });
        showNotification(`Форматирование применено: ${formatDesc}`, 'success');
    }
}

function clearLineFormatting(lineIndex) {
    if (lineFormatting.clearLineFormat(lineIndex)) {
        if (window.renderTable) renderTable();
        window.dispatchEvent(new CustomEvent('subtitlesChanged'));
        showNotification('Форматирование очищено', 'info');
    }
}

function showLineFormatMenu(lineIndex, event) {
    lineFormatting.showLineFormatMenu(lineIndex, event);
}

// Интеграция с рендером таблицы
function integrateFormattingWithTable() {
    const originalRenderTable = window.renderTable;
    
    window.renderTable = function() {
        originalRenderTable?.();
        
        // Добавляем индикаторы форматирования к каждой строке
        const tableBody = document.getElementById('subtitleTableBody');
        if (!tableBody) return;
        
        const rows = tableBody.querySelectorAll('tr[data-index]');
        rows.forEach(row => {
            const lineIndex = parseInt(row.getAttribute('data-index'));
            
            // Добавляем кнопку форматирования в ячейку действий
            const actionCell = row.querySelector('td:last-child');
            if (actionCell) {
                let formatBtn = actionCell.querySelector('.format-btn');
                if (!formatBtn) {
                    formatBtn = document.createElement('button');
                    formatBtn.className = 'btn btn-outline-secondary action-btn format-btn';
                    formatBtn.innerHTML = '<i class="bi bi-palette"></i>';
                    formatBtn.title = 'Форматирование строки';
                    formatBtn.onclick = (e) => showLineFormatMenu(lineIndex, e);
                    
                    // Вставляем первой кнопкой
                    const firstBtn = actionCell.querySelector('.action-btn');
                    if (firstBtn) {
                        actionCell.insertBefore(formatBtn, firstBtn);
                    } else {
                        actionCell.appendChild(formatBtn);
                    }
                }
            }
            
            // Добавляем индикатор форматирования в ячейку текста
            const textCell = row.querySelector('td:nth-child(6)');
            if (textCell) {
                let formatIndicator = textCell.querySelector('.format-indicator');
                if (!formatIndicator) {
                    formatIndicator = document.createElement('span');
                    formatIndicator.className = 'format-indicator me-2';
                    const textInput = textCell.querySelector('.text-input');
                    if (textInput) {
                        textCell.insertBefore(formatIndicator, textInput);
                    }
                }
                
                // Обновляем отображение форматирования
                lineFormatting.updateFormatDisplay(lineIndex);
            }
        });
    };
}

// Новые функции для форматирования отдельных строк
TextFormatting.prototype.quickFormat = function(index, formatType, color = null) {
    if (!window.getSubtitleItems) return;
    
    const items = window.getSubtitleItems();
    if (!items[index]) return;

    let text = items[index].text;
    
    if (color) {
        text = `{\\c${this.colors[color]}}${text}{\\c}`;
    } else if (this.formats[formatType]) {
        const format = this.formats[formatType];
        text = `{${format.ass}}${text}{${format.end.ass}}`;
    }

    items[index].text = text;
    
    if (window.renderTable) renderTable();
    window.dispatchEvent(new CustomEvent('subtitlesChanged'));
    
    showAlert(`Форматирование применено: ${formatType}${color ? ' ' + color : ''}`, 'success');
};

TextFormatting.prototype.clearFormattingForRow = function(index) {
    if (!window.getSubtitleItems) return;
    
    const items = window.getSubtitleItems();
    if (!items[index]) return;

    items[index].text = this.clearFormatting(items[index].text);
    
    if (window.renderTable) renderTable();
    window.dispatchEvent(new CustomEvent('subtitlesChanged'));
    
    showAlert('Форматирование очищено', 'success');
};

// Глобальные функции для использования в таблице
function quickFormatText(index, formatType, color = null) {
    textFormatting.quickFormat(index, formatType, color);
}

function clearRowFormatting(index) {
    textFormatting.clearFormattingForRow(index);
}

function showFormattingButtons(index) {
    const modalHTML = `
        <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> Форматирование для строки ${index + 1}
        </div>
        <div class="mb-3">
            <h6>Стили:</h6>
            <div class="btn-group w-100 mb-2">
                <button class="btn btn-outline-dark" onclick="applyFormatAndClose(${index}, 'bold')">
                    <i class="bi bi-type-bold"></i> Жирный
                </button>
                <button class="btn btn-outline-dark" onclick="applyFormatAndClose(${index}, 'italic')">
                    <i class="bi bi-type-italic"></i> Курсив
                </button>
                <button class="btn btn-outline-dark" onclick="applyFormatAndClose(${index}, 'underline')">
                    <i class="bi bi-type-underline"></i> Подчеркивание
                </button>
            </div>
            
            <h6>Цвета:</h6>
            <div class="btn-group w-100 mb-3">
                <button class="btn btn-outline-danger" onclick="applyFormatAndClose(${index}, 'color', 'red')">Красный</button>
                <button class="btn btn-outline-success" onclick="applyFormatAndClose(${index}, 'color', 'green')">Зеленый</button>
                <button class="btn btn-outline-primary" onclick="applyFormatAndClose(${index}, 'color', 'blue')">Синий</button>
                <button class="btn btn-outline-warning" onclick="applyFormatAndClose(${index}, 'color', 'yellow')">Желтый</button>
            </div>
            
            <button class="btn btn-outline-secondary w-100" onclick="clearFormatAndClose(${index})">
                <i class="bi bi-eraser"></i> Очистить форматирование
            </button>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.createElement('div'));
    modal._element.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Форматирование текста</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">${modalHTML}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal._element);
    modal.show();
}

function applyFormatAndClose(index, formatType, color = null) {
    quickFormatText(index, formatType, color);
    bootstrap.Modal.getInstance(document.querySelector('.modal.show'))?.hide();
}

function clearFormatAndClose(index) {
    clearRowFormatting(index);
    bootstrap.Modal.getInstance(document.querySelector('.modal.show'))?.hide();
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    integrateFormattingWithTable();
});