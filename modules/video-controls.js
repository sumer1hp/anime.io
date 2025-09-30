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
        var playbackRateSelect = document.getElementById('playbackRate');
        if (playbackRateSelect) {
            playbackRateSelect.addEventListener('change', function(e) {
                this.setPlaybackRate(parseFloat(e.target.value));
            }.bind(this));
        }

        // Автосохранение закладок
        setInterval(function() {
            this.saveBookmarks();
        }.bind(this), 10000);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Пропускаем если фокус в поле ввода
            if (this.isInputFocused()) return;

            var video = document.getElementById('videoPlayer');
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
        }.bind(this));
    }

    isInputFocused() {
        var active = document.activeElement;
        return active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable;
    }

    // Навигация по времени
    seek(seconds) {
        var video = document.getElementById('videoPlayer');
        if (!video) return;

        video.currentTime = Math.max(0, video.currentTime + seconds);
        if (window.showAlert) {
            var message = 'Перемотка: ' + (seconds > 0 ? '+' : '') + seconds + 'сек';
            window.showAlert(message, 'info');
        }
    }

    togglePlayPause() {
        var video = document.getElementById('videoPlayer');
        if (!video) return;

        if (video.paused) {
            video.play();
            if (window.showAlert) window.showAlert('Воспроизведение', 'info');
        } else {
            video.pause();
            if (window.showAlert) window.showAlert('Пауза', 'info');
        }
    }

    // Скорость воспроизведения
    setPlaybackRate(rate) {
        var video = document.getElementById('videoPlayer');
        if (!video) return;

        video.playbackRate = rate;
        if (window.showAlert) window.showAlert('Скорость: ' + rate + 'x', 'info');
    }

    increaseSpeed() {
        var video = document.getElementById('videoPlayer');
        if (!video) return;

        var currentRate = video.playbackRate;
        var availableRates = this.playbackRates;
        var currentIndex = availableRates.indexOf(currentRate);
        var nextIndex = Math.min(currentIndex + 1, availableRates.length - 1);
        
        this.setPlaybackRate(availableRates[nextIndex]);
    }

    decreaseSpeed() {
        var video = document.getElementById('videoPlayer');
        if (!video) return;

        var currentRate = video.playbackRate;
        var availableRates = this.playbackRates;
        var currentIndex = availableRates.indexOf(currentRate);
        var nextIndex = Math.max(currentIndex - 1, 0);
        
        this.setPlaybackRate(availableRates[nextIndex]);
    }

    // Закладки
    addBookmark(name) {
        var video = document.getElementById('videoPlayer');
        if (!video) return;

        var time = video.currentTime;
        
        if (!name) {
            name = 'Закладка ' + (this.bookmarks.length + 1);
        }

        var bookmark = {
            id: Date.now(),
            name: name,
            time: time,
            timestamp: this.formatTime(time)
        };

        this.bookmarks.push(bookmark);
        this.saveBookmarks();
        this.updateBookmarksDisplay();
        
        if (window.showAlert) {
            window.showAlert('Закладка добавлена: ' + bookmark.timestamp, 'success');
        }
    }

    removeBookmark(id) {
        this.bookmarks = this.bookmarks.filter(function(b) {
            return b.id !== id;
        });
        this.saveBookmarks();
        this.updateBookmarksDisplay();
    }

    jumpToBookmark(time) {
        var video = document.getElementById('videoPlayer');
        if (!video) return;

        video.currentTime = time;
        video.play().catch(function() {});
        if (window.showAlert) window.showAlert('Переход к: ' + this.formatTime(time), 'info');
    }

    updateBookmarksDisplay() {
        var container = document.getElementById('bookmarksContainer');
        var list = container ? container.querySelector('.bookmarks-list') : null;
        if (!container || !list) return;

        if (this.bookmarks.length === 0) {
            container.classList.add('d-none');
            return;
        }

        container.classList.remove('d-none');
        
        var bookmarksHTML = '';
        for (var i = 0; i < this.bookmarks.length; i++) {
            var bookmark = this.bookmarks[i];
            bookmarksHTML += 
                '<div class="bookmark-item d-inline-block me-2 mb-1">' +
                    '<button class="btn btn-sm btn-outline-light" ' +
                            'onclick="videoControls.jumpToBookmark(' + bookmark.time + ')" ' +
                            'title="' + bookmark.name + '">' +
                        bookmark.timestamp +
                    '</button>' +
                    '<button class="btn btn-sm btn-outline-danger" ' +
                            'onclick="videoControls.removeBookmark(' + bookmark.id + ')" ' +
                            'title="Удалить">' +
                        '<i class="bi bi-x"></i>' +
                    '</button>' +
                '</div>';
        }
        
        list.innerHTML = bookmarksHTML;
    }

    formatTime(seconds) {
        var h = Math.floor(seconds / 3600);
        var m = Math.floor((seconds % 3600) / 60);
        var s = Math.floor(seconds % 60);
        return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
    }

    saveBookmarks() {
        localStorage.setItem('videoBookmarks', JSON.stringify(this.bookmarks));
    }

    loadBookmarks() {
        var saved = localStorage.getItem('videoBookmarks');
        if (saved) {
            this.bookmarks = JSON.parse(saved);
            this.updateBookmarksDisplay();
        }
    }
}

// Глобальные функции для использования в HTML
function videoSeek(seconds) {
    if (window.videoControls) {
        window.videoControls.seek(seconds);
    }
}

function addBookmark() {
    var name = prompt('Название закладки (опционально):', '');
    if (window.videoControls) {
        window.videoControls.addBookmark(name);
    }
}

function setPlaybackRate(rate) {
    if (window.videoControls) {
        window.videoControls.setPlaybackRate(rate);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    window.videoControls = new VideoControls();
});
