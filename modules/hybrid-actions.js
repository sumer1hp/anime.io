// modules/gear-actions.js
class GearActionsModule {
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
                this.createGearActions();
            };
        }
    }

    createGearActions() {
        const tableBody = document.getElementById('subtitleTableBody');
        if (!tableBody) return;

        tableBody.querySelectorAll('tr[data-index]').forEach(row => {
            this.createGearButtons(row);
        });
    }

    createGearButtons(row) {
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

            <!-- Шестерёнка с выпадающими действиями -->
            <div class="gear-container">
                <button class="btn btn-outline-secondary compact-btn gear-btn" 
                        title="Дополнительные действия">
                    <i class="bi bi-gear"></i>
                </button>
                
                <!-- Выпадающие кнопки -->
                <div class="gear-dropdown">
                    <button class="btn btn-outline-info compact-btn" 
                            onclick="showFormattingButtons(${index})"
                            title="Форматирование текста">
                        <i class="bi bi-type-bold"></i>
                        <span>Форматирование</span>
                    </button>
                    <button class="btn btn-outline-warning compact-btn" 
                            onclick="showPositionModal(${index})"
                            title="Позиция текста">
                        <i class="bi bi-arrows-move"></i>
                        <span>Позиция</span>
                    </button>
                    <button class="btn btn-outline-success compact-btn" 
                            onclick="quickSwitchLayout(${index})"
                            title="Сменить раскладку">
                        <i class="bi bi-translate"></i>
                        <span>Раскладка</span>
                    </button>
                    <button class="btn btn-outline-danger compact-btn delete-row" data-index="${index}" 
                            title="Удалить субтитр">
                        <i class="bi bi-trash"></i>
                        <span>Удалить</span>
                    </button>
                </div>
            </div>
        `;

        buttonsContainer.innerHTML = buttonsHtml;
        this.attachHandlers(buttonsContainer, index);
    }

    attachHandlers(container, index) {
        // Основные кнопки
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
            e.preventDefault();
            this.handleDeleteRow(index);
        });

        // Шестерёнка - показываем/скрываем dropdown
        const gearBtn = container.querySelector('.gear-btn');
        const gearDropdown = container.querySelector('.gear-dropdown');

        gearBtn?.addEventListener('mouseenter', () => {
            gearDropdown.style.display = 'flex';
        });

        gearBtn?.addEventListener('mouseleave', (e) => {
            // Не скрываем сразу, даем время для перехода на dropdown
            setTimeout(() => {
                if (!gearDropdown.matches(':hover')) {
                    gearDropdown.style.display = 'none';
                }
            }, 100);
        });

        gearDropdown?.addEventListener('mouseleave', () => {
            gearDropdown.style.display = 'none';
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
                position: relative;
            }

            .main-actions {
                display: flex;
                gap: 3px;
            }

            /* Контейнер для шестерёнки */
            .gear-container {
                position: relative;
                display: flex;
                align-items: center;
            }

            /* Кнопка шестерёнки */
            .gear-btn {
                width: 28px;
                height: 26px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .gear-btn:hover {
                background-color: #6c757d;
                color: white;
                transform: rotate(90deg);
            }

            /* Выпадающее меню шестерёнки */
            .gear-dropdown {
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                padding: 4px;
                gap: 2px;
                flex-direction: column;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                min-width: 140px;
                animation: dropdownAppear 0.2s ease;
            }

            @keyframes dropdownAppear {
                from {
                    opacity: 0;
                    transform: translateY(-5px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Кнопки в выпадающем меню */
            .gear-dropdown .compact-btn {
                width: 100%;
                height: 28px;
                padding: 0 8px;
                justify-content: flex-start;
                font-size: 0.75rem;
                border: none;
                border-radius: 3px;
                text-align: left;
            }

            .gear-dropdown .compact-btn span {
                margin-left: 6px;
                font-size: 0.7rem;
            }

            .gear-dropdown .compact-btn:hover {
                transform: none;
                background-color: #f8f9fa;
            }

            /* Основные компактные кнопки */
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

            /* Цвета кнопок */
            .btn-outline-success { border-color: #198754; color: #198754; }
            .btn-outline-success:hover { background-color: #198754; color: white; }

            .btn-outline-danger { border-color: #dc3545; color: #dc3545; }
            .btn-outline-danger:hover { background-color: #dc3545; color: white; }

            .btn-outline-primary { border-color: #0d6efd; color: #0d6efd; }
            .btn-outline-primary:hover { background-color: #0d6efd; color: white; }

            .btn-outline-info { border-color: #0dcaf0; color: #0dcaf0; }
            .btn-outline-info:hover { background-color: #0dcaf0; color: white; }

            .btn-outline-warning { border-color: #ffc107; color: #ffc107; }
            .btn-outline-warning:hover { background-color: #ffc107; color: black; }

            .btn-outline-secondary { border-color: #6c757d; color: #6c757d; }
            .btn-outline-secondary:hover { background-color: #6c757d; color: white; }

            /* Адаптивность */
            @media (max-width: 768px) {
                .compact-buttons {
                    max-width: 160px;
                    gap: 2px;
                }

                .compact-btn {
                    width: 26px;
                    height: 24px;
                    font-size: 0.7rem;
                }

                .gear-dropdown {
                    right: auto;
                    left: 0;
                    min-width: 130px;
                }

                .gear-dropdown .compact-btn {
                    height: 26px;
                    font-size: 0.7rem;
                }
            }

            @media (max-width: 576px) {
                .compact-buttons {
                    max-width: 140px;
                }

                .compact-btn {
                    width: 24px;
                    height: 22px;
                }

                .gear-dropdown {
                    min-width: 120px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.gearActionsModule = new GearActionsModule();
});