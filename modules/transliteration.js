// modules/transliteration.js
class Transliteration {
    constructor() {
        this.rules = {
            // Русский -> Латинский (ISO 9)
            ruToEn: {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
                'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
                'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
                'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
                'я': 'ya',
                'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh',
                'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
                'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts',
                'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu',
                'Я': 'Ya'
            },
            // Латинский -> Русский (обратная транслитерация)
            enToRu: {
                'a': 'а', 'b': 'б', 'v': 'в', 'g': 'г', 'd': 'д', 'e': 'е', 'yo': 'ё', 'zh': 'ж',
                'z': 'з', 'i': 'и', 'y': 'й', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о',
                'p': 'п', 'r': 'р', 's': 'с', 't': 'т', 'u': 'у', 'f': 'ф', 'kh': 'х', 'ts': 'ц',
                'ch': 'ч', 'sh': 'ш', 'shch': 'щ', 'yu': 'ю', 'ya': 'я',
                'A': 'А', 'B': 'Б', 'V': 'В', 'G': 'Г', 'D': 'Д', 'E': 'Е', 'Yo': 'Ё', 'Zh': 'Ж',
                'Z': 'З', 'I': 'И', 'Y': 'Й', 'K': 'К', 'L': 'Л', 'M': 'М', 'N': 'Н', 'O': 'О',
                'P': 'П', 'R': 'Р', 'S': 'С', 'T': 'Т', 'U': 'У', 'F': 'Ф', 'Kh': 'Х', 'Ts': 'Ц',
                'Ch': 'Ч', 'Sh': 'Ш', 'Shch': 'Щ', 'Yu': 'Ю', 'Ya': 'Я'
            }
        };
    }

    // Определение направления транслитерации
    detectDirection(text) {
        const cyrillicCount = (text.match(/[а-яё]/gi) || []).length;
        const latinCount = (text.match(/[a-z]/gi) || []).length;
        
        if (cyrillicCount > latinCount) return 'ruToEn';
        if (latinCount > cyrillicCount) return 'enToRu';
        return 'ruToEn'; // По умолчанию
    }

    // Транслитерация текста
    transliterateText(text, direction = null) {
        if (!text.trim()) return text;
        
        const actualDirection = direction || this.detectDirection(text);
        const rules = this.rules[actualDirection];
        
        let result = text;
        
        // Сначала обрабатываем многобуквенные комбинации
        const multiCharRules = {};
        Object.keys(rules).forEach(key => {
            if (key.length > 1) {
                multiCharRules[key] = rules[key];
            }
        });
        
        // Применяем многобуквенные правила
        Object.keys(multiCharRules).forEach(key => {
            const regex = new RegExp(key, 'gi');
            result = result.replace(regex, match => {
                return match === match.toUpperCase() 
                    ? multiCharRules[key].toUpperCase()
                    : multiCharRules[key];
            });
        });
        
        // Затем однобуквенные правила
        for (let i = 0; i < result.length; i++) {
            const char = result[i];
            if (rules[char]) {
                result = result.substring(0, i) + rules[char] + result.substring(i + 1);
                i += rules[char].length - 1;
            }
        }
        
        return result;
    }

    // Транслитерация всех субтитров
    transliterateAllSubtitles(direction = null) {
        if (!window.getSubtitleItems) return 0;
        
        const items = window.getSubtitleItems();
        let transliteratedCount = 0;
        
        items.forEach(item => {
            const original = item.text;
            item.text = this.transliterateText(original, direction);
            if (item.text !== original) transliteratedCount++;
        });
        
        return transliteratedCount;
    }
}

window.transliteration = new Transliteration();

// Глобальные функции
function transliterateText() {
    if (!window.getSubtitleItems) {
        showNotification('Нет загруженных субтитров', 'warning');
        return;
    }
    
    // Определяем направление по первому субтитру
    const items = window.getSubtitleItems();
    if (items.length === 0) return;
    
    const sampleText = items[0].text;
    const direction = transliteration.detectDirection(sampleText);
    const directionName = direction === 'ruToEn' ? 'русский → английский' : 'английский → русский';
    
    const count = transliteration.transliterateAllSubtitles(direction);
    
    if (count > 0) {
        if (window.renderTable) renderTable();
        window.dispatchEvent(new CustomEvent('subtitlesChanged'));
        showNotification(`Транслитерировано ${count} субтитров (${directionName})`, 'success');
    } else {
        showNotification('Нечего транслитерировать', 'info');
    }
}

function showTransliterationModal() {
    const modalHTML = `
        <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> Выберите направление транслитерации
        </div>
        <div class="mb-3">
            <label class="form-label">Направление:</label>
            <select class="form-select" id="transliterationDirection">
                <option value="auto">Автоопределение</option>
                <option value="ruToEn">Русский → Английский</option>
                <option value="enToRu">Английский → Русский</option>
            </select>
        </div>
        <div class="mb-3">
            <label class="form-label">Предпросмотр:</label>
            <div class="border p-2 small bg-light" id="transliterationPreview">
                Введите текст для предпросмотра...
            </div>
        </div>
        <div class="mb-3">
            <input type="text" class="form-control" id="transliterationSample" 
                   placeholder="Введите текст для проверки" 
                   oninput="updateTransliterationPreview()">
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.createElement('div'));
    modal._element.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Транслитерация</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">${modalHTML}</div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-primary" onclick="applyTransliteration()">
                        Применить ко всем
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal._element);
    modal.show();
}

function updateTransliterationPreview() {
    const sample = document.getElementById('transliterationSample').value;
    const direction = document.getElementById('transliterationDirection').value;
    
    if (!sample.trim()) {
        document.getElementById('transliterationPreview').textContent = 'Введите текст для предпросмотра...';
        return;
    }
    
    const actualDirection = direction === 'auto' ? null : direction;
    const result = transliteration.transliterateText(sample, actualDirection);
    
    document.getElementById('transliterationPreview').innerHTML = `
        <strong>Результат:</strong> ${result}
        ${sample !== result ? '<br><small class="text-success">✓ Изменения применены</small>' : ''}
    `;
}

function applyTransliteration() {
    const direction = document.getElementById('transliterationDirection').value;
    const actualDirection = direction === 'auto' ? null : direction;
    
    const count = transliteration.transliterateAllSubtitles(actualDirection);
    
    if (count > 0) {
        if (window.renderTable) renderTable();
        window.dispatchEvent(new CustomEvent('subtitlesChanged'));
        showNotification(`Транслитерировано ${count} субтитров`, 'success');
    }
    
    bootstrap.Modal.getInstance(document.querySelector('.modal.show')).hide();
}
