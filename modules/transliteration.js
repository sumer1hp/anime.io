// modules/transliteration.js
class Transliteration {
    constructor() {
        this.rules = {
            // Русская раскладка -> Английская раскладка
            ruToEn: {
                'й': 'q', 'ц': 'w', 'у': 'e', 'к': 'r', 'е': 't', 'н': 'y', 'г': 'u', 'ш': 'i', 'щ': 'o', 'з': 'p',
                'х': '[', 'ъ': ']', 'ф': 'a', 'ы': 's', 'в': 'd', 'а': 'f', 'п': 'g', 'р': 'h', 'о': 'j', 'л': 'k',
                'д': 'l', 'ж': ';', 'э': "'", 'я': 'z', 'ч': 'x', 'с': 'c', 'м': 'v', 'и': 'b', 'т': 'n', 'ь': 'm',
                'б': ',', 'ю': '.', 'ё': '`',
                'Й': 'Q', 'Ц': 'W', 'У': 'E', 'К': 'R', 'Е': 'T', 'Н': 'Y', 'Г': 'U', 'Ш': 'I', 'Щ': 'O', 'З': 'P',
                'Х': '{', 'Ъ': '}', 'Ф': 'A', 'Ы': 'S', 'В': 'D', 'А': 'F', 'П': 'G', 'Р': 'H', 'О': 'J', 'Л': 'K',
                'Д': 'L', 'Ж': ':', 'Э': '"', 'Я': 'Z', 'Ч': 'X', 'С': 'C', 'М': 'V', 'И': 'B', 'Т': 'N', 'Ь': 'M',
                'Б': '<', 'Ю': '>', 'Ё': '~'
            },
            // Английская раскладка -> Русская раскладка
            enToRu: {
                'q': 'й', 'w': 'ц', 'e': 'у', 'r': 'к', 't': 'е', 'y': 'н', 'u': 'г', 'i': 'ш', 'o': 'щ', 'p': 'з',
                '[': 'х', ']': 'ъ', 'a': 'ф', 's': 'ы', 'd': 'в', 'f': 'а', 'g': 'п', 'h': 'р', 'j': 'о', 'k': 'л',
                'l': 'д', ';': 'ж', "'": 'э', 'z': 'я', 'x': 'ч', 'c': 'с', 'v': 'м', 'b': 'и', 'n': 'т', 'm': 'ь',
                ',': 'б', '.': 'ю', '`': 'ё',
                'Q': 'Й', 'W': 'Ц', 'E': 'У', 'R': 'К', 'T': 'Е', 'Y': 'Н', 'U': 'Г', 'I': 'Ш', 'O': 'Щ', 'P': 'З',
                '{': 'Х', '}': 'Ъ', 'A': 'Ф', 'S': 'Ы', 'D': 'В', 'F': 'А', 'G': 'П', 'H': 'Р', 'J': 'О', 'K': 'Л',
                'L': 'Д', ':': 'Ж', '"': 'Э', 'Z': 'Я', 'X': 'Ч', 'C': 'С', 'V': 'М', 'B': 'И', 'N': 'Т', 'M': 'Ь',
                '<': 'Б', '>': 'Ю', '~': 'Ё'
            }
        };

        // Чистые буквы (никогда не бывают знаками препинания)
        this.pureLetters = new Set([
            'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
            'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
            'а','б','в','г','д','е','ё','ж','з','и','й','к','л','м','н','о','п','р','с','т','у','ф','х','ц','ч','ш','щ','ъ','ы','ь','э','ю','я',
            'А','Б','В','Г','Д','Е','Ё','Ж','З','И','Й','К','Л','М','Н','О','П','Р','С','Т','У','Ф','Х','Ц','Ч','Ш','Щ','Ъ','Ы','Ь','Э','Ю','Я'
        ]);

        // Символы, которые могут быть и буквами и знаками (в зависимости от контекста)
        this.ambiguousChars = new Set([
            ';', "'", ',', '.', '`', '[', ']', '{', '}', ':', '"', '<', '>', '~'
        ]);
    }

