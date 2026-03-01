/**
 * app-export.js - Функции экспорта для основного приложения
 * 
 * Этот файл содержит весь код, связанный с экспортом данных из таблицы покупок,
 * включая прогресс-бар, настройки экспорта и обработчики событий.
 * 
 * @requires api.js - для загрузки данных
 * @requires data-exporter.js - для экспорта в различные форматы
 * @requires app.js - для доступа к таблице purchasesTable
 */

/**
 * app-export.js - Функции экспорта для основного приложения
 * 
 * ВНИМАНИЕ: Этот файл должен подключаться ПОСЛЕ app.js
 */

// Проверяем, что purchasesTable будет доступна
if (!window.purchasesTable) {
    console.log('app-export.js: ожидание инициализации purchasesTable...');
    
    // Если таблица ещё не создана, ждём событие
    document.addEventListener('purchasesTableReady', function() {
        console.log('app-export.js: purchasesTable готова');
    });
}

// ============================================
// ПРОГРЕСС-БАР ДЛЯ ЭКСПОРТА БОЛЬШИХ ДАННЫХ
// ============================================

/**
 * Класс ExportProgressBar
 * Отображает прогресс выполнения экспорта больших объёмов данных
 * 
 * @example
 * const progressBar = new ExportProgressBar();
 * progressBar.show(100); // показать прогресс-бар для 100 записей
 * progressBar.update(50); // обновить до 50%
 * progressBar.hide(); // скрыть прогресс-бар
 */
class ExportProgressBar {
    constructor() {
        /** @type {HTMLElement|null} DOM-элемент прогресс-бара */
        this.element = null;
        
        /** @type {number} Общее количество записей для экспорта */
        this.total = 0;
        
        /** @type {number} Текущий прогресс (количество обработанных записей) */
        this.current = 0;
    }
    
    /**
     * Показать прогресс-бар
     * @param {number} total - общее количество записей для экспорта
     */
    show(total) {
        // Если прогресс-бар уже существует, скрываем его
        if (this.element) this.hide();
        
        this.total = total;
        this.current = 0;
        
        // Создаём контейнер прогресс-бара
        this.element = document.createElement('div');
        this.element.className = 'export-progress';
        this.element.innerHTML = `
            <div class="progress-container">
                <div class="progress-header">Экспорт данных</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-stats">
                    <span class="progress-count">0/${total}</span>
                    <span class="progress-percent">0%</span>
                </div>
            </div>
        `;
        
        // Добавляем стили для прогресс-бара, если их ещё нет
        this._addStyles();
        
        // Добавляем в DOM
        document.body.appendChild(this.element);
        
        console.log(`Прогресс-бар показан: всего ${total} записей`);
    }
    
    /**
     * Обновить прогресс
     * @param {number} current - текущее количество обработанных записей
     */
    update(current) {
        if (!this.element) return;
        
        this.current = current;
        
        const percent = Math.round((current / this.total) * 100);
        
        const fill = this.element.querySelector('.progress-fill');
        const count = this.element.querySelector('.progress-count');
        const percentEl = this.element.querySelector('.progress-percent');
        
        if (fill) fill.style.width = percent + '%';
        if (count) count.textContent = `${current}/${this.total}`;
        if (percentEl) percentEl.textContent = percent + '%';
        
        // Если достигнут 100%, автоматически скрываем через секунду
        if (current >= this.total) {
            setTimeout(() => this.hide(), 1000);
        }
    }
    
