/**
 * Shopping Tracker - Enhanced Chart Manager
 * Полностью исправленная версия
 */

// ============================================
// 1. КОНСТАНТЫ И УТИЛИТЫ
// ============================================

class ChartUtils {
    /**
     * Форматирование валюты с пробелами
     */
    static formatCurrency(value, currency = '₽') {
        if (value === null || value === undefined || isNaN(value)) {
            return `0 ${currency}`;
        }
        
        const num = parseFloat(value);
        const [integerPart, decimalPart] = Math.abs(num).toFixed(2).split('.');
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        const sign = num < 0 ? '-' : '';
        
        return `${sign}${formattedInteger}.${decimalPart} ${currency}`;
    }
    
    /**
     * Форматирование числа с пробелами
     */
    static formatNumber(value, decimals = 0) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0';
        }
        
        const num = parseFloat(value);
        const [integerPart, decimalPart] = Math.abs(num).toFixed(decimals).split('.');
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        const sign = num < 0 ? '-' : '';
        
        if (decimals > 0) {
            return `${sign}${formattedInteger}.${decimalPart}`;
        }
        return `${sign}${formattedInteger}`;
    }
    
    /**
     * Форматирование процентов
     */
    static formatPercentage(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0%';
        }
        
        const percentage = parseFloat(value) * 100;
        return `${percentage.toFixed(decimals)}%`;
    }
    
    /**
     * Генерация уникального ID
     */
    static generateId(prefix = 'chart') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Затемнение цвета
     */
    static darkenColor(color, amount) {
        if (!color) return '#cccccc';
        if (color.startsWith('rgb')) {
            // Обработка rgba цвета
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                let r = Math.max(0, parseInt(match[1]) - Math.round(255 * amount));
                let g = Math.max(0, parseInt(match[2]) - Math.round(255 * amount));
                let b = Math.max(0, parseInt(match[3]) - Math.round(255 * amount));
                return `rgb(${r}, ${g}, ${b})`;
            }
        }
        
        // Обработка hex цвета
        const hex = color.replace('#', '');
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            const darkR = Math.max(0, r - Math.round(255 * amount));
            const darkG = Math.max(0, g - Math.round(255 * amount));
            const darkB = Math.max(0, b - Math.round(255 * amount));
            return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
        }
        
        const num = parseInt(hex, 16);
        const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
        const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(255 * amount));
        const b = Math.max(0, (num & 0x0000FF) - Math.round(255 * amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    /**
     * Осветление цвета
     */
    static lightenColor(color, amount) {
        if (!color) return '#ffffff';
        if (color.startsWith('rgb')) {
            const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                let r = Math.min(255, parseInt(match[1]) + Math.round(255 * amount));
                let g = Math.min(255, parseInt(match[2]) + Math.round(255 * amount));
                let b = Math.min(255, parseInt(match[3]) + Math.round(255 * amount));
                return `rgb(${r}, ${g}, ${b})`;
            }
        }
        
        const hex = color.replace('#', '');
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            const lightR = Math.min(255, r + Math.round(255 * amount));
            const lightG = Math.min(255, g + Math.round(255 * amount));
            const lightB = Math.min(255, b + Math.round(255 * amount));
            return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
        }
        
        const num = parseInt(hex, 16);
        const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
        const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * amount));
        const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
}

// ============================================
// 2. ТЕМЫ И ЦВЕТОВЫЕ ПАЛИТРЫ
// ============================================

class ChartThemes {
    static getDefaultTheme() {
        return {
            // Основные цвета
            colors: {
                primary: '#3498db',
                secondary: '#2ecc71',
                success: '#27ae60',
                danger: '#e74c3c',
                warning: '#f39c12',
                info: '#17a2b8',
                light: '#f8f9fa',
                dark: '#343a40'
            },
            
            // Цветовая палитра для категорий
            palette: [
                '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
                '#EF476F', '#FFD166', '#06D6A0', '#073B4C', '#7209B7',
                '#F94144', '#F3722C', '#F8961E', '#F9C74F', '#90BE6D',
                '#43AA8B', '#577590', '#277DA1', '#F72585', '#7209B7',
                '#3A0CA3', '#4361EE', '#4CC9F0', '#4895EF', '#560BAD'
            ],
            
            // Стили текста
            typography: {
                fontFamily: "'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontSize: 12,
                fontColor: '#333333'
            },
            
            // Стили сетки
            grid: {
                color: 'rgba(0, 0, 0, 0.05)',
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                drawBorder: true,
                drawOnChartArea: true
            }
        };
    }
    
    static getContrastTheme() {
        const defaultTheme = this.getDefaultTheme();
        return {
            ...defaultTheme,
            colors: {
                primary: '#1a73e8',
                secondary: '#0b8043',
                success: '#0b8043',
                danger: '#d93025',
                warning: '#f6bf26',
                info: '#4285f4',
                light: '#ffffff',
                dark: '#202124'
            }
        };
    }
    
    /**
     * Получение цвета для категории
     */
    static getCategoryColor(categoryName, index = 0) {
        const theme = this.getDefaultTheme();
        
        const fixedColors = {
            'Продукты': '#FF6B6B',
            'Химия': '#4ECDC4',
            'Электроника': '#FFD166',
            'Одежда': '#06D6A0',
            'Бытовая техника': '#118AB2',
            'Автотовары': '#EF476F',
            'Стройматериалы': '#073B4C',
            'Мебель': '#7209B7',
            'Транспорт': '#F94144',
            'Коммуналка': '#90BE6D'
        };
        
        if (categoryName && fixedColors[categoryName]) {
            return fixedColors[categoryName];
        }
        
        return theme.palette[index % theme.palette.length];
    }
}

// ============================================
// 3. ОБРАБОТЧИК ДАННЫХ (ИСПРАВЛЕННЫЙ)
// ============================================

