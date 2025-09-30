// modules/history-manager.js
class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = 50;
        this.init();
    }

    init() {
        this.loadHistory();
        
        // Автосохранение каждые 30 секунд
        setInterval(() => this.autoSave(), 30000);
    }

    // Добавление состояния в историю
    addState(state, description = 'Изменение') {
        // Удаляем все состояния после текущего индекса (если есть отмена)
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            description: description,
            state: JSON.parse(JSON.stringify(state)), // Глубокая копия
            data: this.getCurrentData()
        };

        this.history.push(historyItem);
        this.currentIndex = this.history.length - 1;

        // Ограничиваем размер истории
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        this.saveHistory();
        this.updateHistoryDisplay();
    }

    // Отмена (Undo)
    undo() {
        if (this.currentIndex <= 0) {
            showNotification('Нет действий для отмены', 'info');
            return;
        }

        this.currentIndex--;
        this.applyState(this.history[this.currentIndex]);
        showNotification(`Отменено: ${this.history[this.currentIndex + 1]?.description}`, 'warning');
    }

    // Повтор (Redo)
    redo() {
        if (this.currentIndex >= this.history.length - 1) {
            showNotification('Нет действий для повтора', 'info');
            return;
        }

        this.currentIndex++;
        this.applyState(this.history[this.currentIndex]);
        showNotification(`Повторено: ${this.history[this.currentIndex]?.description}`, 'info');
    }

    // Применение состояния
    applyState(historyItem) {
        if (!historyItem || !window.getSubtitleItems) return;

        // Восстанавливаем данные
        if (historyItem.data) {
            this.setCurrentData(historyItem.data);
        }

        // Обновляем интерфейс
        if (window.renderTable) {
            renderTable();
        }
        if (window.updateStats) {
            updateStats();
        }

        this.updateHistoryDisplay();
    }

    // Получение текущих данных
    getCurrentData() {
        if (!window.getSubtitleItems) return null;
        
        return {
            subtitles: window.getSubtitleItems(),
            videoTime: document.getElementById('videoPlayer')?.currentTime || 0,
            theme: localStorage.getItem('subtitleEditorTheme') || 'light'
        };
    }

    // Установка текущих данных
    setCurrentData(data) {
        if (!data) return;

        // Восстанавливаем субтитры
        if (data.subtitles && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('subtitlesLoaded', { 
                detail: { items: data.subtitles } 
            }));
        }

        // Восстанавливаем время видео
        if (data.videoTime) {
            const video = document.getElementById('videoPlayer');
            if (video) video.currentTime = data.videoTime;
        }

        // Восстанавливаем тему
        if (data.theme && window.themeManager) {
            window.themeManager.applyTheme(data.theme);
        }
    }

    // Показ истории
    showHistory() {
        const modalHTML = `
            <div class="mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h6>История изменений</h6>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary" onclick="historyManager.undo()" 
                                ${this.currentIndex <= 0 ? 'disabled' : ''}>
                            <i class="bi bi-arrow-counterclockwise"></i> Отмена
                        </button>
                        <button class="btn btn-sm btn-outline-secondary ms-1" onclick="historyManager.redo()" 
                                ${this.currentIndex >= this.history.length - 1 ? 'disabled' : ''}>
                            <i class="bi bi-arrow-clockwise"></i> Повтор
                        </button>
                    </div>
                </div>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
                ${this.history.length === 0 ? `
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-clock-history display-4 d-block mb-2"></i>
                        История изменений пуста
                    </div>
                ` : this.history.map((item, index) => `
                    <div class="card mb-2 ${index === this.currentIndex ? 'border-primary' : ''}">
                        <div class="card-body py-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${item.description}</strong>
                                    <br>
                                    <small class="text-muted">
                                        <i class="bi bi-clock"></i> ${item.timestamp}
                                        ${index === this.currentIndex ? ' • <strong>Текущее состояние</strong>' : ''}
                                    </small>
                                </div>
                                <div>
                                    ${index !== this.currentIndex ? `
                                        <button class="btn btn-sm btn-outline-primary" 
                                                onclick="historyManager.goToState(${index})">
                                            Перейти
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="mt-3">
                <button class="btn btn-outline-danger btn-sm" onclick="historyManager.clearHistory()">
                    <i class="bi bi-trash"></i> Очистить историю
                </button>
                <small class="text-muted ms-2">Всего записей: ${this.history.length}</small>
            </div>
        `;

        const modal = new bootstrap.Modal(document.createElement('div'));
        modal._element.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">История изменений</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">${modalHTML}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal._element);
        modal.show();
    }

    // Переход к конкретному состоянию
    goToState(index) {
        if (index < 0 || index >= this.history.length) return;
        
        this.currentIndex = index;
        this.applyState(this.history[index]);
        
        bootstrap.Modal.getInstance(document.querySelector('.modal.show')).hide();
        showNotification(`Переход к состоянию: ${this.history[index].description}`, 'info');
    }

    // Очистка истории
    clearHistory() {
        if (!confirm('Очистить всю историю изменений?')) return;
        
        this.history = [];
        this.currentIndex = -1;
        this.saveHistory();
        
        bootstrap.Modal.getInstance(document.querySelector('.modal.show')).hide();
        showNotification('История очищена', 'success');
    }

    // Обновление отображения истории
    updateHistoryDisplay() {
        // Можно добавить индикатор в интерфейс
    }

    // Автосохранение
    autoSave() {
        if (!window.getSubtitleItems) return;
        
        const items = window.getSubtitleItems();
        if (items.length === 0) return;

        // Добавляем автосохранение в историю только если есть изменения
        const currentState = this.getCurrentData();
        const lastState = this.history[this.currentIndex]?.data;
        
        if (!lastState || JSON.stringify(currentState.subtitles) !== JSON.stringify(lastState.subtitles)) {
            this.addState(currentState, 'Автосохранение');
        }
    }

    saveHistory() {
        const historyData = {
            items: this.history,
            currentIndex: this.currentIndex
        };
        localStorage.setItem('subtitleHistory', JSON.stringify(historyData));
    }

    loadHistory() {
        const saved = localStorage.getItem('subtitleHistory');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.history = data.items || [];
                this.currentIndex = data.currentIndex || this.history.length - 1;
            } catch (e) {
                console.warn('Ошибка загрузки истории:', e);
            }
        }
    }
}

// Глобальные функции
function showHistory() {
    window.historyManager.showHistory();
}

function addHistoryPoint(description) {
    if (window.historyManager) {
        window.historyManager.addState({}, description);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.historyManager = new HistoryManager();
    
    // Перехватываем основные события для истории
    const originalDispatch = window.dispatchEvent;
    window.dispatchEvent = function(event) {
        if (event.type === 'subtitlesLoaded' || event.type === 'subtitlesChanged') {
            setTimeout(() => {
                window.historyManager.addState({}, 'Изменение субтитров');
            }, 100);
        }
        return originalDispatch.call(this, event);
    };
});