    // Определяем, является ли символ частью слова с учетом контекста
    isWordCharacter(char, prevChar = null, nextChar = null) {
        // Если это чистая буква - всегда часть слова
        if (this.pureLetters.has(char)) {
            return true;
        }
        
        // Если это неоднозначный символ - проверяем контекст
        if (this.ambiguousChars.has(char)) {
            // Если предыдущий ИЛИ следующий символ - буква, то это часть слова
            const prevIsLetter = prevChar && this.pureLetters.has(prevChar);
            const nextIsLetter = nextChar && this.pureLetters.has(nextChar);
            
            // Если есть хотя бы одна буква рядом - это часть слова
            if (prevIsLetter || nextIsLetter) {
                return true;
            }
            
            // Если стоит один и нет букв рядом - это знак препинания
            return false;
        }
        
        // Все остальное - не слово
        return false;
    }

    // Находим границы слова (включая неоднозначные символы на границах)
    findWordBoundaries(text, startIndex) {
        const length = text.length;
        if (startIndex >= length) return { start: startIndex, end: startIndex };
        
        let start = startIndex;
        let end = startIndex;
        
        // Идем назад до начала слова
        for (let i = startIndex; i >= 0; i--) {
            const char = text[i];
            const prevChar = i > 0 ? text[i - 1] : null;
            const nextChar = i < length - 1 ? text[i + 1] : null;
            
            if (this.isWordCharacter(char, prevChar, nextChar)) {
                start = i;
            } else {
                break;
            }
        }
        
        // Идем вперед до конца слова
        for (let i = startIndex; i < length; i++) {
            const char = text[i];
            const prevChar = i > 0 ? text[i - 1] : null;
            const nextChar = i < length - 1 ? text[i + 1] : null;
            
            if (this.isWordCharacter(char, prevChar, nextChar)) {
                end = i;
            } else {
                break;
            }
        }
        
        return { start, end: end + 1 }; // end + 1 потому что substring исключает end
    }

    // Улучшенная смена раскладки с учетом контекста
    smartSwitchLayout(text, direction = 'auto') {
        if (!text || typeof text !== 'string') return text;
        
        let result = '';
        let i = 0;
        const length = text.length;
        
        while (i < length) {
            const char = text[i];
            
            // Если это начало потенциального слова
            if (this.isWordCharacter(char, 
                i > 0 ? text[i - 1] : null, 
                i < length - 1 ? text[i + 1] : null)) {
                
                // Находим границы всего слова (включая неоднозначные символы на границах)
                const boundaries = this.findWordBoundaries(text, i);
                const word = text.substring(boundaries.start, boundaries.end);
                
                // Меняем раскладку для всего слова
                const switchedWord = this.switchLayout(word, direction);
                result += switchedWord;
                
                i = boundaries.end; // Переходим к позиции после слова
            } else {
                // Не слово - добавляем как есть
                result += char;
                i++;
            }
        }
        
        return result;
    }

    // Простая смена раскладки для слова
    switchLayout(word, direction = 'auto') {
        if (!word || typeof word !== 'string') return word;
        
        const actualDirection = direction === 'auto' ? this.detectLayout(word) : direction;
        let result = '';
        
        if (actualDirection === 'enToRu') {
            // Английская -> Русская
            for (let i = 0; i < word.length; i++) {
                const char = word[i];
                result += this.rules.enToRu[char] || char;
            }
        } else {
            // Русская -> Английская
            for (let i = 0; i < word.length; i++) {
                const char = word[i];
                result += this.rules.ruToEn[char] || char;
            }
        }
        
        return result;
    }

    // Определение раскладки слова
    detectLayout(word) {
        if (!word) return 'ruToEn';
        
        let ruCount = 0;
        let enCount = 0;
        
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (this.rules.ruToEn[char]) ruCount++;
            if (this.rules.enToRu[char]) enCount++;
        }
        
