// modules/search-replace.js
class SearchReplace {
    constructor() {
        this.searchHistory = [];
        this.replaceHistory = [];
        this.loadHistory();
    }

    loadHistory() {
        this.searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        this.replaceHistory = JSON.parse(localStorage.getItem('replaceHistory') || '[]');
    }

    saveHistory() {
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
        localStorage.setItem('replaceHistory', JSON.stringify(this.replaceHistory));
    }

    addToHistory(type, value) {
        const history = type === 'search' ? this.searchHistory : this.replaceHistory;
        const index = history.indexOf(value);
        if (index > -1) history.splice(index, 1);
        history.unshift(value);
        if (history.length > 10) history.pop();
        this.saveHistory();
    }

    // Поиск с поддержкой regex
    search(text, pattern, useRegex = false, caseSensitive = false) {
        if (!pattern) return [];
        
        this.addToHistory('search', pattern);
        
        let searchPattern;
        if (useRegex) {
            try {
                searchPattern = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
            } catch (e) {
                showNotification('Ошибка в регулярном выражении: ' + e.message, 'error');
                return [];
            }
        } else {
            searchPattern = new RegExp(this.escapeRegex(pattern), caseSensitive ? 'g' : 'gi');
        }

        const matches = [];
        let match;
        while ((match = searchPattern.exec(text)) !== null) {
            matches.push({
                index: match.index,
                length: match[0].length,
                text: match[0]
            });
        }
        
        return matches;
    }

    // Замена с поддержкой regex
    replace(text, search, replace, useRegex = false, caseSensitive = false) {
        if (!search) return text;
        
        this.addToHistory('search', search);
        this.addToHistory('replace', replace);
        
        let searchPattern;
        if (useRegex) {
            try {
                searchPattern = new RegExp(search, caseSensitive ? 'g' : 'gi');
            } catch (e) {
                showNotification('Ошибка в регулярном выражении: ' + e.message, 'error');
                return text;
            }
        } else {
            searchPattern = new RegExp(this.escapeRegex(search), caseSensitive ? 'g' : 'gi');
        }

        return text.replace(searchPattern, replace);
    }

    // Экранирование спецсимволов для regex
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Поиск по всем субтитрам
    searchInAllSubtitles(pattern, useRegex = false, caseSensitive = false) {
        if (!window.getSubtitleItems) return [];
        
        const items = window.getSubtitleItems();
        const results = [];
        
        items.forEach((item, index) => {
            const matches = this.search(item.text, pattern, useRegex, caseSensitive);
            if (matches.length > 0) {
                results.push({
                    itemIndex: index,
                    subtitle: item,
                    matches: matches
                });
            }
        });
        
        return results;
    }

    // Замена во всех субтитрах
    replaceInAllSubtitles(search, replace, useRegex = false, caseSensitive = false) {
        if (!window.getSubtitleItems) return 0;
        
        const items = window.getSubtitleItems();
        let replaceCount = 0;
        
        items.forEach(item => {
            const original = item.text;
            item.text = this.replace(original, search, replace, useRegex, caseSensitive);
            if (item.text !== original) replaceCount++;
        });
        
        return replaceCount;
    }
}

window.searchReplace = new SearchReplace();

