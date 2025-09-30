// modules/language-manager.js
class LanguageManager {
    constructor() {
        this.languages = {
            ru: {
                name: 'Русский',
                strings: {
                    // Общие
                    'appTitle': 'Редактор субтитров PRO',
                    'loadVideo': 'Загрузить видео',
                    'loadSubtitles': 'Загрузить субтитры',
                    'addSubtitle': 'Добавить субтитр',
                    'export': 'Экспорт',
                    
                    // Таблица
                    'number': '№',
                    'start': 'Начало',
                    'end': 'Конец',
                    'duration': 'Длит.',
                    'speaker': 'Говорящий',
                    'text': 'Текст',
                    'actions': 'Действия',
                    
                    // Кнопки
                    'searchReplace': 'Поиск/Замена',
                    'timeShift': 'Сдвиг времени',
                    'spellCheck': 'Коррекция',
                    'transliterate': 'Транслитерация',
                    'history': 'История',
                    
                    // Уведомления
                    'changesSaved': 'Изменения сохранены',
                    'subtitleAdded': 'Субтитр добавлен',
                    'subtitleDeleted': 'Субтитр удален'
                }
            },
            en: {
                name: 'English',
                strings: {
                    // Common
                    'appTitle': 'Subtitle Editor PRO',
                    'loadVideo': 'Load Video',
                    'loadSubtitles': 'Load Subtitles',
                    'addSubtitle': 'Add Subtitle',
                    'export': 'Export',
                    
                    // Table
                    'number': '#',
                    'start': 'Start',
                    'end': 'End',
                    'duration': 'Dur.',
                    'speaker': 'Speaker',
                    'text': 'Text',
                    'actions': 'Actions',
                    
                    // Buttons
                    'searchReplace': 'Search/Replace',
                    'timeShift': 'Time Shift',
                    'spellCheck': 'Spell Check',
                    'transliterate': 'Transliterate',
                    'history': 'History',
                    
                    // Notifications
                    'changesSaved': 'Changes saved',
                    'subtitleAdded': 'Subtitle added',
                    'subtitleDeleted': 'Subtitle deleted'
                }
            },
            es: {
                name: 'Español',
                strings: {
                    // Common
                    'appTitle': 'Editor de Subtítulos PRO',
                    'loadVideo': 'Cargar Video',
                    'loadSubtitles': 'Cargar Subtítulos',
                    'addSubtitle': 'Añadir Subtítulo',
                    'export': 'Exportar',
                    
                    // Table
                    'number': '#',
                    'start': 'Inicio',
                    'end': 'Fin',
                    'duration': 'Dura.',
                    'speaker': 'Hablando',
                    'text': 'Texto',
                    'actions': 'Acciones',
                    
                    // Buttons
                    'searchReplace': 'Buscar/Reemplazar',
                    'timeShift': 'Cambiar Tiempo',
                    'spellCheck': 'Corrección',
                    'transliterate': 'Transliterar',
                    'history': 'Historial',
                    
                    // Notifications
                    'changesSaved': 'Cambios guardados',
                    'subtitleAdded': 'Subtítulo añadido',
                    'subtitleDeleted': 'Subtítulo eliminado'
                }
            }
        };
        
        this.currentLanguage = localStorage.getItem('subtitleEditorLanguage') || 'ru';
        this.init();
    }

    init() {
        this.applyLanguage(this.currentLanguage);
        this.setupEventListeners();
    }

    setupEventListeners() {
        var select = document.getElementById('languageSelect');
        if (select) {
            select.addEventListener('change', function(e) {
                this.applyLanguage(e.target.value);
            }.bind(this));
        }
    }