class DataProcessor {
    /**
     * Обработка данных по категориям - ВОЗВРАЩАЕТ ПРАВИЛЬНЫЙ ФОРМАТ ДЛЯ CHART.JS
     */
    // УПРОЩЕННАЯ ВЕРСИЯ - возвращает ТОЛЬКО формат Chart.js
    processCategoryData(purchases, categories) {
        console.log('DataProcessor: обработка данных категорий');
        
        if (!purchases || !purchases.length) {
            return {
                labels: [],
                datasets: []
            };
        }
        
        // Создаем мапу категорий
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.id] = {
                name: `${cat.icon} ${cat.name}`,
                color: cat.color || ChartThemes.getCategoryColor(cat.name, cat.id)
            };
        });
        
        // Считаем суммы по категориям
        const totals = {};
        purchases.forEach(p => {
            if (p.category_id) {
                const catId = p.category_id;
                totals[catId] = (totals[catId] || 0) + (parseFloat(p.amount) || 0);
            }
        });
        
        // Преобразуем в массивы
        const result = [];
        Object.keys(totals).forEach(catId => {
            const category = categoryMap[catId];
            if (category) {
                result.push({
                    name: category.name,
                    amount: totals[catId],
                    color: category.color
                });
            }
        });
        
        // Сортируем по сумме
        result.sort((a, b) => b.amount - a.amount);
        
        // Возвращаем ПРАВИЛЬНЫЙ формат для Chart.js
        return {
            labels: result.map(item => item.name),
            datasets: [{
                label: 'Сумма покупок, ₽',
                data: result.map(item => item.amount),
                backgroundColor: result.map(item => item.color),
                borderColor: result.map(item => ChartUtils.darkenColor(item.color, 0.2)),
                borderWidth: 1
            }]
        };
    }

    /**
     * Обработка месячных данных
     */
    processMonthlyData(purchases) {
        console.log('DataProcessor: обработка месячных данных');
        
        const monthlyStats = {};
        
        purchases.forEach(purchase => {
            if (!purchase.date) return;
            
            const date = new Date(purchase.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('ru-RU', { 
                month: 'long', 
                year: 'numeric' 
            }).replace(' г.', '');
            
            if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = {
                    name: monthName,
                    amount: 0
                };
            }
            
            monthlyStats[monthKey].amount += parseFloat(purchase.amount) || 0;
        });
        
        // Сортируем по дате
        const sorted = Object.values(monthlyStats).sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('Месяцев обработано:', sorted.length);
        
        return {
            labels: sorted.map(item => item.name),
            datasets: [{
                label: 'Сумма расходов, ₽',
                data: sorted.map(item => item.amount),
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        };
    }
    
    /**
     * Обработка данных по магазинам
     */
    processStoreData(purchases, stores) {
        console.log('DataProcessor: обработка данных магазинов');
        
        const storeStats = {};
        
        purchases.forEach(purchase => {
            const storeId = purchase.store_id;
            if (!storeId) return;
            
            if (!storeStats[storeId]) {
                const store = stores.find(s => s.id == storeId);
                storeStats[storeId] = {
                    name: store ? store.shop : `Магазин #${storeId}`,
                    amount: 0,
                    color: ChartThemes.getCategoryColor(store ? store.shop : null, storeId)
                };
            }
            
            storeStats[storeId].amount += parseFloat(purchase.amount) || 0;
        });
        
        // Сортируем по сумме
        const sorted = Object.values(storeStats).sort((a, b) => b.amount - a.amount);
        
        console.log('Магазинов обработано:', sorted.length);
        
        return {
            labels: sorted.map(item => item.name),
            datasets: [{
                label: 'Сумма покупок, ₽',
                data: sorted.map(item => item.amount),
                backgroundColor: sorted.map(item => item.color),
                borderColor: sorted.map(item => ChartUtils.darkenColor(item.color, 0.2)),
                borderWidth: 1
            }]
        };
    }
    
    /**
     * Обработка данных для тренда
     */
    processTrendData(purchases, period = 'monthly') {
        console.log('DataProcessor: обработка трендовых данных');
        
        const trendData = {};
        
        purchases.forEach(purchase => {
            if (!purchase.date) return;
            
            const date = new Date(purchase.date);
            let periodKey, periodName;
            
            switch (period) {
                case 'daily':
                    periodKey = date.toISOString().split('T')[0];
                    periodName = date.toLocaleDateString('ru-RU');
                    break;
                    
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    periodKey = weekStart.toISOString().split('T')[0];
                    periodName = `Неделя ${periodKey}`;
                    break;
                    
                case 'monthly':
                default:
                    periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    periodName = date.toLocaleDateString('ru-RU', { 
                        month: 'long', 
                        year: 'numeric' 
                    }).replace(' г.', '');
            }
            
            if (!trendData[periodKey]) {
                trendData[periodKey] = {
                    name: periodName,
                    amount: 0
                };
            }
            
            trendData[periodKey].amount += parseFloat(purchase.amount) || 0;
        });
        
        // Сортируем по дате
        const sorted = Object.values(trendData).sort((a, b) => a.name.localeCompare(b.name));
        
        console.log('Периодов обработано:', sorted.length);
        
        return {
            labels: sorted.map(item => item.name),
            datasets: [{
                label: 'Сумма расходов, ₽',
                data: sorted.map(item => item.amount),
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderColor: '#3498db',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
    }
}

// ============================================
// 4. БАЗОВЫЙ КЛАСС ДЛЯ ВСЕХ ГРАФИКОВ (ИСПРАВЛЕННЫЙ)
// ============================================

class BaseChart {
    constructor(canvasId, config = {}) {
        console.log(`BaseChart создается для: ${canvasId}`);
		console.log('BaseChart constructor called with:', { canvasId, config });
		console.log('config.type:', config.type);
		
        this.canvasId = canvasId;
        this.theme = ChartThemes.getDefaultTheme();
		this.chartType = config.type || 'bar'; // Сохраняем тип графика отдельно
        this.config = this.mergeConfigs(config);
        this.chart = null;
		
        // Проверяем существование canvas
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas элемент с id "${canvasId}" не найден`);
            throw new Error(`Canvas элемент с id "${canvasId}" не найден`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        console.log(`BaseChart инициализирован для: ${canvasId}, тип: ${this.chartType}`);
    }
    
    /**
     * Объединение конфигураций
     */
    mergeConfigs(userConfig) {
        const defaultConfig = this.getDefaultConfig();
        const merged = this.deepMerge(defaultConfig, userConfig);
        this.applyThemeToConfig(merged);
        return merged;
    }
    
    /**
     * Глубокое объединение объектов
     */
    deepMerge(target, source) {
        const output = { ...target };
        
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            });
        }
        
        return output;
    }
    
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }
    
    /**
     * Базовая конфигурация графика
     */
    getDefaultConfig() {
        // Определяем тип графика для использования в конфигурации
        const chartType = this.chartType || 'bar';
        
        // Проверяем, доступен ли плагин datalabels
        const datalabelsPlugin = typeof ChartDataLabels !== 'undefined' ? ChartDataLabels : null;
        if (datalabelsPlugin) {
            try {
                Chart.register(datalabelsPlugin);
                console.log('Плагин DataLabels зарегистрирован');
            } catch (e) {
                console.warn('Не удалось зарегистрировать DataLabels:', e);
            }
        }
        
        // Базовый конфиг
        const baseConfig = {
            type: chartType,
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart',
                    animateScale: true,
                    animateRotate: true
                },
                layout: {
                    padding: {
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20
                    }
                },
                plugins: {
                    // ПЛАГИН ПОДПИСЕЙ ДАННЫХ
                    datalabels: datalabelsPlugin ? {
                        display: true, // По умолчанию включены
                        color: '#333',
                        font: {
                            family: this.theme.typography.fontFamily,
                            size: 11,
                            weight: 'bold'
                        },
                        formatter: (value, context) => {
                            return this.formatDataLabel(value, context, chartType);
                        },
                        anchor: 'end',
                        align: 'top',
                        offset: 4,
                        clamp: true,
                        textAlign: 'center',
                        // Конфигурация для разных типов графиков
                        ...this.getDataLabelsConfig(chartType)
                    } : undefined,
                    
                    // Легенда
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                family: this.theme.typography.fontFamily,
                                size: this.theme.typography.fontSize
                            }
                        }
                    },
                    
                    // Всплывающие подсказки
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            family: this.theme.typography.fontFamily,
                            size: this.theme.typography.fontSize,
                            weight: 'bold'
                        },
                        bodyFont: {
                            family: this.theme.typography.fontFamily,
                            size: this.theme.typography.fontSize
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                const total = context.chart.data.datasets[0]?.data?.reduce((a, b) => a + b, 0) || 0;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                
                                let formattedValue;
                                if (label.toLowerCase().includes('сумма') || 
                                    label.toLowerCase().includes('руб') ||
                                    label.toLowerCase().includes('₽')) {
                                    formattedValue = ChartUtils.formatCurrency(value);
                                } else {
                                    formattedValue = ChartUtils.formatNumber(value, 0);
                                }
                                
                                return [
                                    `${label}: ${formattedValue}`,
                                    `Доля: ${percentage}%`,
                                    `Позиция: ${context.dataIndex + 1}/${context.chart.data.labels.length}`
                                ];
                            }
                        }
                    }
                },
                // Настройки для разных типов графиков
                ...this.getTypeSpecificConfig(chartType)
            }
        };
        
        // Добавляем оси для соответствующих типов графиков
        if (chartType !== 'pie' && chartType !== 'doughnut') {
            baseConfig.options.scales = {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => ChartUtils.formatCurrency(value),
                        font: {
                            family: this.theme.typography.fontFamily,
                            size: 11
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: this.theme.typography.fontFamily,
                            size: 11
                        },
                        maxRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            };
            
            // Дополнительные настройки для горизонтальных гистограмм
            if (chartType === 'horizontalBar') {
                baseConfig.options.indexAxis = 'y';
                baseConfig.options.scales = {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => ChartUtils.formatCurrency(value)
                        }
                    },
                    y: {
                        ticks: {
                            autoSkip: false,
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                };
            }
        }
        
        return baseConfig;
    }
	
	/**
     * Форматирование подписи данных
     */
    formatDataLabel(value, context, chartType) {
        const datasetLabel = context.dataset.label || '';
        
        // Определяем формат в зависимости от типа данных
        if (datasetLabel.toLowerCase().includes('сумма') || 
            datasetLabel.toLowerCase().includes('руб') ||
            datasetLabel.toLowerCase().includes('₽')) {
            
            // Для денежных значений
            if (chartType === 'pie' || chartType === 'doughnut') {
                // Для круговых диаграмм можно показывать проценты
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return `${ChartUtils.formatCurrency(value, '', 0)}\n(${percentage}%)`;
            }
            
            return ChartUtils.formatCurrency(value, '', 0); // Без символа валюты в подписи
        }
        
        // Для количественных значений
        return ChartUtils.formatNumber(value, 0);
    }
	
	/**
	 * Конфигурация подписей для разных типов графиков
	 */
	getDataLabelsConfig(chartType) {
        switch(chartType) {
            case 'bar':
                return {
                    anchor: 'end',
                    align: 'top',
                    offset: 2,
                    clamp: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 4,
                    padding: 4
                };
                
            case 'horizontalBar':
                return {
                    anchor: 'end',
                    align: 'center',
                    offset: 2,
                    clamp: true,
                    textAlign: 'left'
                };
                
            case 'pie':
            case 'doughnut':
                return {
                    anchor: 'center',
                    align: 'center',
                    color: '#fff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    font: {
                        size: 10
                    }
                };
                
            case 'line':
                return {
                    anchor: 'center',
                    align: 'top',
                    offset: 10,
                    display: false // Для линейных графиков лучше отключить
                };
                
            default:
                return {};
        }
    }
    
    /**
     * Типоспецифичная конфигурация
     */
    getTypeSpecificConfig(chartType) {
        switch(chartType) {
            case 'pie':
            case 'doughnut':
                return {
                    scales: {}, // Убираем оси для круговых диаграмм
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        return data.labels.map((label, i) => {
                                            const dataset = data.datasets[0];
                                            const value = dataset.data[i];
                                            const total = dataset.data.reduce((a, b) => a + b, 0);
                                            const percentage = total > 0 ? 
                                                Math.round((value / total) * 100) : 0;
                                            
                                            return {
                                                text: `${label}: ${ChartUtils.formatCurrency(value)} (${percentage}%)`,
                                                fillStyle: dataset.backgroundColor[i],
                                                strokeStyle: dataset.borderColor?.[i] || dataset.backgroundColor[i],
                                                lineWidth: 1,
                                                hidden: false,
                                                index: i
                                            };
                                        });
                                    }
                                    return [];
                                }
                            }
                        }
                    }
                };
                
            default:
                return {};
        }
    }
    
    /**
     * Применение темы к конфигурации
     */
    applyThemeToConfig(config) {
        if (!config.options) config.options = {};
        if (!config.options.plugins) config.options.plugins = {};
        
        // Настройки сетки
        if (!config.options.scales) config.options.scales = {};
    }
    
    /**
     * Подготовка данных - КЛЮЧЕВОЙ ИСПРАВЛЕННЫЙ МЕТОД
     */
    prepareData(rawData) {
		console.log('BaseChart.prepareData вызван');
		
		// Если нет данных
		if (!rawData) {
			return { labels: [], datasets: [] };
		}
		
		// Если уже в формате Chart.js (labels и datasets)
		if (rawData.labels && rawData.datasets && Array.isArray(rawData.datasets)) {
			console.log('Данные уже в формате Chart.js');
			return rawData;
		}
		
		// Если это какие-то другие данные (старый формат)
		console.warn('Неизвестный формат данных:', rawData);
		return { labels: [], datasets: [] };
	}

    /**
     * Создание графика
     */
    create(data = null) {
        console.log(`BaseChart.create для ${this.canvasId}, тип: ${this.chartType}`);
        
        try {
            // Уничтожаем старый график если есть
            this.destroy();
            
            // Подготавливаем данные если переданы
            if (data) {
                console.log('Подготавливаем данные...');
                const preparedData = this.prepareData(data);
                console.log('Подготовленные данные:', preparedData);
                this.config.data = preparedData;
            } else {
                console.log('Нет данных для отображения');
            }
            
            console.log('Конфигурация перед созданием:', {
                type: this.config.type,
                labelsCount: this.config.data?.labels?.length,
                datasetsCount: this.config.data?.datasets?.length
            });
            
            // Создаем график
            this.chart = new Chart(this.ctx, this.config);
            
            // Сохраняем ссылку на график в canvas
            this.canvas.chartInstance = this.chart;
            
            console.log(`График создан: ${this.canvasId}, тип: ${this.chartType}`);
            
            return this.chart;
            
        } catch (error) {
            console.error(`Ошибка создания графика ${this.canvasId}:`, error);
            throw error;
        }
    }
    
	/**
     * Обновление видимости подписей данных
     */
    updateDataLabelsVisibility(visible) {
        if (!this.chart || !this.chart.config.options.plugins.datalabels) {
            return false;
        }
        
        this.chart.config.options.plugins.datalabels.display = visible;
        this.chart.update();
        return true;
    }
    
    /**
     * Обновление формата подписей (проценты/значения для круговых)
     */
    updateDataLabelsFormat(showPercentages) {
        if (!this.chart || !this.chart.config.options.plugins.datalabels) {
            return false;
        }
        
        // Сохраняем настройку глобально
        window.showPercentages = showPercentages;
        
        if (this.chartType === 'pie' || this.chartType === 'doughnut') {
            this.chart.config.options.plugins.datalabels.formatter = (value, context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                
                if (showPercentages) {
                    return `${percentage}%`;
                }
                
                return `${ChartUtils.formatCurrency(value, '', 0)}\n(${percentage}%)`;
            };
            
            this.chart.update();
        }
        
        return true;
    }
	
    /**
     * Обновление данных графика
     */
    update(newData) {
        if (!this.chart) {
            console.warn(`График ${this.canvasId} не существует для обновления`);
            return this.create(newData);
        }
        
        const preparedData = this.prepareData(newData);
        this.chart.data = preparedData;
        this.chart.update('none');
        
        return this.chart;
    }
    
    /**
     * Уничтожение графика
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
            delete this.canvas.chartInstance;
        }
    }
    
    /**
     * Экспорт графика в PNG
     */
    exportToPNG(filename = null) {
        if (!this.chart) {
            console.warn(`График ${this.canvasId} не существует для экспорта`);
            return null;
        }
        
        if (!filename) {
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:]/g, '-');
            filename = `chart-${this.canvasId}-${timestamp}.png`;
        }
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        return filename;
    }
}

// ============================================
// 5. КОНКРЕТНЫЕ ТИПЫ ГРАФИКОВ (УПРОЩЕННЫЕ)
// ============================================

class BarChart extends BaseChart {
    constructor(canvasId, config = {}) {
        super(canvasId, {
            type: 'bar',
            ...config
        });
        console.log(`BarChart создан для: ${canvasId}`);
    }
}

class PieChart extends BaseChart {
    constructor(canvasId, config = {}) {
        super(canvasId, {
            type: 'pie',
            ...config
        });
		
		// Переопределяем конфигурацию для pie chart
        this.config.options = {
            ...this.config.options,
            scales: {},  // Убираем оси для pie chart
            plugins: {
                ...this.config.options.plugins,
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            family: this.theme.typography.fontFamily,
                            size: 12
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                    const dataset = data.datasets[0];
                                    const value = dataset.data[i];
                                    const color = dataset.backgroundColor[i];
                                    
                                    return {
                                        text: `${label}: ${ChartUtils.formatCurrency(value)}`,
                                        fillStyle: color,
                                        strokeStyle: color,
                                        lineWidth: 1,
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
                            return [];
                        }
                    }
                }
            }
        };
		
        console.log(`PieChart создан для: ${canvasId}`);
    }
}

class LineChart extends BaseChart {
    constructor(canvasId, config = {}) {
        super(canvasId, {
            type: 'line',
            ...config
        });
        console.log(`LineChart создан для: ${canvasId}`);
    }
}

// ============================================
// 6. ФАБРИКА ГРАФИКОВ (ИСПРАВЛЕННАЯ)
// ============================================

class ChartFactory {
    /**
     * Создание графика распределения по категориям
     */
    static createCategoryDistribution(purchases, categories, options = {}) {
        console.log('ChartFactory: создание графика категорий');
        
        const dataProcessor = new DataProcessor();
        const processedData = dataProcessor.processCategoryData(purchases, categories);
        
        console.log('Обработанные данные:', processedData);
        
        return {
            type: options.type || 'bar',
            data: processedData,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Расходы по категориям',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: options.type === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => ChartUtils.formatCurrency(value)
                        }
                    }
                } : undefined
            }
        };
    }
    
    /**
     * Создание графика месячных расходов
     */
    static createMonthlyExpenses(purchases, options = {}) {
        console.log('ChartFactory: создание месячного графика');
        
        const dataProcessor = new DataProcessor();
        const processedData = dataProcessor.processMonthlyData(purchases);
        
        return {
            type: options.type || 'bar',
            data: processedData,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Месячные расходы',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => ChartUtils.formatCurrency(value)
                        }
                    }
                }
            }
        };
    }
    
    /**
     * Создание графика сравнения магазинов
     */
    static createStoreComparison(purchases, stores, options = {}) {
        console.log('ChartFactory: создание графика магазинов');
        
        const dataProcessor = new DataProcessor();
        const processedData = dataProcessor.processStoreData(purchases, stores);
        
        return {
            type: options.type || 'bar',
            data: processedData,
            options: {
                indexAxis: options.horizontal ? 'y' : 'x',
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Сравнение магазинов',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => ChartUtils.formatCurrency(value)
                        }
                    }
                }
            }
        };
    }
    
    /**
     * Создание графика динамики расходов
     */
    static createExpenseTrend(purchases, options = {}) {
        console.log('ChartFactory: создание графика тренда');
        
        const dataProcessor = new DataProcessor();
        const processedData = dataProcessor.processTrendData(purchases, options.period);
        
        return {
            type: 'line',
            data: processedData,
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Динамика расходов',
                        font: { size: 16, weight: 'bold' }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => ChartUtils.formatCurrency(value)
                        }
                    }
                }
            }
        };
    }
}

// ============================================
// 7. ГЛАВНЫЙ КЛАСС CHART MANAGER (ИСПРАВЛЕННЫЙ)
// ============================================

class ChartManager {
    constructor() {
        this.charts = new Map();
		this.chartPairs = new Map(); // Новое: хранилище пар
        this.theme = ChartThemes.getDefaultTheme();
        this.dataProcessor = new DataProcessor();
		this.unifiedProcessor = new UnifiedDataProcessor(); // Новый процессор
        
        console.log('ChartManager инициализирован с поддержкой пар графиков');
    }
	
	/**
     * Создание пары графиков (основной метод)
     */
    createChartPair(leftCanvasId, rightCanvasId, dataType, purchases, additionalData = [], options = {}) {
        console.log(`Создание пары графиков: ${dataType}`);
        
        // Обрабатываем данные через UnifiedDataProcessor
        const processedData = this.unifiedProcessor.process(
            dataType, 
            purchases, 
            additionalData, 
            options
        );
        
        // Создаем пару графиков
        const pair = new ChartPair(leftCanvasId, rightCanvasId, options);
        const charts = pair.create(processedData, options);
        
        // Сохраняем пару
        this.chartPairs.set(`${leftCanvasId}-${rightCanvasId}`, pair);
        
        return charts;
    }
    
    /**
     * Создание пары графиков по категориям
     */
    createCategoryPair(canvasIds, purchases, categories, options = {}) {
        // Определяем индексную ось в зависимости от типа графика
		const indexAxis = options.type === 'horizontalBar' ? 'y' : 'x';
		
		return this.createChartPair(
            canvasIds.left || 'left-chart',
            canvasIds.right || 'right-chart',
            'categories',
            purchases,
            categories,
            { 
                ...options,
                type: options.type || 'horizontalBar', // Используем переданный тип
                indexAxis: indexAxis,
				leftTitle: options.leftTitle || 'Сумма расходов по категориям',
                rightTitle: options.rightTitle || 'Количество покупок по категориям'
            }
        );
    }
    
    /**
     * Создание пары графиков по месяцам
     */
    createMonthlyPair(canvasIds, purchases, options = {}) {
        // Для месяцев вертикальная гистограмма по умолчанию
		const defaultType = options.type || 'bar';
		const indexAxis = defaultType === 'horizontalBar' ? 'y' : 'x';
		
		return this.createChartPair(
            canvasIds.left || 'left-chart',
            canvasIds.right || 'right-chart',
            'months',
            purchases,
            [],
            { 
                ...options,
                type: defaultType,
				indexAxis: indexAxis,
				leftTitle: options.leftTitle || 'Месячные расходы',
				rightTitle: options.rightTitle || 'Количество покупок по месяцам'
			}
        );
    }
    
    /**
     * Создание пары графиков по годам
     */
    createYearlyPair(canvasIds, purchases, options = {}) {
        // Для годов вертикальная гистограмма по умолчанию
		const defaultType = options.type || 'bar';
		const indexAxis = defaultType === 'horizontalBar' ? 'y' : 'x';
		
		return this.createChartPair(
            canvasIds.left || 'left-chart',
            canvasIds.right || 'right-chart',
            'years',
            purchases,
            [],
            { 
                ...options,
				type: defaultType,
				indexAxis: indexAxis,
				leftTitle: options.leftTitle || 'Годовые расходы',
				rightTitle: options.rightTitle || 'Количество покупок по годам'
			}
        );
    }
	
	/**
	 * Создание пары графиков по магазинам
	 */
	createStorePair(canvasIds, purchases, stores, options = {}) {
		// Для магазинов вертикальная гистограмма по умолчанию
		const indexAxis = options.type === 'horizontalBar' ? 'y' : 'x';
		
		return this.createChartPair(
			canvasIds.left || 'left-chart',
			canvasIds.right || 'right-chart',
			'stores',
			purchases,
			stores,
			{ 
				...options,
				type: options.type || 'horizontalBar', // Используем переданный тип
				indexAxis: indexAxis,
				leftTitle: options.leftTitle || 'ТОП-10 магазинов по сумме',
				rightTitle: options.rightTitle || 'ТОП-10 магазинов по количеству',
				limit: options.limit || 10
			}
		);
	}
	
	/**
	 * Создание пары графиков по товарам
	 */
	createProductPair(canvasIds, purchases, options = {}) {
		// Определяем индексную ось в зависимости от типа графика
		const indexAxis = options.type === 'horizontalBar' ? 'y' : 'x';
		
		return this.createChartPair(
			canvasIds.left || 'left-chart',
			canvasIds.right || 'right-chart',
			'products',
			purchases,
			[],
			{ 
				...options,
				type: options.type || 'horizontalBar', // Используем переданный тип
				indexAxis: indexAxis,
				leftTitle: options.leftTitle || 'ТОП-10 товаров по сумме',
				rightTitle: options.rightTitle || 'ТОП-10 товаров по количеству',
				limit: options.limit || 10
			}
		);
	}
    
    /**
     * Создание графика - ОСНОВНОЙ ИСПРАВЛЕННЫЙ МЕТОД
     */
    createChart(canvasId, type = 'bar', data = null, customConfig = {}) {
        console.log(`ChartManager.createChart: ${canvasId}, type: ${type}`);
        console.log('Полученные данные:', data);
        
        try {
            let chart;
            
            // Выбираем тип графика
            switch (type.toLowerCase()) {
                case 'bar':
                    chart = new BarChart(canvasId, customConfig);
                    break;
                    
                case 'pie':
                    chart = new PieChart(canvasId, customConfig);
                    break;
                    
                case 'line':
                    chart = new LineChart(canvasId, customConfig);
                    break;
                    
                case 'doughnut':
                    chart = new PieChart(canvasId, { ...customConfig, options: { cutout: '50%' } });
                    break;
                    
                default:
                    console.warn(`Тип графика "${type}" не поддерживается, используется bar`);
                    chart = new BarChart(canvasId, customConfig);
            }
            
            // Создаем график
            const chartInstance = chart.create(data);
            
            // Сохраняем в коллекции
            this.charts.set(canvasId, chart);
            
            console.log(`Создан график: ${canvasId} (тип: ${type})`);
            return chartInstance;
            
        } catch (error) {
            console.error(`Ошибка создания графика ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Создание графика через фабрику - ИСПРАВЛЕННЫЙ МЕТОД
     */
    createChartFromFactory(canvasId, chartType, data, options = {}) {
        console.log(`ChartManager.createChartFromFactory: ${canvasId}, ${chartType}`);
        console.log('Входные данные:', data);
        
        try {
            let config;
            
            switch (chartType) {
                case 'category-distribution':
                    config = ChartFactory.createCategoryDistribution(
                        data.purchases, 
                        data.categories, 
                        options
                    );
                    break;
                    
                case 'monthly-expenses':
                    config = ChartFactory.createMonthlyExpenses(
                        data.purchases,
                        options
                    );
                    break;
                    
                case 'store-comparison':
                    config = ChartFactory.createStoreComparison(
                        data.purchases,
                        data.stores,
                        options
                    );
                    break;
                    
                case 'expense-trend':
                    config = ChartFactory.createExpenseTrend(
                        data.purchases,
                        options
                    );
                    break;
                    
                default:
                    throw new Error(`Тип графика "${chartType}" не поддерживается фабрикой`);
            }
            
            console.log('Конфигурация из фабрики:', config);
            
            // Создаем график
            return this.createChart(canvasId, config.type, config.data, config.options);
            
        } catch (error) {
            console.error(`Ошибка создания графика через фабрику:`, error);
            return null;
        }
    }
    
    /**
     * Создание графика распределения по категориям (простой метод)
     */
    createCategoryChart(canvasId, purchases, categories, type = 'bar') {
        console.log('ChartManager.createCategoryChart');
        return this.createChartFromFactory(canvasId, 'category-distribution', {
            purchases,
            categories
        }, { type });
    }
    
    /**
     * Создание графика месячных расходов (простой метод)
     */
    createMonthlyChart(canvasId, purchases, type = 'bar') {
        console.log('ChartManager.createMonthlyChart');
        return this.createChartFromFactory(canvasId, 'monthly-expenses', {
            purchases
        }, { type });
    }
    
    /**
     * Создание графика сравнения магазинов (простой метод)
     */
    createStoreChart(canvasId, purchases, stores, type = 'bar') {
        console.log('ChartManager.createStoreChart');
        return this.createChartFromFactory(canvasId, 'store-comparison', {
            purchases,
            stores
        }, { type });
    }
    
    /**
     * Обновление графика
     */
    updateChart(canvasId, newData) {
        const chart = this.charts.get(canvasId);
        if (!chart) {
            console.warn(`График ${canvasId} не найден для обновления`);
            return null;
        }
        
        return chart.update(newData);
    }
    
    /**
     * Уничтожение графика
     */
    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.destroy();
            this.charts.delete(canvasId);
            console.log(`График ${canvasId} уничтожен`);
        }
    }
	
	/**
     * Уничтожение пар графиков
     */
	destroyChartPair(leftCanvasId, rightCanvasId) {
		const pairKey = `${leftCanvasId}-${rightCanvasId}`;
		const pair = this.chartPairs.get(pairKey);
		
		if (pair) {
			pair.destroy();
			this.chartPairs.delete(pairKey);
		}
		
		// Также уничтожаем отдельные графики
		this.destroyChart(leftCanvasId);
		this.destroyChart(rightCanvasId);
	} 
    
    /**
     * Уничтожение всех графиков
     */
    destroyAll() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
        console.log('Все графики уничтожены');
    }
	
	//** ЭКСПОРТ ГРАФИКОВ **//
    /**
	 * Экспорт графика в PNG
	 */
	exportChartToPNG(canvasId, options = {}) {
		const canvas = document.getElementById(canvasId);
		if (!canvas) {
			console.error(`Canvas ${canvasId} не найден`);
			return null;
		}
		
		const chart = canvas.chartInstance;
		if (!chart) {
			console.error(`График ${canvasId} не найден`);
			return null;
		}
		
		// Опции экспорта
		const exportOptions = {
			filename: options.filename || this.generateExportFilename(canvasId),
			quality: options.quality || 1.0,
			backgroundColor: options.backgroundColor || 'white',
			padding: options.padding || 20,
			includeTitle: options.includeTitle !== false,
			includeLegend: options.includeLegend !== false,
			...options
		};
		
		// Создаем временный canvas для экспорта
		const exportCanvas = this.createExportCanvas(canvas, chart, exportOptions);
		
		// Экспортируем
		return this.downloadCanvasAsPNG(exportCanvas, exportOptions.filename, exportOptions.quality);
	}

	/**
	 * Создание canvas для экспорта с улучшениями
	 */
	createExportCanvas(originalCanvas, chart, options) {
		const originalWidth = originalCanvas.width;
		const originalHeight = originalCanvas.height;
		
		// Увеличиваем размер для лучшего качества
		const scale = 2; // 2x для retina/печати
		const width = originalWidth * scale;
		const height = originalHeight * scale;
		const padding = options.padding * scale;
		
		// Создаем временный canvas
		const exportCanvas = document.createElement('canvas');
		exportCanvas.width = width + (padding * 2);
		exportCanvas.height = height + (padding * 2) + (options.includeTitle ? 60 * scale : 0);
		
		const ctx = exportCanvas.getContext('2d');
		
		// Заливаем фон
		ctx.fillStyle = options.backgroundColor;
		ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
		
		// Добавляем заголовок если нужно
		let yOffset = padding;
		if (options.includeTitle) {
			this.addTitleToExport(ctx, chart, exportCanvas.width, scale, yOffset);
			yOffset += 50 * scale;
		}
		
		// Копируем оригинальный график
		ctx.drawImage(
			originalCanvas,
			0, 0, originalWidth, originalHeight,
			padding, yOffset, width, height
		);
		
		// Добавляем легенду если нужно
		if (options.includeLegend && chart.legend && chart.legend.legendItems) {
			this.addLegendToExport(ctx, chart, exportCanvas.width, scale, yOffset + height + 10);
		}
		
		// Добавляем подпись с датой
		this.addFooterToExport(ctx, exportCanvas.width, exportCanvas.height, scale);
		
		return exportCanvas;
	}

	/**
	 * Добавление заголовка к экспорту
	 */
	addTitleToExport(ctx, chart, width, scale, yOffset) {
		const title = chart.options?.plugins?.title?.text || 
					  chart.canvas?.closest('.chart-container')?.querySelector('h3')?.textContent ||
					  'График покупок';
		
		ctx.fillStyle = '#333';
		ctx.font = `${24 * scale}px ${ChartThemes.getDefaultTheme().typography.fontFamily}`;
		ctx.textAlign = 'center';
		ctx.fillText(title, width / 2, yOffset + (30 * scale));
		
		// Подзаголовок с датой
		ctx.fillStyle = '#666';
		ctx.font = `${14 * scale}px ${ChartThemes.getDefaultTheme().typography.fontFamily}`;
		const dateStr = new Date().toLocaleDateString('ru-RU', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
		ctx.fillText(`Сгенерировано: ${dateStr}`, width / 2, yOffset + (50 * scale));
	}

	/**
	 * Добавление легенды к экспорту
	 */
	addLegendToExport(ctx, chart, width, scale, yOffset) {
		const legend = chart.legend;
		if (!legend || !legend.legendItems || legend.legendItems.length === 0) return;
		
		const itemsPerRow = Math.min(legend.legendItems.length, 4);
		const itemWidth = width / itemsPerRow;
		const itemHeight = 30 * scale;
		
		legend.legendItems.forEach((item, index) => {
			const row = Math.floor(index / itemsPerRow);
			const col = index % itemsPerRow;
			
			const x = col * itemWidth + (20 * scale);
			const y = yOffset + (row * itemHeight);
			
			// Цветной квадрат
			ctx.fillStyle = item.fillStyle;
			ctx.fillRect(x, y, 20 * scale, 20 * scale);
			
			// Текст
			ctx.fillStyle = '#333';
			ctx.font = `${12 * scale}px ${ChartThemes.getDefaultTheme().typography.fontFamily}`;
			ctx.textAlign = 'left';
			ctx.fillText(item.text, x + (30 * scale), y + (15 * scale));
		});
	}

	/**
	 * Добавление подвала к экспорту
	 */
	addFooterToExport(ctx, width, height, scale) {
		ctx.fillStyle = '#999';
		ctx.font = `${10 * scale}px ${ChartThemes.getDefaultTheme().typography.fontFamily}`;
		ctx.textAlign = 'right';
		ctx.fillText('Shopping Tracker © ' + new Date().getFullYear(), width - (20 * scale), height - (10 * scale));
	}

	/**
	 * Генерация имени файла
	 */
	generateExportFilename(canvasId) {
		const chartType = currentChartType || 'chart';
		const viewType = currentViewType || 'bar';
		const date = new Date();
		const timestamp = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}-${date.getMinutes().toString().padStart(2,'0')}`;
		
		return `shopping_chart_${chartType}_${viewType}_${canvasId}_${timestamp}.png`;
	}

	/**
	 * Скачивание canvas как PNG
	 */
	downloadCanvasAsPNG(canvas, filename, quality = 1.0) {
		return new Promise((resolve, reject) => {
			try {
				canvas.toBlob(blob => {
					const url = URL.createObjectURL(blob);
					const link = document.createElement('a');
					link.download = filename;
					link.href = url;
					
					// Триггер скачивания
					document.body.appendChild(link);
					link.click();
					document.body.removeChild(link);
					
					// Очистка
					setTimeout(() => URL.revokeObjectURL(url), 100);
					
					resolve(filename);
					
					// Показываем уведомление
					this.showExportNotification(filename);
				}, 'image/png', quality);
			} catch (error) {
				console.error('Ошибка экспорта:', error);
				reject(error);
			}
		});
	}

	/**
	 * Экспорт обоих графиков как коллаж
	 */
	exportBothChartsAsCollage(options = {}) {
		const leftCanvas = document.getElementById('left-chart');
		const rightCanvas = document.getElementById('right-chart');
		
		if (!leftCanvas || !rightCanvas) {
			console.error('Не найдены оба canvas');
			return;
		}
		
		const leftChart = leftCanvas.chartInstance;
		const rightChart = rightCanvas.chartInstance;
		
		if (!leftChart || !rightChart) {
			console.error('Не найдены оба графика');
			return;
		}
		
		// Размеры
		const scale = 1.5;
		const padding = 30 * scale;
		const chartWidth = Math.max(leftCanvas.width, rightCanvas.width) * scale;
		const chartHeight = Math.max(leftCanvas.height, rightCanvas.height) * scale;
		
		// Создаем canvas для коллажа
		const collageCanvas = document.createElement('canvas');
		collageCanvas.width = (chartWidth * 2) + (padding * 3);
		collageCanvas.height = chartHeight + (padding * 2) + (80 * scale); // + заголовок
		
		const ctx = collageCanvas.getContext('2d');
		
		// Фон
		ctx.fillStyle = options.backgroundColor || 'white';
		ctx.fillRect(0, 0, collageCanvas.width, collageCanvas.height);
		
		// Заголовок коллажа
		const title = `Сравнительный анализ: ${this.getChartTypeName(currentChartType)}`;
		ctx.fillStyle = '#333';
		ctx.font = `${28 * scale}px ${ChartThemes.getDefaultTheme().typography.fontFamily}`;
		ctx.textAlign = 'center';
		ctx.fillText(title, collageCanvas.width / 2, padding + (40 * scale));
		
		// Левый график
		ctx.drawImage(
			leftCanvas,
			0, 0, leftCanvas.width, leftCanvas.height,
			padding, padding + (80 * scale), chartWidth, chartHeight
		);
		
		// Правый график
		ctx.drawImage(
			rightCanvas,
			0, 0, rightCanvas.width, rightCanvas.height,
			padding * 2 + chartWidth, padding + (80 * scale), chartWidth, chartHeight
		);
		
		// Подписи под графиками
		ctx.fillStyle = '#666';
		ctx.font = `${16 * scale}px ${ChartThemes.getDefaultTheme().typography.fontFamily}`;
		ctx.textAlign = 'center';
		
		const leftTitle = document.querySelector('#left-chart-title')?.textContent || 'Левый график';
		const rightTitle = document.querySelector('#right-chart-title')?.textContent || 'Правый график';
		
		ctx.fillText(leftTitle, padding + (chartWidth / 2), padding + (80 * scale) + chartHeight + (30 * scale));
		ctx.fillText(rightTitle, padding * 2 + chartWidth + (chartWidth / 2), padding + (80 * scale) + chartHeight + (30 * scale));
		
		// Подвал
		this.addFooterToExport(ctx, collageCanvas.width, collageCanvas.height, scale);
		
		// Экспортируем
		const filename = `shopping_collage_${currentChartType}_${new Date().toISOString().slice(0,10)}.png`;
		return this.downloadCanvasAsPNG(collageCanvas, filename, options.quality || 1.0);
	}

	/**
	 * Получение читаемого имени типа графика
	 */
	getChartTypeName(type) {
		const names = {
			'categories': 'по категориям',
			'months': 'по месяцам',
			'years': 'по годам',
			'stores': 'по магазинам',
			'products': 'по товарам'
		};
		
		return names[type] || type;
	}

	/**
	 * Уведомление об успешном экспорте
	 */
	showExportNotification(filename) {
		const notification = document.createElement('div');
		notification.className = 'export-notification';
		notification.innerHTML = `
			<div class="notification-content">
				<strong>✅ График экспортирован</strong>
				<div>Файл: <code>${filename}</code></div>
				<small>Проверьте папку "Загрузки"</small>
			</div>
		`;
		
		notification.style.cssText = `
			position: fixed;
			bottom: 20px;
			right: 20px;
			background: #27ae60;
			color: white;
			padding: 15px;
			border-radius: 8px;
			box-shadow: 0 4px 12px rgba(0,0,0,0.2);
			z-index: 1000;
			animation: slideUp 0.3s ease-out;
			max-width: 300px;
		`;
		
		// Анимация
		const style = document.createElement('style');
		style.textContent = `
			@keyframes slideUp {
				from { transform: translateY(100%); opacity: 0; }
				to { transform: translateY(0); opacity: 1; }
			}
			@keyframes slideDown {
				from { transform: translateY(0); opacity: 1; }
				to { transform: translateY(100%); opacity: 0; }
			}
		`;
		document.head.appendChild(style);
		
		document.body.appendChild(notification);
		
		// Автоудаление через 5 секунд
		setTimeout(() => {
			notification.style.animation = 'slideDown 0.3s ease-out';
			setTimeout(() => {
				if (notification.parentNode) {
					notification.parentNode.removeChild(notification);
				}
			}, 300);
		}, 5000);
	}
    
    /**
     * Получение графика по ID
     */
    getChart(canvasId) {
        return this.charts.get(canvasId);
    }
}

// ============================================
// УНИФИЦИРОВАННЫЙ ОБРАБОТЧИК ДАННЫХ (ДЛЯ AMOUNT/COUNT)
// ============================================

class UnifiedDataProcessor {
    constructor() {
        console.log('UnifiedDataProcessor initialized');
    }
    
    /**
     * Основной метод обработки - возвращает данные для пар графиков
     * @param {string} dataType - 'categories', 'months', 'years', 'stores', 'products'
     * @param {Array} purchases - массив покупок
     * @param {Array} additionalData - категории, магазины и т.д.
     * @param {Object} options - настройки
     * @returns {Object} { amountData, countData }
     */
    process(dataType, purchases, additionalData = [], options = {}) {
        console.log(`UnifiedDataProcessor.process: ${dataType}, покупок: ${purchases?.length}`);
        
        if (!purchases || purchases.length === 0) {
            return {
                amountData: { labels: [], datasets: [] },
                countData: { labels: [], datasets: [] }
            };
        }
        
        switch(dataType) {
            case 'categories':
                return this._processCategories(purchases, additionalData, options);
            case 'months':
                return this._processMonths(purchases, options);
            case 'years':
                return this._processYears(purchases, options);
            case 'stores':
                return this._processStores(purchases, additionalData, options);
            case 'products':
                return this._processProducts(purchases, options);
            default:
                throw new Error(`Неизвестный тип данных: ${dataType}`);
        }
    }
    
    /**
     * Обработка категорий - горизонтальная гистограмма
     */
    _processCategories(purchases, categories, options = {}) {
        const stats = {};
        const limit = options.limit || 0; // Без лимита
        
        // Собираем статистику
        purchases.forEach(purchase => {
            const catId = purchase.category_id;
            if (!catId) return;
            
            if (!stats[catId]) {
                const category = categories.find(c => c.id == catId);
                stats[catId] = {
                    id: catId,
                    name: category ? `${category.icon} ${category.name}` : `Категория #${catId}`,
                    color: category ? category.color : ChartThemes.getCategoryColor(null, catId),
                    amount: 0,
                    count: 0,
                    sortOrder: category ? category.sort_order : 999
                };
            }
            
            stats[catId].amount += parseFloat(purchase.amount) || 0;
            stats[catId].count += 1;
        });
        
        // Преобразуем в массивы
        let items = Object.values(stats);
        
		// Сортировка по сумме (для amount):
		const amountSorted = limit > 0 ? 
			[...items].sort((a, b) => b.amount - a.amount).slice(0, limit) :
			[...items].sort((a, b) => b.amount - a.amount);
		
		// Сортировка по количеству (для count):
		const countSorted = limit > 0 ? 
			[...items].sort((a, b) => b.count - a.count).slice(0, limit) :
			[...items].sort((a, b) => b.count - a.count);
		
        // Формируем данные для amount (сумма)
        const amountData = {
            labels: amountSorted.map(item => item.name),
            datasets: [{
                label: 'Сумма расходов, ₽',
                data: amountSorted.map(item => item.amount),
                backgroundColor: amountSorted.map(item => item.color),
                borderColor: amountSorted.map(item => ChartUtils.darkenColor(item.color, 0.2)),
                borderWidth: 1
            }]
        };
        
        // Формируем данные для count (количество)
        const countData = {
            labels: countSorted.map(item => item.name),
            datasets: [{
                label: 'Количество покупок',
                data: countSorted.map(item => item.count),
                backgroundColor: countSorted.map(item => item.color),
                borderColor: countSorted.map(item => ChartUtils.darkenColor(item.color, 0.2)),
                borderWidth: 1
            }]
        };
        
        return { amountData, countData };
    }
    
    /**
     * Обработка месяцев - вертикальная гистограмма
     */
    _processMonths(purchases, options = {}) {
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        
        const stats = {};
        
        // Инициализируем все месяцы
        for (let i = 1; i <= 12; i++) {
            stats[i] = {
                month: i,
                name: monthNames[i-1],
                amount: 0,
                count: 0
            };
        }
        
        // Собираем статистику
        purchases.forEach(purchase => {
            if (!purchase.date) return;
            
            const date = new Date(purchase.date);
            const month = date.getMonth() + 1; // 1-12
            
            stats[month].amount += parseFloat(purchase.amount) || 0;
            stats[month].count += 1;
        });
        
        // Преобразуем в массивы (уже отсортированы по месяцам)
        const items = Object.values(stats);
        
        // Формируем данные для amount (сумма)
        const amountData = {
            labels: items.map(item => item.name),
            datasets: [{
                label: 'Сумма расходов, ₽',
                data: items.map(item => item.amount),
                backgroundColor: '#3498db',
                borderColor: '#2980b9',
                borderWidth: 1
            }]
        };
        
        // Формируем данные для count (количество)
        const countData = {
            labels: items.map(item => item.name),
            datasets: [{
                label: 'Количество покупок',
                data: items.map(item => item.count),
                backgroundColor: '#2ecc71',
                borderColor: '#27ae60',
                borderWidth: 1
            }]
        };
        
        return { amountData, countData };
    }
    
    /**
     * Обработка годов
     */
    _processYears(purchases, options = {}) {
        const stats = {};
        
        // Собираем статистику
        purchases.forEach(purchase => {
            if (!purchase.date) return;
            
            const date = new Date(purchase.date);
            const year = date.getFullYear();
            
            if (!stats[year]) {
                stats[year] = {
                    year: year,
                    name: `${year} год`,
                    amount: 0,
                    count: 0
                };
            }
            
            stats[year].amount += parseFloat(purchase.amount) || 0;
            stats[year].count += 1;
        });
        
        // Сортируем по году
        const items = Object.values(stats).sort((a, b) => a.year - b.year);
        
        // Формируем данные
        const amountData = {
            labels: items.map(item => item.name),
            datasets: [{
                label: 'Сумма расходов, ₽',
                data: items.map(item => item.amount),
                backgroundColor: '#e74c3c',
                borderColor: '#c0392b',
                borderWidth: 1
            }]
        };
        
        const countData = {
            labels: items.map(item => item.name),
            datasets: [{
                label: 'Количество покупок',
                data: items.map(item => item.count),
                backgroundColor: '#9b59b6',
                borderColor: '#8e44ad',
                borderWidth: 1
            }]
        };
        
        return { amountData, countData };
    }
    
    /**
     * Обработка ТОП магазинов
     */
	_processStores(purchases, stores, options = {}) {
		const limit = options.limit || 10;
		const stats = {};
		
		// Собираем статистику
		purchases.forEach(purchase => {
			const storeId = purchase.store_id;
			if (!storeId) return;
			
			if (!stats[storeId]) {
				const store = stores.find(s => s.id == storeId);
				stats[storeId] = {
					id: storeId,
					name: store ? store.shop : `Магазин #${storeId}`,
					city: store ? store.city_name : '',
					amount: 0,
					count: 0
				};
			}
			
			stats[storeId].amount += parseFloat(purchase.amount) || 0;
			stats[storeId].count += 1;
		});
		
		// Преобразуем в массивы и сортируем
		let items = Object.values(stats);
		
		// Сортируем по сумме (для amount) или количеству (для count)
		const amountSorted = [...items]
			.sort((a, b) => b.amount - a.amount)
			.slice(0, limit);
		
		const countSorted = [...items]
			.sort((a, b) => b.count - a.count)
			.slice(0, limit);
		
		// Генерируем цвета для магазинов
		const generateStoreColors = (items) => {
			return items.map((item, index) => {
				// Используем разные цвета для магазинов
				const storeColors = [
					'#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
					'#EF476F', '#FFD166', '#06D6A0', '#073B4C', '#7209B7'
				];
				return storeColors[index % storeColors.length];
			});
		};
		
		// Формируем данные для amount (сумма)
		const amountData = {
			labels: amountSorted.map(item => {
				// Сокращаем длинные названия магазинов
				const name = item.name.length > 20 ? 
					item.name.substring(0, 20) + '...' : 
					item.name;
				return `${name} (${item.city || '?'})`;
			}),
			datasets: [{
				label: 'Сумма покупок, ₽',
				data: amountSorted.map(item => item.amount),
				backgroundColor: generateStoreColors(amountSorted),
				borderColor: generateStoreColors(amountSorted).map(color => 
					ChartUtils.darkenColor(color, 0.2)
				),
				borderWidth: 1
			}]
		};
		
		// Формируем данные для count (количество)
		const countData = {
			labels: countSorted.map(item => {
				const name = item.name.length > 20 ? 
					item.name.substring(0, 20) + '...' : 
					item.name;
				return `${name} (${item.city || '?'})`;
			}),
			datasets: [{
				label: 'Количество покупок',
				data: countSorted.map(item => item.count),
				backgroundColor: generateStoreColors(countSorted),
				borderColor: generateStoreColors(countSorted).map(color => 
					ChartUtils.darkenColor(color, 0.2)
				),
				borderWidth: 1
			}]
		};
		
		console.log(`Обработано магазинов: ${items.length}, показано: ${limit}`);
		
		return { amountData, countData };
	}
    
	/**
     * Обработка ТОП товаров
     */
    _processProducts(purchases, options = {}) {
		const limit = options.limit || 10;
		const stats = {};
		
		// Собираем статистику по названиям товаров
		purchases.forEach(purchase => {
			const productName = purchase.name;
			if (!productName) return;
			
			const key = productName.toLowerCase().trim();
			
			if (!stats[key]) {
				stats[key] = {
					name: productName,
					amount: 0,
					count: 0,
					unit: purchase.item || 'шт.',
					lastPrice: parseFloat(purchase.price) || 0,
					lastDate: purchase.date
				};
			}
			
			stats[key].amount += parseFloat(purchase.amount) || 0;
			stats[key].count += 1;
			
			// Обновляем последнюю цену и дату
			if (purchase.date > stats[key].lastDate) {
				stats[key].lastPrice = parseFloat(purchase.price) || 0;
				stats[key].lastDate = purchase.date;
			}
		});
		
		// Преобразуем в массивы и сортируем
		let items = Object.values(stats);
		
		// Сортируем по сумме (для amount) или количеству (для count)
		const amountSorted = [...items]
			.sort((a, b) => b.amount - a.amount)
			.slice(0, limit);
		
		const countSorted = [...items]
			.sort((a, b) => b.count - a.count)
			.slice(0, limit);
		
		// Генерируем цвета для товаров
		const generateProductColors = (items) => {
			return items.map((item, index) => {
				const productColors = [
					'#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
					'#EF476F', '#FF9A00', '#00C896', '#6A11CB', '#2575FC'
				];
				return productColors[index % productColors.length];
			});
		};
		
		// Формируем метки с дополнительной информацией
		const createProductLabel = (item, showPrice = false) => {
			let label = item.name;
			
			// Сокращаем длинные названия
			if (label.length > 25) {
				label = label.substring(0, 25) + '...';
			}
			
			// Добавляем единицу измерения
			label += ` (${item.unit})`;
			
			// Можно добавить последнюю цену
			if (showPrice && item.lastPrice > 0) {
				label += ` ~${ChartUtils.formatCurrency(item.lastPrice)}`;
			}
			
			return label;
		};
		
		// Формируем данные для amount (сумма)
		const amountData = {
			labels: amountSorted.map(item => createProductLabel(item, true)),
			datasets: [{
				label: 'Сумма покупок, ₽',
				data: amountSorted.map(item => item.amount),
				backgroundColor: generateProductColors(amountSorted),
				borderColor: generateProductColors(amountSorted).map(color => 
					ChartUtils.darkenColor(color, 0.2)
				),
				borderWidth: 1
			}]
		};
		
		// Формируем данные для count (количество)
		const countData = {
			labels: countSorted.map(item => createProductLabel(item)),
			datasets: [{
				label: 'Количество покупок',
				data: countSorted.map(item => item.count),
				backgroundColor: generateProductColors(countSorted),
				borderColor: generateProductColors(countSorted).map(color => 
					ChartUtils.darkenColor(color, 0.2)
				),
				borderWidth: 1
			}]
		};
		
		console.log(`Обработано товаров: ${items.length}, показано: ${limit}`);
		
		return { amountData, countData };
	}
    
    /**
     * Фильтрация покупок по году
     */
    filterByYear(purchases, year) {
        if (!year || year === 'all') return purchases;
        
        return purchases.filter(purchase => {
            if (!purchase.date) return false;
            const date = new Date(purchase.date);
            return date.getFullYear() == year;
        });
    }
    
    /**
     * Фильтрация покупок по году и месяцу
     */
    filterByYearMonth(purchases, year, month) {
        if (!year || !month) return purchases;
        
        return purchases.filter(purchase => {
            if (!purchase.date) return false;
            const date = new Date(purchase.date);
            return date.getFullYear() == year && (date.getMonth() + 1) == month;
        });
    }
    
    /**
     * Получение списка уникальных годов из покупок
     */
    getAvailableYears(purchases) {
        const years = new Set();
        
        purchases.forEach(purchase => {
            if (purchase.date) {
                const date = new Date(purchase.date);
                years.add(date.getFullYear());
            }
        });
        
        return Array.from(years).sort((a, b) => b - a); // Сортировка по убыванию
    }
	
	/**
     * Получение для фильтрации только существующие комбинации месяц-год
     */
	getAvailableMonths(purchases, year) {
		const months = new Set();
		
		purchases.forEach(purchase => {
			if (purchase.date) {
				const date = new Date(purchase.date);
				if (!year || date.getFullYear() == year) {
					months.add(date.getMonth() + 1); // 1-12
				}
			}
		});
		
		// Сортируем и возвращаем с названиями
		const monthNames = [
			'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
			'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
		];
		
		return Array.from(months)
			.sort((a, b) => a - b)
			.map(month => ({
				value: month,
				name: monthNames[month - 1]
			}));
	}
}

