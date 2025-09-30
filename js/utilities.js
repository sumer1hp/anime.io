// utilities.js - Дополнительные утилиты для редактора субтитров

class SubtitleUtilities {
    // Генерация временных меток с заданным интервалом
    static generateTimestamps(startTime, endTime, interval = 1) {
        const timestamps = [];
        for (let time = startTime; time <= endTime; time += interval) {
            timestamps.push({
                time: time,
                formatted: this.secondsToTime(time)
            });
        }
        return timestamps;
    }

    // Проверка на пересечение временных интервалов
    static checkOverlaps(subtitles) {
        const overlaps = [];
        for (let i = 0; i < subtitles.length - 1; i++) {
            if (subtitles[i].end > subtitles[i + 1].start) {
                overlaps.push({
                    first: subtitles[i],
                    second: subtitles[i + 1],
                    overlap: subtitles[i].end - subtitles[i + 1].start
                });
            }
        }
        return overlaps;
    }

    // Автоматическое исправление пересечений
    static fixOverlaps(subtitles) {
        const fixed = [...subtitles];
        for (let i = 0; i < fixed.length - 1; i++) {
            if (fixed[i].end > fixed[i + 1].start) {
                // Устанавливаем конец первого равным началу второго
                fixed[i].end = fixed[i + 1].start - 0.1;
            }
        }
        return fixed;
    }

    // Поиск субтитров по тексту
    static searchSubtitles(subtitles, query) {
        const lowerQuery = query.toLowerCase();
        return subtitles.filter(item => 
            item.text.toLowerCase().includes(lowerQuery)
        );
    }

    // Создание субтитров из текста с автоматическим распределением
    static createFromText(text, options = {}) {
        const {
            startTime = 0,
            duration = 3,
            gap = 0.5,
            maxCharsPerLine = 40,
            maxLines = 2
        } = options;

        const lines = text.split('\n').filter(line => line.trim());
        const subtitles = [];
        let currentTime = startTime;

        lines.forEach(line => {
            // Разбиваем длинные строки
            const chunks = this.splitText(line, maxCharsPerLine, maxLines);
            
            chunks.forEach(chunk => {
                subtitles.push({
                    id: subtitles.length + 1,
                    start: currentTime,
                    end: currentTime + duration,
                    text: chunk
                });
                currentTime += duration + gap;
            });
        });

        return subtitles;
    }

    // Разбивка текста на части
    static splitText(text, maxChars, maxLines) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            if ((currentLine + ' ' + word).length <= maxChars) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) lines.push(currentLine);
        return lines.slice(0, maxLines);
    }

    // Расчет читабельности (скорость чтения)
    static calculateReadability(subtitle) {
        const wordCount = subtitle.text.split(' ').length;
        const duration = subtitle.end - subtitle.start;
        const wps = wordCount / duration; // слов в секунду
        
        let readability = 'optimal';
        if (wps > 3) readability = 'fast';
        if (wps < 1.5) readability = 'slow';
        if (wps > 4) readability = 'very-fast';
        
        return {
            wps,
            readability,
            wordCount,
            duration
        };
    }

    // Экспорт в различные форматы
    static exportFormats = {
        txt: (subtitles) => {
            return subtitles.map(item => 
                `${this.secondsToTime(item.start)} - ${this.secondsToTime(item.end)}\n${item.text}\n`
            ).join('\n');
        },

        csv: (subtitles) => {
            const headers = 'Start,End,Duration,Text\n';
            const rows = subtitles.map(item => 
                `"${this.secondsToTime(item.start)}","${this.secondsToTime(item.end)}","${this.secondsToTime(item.end - item.start)}","${item.text.replace(/"/g, '""')}"`
            ).join('\n');
            return headers + rows;
        },

        json: (subtitles) => {
            return JSON.stringify(subtitles, null, 2);
        }
    };

    // Вспомогательные функции времени
    static secondsToTime(sec) {
        if (isNaN(sec) || sec < 0) return '00:00:00,000';
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }

    static timeToSeconds(timeStr) {
        let match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
        if (match) {
            return (+match[1]) * 3600 + (+match[2]) * 60 + (+match[3]) + (+match[4]) / 1000;
        }
        
        match = timeStr.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
        if (match) {
            return (+match[1]) * 3600 + (+match[2]) * 60 + (+match[3]) + (+match[4]) / 1000;
        }
        
        return NaN;
    }
}

// Глобальные хоткеи
class KeyboardShortcuts {
    constructor(editor) {
        this.editor = editor;
        this.setupShortcuts();
    }

    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter - добавить субтитр
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.editor.addSubtitleRow();
            }

            // Ctrl+S - сохранить (экспорт SRT)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                document.getElementById('exportSrt')?.click();
            }

            // Ctrl+Shift+S - сохранить как ASS
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                document.getElementById('exportAss')?.click();
            }

            // Space - play/pause видео
            if (e.key === ' ' && !this.isInputFocused()) {
                e.preventDefault();
                this.togglePlayPause();
            }

            // Delete - удалить выделенный субтитр
            if (e.key === 'Delete' && !this.isInputFocused()) {
                const selected = document.querySelector('.table-warning');
                if (selected) {
                    const index = selected.getAttribute('data-index');
                    this.editor.handleDeleteRow({ currentTarget: { dataset: { index } } });
                }
            }
        });
    }

    isInputFocused() {
        const active = document.activeElement;
        return active.tagName === 'INPUT' || active.tagName === 'TEXTAREA';
    }

    togglePlayPause() {
        const video = document.getElementById('videoPlayer');
        if (video) {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        }
    }
}

// Система уведомлений
class NotificationSystem {
    static show(message, type = 'info', duration = 4000) {
        // Удаляем предыдущие уведомления
        const existing = document.querySelectorAll('.subtitle-notification');
        existing.forEach(notif => notif.remove());

        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const notification = document.createElement('div');
        notification.className = `alert ${alertClass} subtitle-notification position-fixed`;
        notification.style.cssText = `
            top: 20px; 
            right: 20px; 
            z-index: 9999; 
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: none;
            border-radius: 8px;
        `;
        
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${this.getIcon(type)} me-2"></i>
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close ms-2" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }

    static getIcon(type) {
        const icons = {
            'success': 'bi-check-circle',
            'error': 'bi-exclamation-circle',
            'warning': 'bi-exclamation-triangle',
            'info': 'bi-info-circle'
        };
        return icons[type] || 'bi-info-circle';
    }
}

// Добавляем утилиты в глобальную область видимости
window.SubtitleUtilities = SubtitleUtilities;
window.KeyboardShortcuts = KeyboardShortcuts;
window.NotificationSystem = NotificationSystem;
