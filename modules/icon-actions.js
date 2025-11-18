// modules/icon-actions.js
class IconActionsModule {
    constructor() {
        this.init();
    }

    init() {
        this.integrateWithEditor();
        this.addStyles();
    }

    integrateWithEditor() {
        const originalRenderTable = window.renderTable;
        if (originalRenderTable) {
            window.renderTable = () => {
                originalRenderTable();
                this.convertToIcons();
            };
        }
    }

    convertToIcons() {
        const tableBody = document.getElementById('subtitleTableBody');
        if (!tableBody) return;

        tableBody.querySelectorAll('tr[data-index]').forEach(row => {
            this.replaceWithIcons(row);
        });
    }

    replaceWithIcons(row) {
        const index = parseInt(row.dataset.index);
        const actionsCell = row.querySelector('td:last-child');
        if (!actionsCell) return;

        const buttonsContainer = actionsCell.querySelector('.compact-buttons');
        if (!buttonsContainer) return;

        const iconButtons = `
            <!-- Установка времени -->
            <button class="btn btn-outline-success compact-btn set-start" data-index="${index}" 
                    title="Установить начало (текущее время видео)">
                <i class="bi bi-play-fill"></i>
            </button>
            <button class="btn btn-outline-danger compact-btn set-end" data-index="${index}" 
                    title="Установить конец (текущее время видео)">
                <i class="bi bi-stop-fill"></i>
            </button>
            
            <!-- Основные действия -->
            <button class="btn btn-outline-primary compact-btn copy-time-btn" data-index="${index}" 
                    title="Копировать время и текст (Ctrl+C)">
                <i class="bi bi-copy"></i>
            </button>
            <button class="btn btn-outline-info compact-btn" 
                    onclick="showFormattingButtons(${index})"
                    title="Форматирование текста">
                <i class="bi bi-type-bold"></i>
            </button>
            
            <!-- Дополнительные действия (появляются при наведении) -->
            <div class="more-actions">
                <button class="btn btn-outline-warning compact-btn" 
                        onclick="showPositionModal(${index})"
                        title="Позиция текста">
                    <i class="bi bi-arrows-move"></i>
                </button>
                <button class="btn btn-outline-success compact-btn switch-layout-btn" 
                        onclick="quickSwitchLayout(${index})"
                        title="Сменить раскладку (ghbdtn -> привет)">
                    <i class="bi bi-translate"></i>
                </button>
                <button class="btn btn-outline-danger compact-btn delete-row" data-index="${index}" 
                        title="Удалить субтитр">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;

        buttonsContainer.innerHTML = iconButtons;
        this.attachHandlers(buttonsContainer, index);
    }

    attachHandlers(container, index) {
        container.querySelector('.set-start')?.addEventListener('click', (e) => {
            this.setTimeFromVideo(index, 'start');
        });

        container.querySelector('.set-end')?.addEventListener('click', (e) => {
            this.setTimeFromVideo(index, 'end');
        });

        container.querySelector('.copy-time-btn')?.addEventListener('click', (e) => {
            if (window.copyTimeModule) {
                window.copyTimeModule.copyTimeAndText(index);
            }
        });

        container.querySelector('.delete-row')?.addEventListener('click', (e) => {
            this.handleDeleteRow(index);
        });
    }

    setTimeFromVideo(index, type) {
        const currentVideo = document.getElementById('videoPlayer');
        if (!currentVideo) {
            alert('Сначала загрузите видео');
            return;
        }

        const currentTime = currentVideo.currentTime;
        const items = window.getSubtitleItems ? window.getSubtitleItems() : [];

        if (items[index]) {
            if (type === 'start') {
                items[index].start = currentTime;
                if (items[index].start > items[index].end) {
                    items[index].end = items[index].start + 3;
                }
            } else {
                items[index].end = currentTime;
                if (items[index].end < items[index].start) {
                    items[index].start = items[index].end - 3;
                }
            }

            window.renderTable();
            window.dispatchEvent(new CustomEvent('subtitlesChanged'));
        }
    }

    handleDeleteRow(index) {
        const items = window.getSubtitleItems ? window.getSubtitleItems() : [];
        if (confirm('Удалить этот субтитр?')) {
            items.splice(index, 1);
            window.autoNumberSubtitles();
            window.renderTable();
            window.dispatchEvent(new CustomEvent('subtitlesChanged'));
        }
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .compact-buttons {
                display: flex;
                gap: 2px;
                flex-wrap: nowrap;
                max-width: 200px;
            }
            
            .more-actions {
                display: none;
                gap: 2px;
            }
            
            .compact-buttons:hover .more-actions {
                display: flex;
            }
            
            .compact-btn {
                width: 28px;
                height: 26px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                transition: all 0.2s ease;
            }
            
            .compact-btn:hover {
                transform: scale(1.1);
            }
            
            /* Адаптивность */
            @media (max-width: 768px) {
                .compact-buttons {
                    max-width: 150px;
                }
                
                .compact-btn {
                    width: 26px;
                    height: 24px;
                    font-size: 0.7rem;
                }
                
                .more-actions {
                    display: flex !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.iconActionsModule = new IconActionsModule();
});