/**
 * Chart Settings Manager
 * Сохранение и восстановление настроек графиков
 */

class ChartSettingsManager {
    constructor() {
        this.storageKey = 'shopping_tracker_chart_settings';
        this.defaultSettings = {
            // Общие настройки
            chartType: 'categories',      // categories, months, years, stores, products, comparison, heatmap, combo
            viewType: 'horizontalBar',     // bar, horizontalBar, pie, line
            showDataLabels: true,          // Показывать подписи
            showPercentages: false,        // Показывать проценты (для круговых)
            
            // Фильтры
            periodFilter: 'all',            // all, year, month
            selectedYear: null,
            selectedMonth: null,
            
            // Настройки для специальных графиков
            comparisonSettings: {
                year1: null,
                year2: null,
                quarter1: null,
                quarter2: null,
                type: 'year'
            },
            
            heatmapSettings: {
                month: null
            },
            
            comboSettings: {
                period: 'month',
                year: null,
                metric: 'count'
            },
            
            // Настройки интерфейса
            lastVisited: null,
            theme: 'light'                  // Для будущей темной темы
        };
        
        this.settings = this.loadSettings();
        console.log('ChartSettingsManager инициализирован');
    }
    
    /**
     * Загрузка настроек из localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Проверяем возраст настроек (не старше 7 дней)
                if (parsed.lastVisited && (Date.now() - parsed.lastVisited < 7 * 24 * 60 * 60 * 1000)) {
                    console.log('Настройки загружены из localStorage');
                    return { ...this.defaultSettings, ...parsed };
                } else {
                    console.log('Настройки устарели, используем значения по умолчанию');
                    this.clearSettings();
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
        
        return { ...this.defaultSettings };
    }
    
    /**
     * Сохранение настроек
     */
    saveSettings() {
        try {
            this.settings.lastVisited = Date.now();
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            console.log('Настройки сохранены');
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
        }
    }
    
    /**
     * Обновление конкретной настройки
     */
    updateSetting(key, value) {
        // Поддержка вложенных ключей (например, 'comparisonSettings.year1')
        if (key.includes('.')) {
            const parts = key.split('.');
            let current = this.settings;
            
            for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current = current[parts[i]];
            }
            
            current[parts[parts.length - 1]] = value;
        } else {
            this.settings[key] = value;
        }
        
        this.saveSettings();
    }
    
    /**
     * Получение настройки
     */
    getSetting(key, defaultValue = null) {
        if (key.includes('.')) {
            const parts = key.split('.');
            let current = this.settings;
            
            for (const part of parts) {
                if (current === undefined || current === null) return defaultValue;
                current = current[part];
            }
            
            return current !== undefined ? current : defaultValue;
        }
        
        return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
    }
    
    /**
     * Сброс настроек к значениям по умолчанию
     */
    resetSettings() {
        this.settings = { ...this.defaultSettings, lastVisited: Date.now() };
        this.saveSettings();
        console.log('Настройки сброшены к значениям по умолчанию');
        return this.settings;
    }
    
    /**
     * Очистка настроек (полное удаление)
     */
    clearSettings() {
        localStorage.removeItem(this.storageKey);
        this.settings = { ...this.defaultSettings };
    }
    
    /**
     * Применение сохраненных настроек к интерфейсу
     */
    applyToUI() {
        console.log('Применение настроек к интерфейсу');
        
        // Устанавливаем тип графика
        const chartTypeBtn = document.querySelector(`.chart-type-btn[data-type="${this.settings.chartType}"]`);
        if (chartTypeBtn) {
            chartTypeBtn.click();
        }
        
        // Устанавливаем тип отображения
        const viewTypeBtn = document.querySelector(`.view-type-btn[data-view="${this.settings.viewType}"]`);
        if (viewTypeBtn) {
            viewTypeBtn.click();
        }
        
        // Устанавливаем чекбоксы
        const labelsCheckbox = document.getElementById('show-data-labels');
        if (labelsCheckbox) {
            labelsCheckbox.checked = this.settings.showDataLabels;
            // Триггерим событие изменения
            labelsCheckbox.dispatchEvent(new Event('change'));
        }
        
        const percentagesCheckbox = document.getElementById('show-percentages');
        if (percentagesCheckbox) {
            percentagesCheckbox.checked = this.settings.showPercentages;
            percentagesCheckbox.dispatchEvent(new Event('change'));
        }
        
        // Устанавливаем фильтры
        const periodFilter = document.getElementById('period-filter');
        if (periodFilter) {
            periodFilter.value = this.settings.periodFilter;
            periodFilter.dispatchEvent(new Event('change'));
        }
        
        // Для фильтров с задержкой (так как селекты могут заполняться позже)
        setTimeout(() => {
            // Год
            if (this.settings.selectedYear) {
                const yearSelect = document.getElementById('year-filter');
                if (yearSelect) {
                    yearSelect.value = this.settings.selectedYear;
                }
            }
            
            // Месяц
            if (this.settings.selectedMonth) {
                const monthSelect = document.getElementById('month-filter');
                if (monthSelect) {
                    monthSelect.value = this.settings.selectedMonth;
                }
            }
        }, 500);
    }
    
    /**
     * Сохранение состояния фильтров из интерфейса
     */
    captureFromUI() {
        // Тип графика
        const activeChartBtn = document.querySelector('.chart-type-btn.active');
        if (activeChartBtn) {
            this.settings.chartType = activeChartBtn.dataset.type;
        }
        
        // Тип отображения
        const activeViewBtn = document.querySelector('.view-type-btn.active');
        if (activeViewBtn) {
            this.settings.viewType = activeViewBtn.dataset.view;
        }
        
        // Чекбоксы
        const labelsCheckbox = document.getElementById('show-data-labels');
        if (labelsCheckbox) {
            this.settings.showDataLabels = labelsCheckbox.checked;
        }
        
        const percentagesCheckbox = document.getElementById('show-percentages');
        if (percentagesCheckbox) {
            this.settings.showPercentages = percentagesCheckbox.checked;
        }
        
        // Фильтры
        const periodFilter = document.getElementById('period-filter');
        if (periodFilter) {
            this.settings.periodFilter = periodFilter.value;
        }
        
        const yearSelect = document.getElementById('year-filter');
        if (yearSelect && yearSelect.value) {
            this.settings.selectedYear = yearSelect.value;
        }
        
        const monthSelect = document.getElementById('month-filter');
        if (monthSelect && monthSelect.value) {
            this.settings.selectedMonth = monthSelect.value;
        }
        
        this.saveSettings();
    }
}

// Создаем глобальный экземпляр
window.settingsManager = new ChartSettingsManager();