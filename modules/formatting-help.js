// modules/formatting-help.js
function showFormattingHelp() {
    const modalHTML = `
        <div class="alert alert-info">
            <i class="bi bi-info-circle"></i> Форматирование применяется к каждой строке отдельно
        </div>
        
        <h6>Как использовать:</h6>
        <ul class="small">
            <li>Нажмите кнопку <i class="bi bi-palette text-primary"></i> в строке субтитра</li>
            <li>Выберите нужное форматирование из меню</li>
            <li>Форматирование применяется ко всей строке</li>
            <li>Каждая строка может иметь свое собственное форматирование</li>
        </ul>
        
        <h6 class="mt-3">Поддерживаемые форматы:</h6>
        <div class="row small">
            <div class="col-md-6">
                <strong>Стили:</strong>
                <ul>
                    <li><i class="bi bi-type-bold"></i> <strong>Жирный</strong></li>
                    <li><i class="bi bi-type-italic"></i> <em>Курсив</em></li>
                    <li><i class="bi bi-type-underline"></i> <u>Подчеркнутый</u></li>
                </ul>
            </div>
            <div class="col-md-6">
                <strong>Цвета:</strong>
                <ul>
                    <li><span class="text-danger">●</span> Красный</li>
                    <li><span class="text-success">●</span> Зеленый</li>
                    <li><span class="text-primary">●</span> Синий</li>
                    <li><span class="text-warning">●</span> Желтый</li>
                    <li><span class="text-light">●</span> Белый</li>
                </ul>
            </div>
        </div>
        
        <div class="alert alert-warning mt-3">
            <i class="bi bi-exclamation-triangle"></i> 
            Форматирование сохраняется в форматах ASS и SRT
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.createElement('div'));
    modal._element.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Форматирование субтитров</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">${modalHTML}</div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Понятно</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal._element);
    modal.show();
}