// ============================================
// КЛАСС ДЛЯ УПРАВЛЕНИЯ ПАРОЙ ГРАФИКОВ
// ============================================

class ChartPair {
    constructor(leftCanvasId, rightCanvasId, options = {}) {
        this.leftCanvasId = leftCanvasId;
        this.rightCanvasId = rightCanvasId;
        this.leftChart = null;
        this.rightChart = null;
        
        this.config = {
            type: options.type || 'bar', // 'bar', 'horizontalBar', 'pie'
            leftTitle: options.leftTitle || 'Сумма расходов',
            rightTitle: options.rightTitle || 'Количество покупок',
            showAmount: options.showAmount !== false,
            showCount: options.showCount !== false,
            indexAxis: options.indexAxis // 'x' или 'y' для гистограмм
        };
        
        console.log(`ChartPair создан: ${leftCanvasId} + ${rightCanvasId}`);
    }
    
    /**
     * Создание пары графиков
     */
    create(dataPair, customOptions = {}) {
        const options = { ...this.config, ...customOptions };
        
        // Уничтожаем старые графики
        this.destroy();
		
		// Также удаляем из chartManager
		chartManager.destroyChart(this.leftCanvasId);
		chartManager.destroyChart(this.rightCanvasId);
        
        // Левый график - сумма
        if (options.showAmount && dataPair.amountData) {
            const chartOptions = this._getChartOptions('left', options);
            this.leftChart = this._createSingleChart(
                this.leftCanvasId, 
                dataPair.amountData, 
                chartOptions
            );
            
            // Обновляем заголовок
            this._updateChartTitle(this.leftCanvasId, options.leftTitle);
        }
        
        // Правый график - количество
        if (options.showCount && dataPair.countData) {
            const chartOptions = this._getChartOptions('right', options);
            this.rightChart = this._createSingleChart(
                this.rightCanvasId, 
                dataPair.countData, 
                chartOptions
            );
            
            // Обновляем заголовок
            this._updateChartTitle(this.rightCanvasId, options.rightTitle);
        }
        
        return { left: this.leftChart, right: this.rightChart };
    }
    
