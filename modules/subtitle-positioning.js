// modules/subtitle-position.js
class SubtitlePosition {
    constructor() {
        this.positions = {
            'bottom': { class: '', name: 'Снизу', icon: 'arrow-down' },
            'top': { class: 'pos-top', name: 'Сверху', icon: 'arrow-up' },
            'middle': { class: 'pos-middle', name: 'По центру', icon: 'dash' },
            'top-left': { class: 'pos-top pos-left', name: 'Сверху слева', icon: 'arrow-up-left' },
            'top-right': { class: 'pos-top pos-right', name: 'Сверху справа', icon: 'arrow-up-right' },
            'bottom-left': { class: 'pos-bottom pos-left', name: 'Снизу слева', icon: 'arrow-down-left' },
            'bottom-right': { class: 'pos-bottom pos-right', name: 'Снизу справа', icon: 'arrow-down-right' }
        };
    }

    // Установка позиции для конкретного субтитра
    setPosition(index, position) {
        if (!window.getSubtitleItems) return;
        
        const items = window.getSubtitleItems();
        if (!items[index]) return;

        // Сохраняем позицию в данных субтитра
        items[index].position = position;
        
        // Обновляем отображение если это текущий субтитр
        this.updateCurrentSubtitlePosition();
        
        showAlert(`Позиция установлена: ${this.positions[position]?.name || position}`, 'success');
    }

    // Обновление позиции текущего отображаемого субтитра
    updateCurrentSubtitlePosition() {
        const video = document.getElementById('videoPlayer');
        const overlay = document.getElementById('subtitleOverlay');
        
        if (!video || !overlay) return;
        
        const currentTime = video.currentTime;
        const items = window.getSubtitleItems();
        const current = items.find(item => currentTime >= item.start && currentTime <= item.end);
        
        if (current) {
            this.applyPositionToOverlay(overlay, current.position || 'bottom');
        }
    }

    // Применение позиции к оверлею
    applyPositionToOverlay(overlay, position) {
        // Сбрасываем все классы позиций
        Object.keys(this.positions).forEach(pos => {
            this.positions[pos].class.split(' ').forEach(className => {
                if (className) overlay.classList.remove(className);
            });
        });
        
        // Применяем новые классы
        if (this.positions[position]) {
            this.positions[position].class.split(' ').forEach(className => {
                if (className) overlay.classList.add(className);
            });
        }
    }

    // Получение иконки для позиции
    getPositionIcon(position) {
        return this.positions[position]?.icon || 'text-center';
    }
}

window.subtitlePosition = new SubtitlePosition();

// Глобальные функции
function setSubtitlePosition(index, position) {
    subtitlePosition.setPosition(index, position);
}

function showPositionModal(index) {
    const modalHTML = `
        <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> Выберите позицию для строки ${index + 1}
        </div>
        <div class="text-center">
            <div class="btn-group-vertical w-100">
                ${Object.keys(subtitlePosition.positions).map(pos => `
                    <button type="button" class="btn btn-outline-primary text-start" 
                            onclick="setPositionAndClose(${index}, '${pos}')">
                        <i class="bi bi-${subtitlePosition.getPositionIcon(pos)} me-2"></i>
                        ${subtitlePosition.positions[pos].name}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.createElement('div'));
    modal._element.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Позиция субтитра</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">${modalHTML}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal._element);
    modal.show();
}

function setPositionAndClose(index, position) {
    setSubtitlePosition(index, position);
    bootstrap.Modal.getInstance(document.querySelector('.modal.show'))?.hide();
}

// Обновляем отображение позиции при изменении времени видео
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('videoPlayer');
    if (video) {
        video.addEventListener('timeupdate', () => {
            subtitlePosition.updateCurrentSubtitlePosition();
        });
    }
});