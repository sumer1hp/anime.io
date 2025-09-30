// modules/video-controls.js
class VideoControls {
    constructor() {
        this.bookmarks = [];
        this.playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];
        this.init();
    }

    init() {
        this.loadBookmarks();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    setupEventListeners() {
        // Скорость воспроизведения
        document.getElementById('playbackRate')?.addEventListener('change', (e) => {
            this.setPlaybackRate(parseFloat(e.target.value));
        });

        // Автосохранение закладок
        setInterval(() => this.saveBookmarks(), 10000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Пропускаем если фокус в поле ввода
            if (this.isInputFocused()) return;

            const video = document.getElementById('videoPlayer');
            if (!video) return;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.seek(-5);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.seek(5);
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePlayPause();
                    break;
                case 'b':
                case 'B':
                    e.preventDefault();
                    this.addBookmark();
                    break;
                case '>':
                case '.':
                    e.preventDefault();
                    this.increaseSpeed();
                    break;
                case '<':
                case ',':
                    e.preventDefault();
                    this.decreaseSpeed();
                    break;
            }
        });
    }

    isInputFocused() {
        const active = document.activeElement;
        return active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable;
    }

    // Навигация по времени
    seek(seconds) {
        const video = document.getElementById('videoPlayer');
        if (!video) return;

        video.currentTime = Math.max(0, video.currentTime + seconds);
        showNotification(`Перемотка: ${seconds > 0 ? '+' : ''}${seconds}сек`, 'info');
    }

    togglePlayPause() {
        const video = document.getElementById('videoPlayer');
        if (!video) return;

        if (video.paused) {
            video.play();
            showNotification('Воспроизведение', 'info');
        } else {
            video.pause();
            showNotification('Пауза', 'info');
        }
    }

    // Скорость воспроизведения
    setPlaybackRate(rate) {
        const video = document.getElementById('videoPlayer');
        if (!video) return;

        video.playbackRate = rate;
        showNotification(`Скорость: ${rate}x`, 'info');
    }

    increaseSpeed() {
        const video = document.getElementById('videoPlayer');
        if (!video) return;

        const currentRate = video.playbackRate;
        const availableRates = this.playbackRates;
        const currentIndex = availableRates.indexOf(currentRate);
        const nextIndex = Math.min(currentIndex + 1, availableRates.length - 1);
        
        this.setPlaybackRate(availableRates[nextIndex]);
    }

    decreaseSpeed() {
        const video = document.getElementById('videoPlayer');
        if (!video) return;

        const currentRate = video.playbackRate;
        const availableRates = this.playbackRates;
        const currentIndex = availableRates.indexOf(currentRate);
        const nextIndex = Math.max(currentIndex - 1, 0);
        
        this.setPlaybackRate(availableRates[nextIndex]);
    }

    // Закладки
    addBookmark(name = '') {
        const video = document.getElementById('videoPlayer');
        if (!video) return;

        const time = video.currentTime;
        
        if (!name) {
            name = `Закладка ${this.bookmarks.length + 1}`;
        }

        const bookmark = {
            id: Date.now(),
            name: name,
            time: time,
            timestamp: this.formatTime(time)
        };

        this.bookmarks.push(bookmark);
        this.saveBookmarks();
        this.updateBookmarksDisplay();
        
        showNotification(`Закладка добавлена: ${bookmark.timestamp}`, 'success');
    }

    removeBookmark(id) {
        this.bookmarks = this.bookmarks.filter(b => b.id !== id);
        this.saveBookmarks();
        this.updateBookmarksDisplay();
    }

    jumpToBookmark(time) {
        const video = document.getElementById('videoPlayer');
        if (!video) return;

        video.currentTime = time;
        video.play().catch(() => {});
        showNotification(`Переход к: ${this.formatTime(time)}`, 'info');
    }

    updateBookmarksDisplay() {
        const container = document.getElementById('bookmarksContainer');
        const list = container?.querySelector('.bookmarks-list');
        if (!container || !list) return;

        if (this.bookmarks.length === 0) {
            container.classList.add('d-none');
            return;
        }

        container.classList.remove('d-none');
        
        list.innerHTML = this.bookmarks.map(bookmark => `
            <div class="bookmark-item d-inline-block me-2 mb-1">
                <button class="btn btn-sm btn-outline-light" 
                        onclick="videoControls.jumpToBookmark(${bookmark.time})"
                        title="${bookmark.name}">
                    ${bookmark.timestamp}
                </button>
                <button class="btn btn-sm btn-outline-danger" 
                        onclick="videoControls.removeBookmark(${bookmark.id})"
                        title="Удалить">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `).join('');
    }

    formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    saveBookmarks() {
        localStorage.setItem('videoBookmarks', JSON.stringify(this.bookmarks));
    }

    loadBookmarks() {
        const saved = localStorage.getItem('videoBookmarks');
        if (saved) {
            this.bookmarks = JSON.parse(saved);
            this.updateBookmarksDisplay();
        }
    }
}

// Глобальные функции для использования в HTML
function videoSeek(seconds) {
    window.videoControls.seek(seconds);
}

function addBookmark() {
    const name = prompt('Название закладки (опционально):', '');
    window.videoControls.addBookmark(name);
}

function setPlaybackRate(rate) {
    window.videoControls.setPlaybackRate(rate);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.videoControls = new VideoControls();
});