    /**
     * Создание одиночного графика
     */
    _createSingleChart(canvasId, data, options) {
		try {
			// УНИЧТОЖАЕМ старый график если он существует
			const existingChart = chartManager.getChart(canvasId);
			if (existingChart) {
				existingChart.destroy();
			}
			
			let chart;
			const chartType = options.type;
			
			if (chartType === 'horizontalBar') {
				// Горизонтальная гистограмма с правильными метками
				chart = new BarChart(canvasId, {
					type: 'bar',
					options: {
						responsive: true,
						maintainAspectRatio: false,
						indexAxis: 'y', // КЛЮЧЕВОЙ ПАРАМЕТР
						plugins: {
							legend: { display: false },
							tooltip: {
								callbacks: {
									label: (context) => {
										const value = context.raw || 0;
										if (options.isAmountChart) {
											return ChartUtils.formatCurrency(value);
										}
										return ChartUtils.formatNumber(value, 0) + ' шт.';
									}
								}
							}
						},
						scales: {
							x: {
								beginAtZero: true,
								ticks: {
									callback: (value) => {
										if (options.isAmountChart) {
											return ChartUtils.formatCurrency(value);
										}
										return ChartUtils.formatNumber(value, 0);
									}
								}
							},
							y: {
								ticks: {
									autoSkip: false,
									padding: 10,
									font: {
										size: 12
									},
									// Используем коллбек для получения меток
									callback: function(value, index) {
										// Получаем метку из данных графика
										const chart = this.chart;
										if (chart && chart.data && chart.data.labels) {
											return chart.data.labels[index];
										}
										return '';
									}
								},
								grid: {
									drawBorder: false,
									display: true
								}
							}
						},
						layout: {
							padding: {
								left: 5 // Отступ слева для длинных названий категорий
							}
						}
					}
				});
			} else if (chartType === 'bar') {
				// Вертикальная гистограмма
				chart = new BarChart(canvasId, {
					type: 'bar',
					options: {
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: { display: false },
							tooltip: {
								callbacks: {
									label: (context) => {
										const value = context.raw || 0;
										if (options.isAmountChart) {
											return ChartUtils.formatCurrency(value);
										}
										return ChartUtils.formatNumber(value, 0) + ' шт.';
									}
								}
							}
						},
						scales: {
							y: {
								beginAtZero: true,
								ticks: {
									callback: (value) => {
										if (options.isAmountChart) {
											return ChartUtils.formatCurrency(value);
										}
										return ChartUtils.formatNumber(value, 0);
									}
								}
							},
							x: {
								ticks: {
									autoSkip: false,
									maxRotation: 45
								},
								grid: {
									display: false
								}
							}
						}
					}
				});
			} else {
				// Другие типы графиков
				chart = chartType === 'pie' ? new PieChart(canvasId) : new BarChart(canvasId);
			}
			
			// Создаем график
			const chartInstance = chart.create(data);
			
			// Сохраняем в менеджере
			if (chartInstance) {
				chartManager.charts.set(canvasId, chart);
			}
			
			return chartInstance;
			
		} catch (error) {
			console.error(`Ошибка создания графика ${canvasId}:`, error);
			return null;
		}
	}
    
    /**
     * Получение настроек для конкретного графика
     */
    _getChartOptions(side, pairOptions) {
        const isLeft = side === 'left';
        
        return {
            type: pairOptions.type,
            indexAxis: pairOptions.indexAxis,
            isAmountChart: isLeft,
            // Дополнительные настройки в зависимости от типа
        };
    }
    
    /**
     * Общие настройки для графиков
     */
    _getCommonOptions() {
        return {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false // Легенду убираем, так как у нас только один набор данных
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.raw || 0;
                            
                            if (label.includes('Сумма') || label.includes('₽')) {
                                return `${label}: ${ChartUtils.formatCurrency(value)}`;
                            }
                            return `${label}: ${ChartUtils.formatNumber(value, 0)}`;
                        }
                    }
                }
            }
        };
    }
    
    /**
     * Обновление заголовка графика
     */
    _updateChartTitle(canvasId, title) {
        const container = document.getElementById(canvasId).closest('.chart-container');
        if (container) {
            const titleElement = container.querySelector('h3');
            if (titleElement) {
                titleElement.textContent = title;
            }
        }
    }
    
    /**
     * Обновление данных
     */
    update(dataPair) {
        if (this.leftChart && dataPair.amountData) {
            this.leftChart.update(dataPair.amountData);
        }
        if (this.rightChart && dataPair.countData) {
            this.rightChart.update(dataPair.countData);
        }
    }
    
    /**
     * Уничтожение графиков
     */
    destroy() {
        if (this.leftChart) {
            this.leftChart.destroy();
            this.leftChart = null;
        }
        if (this.rightChart) {
            this.rightChart.destroy();
            this.rightChart = null;
        }
    }
    
    /**
     * Экспорт графиков
     */
    exportToPNG(filenamePrefix = 'chart-pair') {
        const leftName = `${filenamePrefix}-left-${new Date().toISOString().slice(0, 10)}.png`;
        const rightName = `${filenamePrefix}-right-${new Date().toISOString().slice(0, 10)}.png`;
        
        if (this.leftChart) this.leftChart.exportToPNG(leftName);
        if (this.rightChart) this.rightChart.exportToPNG(rightName);
        
        return { left: leftName, right: rightName };
    }
}

// ============================================
// 8. ИНИЦИАЛИЗАЦИЯ И ГЛОБАЛЬНЫЙ ДОСТУП
// ============================================

// Проверяем загрузку Chart.js
if (typeof Chart === 'undefined') {
    console.error('Chart.js не загружен! Подключите библиотеку перед charts.js');
} else {
    console.log('Chart.js загружен, версия:', Chart.version);
}

// Создаем глобальный экземпляр ChartManager
console.log('Создание глобального ChartManager...');
window.chartManager = new ChartManager();
console.log('ChartManager готов к использованию');