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
    processCategoryData(purchases, categories) {
        console.log('DataProcessor: обработка данных категорий');
        console.log('Покупок:', purchases?.length, 'Категорий:', categories?.length);
        
        const categoryStats = {};
        
        purchases.forEach(purchase => {
            const categoryId = purchase.category_id;
            if (!categoryId) return;
            
            if (!categoryStats[categoryId]) {
                const category = categories.find(c => c.id == categoryId);
                categoryStats[categoryId] = {
                    name: category ? `${category.icon} ${category.name}` : `Категория #${categoryId}`,
                    amount: 0,
                    color: category ? category.color : ChartThemes.getCategoryColor(null, categoryId)
                };
            }
            
            categoryStats[categoryId].amount += parseFloat(purchase.amount) || 0;
        });
        
        // Сортируем по сумме
        const sorted = Object.values(categoryStats).sort((a, b) => b.amount - a.amount);
        
        console.log('Обработано категорий:', sorted.length);
        if (sorted.length > 0) {
            console.log('Первая категория:', sorted[0].name, sorted[0].amount);
        }
        
        // ВАЖНО: Возвращаем в формате Chart.js
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
        this.canvasId = canvasId;
        this.theme = ChartThemes.getDefaultTheme();
        this.config = this.mergeConfigs(config);
        this.chart = null;
        this.dataLabelsEnabled = true;
        
        // Проверяем существование canvas
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas элемент с id "${canvasId}" не найден`);
            throw new Error(`Canvas элемент с id "${canvasId}" не найден`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        console.log(`BaseChart инициализирован для: ${canvasId}`);
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
        return {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
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
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
                        cornerRadius: 6,
                        displayColors: true,
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                
                                if (label.toLowerCase().includes('сумма') || 
                                    label.toLowerCase().includes('руб') ||
                                    label.toLowerCase().includes('₽')) {
                                    return `${label}: ${ChartUtils.formatCurrency(value)}`;
                                }
                                
                                return `${label}: ${ChartUtils.formatNumber(value, 2)}`;
                            }
                        }
                    }
                }
            }
        };
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
        console.log('rawData:', rawData);
        
        if (!rawData) {
            console.log('Нет данных, возвращаем пустые');
            return {
                labels: [],
                datasets: []
            };
        }
        
        // Если rawData уже в формате Chart.js (labels и datasets)
        if (rawData.labels && rawData.datasets) {
            console.log('Данные уже в формате Chart.js, возвращаем как есть');
            console.log('labels:', rawData.labels?.length);
            console.log('datasets:', rawData.datasets?.length);
            if (rawData.datasets && rawData.datasets[0]) {
                console.log('Первые данные:', rawData.datasets[0].data?.slice(0, 3));
            }
            return rawData;
        }
        
        // Если это объект с другим форматом (например, из DataProcessor)
        if (rawData.labels && rawData.amounts) {
            console.log('Конвертируем из формата DataProcessor в Chart.js');
            return {
                labels: rawData.labels,
                datasets: [{
                    label: rawData.datasetLabel || 'Данные',
                    data: rawData.amounts,
                    backgroundColor: rawData.colors || this.theme.palette,
                    borderColor: rawData.colors ? 
                        rawData.colors.map(color => ChartUtils.darkenColor(color, 0.2)) : 
                        this.theme.palette.map(color => ChartUtils.darkenColor(color, 0.2)),
                    borderWidth: 1
                }]
            };
        }
        
        console.warn('BaseChart.prepareData: неизвестный формат данных');
        console.log('Тип данных:', typeof rawData);
        console.log('Ключи:', Object.keys(rawData || {}));
        
        return {
            labels: [],
            datasets: []
        };
    }
    
    /**
     * Создание графика
     */
    create(data = null) {
        console.log(`BaseChart.create для ${this.canvasId}`);
        
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
            
            if (this.config.data?.datasets?.[0]?.data) {
                console.log('Первые 3 значения:', this.config.data.datasets[0].data.slice(0, 3));
            }
            
            // Создаем график
            this.chart = new Chart(this.ctx, this.config);
            
            // Сохраняем ссылку на график в canvas
            this.canvas.chartInstance = this.chart;
            
            console.log(`График создан: ${this.canvasId}`);
            console.log('Chart instance:', this.chart);
            
            return this.chart;
            
        } catch (error) {
            console.error(`Ошибка создания графика ${this.canvasId}:`, error);
            throw error;
        }
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
        this.theme = ChartThemes.getDefaultTheme();
        this.dataProcessor = new DataProcessor();
        
        console.log('ChartManager инициализирован');
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
     * Уничтожение всех графиков
     */
    destroyAll() {
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
        console.log('Все графики уничтожены');
    }
    
    /**
     * Экспорт графика в PNG
     */
    exportChart(canvasId, filename = null) {
        const chart = this.charts.get(canvasId);
        if (!chart) {
            console.warn(`График ${canvasId} не найден для экспорта`);
            return null;
        }
        
        return chart.exportToPNG(filename);
    }
    
    /**
     * Получение графика по ID
     */
    getChart(canvasId) {
        return this.charts.get(canvasId);
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