// UI функции
function showSearchReplaceModal() {
    const modalHTML = `
        <div class="row">
            <div class="col-md-6">
                <label class="form-label">Поиск:</label>
                <input type="text" id="searchPattern" class="form-control" list="searchHistory">
                <datalist id="searchHistory">
                    ${searchReplace.searchHistory.map(item => `<option value="${item}">`).join('')}
                </datalist>
            </div>
            <div class="col-md-6">
                <label class="form-label">Замена:</label>
                <input type="text" id="replacePattern" class="form-control" list="replaceHistory">
                <datalist id="replaceHistory">
                    ${searchReplace.replaceHistory.map(item => `<option value="${item}">`).join('')}
                </datalist>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-md-6">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="useRegex">
                    <label class="form-check-label" for="useRegex">Регулярные выражения</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="caseSensitive">
                    <label class="form-check-label" for="caseSensitive">Учитывать регистр</label>
                </div>
            </div>
            <div class="col-md-6">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="replaceAll" checked>
                    <label class="form-check-label" for="replaceAll">Заменить во всех субтитрах</label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="previewMode">
                    <label class="form-check-label" for="previewMode">Предпросмотр перед заменой</label>
                </div>
            </div>
        </div>
        
        <div class="mt-3" id="searchResults" style="display: none;">
            <h6>Результаты поиска:</h6>
            <div id="resultsList" class="small"></div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('searchReplaceModal'));
    const modalBody = document.getElementById('searchReplaceModal').querySelector('.modal-body');
    modalBody.innerHTML = modalHTML;
    
    const footer = `
        <button type="button" class="btn btn-secondary" onclick="performSearch()">Найти</button>
        <button type="button" class="btn btn-warning" onclick="performReplace()">Заменить</button>
        <button type="button" class="btn btn-primary" onclick="performReplaceAll()">Заменить все</button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Закрыть</button>
    `;
    
    document.getElementById('searchReplaceModal').querySelector('.modal-footer')?.remove();
    document.getElementById('searchReplaceModal').querySelector('.modal-content').innerHTML += `<div class="modal-footer">${footer}</div>`;
    
    modal.show();
}

function performSearch() {
    const pattern = document.getElementById('searchPattern').value;
    const useRegex = document.getElementById('useRegex').checked;
    const caseSensitive = document.getElementById('caseSensitive').checked;
    
    if (!pattern) {
        showNotification('Введите текст для поиска', 'warning');
        return;
    }
    
    const results = searchReplace.searchInAllSubtitles(pattern, useRegex, caseSensitive);
    displaySearchResults(results);
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    const list = document.getElementById('resultsList');
    
    if (results.length === 0) {
        list.innerHTML = '<div class="text-muted">Совпадений не найдено</div>';
        container.style.display = 'block';
        return;
    }
    
    list.innerHTML = results.map(result => `
        <div class="border-bottom pb-2 mb-2">
            <strong>Субтитр ${result.subtitle.id}:</strong> 
            ${result.subtitle.text.substring(0, 100)}...
            <br><small class="text-muted">${result.matches.length} совпадений</small>
            <button class="btn btn-sm btn-outline-primary ms-2" onclick="goToSubtitle(${result.itemIndex})">
                Перейти
            </button>
        </div>
    `).join('');
    
    container.style.display = 'block';
}

function goToSubtitle(index) {
    const row = document.querySelector(`#subtitleTable tr[data-index="${index}"]`);
    if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('table-info');
        setTimeout(() => row.classList.remove('table-info'), 2000);
    }
    bootstrap.Modal.getInstance(document.getElementById('searchReplaceModal')).hide();
}

function performReplace() {
    // Замена в текущем поле или выбранном тексте
    showNotification('Функция замены в разработке', 'info');
}

function performReplaceAll() {
    const search = document.getElementById('searchPattern').value;
    const replace = document.getElementById('replacePattern').value;
    const useRegex = document.getElementById('useRegex').checked;
    const caseSensitive = document.getElementById('caseSensitive').checked;
    
    if (!search) {
        showNotification('Введите текст для поиска', 'warning');
        return;
    }
    
    const count = searchReplace.replaceInAllSubtitles(search, replace, useRegex, caseSensitive);
    
    if (count > 0) {
        if (window.renderTable) renderTable();
        window.dispatchEvent(new CustomEvent('subtitlesChanged'));
        showNotification(`Заменено ${count} совпадений`, 'success');
    } else {
        showNotification('Совпадений для замены не найдено', 'info');
    }
    
    bootstrap.Modal.getInstance(document.getElementById('searchReplaceModal')).hide();
}
