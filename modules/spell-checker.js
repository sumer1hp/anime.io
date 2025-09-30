// modules/spell-checker.js
class SpellChecker {
    constructor() {
        this.rules = {
            // Основные правила пунктуации
            punctuation: [
                { pattern: /\s+([.,!?;:])/g, replacement: '$1' }, // Убираем пробелы перед знаками
                { pattern: /([.,!?;:])([А-Яа-яA-Za-z])/g, replacement: '$1 $2' }, // Добавляем пробелы после знаков
                { pattern: /\.{3,}/g, replacement: '…' }, // Многоточие
                { pattern: /\s-\s/g, replacement: ' — ' }, // Тире
            ],
            // Орфографические правила для русского
            russian: [
                { pattern: /(\s|^)([А-Яа-я]{1,2}\s)([А-Яа-я])/g, replacement: '$1$2$3' }, // Короткие слова
                { pattern: /(\s|^)([А-Яа-я]+)(же|ли|то|ка|нибудь|либо|таки)(\s|$|[.,!?])/g, replacement: '$1$2-$3$4' }, // Частицы
                { pattern: /([А-Яа-я]+)(с)([.,!?]|\s|$)/g, replacement: '$1-$2$3' }, // Частица -с
            ],
            // Общие правила
            common: [
                { pattern: /\s+/g, replacement: ' ' }, // Множественные пробелы
                { pattern: /^\s+|\s+$/g, replacement: '' }, // Пробелы в начале/конце
                { pattern: /([.!?])\s*([А-ЯA-Z])/g, replacement: '$1 $2' }, // Большие буквы после знаков
            ]
        };
    }

    // Основная функция коррекции
    correctText(text, language = 'ru') {
        let corrected = text;
        
        // Применяем все правила
        Object.values(this.rules).forEach(ruleSet => {
            ruleSet.forEach(rule => {
                corrected = corrected.replace(rule.pattern, rule.replacement);
            });
        });
        
        // Языко-специфичные правила
        if (language === 'ru') {
            corrected = this.applyRussianRules(corrected);
        }
        
        return corrected;
    }

    // Русско-специфичные правила
    applyRussianRules(text) {
        return text
            .replace(/(\s|^)(что|это|вот)(\s|$)/g, '$1$2$3')
            .replace(/([А-Яа-я]+)(бы)(\s|$|[.,!?])/g, '$1-$2$3')
            .replace(/([А-Яа-я]+)(ль)(\s|$|[.,!?])/g, '$1-$2$3');
    }

    // Проверка конкретного текста
    checkText(text) {
        const errors = [];
        const lines = text.split('\n');
        
        lines.forEach((line, lineIndex) => {
            // Проверка пунктуации
            if (line.match(/[.,!?;:]\s*[а-яa-z]/)) {
                errors.push({
                    type: 'punctuation',
                    line: lineIndex + 1,
                    message: 'Отсутствует пробел после знака препинания',
                    text: line
                });
            }
            
            // Проверка двойных пробелов
            if (line.match(/\s{2,}/)) {
                errors.push({
                    type: 'spaces',
                    line: lineIndex + 1,
                    message: 'Обнаружены двойные пробелы',
                    text: line
                });
            }
            
            // Проверка дефисов/тире
            if (line.match(/\s-\s/)) {
                errors.push({
                    type: 'dash',
                    line: lineIndex + 1,
                    message: 'Используется дефис вместо тире',
                    text: line
                });
            }
        });
        
        return errors;
    }

    // Коррекция всех субтитров
    correctAllSubtitles() {
        if (!window.getSubtitleItems) return 0;
        
        const items = window.getSubtitleItems();
        let correctedCount = 0;
        
        items.forEach(item => {
            const original = item.text;
            item.text = this.correctText(original);
            if (item.text !== original) correctedCount++;
        });
        
        return correctedCount;
    }
}

window.spellChecker = new SpellChecker();

// Глобальные функции
function autoCorrectSpelling() {
    if (!window.getSubtitleItems) {
        showNotification('Нет загруженных субтитров', 'warning');
        return;
    }
    
    const count = spellChecker.correctAllSubtitles();
    
    if (count > 0) {
        if (window.renderTable) renderTable();
        window.dispatchEvent(new CustomEvent('subtitlesChanged'));
        showNotification(`Скорректировано ${count} субтитров`, 'success');
    } else {
        showNotification('Ошибки не обнаружены', 'info');
    }
}

function showSpellCheckModal() {
    if (!window.getSubtitleItems) {
        showNotification('Нет загруженных субтитров', 'warning');
        return;
    }
    
    const items = window.getSubtitleItems();
    const allErrors = [];
    
    // Собираем все ошибки
    items.forEach((item, index) => {
        const errors = spellChecker.checkText(item.text);
        errors.forEach(error => {
            allErrors.push({
                ...error,
                subtitleId: item.id,
                itemIndex: index
            });
        });
    });
    
    if (allErrors.length === 0) {
        showNotification('Ошибки не обнаружены!', 'success');
        return;
    }
    
    // Показываем модальное окно с ошибками
    const modalHTML = `
        <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> Найдено ${allErrors.length} ошибок
        </div>
        <div style="max-height: 400px; overflow-y: auto;">
            ${allErrors.map(error => `
                <div class="card mb-2">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <strong>Субтитр ${error.subtitleId}</strong>: ${error.message}
                                <br><small class="text-muted">${error.text}</small>
                            </div>
                            <button class="btn btn-sm btn-outline-primary" onclick="goToSubtitle(${error.itemIndex})">
                                Исправить
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.createElement('div'));
    modal._element.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Проверка орфографии</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">${modalHTML}</div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    <button type="button" class="btn btn-primary" onclick="autoCorrectSpelling()">
                        Авто-коррекция всех
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal._element);
    modal.show();
}