    applyLanguage(langCode) {
        if (!this.languages[langCode]) {
            console.log('Language not found:', langCode);
            return;
        }
        
        console.log('Applying language:', langCode);
        this.currentLanguage = langCode;
        localStorage.setItem('subtitleEditorLanguage', langCode);
        
        var lang = this.languages[langCode];
        this.updateInterface(lang);
        
        // Обновляем выпадающий список
        var select = document.getElementById('languageSelect');
        if (select) {
            select.value = langCode;
        }
        
        // Используем showAlert из editor.js
        if (window.showAlert) {
            window.showAlert('Язык: ' + lang.name, 'info');
        } else {
            console.log('Language changed to: ' + lang.name);
        }
    }

    updateInterface(lang) {
        console.log('Updating interface for language:', lang.name);
        
        // Обновляем заголовки
        this.updateText('[data-i18n]', lang);
        
        // Обновляем атрибуты title и placeholder
        this.updateAttributes('[data-i18n-title]', 'title', lang);
        this.updateAttributes('[data-i18n-placeholder]', 'placeholder', lang);
        
        // Обновляем статические тексты
        this.updateStaticTexts(lang);
    }

    updateText(selector, lang) {
        var elements = document.querySelectorAll(selector);
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var key = element.getAttribute('data-i18n');
            if (key && lang.strings[key]) {
                element.textContent = lang.strings[key];
                console.log('Updated text:', key, '->', lang.strings[key]);
            }
        }
    }

    updateAttributes(selector, attribute, lang) {
        var elements = document.querySelectorAll(selector);
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var key = element.getAttribute('data-i18n-' + attribute);
            if (key && lang.strings[key]) {
                element.setAttribute(attribute, lang.strings[key]);
                console.log('Updated attribute:', attribute, key, '->', lang.strings[key]);
            }
        }
    }

    updateStaticTexts(lang) {
        // Обновляем основные элементы интерфейса
        var elementsToUpdate = {
            // Заголовки
            'h4': 'appTitle',
            
            // Labels
            '[for="videoFile"]': 'loadVideo',
            '[for="subtitleFile"]': 'loadSubtitles',
            
            // Кнопки
            '#addSubtitleRow': 'addSubtitle',
            '#autoNumber': 'autoNumber',
            '#sortByTime': 'sortByTime',
            '#importText': 'importText',
            '#exportSrt': 'export',
            '#exportAss': 'export'
        };

        for (var selector in elementsToUpdate) {
            if (elementsToUpdate.hasOwnProperty(selector)) {
                var key = elementsToUpdate[selector];
                var element = document.querySelector(selector);
                if (element && lang.strings[key]) {
                    // Для кнопок обновляем текст, сохраняя иконки
                    if (element.tagName === 'BUTTON') {
                        var icon = element.querySelector('i');
                        if (icon) {
                            element.innerHTML = icon.outerHTML + ' ' + lang.strings[key];
                        } else {
                            element.textContent = lang.strings[key];
                        }
                    } else {
                        element.textContent = lang.strings[key];
                    }
                    console.log('Updated static text:', selector, '->', lang.strings[key]);
                }
            }
        }

        // Обновляем заголовки таблицы
        this.updateTableHeaders(lang);
    }

    updateTableHeaders(lang) {
        var headers = document.querySelectorAll('#subtitleTable th');
        var headerKeys = ['number', 'start', 'end', 'duration', 'speaker', 'text', 'actions'];
        
        for (var i = 0; i < headers.length && i < headerKeys.length; i++) {
            var key = headerKeys[i];
            if (lang.strings[key]) {
                headers[i].textContent = lang.strings[key];
            }
        }
    }

    translate(key) {
        var lang = this.languages[this.currentLanguage];
        return lang.strings[key] || key;
    }

    getAvailableLanguages() {
        var result = [];
        for (var code in this.languages) {
            if (this.languages.hasOwnProperty(code)) {
                result.push({
                    code: code,
                    name: this.languages[code].name
                });
            }
        }
        return result;
    }
}

// Глобальные функции
function t(key) {
    return window.languageManager ? window.languageManager.translate(key) : key;
}

function changeLanguage(langCode) {
    if (window.languageManager) {
        window.languageManager.applyLanguage(langCode);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    window.languageManager = new LanguageManager();
});
