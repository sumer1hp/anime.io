// modules/copy-time.js
class CopyTimeModule {
    constructor() {
        this.init();
    }

    init() {
        this.setupCopyButtons();
        this.setupGlobalHotkeys();
        this.integrateWithEditor();
    }

    integrateWithEditor() {
        // Перехватываем функцию renderTable для добавления наших кнопок
        const originalRenderTable = window.renderTable;
        if (originalRenderTable) {
            window.renderTable = () => {
                originalRenderTable();
                this.injectCopyButtons();
            };
        }
    }

    setupCopyButtons() {
        document.addEventListener('DOMContentLoaded', () => {
            // Ждем немного для инициализации редактора
            setTimeout(() => {
                this.injectCopyButtons();
            }, 1000);
        });
    }

    injectCopyButtons() {
        const tableBody = document.getElementById('subtitleTableBody');
        if (!tableBody) return;

        tableBody.querySelectorAll('tr[data-index]').forEach(row => {
            this.addCopyButtonToRow(row);
        });
    }

    addCopyButtonToRow(row) {
        const index = parseInt(row.dataset.index);
        const actionsCell = row.querySelector('td:last-child');
        if (!actionsCell) return;

        // Удаляем старую кнопку если есть
        const oldBtn = actionsCell.querySelector('.copy-time-btn');
        if (oldBtn) oldBtn.remove();

        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'btn btn-outline-secondary compact-btn copy-time-btn';
        copyBtn.title = 'Копировать время и текст (Ctrl+C)';
        copyBtn.innerHTML = '<i class="bi bi-copy"></i>';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            this.copyTimeAndText(index);
        };

        const buttonsContainer = actionsCell.querySelector('.compact-buttons');
        if (buttonsContainer) {
            // Вставляем перед кнопкой удаления
            const deleteBtn = buttonsContainer.querySelector('.delete-row');
            if (deleteBtn) {
                buttonsContainer.insertBefore(copyBtn, deleteBtn);
            } else {
                buttonsContainer.appendChild(copyBtn);
            }
        }
    }

    copyTimeAndText(index) {
        const items = window.getSubtitleItems ? window.getSubtitleItems() : [];
        if (!items[index]) return;

        const item = items[index];
        const startTime = this.secondsToTimeFormat(item.start);
        const endTime = this.secondsToTimeFormat(item.end);
        const text = item.text;
        
        const speaker = item.speaker ? `${item.speaker}: ` : '';
        const fullText = `${speaker}${text}`;

        const copyText = `${startTime} --> ${endTime}\n${fullText}`;
        
        this.copyToClipboard(copyText);
        this.showCopyNotification(`Скопировано: ${startTime} - ${endTime}`);
    }

    secondsToTimeFormat(seconds) {
        if (isNaN(seconds) || seconds < 0) return '00:00:00,000';
        
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }

    copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).catch(err => {
                console.error('Ошибка копирования:', err);
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Ошибка копирования:', err);
        }
        
        document.body.removeChild(textArea);
    }

    showCopyNotification(message) {
        if (window.showAlert) {
            window.showAlert(message, 'success');
        } else {
            const notification = document.createElement('div');
            notification.className = 'alert alert-success position-fixed';
            notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
            notification.innerHTML = `
                <div class="d-flex align-items-center">
                    <div>${message}</div>
                    <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 2000);
        }
    }

    setupGlobalHotkeys() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                const selectedRow = document.querySelector('#subtitleTable tr.table-warning');
                if (selectedRow) {
                    const index = parseInt(selectedRow.dataset.index);
                    if (!isNaN(index)) {
                        e.preventDefault();
                        this.copyTimeAndText(index);
                    }
                }
            }
        });
    }
}

// Инициализация модуля
document.addEventListener('DOMContentLoaded', () => {
    window.copyTimeModule = new CopyTimeModule();
});