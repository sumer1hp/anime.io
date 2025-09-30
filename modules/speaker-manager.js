// modules/speaker-manager.js
class SpeakerManager {
    constructor() {
        this.speakers = new Set();
        this.loadSpeakers();
    }

    loadSpeakers() {
        const saved = localStorage.getItem('subtitleSpeakers');
        if (saved) {
            this.speakers = new Set(JSON.parse(saved));
        }
    }

    saveSpeakers() {
        localStorage.setItem('subtitleSpeakers', JSON.stringify([...this.speakers]));
    }

    addSpeaker(name) {
        if (name && name.trim()) {
            this.speakers.add(name.trim());
            this.saveSpeakers();
        }
    }

    removeSpeaker(name) {
        this.speakers.delete(name);
        this.saveSpeakers();
    }

    getSpeakersList() {
        return Array.from(this.speakers).sort();
    }

    // Автоматическое определение говорящего по тексту
    detectSpeaker(text) {
        const patterns = [
            /^([А-ЯЁA-Z][а-яёa-z]+):\s*(.+)/, // Иван: текст
            /^([А-ЯЁA-Z][а-яёa-z]+)\s*:\s*(.+)/, // Иван : текст
            /^-?\s*([А-ЯЁA-Z][а-яёa-z]+):?\s*(.+)/, // - Иван: текст
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

    // Автоматическое извлечение говорящих из всех субтитров
    extractSpeakersFromSubtitles(subtitles) {
        const foundSpeakers = new Set();
        
        subtitles.forEach(item => {
            const detected = this.detectSpeaker(item.text);
            if (detected) {
                foundSpeakers.add(detected.speaker);
                // Обновляем текст без имени говорящего
                item.text = detected.text;
            }
        });

        foundSpeakers.forEach(speaker => this.addSpeaker(speaker));
        return foundSpeakers;
    }
}

// Глобальный экземпляр
window.speakerManager = new SpeakerManager();

// Функции для использования в editor.js
function updateSpeakerList() {
    const speakers = speakerManager.getSpeakersList();
    // Обновляем все select'ы в таблице
    document.querySelectorAll('.speaker-select').forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- Выберите --</option>' +
            speakers.map(speaker => 
                `<option value="${speaker}" ${speaker === currentValue ? 'selected' : ''}>${speaker}</option>`
            ).join('');
    });
}

function autoDetectSpeakers() {
    if (!window.getSubtitleItems) return;
    
    const items = window.getSubtitleItems();
    const found = speakerManager.extractSpeakersFromSubtitles(items);
    
    if (found.size > 0) {
        updateSpeakerList();
        if (window.renderTable) renderTable();
        showNotification(`Обнаружено ${found.size} говорящих: ${Array.from(found).join(', ')}`, 'success');
    } else {
        showNotification('Говорящие не обнаружены в тексте', 'info');
    }
}
