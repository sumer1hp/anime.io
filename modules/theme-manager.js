// modules/theme-manager.js
class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'auto'];
        this.currentTheme = localStorage.getItem('subtitleEditorTheme') || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Кнопка переключения темы
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Слушатель изменения системной темы
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });
        }
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    applyTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('subtitleEditorTheme', theme);

        const actualTheme = theme === 'auto' ? this.getSystemTheme() : theme;
        document.body.setAttribute('data-theme', actualTheme);
        document.documentElement.setAttribute('data-bs-theme', actualTheme);

        this.updateThemeButton();
        this.applyCustomStyles(actualTheme);
    }

    applyCustomStyles(theme) {
        // Удаляем старые стили
        const oldStyle = document.getElementById('dynamic-theme-styles');
        if (oldStyle) oldStyle.remove();

        if (theme === 'dark') {
            const style = document.createElement('style');
            style.id = 'dynamic-theme-styles';
            style.textContent = `
                [data-theme="dark"] {
                    --bs-body-bg: #1a1a1a;
                    --bs-body-color: #e9ecef;
                }
                [data-theme="dark"] .table-wrapper {
                    background: #2d2d2d;
                    border-color: #444;
                }
                [data-theme="dark"] .table {
                    --bs-table-bg: #2d2d2d;
                    --bs-table-color: #e9ecef;
                    --bs-table-border-color: #444;
                }
                [data-theme="dark"] .table-light {
                    --bs-table-bg: #3d3d3d;
                    --bs-table-color: #e9ecef;
                }
                [data-theme="dark"] .form-control {
                    background-color: #2d2d2d;
                    border-color: #555;
                    color: #e9ecef;
                }
                [data-theme="dark"] .form-control:focus {
                    background-color: #3d3d3d;
                    border-color: #0d6efd;
                    color: #e9ecef;
                }
                [data-theme="dark"] .alert-light {
                    background-color: #3d3d3d;
                    color: #e9ecef;
                    border-color: #555;
                }
            `;
            document.head.appendChild(style);
        }
    }

    toggleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.applyTheme(this.themes[nextIndex]);
        
        const themeNames = { light: 'Светлая', dark: 'Темная', auto: 'Авто' };
        showNotification(`Тема: ${themeNames[this.themes[nextIndex]]}`, 'info');
    }

    updateThemeButton() {
        const button = document.getElementById('themeToggle');
        if (!button) return;

        const icons = { light: 'bi-sun', dark: 'bi-moon', auto: 'bi-circle-half' };
        const texts = { light: 'Светлая', dark: 'Темная', auto: 'Авто' };
        
        button.innerHTML = `<i class="bi ${icons[this.currentTheme]}"></i> ${texts[this.currentTheme]}`;
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});