    /**
     * Скрыть прогресс-бар с анимацией
     */
    hide() {
        if (this.element) {
            this.element.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                    this.element = null;
                }
            }, 300);
        }
    }
    
    /**
     * Добавить стили для прогресс-бара (если их ещё нет в CSS)
     * @private
     */
    _addStyles() {
        // Проверяем, есть ли уже стили
        if (document.getElementById('export-progress-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'export-progress-styles';
        style.textContent = `
            .export-progress {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: white;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                z-index: 10001;
                min-width: 300px;
                animation: slideInRight 0.3s ease-out;
            }
            
            .progress-container {
                width: 100%;
            }
            
            .progress-header {
                font-weight: bold;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            .progress-bar {
                height: 20px;
                background: #ecf0f1;
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3498db, #2ecc71);
                transition: width 0.3s ease;
                border-radius: 10px;
            }
            
            .progress-stats {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #7f8c8d;
            }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
    }
}

// ============================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================

/** @type {ExportProgressBar} Глобальный экземпляр прогресс-бара */
const progressBar = new ExportProgressBar();

// ============================================
// ФУНКЦИИ УПРАВЛЕНИЯ ЭКСПОРТОМ
// ============================================

/**
 * Настройка элементов управления экспортом
 * Вызывается при загрузке страницы
 */
function setupExportControls() {
    const exportButton = document.getElementById('export-button');
    const exportMenu = document.getElementById('export-menu');
    const closeButton = document.getElementById('close-export-menu');
    const startButton = document.getElementById('start-export');
    const formatOptions = document.querySelectorAll('.export-option');
    const truncateOption = document.getElementById('truncate-option');
    
    if (!exportButton || !exportMenu) {
        console.warn('Элементы экспорта не найдены на странице');
        return;
    }
    
    let currentFormat = 'csv';
    
    // Открытие/закрытие меню
    exportButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = exportMenu.style.display !== 'none';
        exportMenu.style.display = isVisible ? 'none' : 'block';
    });
    
    // Закрытие при клике вне меню
    document.addEventListener('click', function(e) {
        if (!exportMenu.contains(e.target) && e.target !== exportButton) {
            exportMenu.style.display = 'none';
        }
    });
    
    // Закрытие по кнопке
    closeButton?.addEventListener('click', function() {
        exportMenu.style.display = 'none';
    });
    
    // Выбор формата
    formatOptions.forEach(option => {
        option.addEventListener('click', function() {
            const format = this.dataset.format;
            currentFormat = format;
            
            // Подсветка выбранного
            formatOptions.forEach(opt => opt.style.background = 'white');
            this.style.background = '#f0f7ff';
            
            // Показываем дополнительные опции для SQL
            if (truncateOption) {
                truncateOption.style.display = format === 'sql' ? 'block' : 'none';
            }
        });
    });
    
    // Запуск экспорта
    startButton?.addEventListener('click', async function() {
        exportMenu.style.display = 'none';
        
        // Получаем данные для экспорта
        const data = await getDataForExport();
        
        if (!data || data.length === 0) {
            alert('Нет данных для экспорта');
            return;
        }
        
        // Получаем настройки
        const includeHeaders = document.getElementById('export-headers')?.checked ?? true;
        const onlyFiltered = document.getElementById('export-filters')?.checked ?? true;
        const truncateFirst = document.getElementById('export-truncate')?.checked ?? false;
        
        // Для больших данных показываем прогресс-бар
        if (data.length > 500) {
            progressBar.show(data.length);
        }
        
        // Показываем индикатор загрузки
        showLoadingIndicator(`Экспорт ${data.length} записей...`);
        
        // Выполняем экспорт
        try {
            const filename = window.dataExporter.generateFilename('shopping_list');
            
            const result = window.dataExporter.export(data, {
                format: currentFormat,
                filename: filename,
                headers: includeHeaders,
                tableName: 'shops',
                truncateFirst: truncateFirst,
                separator: currentFormat === 'xls' ? '\t' : ';',
                decimalSeparator: ',',
                pretty: true
            });
            
            if (result) {
                console.log(`Экспорт завершён: ${filename}.${currentFormat}`);
            }
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            alert('Ошибка при экспорте данных: ' + error.message);
        } finally {
            hideLoadingIndicator();
            if (data.length > 500) {
                progressBar.hide();
            }
        }
    });
}

// ============================================
// ФУНКЦИИ ПОЛУЧЕНИЯ ДАННЫХ ДЛЯ ЭКСПОРТА
// ============================================

/**
 * Получение данных для экспорта
 * @returns {Promise<Array>} Массив данных для экспорта
 */
async function getDataForExport() {
    // Проверяем, включен ли фильтр "только отфильтрованные"
    const onlyFiltered = document.getElementById('export-filters')?.checked ?? true;
    
    if (onlyFiltered && window.purchasesTable) {
        // Получаем отфильтрованные данные из таблицы Tabulator
        try {
            const data = window.purchasesTable.getData('active');
            console.log(`Получено отфильтрованных данных: ${data.length} записей`);
            return data;
        } catch (error) {
            console.error('Ошибка получения данных из таблицы:', error);
            return [];
        }
    } else {
        // Иначе получаем все данные через API
        try {
            const response = await apiClient.getPurchases();
            console.log(`Получено всех данных через API: ${response.length} записей`);
            return response;
        } catch (error) {
            console.error('Ошибка загрузки данных из API:', error);
            return [];
        }
    }
}

// ============================================
// ФУНКЦИИ УПРАВЛЕНИЯ ИНДИКАТОРОМ ЗАГРУЗКИ
// ============================================

/**
 * Показать индикатор загрузки
 * @param {string} message - сообщение для отображения
 */
function showLoadingIndicator(message) {
    // Проверяем, не существует ли уже индикатор
    if (document.getElementById('export-loading')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'export-loading';
    indicator.className = 'loading-indicator';
    indicator.innerHTML = `
        <div class="spinner"></div>
        <span>${message}</span>
    `;
    
    // Добавляем стили, если их нет
    if (!document.getElementById('loading-indicator-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-indicator-styles';
        style.textContent = `
            #export-loading {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 20px 30px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 15px;
                z-index: 10000;
                box-shadow: 0 5px 25px rgba(0,0,0,0.3);
                animation: fadeIn 0.3s ease;
            }
            
            .spinner {
                width: 24px;
                height: 24px;
                border: 3px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(indicator);
}

/**
 * Скрыть индикатор загрузки
 */
function hideLoadingIndicator() {
    const indicator = document.getElementById('export-loading');
    if (indicator) {
        indicator.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }
}

// ============================================
// ФУНКЦИИ ДЛЯ ОЧИСТКИ ФИЛЬТРОВ
// ============================================

/**
 * Настройка кнопки очистки всех фильтров
 */
function setupClearFilters() {
    const clearBtn = document.getElementById('clear-all-filters');
    if (!clearBtn) return;
    
    clearBtn.addEventListener('click', function() {
        // Очищаем фильтры таблицы Tabulator
        if (window.purchasesTable) {
            window.purchasesTable.clearFilter();
        }
        
        // Очищаем фильтр из localStorage (если есть)
        if (window.clearChartFilter) {
            window.clearChartFilter();
        }
        
        // Удаляем баннер фильтра если есть
        const banner = document.getElementById('applied-filter-banner');
        if (banner) banner.remove();
        
        // Показываем сообщение
        showToast('Все фильтры очищены');
    });
}

// ============================================
// УТИЛИТНЫЕ ФУНКЦИИ
// ============================================

/**
 * Показать всплывающее уведомление (toast)
 * @param {string} message - текст сообщения
 */
function showToast(message) {
    // Проверяем, не существует ли уже toast
    const existingToast = document.querySelector('.toast-message');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 1000;
        animation: fadeInOut 3s ease-in-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Добавляем стили анимации, если их нет
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(20px); }
                10% { opacity: 1; transform: translateY(0); }
                90% { opacity: 1; transform: translateY(0); }
                100% { opacity: 0; transform: translateY(20px); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Автоматически удаляем через 3 секунды
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// ============================================
// ФУНКЦИИ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
// ============================================

/**
 * Очистка фильтра графика (для обратной совместимости)
 * Эта функция может быть вызвана из app.html
 */
function clearChartFilter() {
    localStorage.removeItem('shoppingTracker_chartFilter');
    localStorage.removeItem('shoppingTracker_filterTimestamp');
    console.log('Фильтр графика очищен');
}

// ============================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// ============================================

// Основные функции
window.setupExportControls = setupExportControls;
window.getDataForExport = getDataForExport;
window.showLoadingIndicator = showLoadingIndicator;
window.hideLoadingIndicator = hideLoadingIndicator;
window.setupClearFilters = setupClearFilters;
window.showToast = showToast;

// Для обратной совместимости
window.clearChartFilter = clearChartFilter;

// Экспортируем класс прогресс-бара (на случай, если понадобится использовать отдельно)
window.ExportProgressBar = ExportProgressBar;

console.log('app-export.js загружен, функции экспорта готовы');