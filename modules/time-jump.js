// modules/time-jump.js
class TimeJumpModule {
    constructor() {
        this.init();
    }

    init() {
        this.setupTimeJumpInterface();
        this.setupGlobalHotkeys();
        this.setupTableClickHandlers();
    }

    setupTimeJumpInterface() {
        // Добавляем поле для быстрого перехода по времени в панель инструментов
        this.injectTimeJumpInput();
    }

    injectTimeJumpInput() {
        const toolsPanel = document.querySelector('#toolsPanel .d-flex.flex-wrap.gap-2');
        if (!toolsPanel) return;

        if (document.getElementById('timeJumpInput')) return;

        const jumpContainer = document.createElement('div');
        jumpContainer.className = 'd-flex gap-1 align-items-center';
        jumpContainer.innerHTML = `
            <input type="text" 
                   id="timeJumpInput" 
                   class="form-control form-control-sm" 
                   placeholder="Перейти к времени (мм:сс)"
                   style="width: 120px; font-family: monospace;"
                   title="Формат: мм:сс или чч:мм:сс">
            <button class="btn btn-sm btn-outline-primary" id="timeJumpBtn" title="Перейти ко времени (G)">
                <i class="bi bi-arrow-right-circle"></i>
            </button>
        `;

        toolsPanel.appendChild(jumpContainer);

        document.getElementById('timeJumpBtn').addEventListener('click', () => {
            this.jumpToTimeInput();
        });

        document.getElementById('timeJumpInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.jumpToTimeInput();
            }
        });
    }

    setupTableClickHandlers() {
        // Обработчик клика по номеру субтитра для перехода
        document.addEventListener('click', (e) => {
            // Клик по номеру субтитра
            if (e.target.matches('td[data-action="jump"]')) {
                const index = parseInt(e.target.dataset.index);
                this.jumpToSubtitle(index);
            }
            
            // Двойной клик по ячейке времени
            if (e.target.classList.contains('time-input')) {
                const timeValue = e.target.value;
                const seconds = this.timeToSeconds(timeValue);
                if (!isNaN(seconds)) {
                    this.jumpToTime(seconds);
                }
            }
        });
    }

    jumpToTimeInput() {
        const input = document.getElementById('timeJumpInput');
        if (!input) return;

        const timeString = input.value.trim();
        if (!timeString) return;

        const seconds = this.parseTimeString(timeString);
        if (!isNaN(seconds)) {
            this.jumpToTime(seconds);
            input.value = '';
        } else {
            this.showError('Неверный формат времени. Используйте: мм:сс или чч:мм:сс');
        }
    }

    parseTimeString(timeString) {
        const patterns = [
            /^(\d{1,2}):(\d{2})$/i, // мм:сс
            /^(\d{1,2}):(\d{2}):(\d{2})$/i, // чч:мм:сс
            /^(\d{1,2}):(\d{2})\.(\d{1,3})$/i, // мм:сс.мсс
            /^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/i // чч:мм:сс.мсс
        ];

        for (const pattern of patterns) {
            const match = timeString.match(pattern);
            if (match) {
                if (match[3] && !match[4]) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = parseInt(match[3].padEnd(3, '0'));
                    return minutes * 60 + seconds + milliseconds / 1000;
                } else if (match[3] && match[4]) {
                    const hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    const seconds = parseInt(match[3]);
                    const milliseconds = parseInt(match[4].padEnd(3, '0'));
                    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
                } else if (match[3]) {
                    const hours = parseInt(match[1]);
                    const minutes = parseInt(match[2]);
                    const seconds = parseInt(match[3]);
                    return hours * 3600 + minutes * 60 + seconds;
                } else {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    return minutes * 60 + seconds;
                }
            }
        }

        const seconds = parseFloat(timeString);
        if (!isNaN(seconds)) {
            return seconds;
        }

        return NaN;
    }

    jumpToTime(seconds) {
        const video = document.getElementById('videoPlayer');
        if (!video || !video.src) {
            this.showError('Видео не загружено');
            return;
        }

        if (seconds < 0) seconds = 0;
        if (seconds > video.duration) seconds = video.duration;

        video.currentTime = seconds;
        this.showJumpFeedback(seconds);
        
        if (video.paused) {
            video.play();
            setTimeout(() => {
                video.pause();
            }, 1000);
        }
    }

    jumpToSubtitle(index) {
        const items = window.getSubtitleItems ? window.getSubtitleItems() : [];
        if (items[index]) {
            this.jumpToTime(items[index].start);
        }
    }

    showJumpFeedback(targetTime) {
        const feedback = document.createElement('div');
        feedback.className = 'jump-feedback';
        feedback.innerHTML = `⏩ ${this.formatTime(targetTime)}`;
        
        const container = document.getElementById('playerContainer');
        if (container) {
            container.appendChild(feedback);
            
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.remove();
                }
            }, 1500);
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        } else {
            return `${m}:${s.toString().padStart(2, '0')}`;
        }
    }

    timeToSeconds(timeStr) {
        let match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
        if (match) {
            return (+match[1]) * 3600 + (+match[2]) * 60 + (+match[3]) + (+match[4]) / 1000;
        }

        match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})/);
        if (match) {
            return (+match[1]) * 3600 + (+match[2]) * 60 + (+match[3]);
        }

        match = timeStr.match(/(\d{2}):(\d{2})/);
        if (match) {
            return (+match[1]) * 60 + (+match[2]);
        }

        return NaN;
    }

    setupGlobalHotkeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'g' || e.key === 'G') {
                const input = document.getElementById('timeJumpInput');
                if (input && !this.isInputFocused(e.target)) {
                    e.preventDefault();
                    input.focus();
                    input.select();
                }
            }
        });
    }

    isInputFocused(element) {
        return element.tagName === 'INPUT' || 
               element.tagName === 'TEXTAREA' || 
               element.isContentEditable;
    }

    showError(message) {
        if (window.showAlert) {
            window.showAlert(message, 'danger');
        } else {
            alert(message);
        }
    }
}

// Инициализация модуля
document.addEventListener('DOMContentLoaded', () => {
    window.timeJumpModule = new TimeJumpModule();
});

// Глобальные функции
window.jumpToTime = (seconds) => {
    if (window.timeJumpModule) {
        window.timeJumpModule.jumpToTime(seconds);
    }
};

window.jumpToSubtitle = (index) => {
    if (window.timeJumpModule) {
        window.timeJumpModule.jumpToSubtitle(index);
    }
};