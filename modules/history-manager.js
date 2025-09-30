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
        if (window.showAlert) window.showAlert(`Отменено: ${this.history[this.currentIndex + 1]?.description}`, 'warning');
    }

    // Повтор (Redo)
    redo() {
        if (this.currentIndex >= this.history.length - 1) {
            if (window.showAlert) window.showAlert('Нет действий для повтора', 'info');
            return;
        }

        this.currentIndex++;
        this.applyState(this.history[this.currentIndex]);
        if (window.showAlert) window.showAlert(`Повторено: ${this.history[this.currentIndex]?.description}`, 'info');
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
                                ${this.current
