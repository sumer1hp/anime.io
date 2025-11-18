// modules/compact-actions.js
class CompactActionsModule {
    constructor() {
        this.init();
    }

    init() {
        this.integrateWithEditor();
    }

    integrateWithEditor() {
        const originalRenderTable = window.renderTable;
        if (originalRenderTable) {
            window.renderTable = () => {
                originalRenderTable();
                this.convertToDropdown();
            };
        }
    }

    convertToDropdown() {
        const tableBody = document.getElementById('subtitleTableBody');
        if (!tableBody) return;

        tableBody.querySelectorAll('tr[data-index]').forEach(row => {
            this.createDropdownForRow(row);
        });
    }

    createDropdownForRow(row) {
        const index = parseInt(row.dataset.index);
        const actionsCell = row.querySelector('td:last-child');
        if (!actionsCell) return;

        // Сохраняем старые кнопки если есть
        const oldButtons = actionsCell.querySelector('.compact-buttons');
        if (!oldButtons) return;

        // Создаем выпадающее меню
        const dropdownHtml = `
            <div class="dropdown">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle compact-dropdown-btn" 
                        type="button" data-bs-toggle="dropdown" 
                        title="Действия с субтитром">
                    <i class="bi bi-gear"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item set-start" href="#" data-index="${index}">
                        <i class="bi bi-play-fill text-success"></i> Установить начало
                    </a></li>
                    <li><a class="dropdown-item set-end" href="#" data-index="${index}">
                        <i class="bi bi-stop-fill text-danger"></i> Установить конец
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item copy-time-btn" href="#" data-index="${index}">
                        <i class="bi bi-copy text-primary"></i> Копировать время и текст
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="showFormattingButtons(${index})">
                        <i class="bi bi-type-bold text-info"></i> Форматирование
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="showPositionModal(${index})">
                        <i class="bi bi-arrows-move text-warning"></i> Позиция текста
                    </a></li>
                    <li><a class="dropdown-item" href="#" onclick="quickSwitchLayout(${index})">
                        <i class="bi bi-translate text-success"></i> Сменить раскладку
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item delete-row text-danger" href="#" data-index="${index}">
                        <i class="bi bi-trash"></i> Удалить
                    </a></li>
                </ul>
            </div>
        `;

        // Заменяем старые кнопки на dropdown
        oldButtons.innerHTML = dropdownHtml;

        // Назначаем обработчики
        this.attachDropdownHandlers(actionsCell, index);
    }

    attachDropdownHandlers(actionsCell, index) {
        // Обработчики для dropdown элементов
        actionsCell.querySelector('.set-start')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.setTimeFromVideo(index, 'start');
        });

        actionsCell.querySelector('.set-end')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.setTimeFromVideo(index, 'end');
        });

        actionsCell.querySelector('.copy-time-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.copyTimeModule) {
                window.copyTimeModule.copyTimeAndText(index);
            }
        });

        actionsCell.querySelector('.delete-row')?.addEventListener('click', (e) => {
            e.preventDefault();
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
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.compactActionsModule = new CompactActionsModule();
});