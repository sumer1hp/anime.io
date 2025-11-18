// modules/hybrid-actions-v2.js
class HybridActionsModuleV2 {
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
                this.createHybridActionsV2();
            };
        }
    }

    createHybridActionsV2() {
        const tableBody = document.getElementById('subtitleTableBody');
        if (!tableBody) return;

        tableBody.querySelectorAll('tr[data-index]').forEach(row => {
            this.createHybridButtonsV2(row);
        });
    }

    createHybridButtonsV2(row) {
        const index = parseInt(row.dataset.index);
        const actionsCell = row.querySelector('td:last-child');
        if (!actionsCell) return;

        const buttonsContainer = actionsCell.querySelector('.compact-buttons');
        if (!buttonsContainer) return;

        const buttonsHtml = `
            <!-- Основные кнопки (всегда видны) -->
            <div class="main-actions">
                <button class="btn btn-outline-success compact-btn set-start" data-index="${index}" 
                        title="Установить начало">
                    <i class="bi bi-play-fill"></i>
                </button>
                <button class="btn btn-outline-danger compact-btn set-end" data-index="${index}" 
                        title="Установить конец">
                    <i class="bi bi-stop-fill"></i>
                </button>
                <button class="btn btn-outline-primary compact-btn copy-time-btn" data-index="${index}" 
                        title="Копировать время и текст">
                    <i class="bi bi-copy"></i>
                </button>
            </div>

            <!-- Разделитель (появляется при наведении) -->
            <div class="action-divider"></div>

            <!-- Дополнительные кнопки (появляются при наведении) -->
            <div class="more-actions">
                <button class="btn btn-outline-info compact-btn format-btn" 
                        onclick="showFormattingButtons(${index})"
                        title="Форматирование текста">
                    <i class="bi bi-type-bold"></i>
                </button>
                <button class="btn btn-outline-warning compact-btn position-btn" 
                        onclick="showPositionModal(${index})"
                        title="Позиция текста">
                    <i class="bi bi-arrows-move"></i>
                </button>
                <button class="btn btn-outline-secondary compact-btn layout-btn" 
                        onclick="quickSwitchLayout(${index})"
                        title="Сменить раскладку">
                    <i class="bi bi-translate"></i>
                </button>
                <button class="btn btn-outline-danger compact-btn delete-row" data-index="${index}" 
                        title="Удалить субтитр">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;

        buttonsContainer.innerHTML = buttonsHtml;
        this.attachHandlersV2(buttonsContainer, index);
    }

    attachHandlersV2(container, index) {
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
                gap: 3px;
                align-items: center;
                max-width: 200px;
                transition: all 0.3s ease;
            }

            .main-actions {
                display: flex;
                gap: 3px;
            }

            .action-divider {
                width: 1px;
                height: 20px;
                background: #dee2e6;
                margin: 0 2px;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .more-actions {
                display: flex;
                gap: 3px;
                opacity: 0;
                transform: translateX(-5px);
                transition: all 0.3s ease;
            }

            /* При наведении на строку показываем разделитель и дополнительные кнопки */
            tr:hover .action-divider,
            tr:hover .more-actions {
                opacity: 1;
                transform: translateX(0);
            }

            /* При наведении на контейнер кнопок */
            .compact-buttons:hover .action-divider,
            .compact-buttons:hover .more-actions {
                opacity: 1;
                transform: translateX(0);
            }

            .compact-btn {
                width: 28px;
                height: 26px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.75rem;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .compact-btn:hover {
                transform: scale(1.1);
            }

            /* Адаптивность */
            @media (max-width: 768px) {
                .compact-buttons {
                    max-width: 160px;
                }

                .action-divider,
                .more-actions {
                    opacity: 1 !important;
                    transform: translateX(0) !important;
                }

                .compact-btn {
                    width: 26px;
                    height: 24px;
                }
            }

            @media (max-width: 576px) {
                .compact-buttons {
                    max-width: 140px;
                    gap: 2px;
                }

                .compact-btn {
                    width: 24px;
                    height: 22px;
                    font-size: 0.7rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.hybridActionsModuleV2 = new HybridActionsModuleV2();
});