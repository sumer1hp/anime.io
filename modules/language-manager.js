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
        const select = document.getElementById('languageSelect');
        if (select) {
            select.addEventListener('change', (e) => {
                this.applyLanguage(e.target.value);
            });
        }
    }

    applyLanguage(langCode) {
        if (!this.languages[langCode]) return;
        
        this.currentLanguage = langCode;
        localStorage.setItem('subtitleEditorLanguage', langCode);
        
        const lang = this.languages[langCode];
        this.updateInterface(lang);
        
        // Обновляем выпадающий список
        const select = document.getElementById('languageSelect');
        if (select) select.value = langCode;
        
        // Используем showAlert из editor.js
        if (window.showAlert) {
            window.showAlert(`Язык: ${lang.name}`, 'info');
        } else {
            console.log(`Language changed to: ${lang.name}`);
        }
    }

    updateInterface(lang) {
        // Обновляем заголовки
        this.updateText('[data-i18n]', lang);
        
        // Обновляем атрибуты title и placeholder
        this.updateAttributes('[title]', 'title', lang);
        this.updateAttributes('[placeholder]', 'placeholder', lang);
    }

    updateText(selector, lang) {
        document.querySelectorAll(selector).forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key && lang.strings[key]) {
                element.textContent = lang.strings[key];
            }
        });
    }

    updateAttributes(selector, attribute, lang) {
        document.querySelectorAll(selector).forEach(element => {
            const key = element.getAttribute(`data-i18n-${attribute}`);
            if (key && lang.strings[key]) {
                element.setAttribute(attribute, lang.strings[key]);
            }
        });
    }

    translate(key) {
        const lang = this.languages[this.currentLanguage];
        return lang.strings[key] || key;
    }

    getAvailableLanguages() {
        return Object.keys(this.languages).map(code => ({
            code: code,
            name: this.languages[code].name
        }));
    }
}

// Глобальные функции
function t(key) {
    return window.languageManager?.translate(key) || key;
}

function changeLanguage(langCode) {
    window.languageManager?.applyLanguage(langCode);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});