        return ruCount >= enCount ? 'ruToEn' : 'enToRu';
    }

    // Быстрая смена раскладки для выделенного текста в таблице
    quickSwitchLayout(index) {
        if (!window.getSubtitleItems) return;
        
        const items = window.getSubtitleItems();
        if (!items[index]) return;
        
        const textarea = document.querySelector(`.text-input[data-index="${index}"]`);
        if (!textarea) return;
        
        const originalText = items[index].text;
        let newText = '';
        
        // Проверяем, есть ли выделение
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        
        if (selectionStart !== selectionEnd) {
            // Меняем раскладку только для выделенного текста
            const selectedText = originalText.substring(selectionStart, selectionEnd);
            const switchedText = this.smartSwitchLayout(selectedText, 'auto');
            
            newText = originalText.substring(0, selectionStart) + 
                     switchedText + 
                     originalText.substring(selectionEnd);
        } else {
            // Меняем раскладку для всего текста
            newText = this.smartSwitchLayout(originalText, 'auto');
        }
        
        // Обновляем данные и поле ввода
        items[index].text = newText;
        textarea.value = newText;
        
        // Форсируем обновление интерфейса
        this.forceUpdate();
        
        console.log('Раскладка изменена:', { 
            original: originalText, 
            new: newText, 
            index,
            selection: selectionStart !== selectionEnd ? 'partial' : 'full'
        });
    }

    // Принудительное обновление интерфейса
    forceUpdate() {
        // Обновляем оверлей субтитров
        if (window.updateSubtitleOverlay) {
            window.updateSubtitleOverlay();
        }
        
        // Отправляем событие об изменении
        window.dispatchEvent(new CustomEvent('subtitlesChanged'));
        
        // Показываем уведомление
        if (window.showAlert) {
            window.showAlert('Раскладка изменена', 'success');
        } else {
            console.log('Раскладка изменена');
        }
    }

    // Смена раскладки для всех субтитров
    switchAllLayouts(direction = 'auto') {
        if (!window.getSubtitleItems) return 0;
        
        const items = window.getSubtitleItems();
        let switchedCount = 0;
        
        items.forEach((item, index) => {
            const original = item.text;
            const newText = this.smartSwitchLayout(original, direction);
            
            if (newText !== original) {
                item.text = newText;
                switchedCount++;
                
                // Обновляем соответствующее поле ввода
                const textarea = document.querySelector(`.text-input[data-index="${index}"]`);
                if (textarea) {
                    textarea.value = newText;
                }
            }
        });
        
        if (switchedCount > 0) {
            this.forceUpdate();
        }
        
        return switchedCount;
    }
}

// Создаем глобальный экземпляр
window.transliteration = new Transliteration();

// Глобальные функции для быстрого доступа
function quickSwitchLayout(index) {
    console.log('quickSwitchLayout called with index:', index);
    window.transliteration.quickSwitchLayout(index);
}

function switchAllLayouts() {
    console.log('switchAllLayouts called');
    
    if (!window.getSubtitleItems) {
        console.warn('No subtitle items found');
        if (window.showNotification) {
            window.showNotification('Нет загруженных субтитров', 'warning');
        }
        return;
    }
    
    const items = window.getSubtitleItems();
    if (items.length === 0) {
        console.warn('No subtitles loaded');
        return;
    }
    
    // Определяем направление по первому субтитру
    const sampleText = items[0].text;
    const direction = window.transliteration.detectLayout(sampleText);
    const directionName = direction === 'ruToEn' ? 'русская → английская' : 'английская → русская';
    
    console.log('Switching layout for all subtitles:', { direction, directionName, count: items.length });
    
    const count = window.transliteration.switchAllLayouts(direction);
    
    if (count > 0) {
        // Принудительно обновляем таблицу
        if (window.renderTable) {
            window.renderTable();
        }
        
        if (window.showNotification) {
            window.showNotification(`Изменена раскладка для ${count} субтитров (${directionName})`, 'success');
        }
        
        console.log(`Layout switched for ${count} subtitles`);
    } else {
        if (window.showNotification) {
            window.showNotification('Нечего изменять', 'info');
        }
        console.log('No changes made');
    }
}

// Обновляем существующую функцию транслитерации
function transliterateText() {
    console.log('transliterateText called - using layout switching instead');
    // Теперь используем смену раскладки вместо транслитерации
    switchAllLayouts();
}
