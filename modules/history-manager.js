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
    }

    // Добавление состояния в историю
    addState(description = 'Изменение') {
        if (!window.getSubtitleItems) return;
        
        const currentState = this.getCurrentData();
        
        // Удаляем все состояния после текущего индекса (если есть отмена)
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        const historyItem = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            description: description,
            data: JSON.parse(JSON.stringify(currentState)) // Глубокая копия
        };

        this.history.push(historyItem);
        this.currentIndex = this.history.length - 1;

        // Ограничиваем размер истории
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        this.saveHistory();
    }

    // Отмена (Undo)
    undo() {
        if (this.currentIndex <= 0) {
            if (window.showAlert) window.showAlert('Нет действий для отмены', 'info');
            return;
        }

        this.currentIndex--;
        this.applyState(this.history[this.currentIndex]);
        if (window.showAlert) window.showAlert('Отменено: ' + this.history[this.currentIndex + 1]?.description, 'warning');
    }

    // Повтор (Redo)
    redo() {
        if (this.currentIndex >= this.history.length - 1) {
            if (window.showAlert) window.showAlert('Нет действий для повтора', 'info');
            return;
        }

        this.currentIndex++;
        this.applyState(this.history[this.currentIndex]);
        if (window.showAlert) window.showAlert('Повторено: ' + this.history[this.currentIndex]?.description, 'info');
    }

    // Применение состояния
    applyState(historyItem) {
        if (!historyItem || !historyItem.data) return;

        this.setCurrentData(historyItem.data);
    }

    // Получение текущих данных
    getCurrentData() {
        if (!window.getSubtitleItems) return null;
        
        return {
            subtitles: window.getSubtitleItems(),
            videoTime: document.getElementById('videoPlayer')?.currentTime || 0
        };
    }

    // Установка текущих данных
    setCurrentData(data) {
        if (!data || !data.subtitles) return;

        // Восстанавливаем субтитры
        if (window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('subtitlesLoaded', { 
                detail: { items: data.subtitles } 
            }));
        }

        // Восстанавливаем время видео
        if (data.videoTime) {
            const video = document.getElementById('videoPlayer');
            if (video) video.currentTime = data.videoTime;
        }
    }

    // Показ истории
    showHistory() {
        let historyHTML = '';
        
        if (this.history.length === 0) {
            historyHTML = 
                '<div class="text-center text-muted py-4">' +
                    '<i class="bi bi-clock-history display-4 d-block mb-2"></i>' +
                    'История изменений пуста' +
                '</div>';
        } else {
            historyHTML = this.history.map((item, index) => {
                const isCurrent = index === this.currentIndex;
                return (
                    '<div class="card mb-2 ' + (isCurrent ? 'border-primary' : '') + '">' +
                        '<div class="card-body py-2">' +
                            '<div class="d-flex justify-content-between align-items-center">' +
                                '<div>' +
                                    '<strong>' + item.description + '</strong>' +
                                    '<br>' +
                                    '<small class="text-muted">' +
                                        '<i class="bi bi-clock"></i> ' + item.timestamp +
                                        (isCurrent ? ' • <strong>Текущее состояние</strong>' : '') +
                                    '</small>' +
                                '</div>' +
                                '<div>' +
                                    (index !== this.currentIndex ? 
                                        '<button class="btn btn-sm btn-outline-primary" onclick="historyManager.goToState(' + index + ')">Перейти</button>' 
                                        : '') +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                );
            }).join('');
        }

        const modalHTML = 
            '<div class="mb-3">' +
                '<div class="d-flex justify-content-between align-items-center">' +
                    '<h6>История изменений</h6>' +
                    '<div>' +
                        '<button class="btn btn-sm btn-outline-secondary" onclick="historyManager.undo()" ' + 
                            (this.currentIndex <= 0 ? 'disabled' : '') + '>' +
                            '<i class="bi bi-arrow-counterclockwise"></i> Отмена' +
                        '</button>' +
                        '<button class="btn btn-sm btn-outline-secondary ms-1" onclick="historyManager.redo()" ' + 
                            (this.currentIndex >= this.history.length - 1 ? 'disabled' : '') + '>' +
                            '<i class="bi bi-arrow-clockwise"></i> Повтор' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="max-height: 400px; overflow-y: auto;">' + historyHTML + '</div>' +
            '<div class="mt-3">' +
                '<button class="btn btn-outline-danger btn-sm" onclick="historyManager.clearHistory()">' +
                    '<i class="bi bi-trash"></i> Очистить историю' +
                '</button>' +
                '<small class="text-muted ms-2">Всего записей: ' + this.history.length + '</small>' +
            '</div>';

        // Создаем модальное окно
        const modalId = 'historyModal';
        let modalElement = document.getElementById(modalId);
        
        if (!modalElement) {
            modalElement = document.createElement('div');
            modalElement.id = modalId;
            modalElement.className = 'modal fade';
            modalElement.tabIndex = -1;
            modalElement.innerHTML = 
                '<div class="modal-dialog modal-lg">' +
                    '<div class="modal-content">' +
                        '<div class="modal-header">' +
                            '<h5 class="modal-title">История изменений</h5>' +
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

    // Переход к конкретному состоянию
    goToState(index) {
        if (index < 0 || index >= this.history.length) return;
        
        this.currentIndex = index;
        this.applyState(this.history[index]);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
        if (modal) modal.hide();
        
        if (window.showAlert) window.showAlert('Переход к состоянию: ' + this.history[index].description, 'info');
    }

    // Очистка истории
    clearHistory() {
        if (!confirm('Очистить всю историю изменений?')) return;
        
        this.history = [];
        this.currentIndex = -1;
        this.saveHistory();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
        if (modal) modal.hide();
        
        if (window.showAlert) window.showAlert('История очищена', 'success');
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
    if (window.historyManager) {
        window.historyManager.showHistory();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.historyManager = new HistoryManager();
    
    // Автоматически добавляем в историю при изменениях
    const originalAddState = window.historyManager.addState.bind(window.historyManager);
    
    // Перехватываем основные события
    window.addEventListener('subtitlesLoaded', () => {
        setTimeout(() => originalAddState('Загрузка субтитров'), 100);
    });
    
    window.addEventListener('subtitlesChanged', () => {
        setTimeout(() => originalAddState('Изменение субтитров'), 100);
    });
});
