// modules/horizontal-scroll-actions.js
class HorizontalScrollActions {
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
                this.optimizeActionCells();
            };
        }
    }

    optimizeActionCells() {
        const table = document.getElementById('subtitleTable');
        if (!table) return;

        // Уменьшаем ширину колонки действий
        const actionHeader = table.querySelector('th:last-child');
        if (actionHeader) {
            actionHeader.style.width = '180px';
        }

        const tableBody = document.getElementById('subtitleTableBody');
        if (!tableBody) return;

        tableBody.querySelectorAll('tr[data-index]').forEach(row => {
            this.optimizeActionButtons(row);
        });
    }

    optimizeActionButtons(row) {
        const actionsCell = row.querySelector('td:last-child');
        if (!actionsCell) return;

        const buttonsContainer = actionsCell.querySelector('.compact-buttons');
        if (!buttonsContainer) return;

        // Добавляем горизонтальный скролл если нужно
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.flexWrap = 'nowrap';
        buttonsContainer.style.overflowX = 'auto';
        buttonsContainer.style.gap = '2px';
        buttonsContainer.style.padding = '2px';
        buttonsContainer.style.maxWidth = '180px';

        // Оптимизируем кнопки
        buttonsContainer.querySelectorAll('.compact-btn').forEach(btn => {
            btn.style.minWidth = '28px';
            btn.style.height = '26px';
            btn.style.padding = '2px 4px';
            btn.style.fontSize = '0.75rem';
            
            // Оставляем только иконки, убираем текст если есть
            const text = btn.textContent;
            if (text && text.trim() && !btn.querySelector('i')) {
                btn.title = text.trim();
                btn.innerHTML = text.charAt(0);
            }
        });
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .compact-buttons::-webkit-scrollbar {
                height: 3px;
            }
            .compact-buttons::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 2px;
            }
            .compact-buttons::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 2px;
            }
            .compact-buttons::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
        `;
        document.head.appendChild(style);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.horizontalScrollActions = new HorizontalScrollActions();
});