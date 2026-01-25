/**
 * Shopping Tracker - Enhanced Chart Manager
 * Этап 1: Новая архитектура
 */
// ============================================
// ПЛАГИН ДЛЯ ПОДПИСЕЙ ДАННЫХ (Datalabels)
// ============================================

class DataLabelsPlugin {
    /**
     * Регистрация плагина для Chart.js
     */
    static getPlugin() {
        return {
            id: 'customDataLabels',
            afterDatasetsDraw: (chart, args, options) => {
                this.drawDataLabels(chart, options);
            }
        };
    }
    
    /**
     * Отрисовка подписей данных
     */
    static drawDataLabels(chart, options = {}) {
        const ctx = chart.ctx;
        const meta = chart.getDatasetMeta(0);
        
        if (!meta || !meta.data) return;
        
        // Настройки по умолчанию
        const defaults = {
            display: true,
            color: '#333333',
            font: {
                family: "'Segoe UI', 'Roboto', sans-serif",
                size: 12,
                weight: 'bold'
            },
            align: 'center',
            anchor: 'center',
            offset: 0,
            formatter: (value) => ChartUtils.formatNumber(value)
        };
        
        const config = { ...defaults, ...options };
        
        // Если отображение отключено
        if (config.display === false) return;
        
        ctx.save();
        ctx.font = `${config.font.weight} ${config.font.size}px ${config.font.family}`;
        ctx.fillStyle = config.color;
        ctx.textAlign = config.align;
        ctx.textBaseline = 'middle';
        
        meta.data.forEach((element, index) => {
            const value = chart.data.datasets[0].data[index];
            
            // Пропускаем нулевые значения
            if (!value || value === 0) return;
            
            const formattedValue = config.formatter(value, chart, index);
            const position = this.calculateLabelPosition(element, config);
            
            // Рисуем фон для лучшей читаемости (опционально)
            if (config.background) {
                ctx.save();
                ctx.fillStyle = config.background.color || 'rgba(255, 255, 255, 0.7)';
                const textWidth = ctx.measureText(formattedValue).width;
                const padding = config.background.padding || 4;
                ctx.fillRect(
                    position.x - textWidth / 2 - padding,
                    position.y - config.font.size / 2 - padding,
                    textWidth + padding * 2,
                    config.font.size + padding * 2
                );
                ctx.restore();
            }
            
            // Рисуем текст
            ctx.fillText(formattedValue, position.x, position.y);
            
            // Рисуем выноску если нужно
            if (position.leaderLine) {
                ctx.beginPath();
                ctx.moveTo(position.originalX, position.originalY);
                ctx.lineTo(position.x, position.y);
                ctx.strokeStyle = config.leaderLineColor || '#333333';
                ctx.lineWidth = config.leaderLineWidth || 1;
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
    
    /**
     * Расчет позиции для подписи
     */
    static calculateLabelPosition(element, config) {
        const { x, y, width, height, tooltipPosition } = element;
        
        let labelX = x;
        let labelY = y;
        let leaderLine = false;
        let originalX = x;
        let originalY = y;
        
        switch (config.anchor) {
            case 'center':
                labelX = x;
                labelY = y;
                break;
                
            case 'end':
                if (element instanceof Chart.elements.Arc) {
                    // Для круговых диаграмм
                    const angle = element.endAngle - (element.endAngle - element.startAngle) / 2;
                    const radius = element.outerRadius * 1.1; // 10% за пределами сегмента
                    labelX = x + Math.cos(angle) * radius;
                    labelY = y + Math.sin(angle) * radius;
                    leaderLine = true;
                    originalX = x + Math.cos(angle) * element.outerRadius;
                    originalY = y + Math.sin(angle) * element.outerRadius;
                } else {
                    // Для столбчатых диаграмм
                    labelY = y - config.offset - 10;
                }
                break;
                
            case 'start':
                labelY = y - config.offset - 10;
                break;
                
            default:
                labelX = x;
                labelY = y - config.offset - 10;
        }
        
        return { x: labelX, y: labelY, leaderLine, originalX, originalY };
    }
}

// Регистрируем плагин если Chart доступен
if (typeof Chart !== 'undefined') {
    Chart.register(DataLabelsPlugin.getPlugin());
}


// ============================================
// КОНСТАНТЫ И УТИЛИТЫ
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
     * Определение оптимального размера шрифта
     */
    static getOptimalFontSize(containerWidth, baseSize = 12) {
        if (containerWidth < 400) return baseSize - 2;
        if (containerWidth < 600) return baseSize - 1;
        if (containerWidth > 1200) return baseSize + 2;
        return baseSize;
    }
}

// ============================================
// ТЕМЫ И ЦВЕТОВЫЕ ПАЛИТРЫ
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
            
            // Цветовая палитра для категорий (расширенная)
            palette: [
                '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
                '#EF476F', '#FFD166', '#06D6A0', '#073B4C', '#7209B7',
                '#F94144', '#F3722C', '#F8961E', '#F9C74F', '#90BE6D',
                '#43AA8B', '#577590', '#277DA1', '#F72585', '#7209B7',
                '#3A0CA3', '#4361EE', '#4CC9F0', '#4895EF', '#560BAD'
            ],
            
            // Стили графиков
            chart: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: '#dee2e6',
                borderWidth: 1,
                borderRadius: 6
            },
            
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
            },
            chart: {
                ...defaultTheme.chart,
                backgroundColor: 'rgba(255, 255, 255, 1)',
                borderColor: '#dadce0',
                borderWidth: 2
            },
            typography: {
                ...defaultTheme.typography,
                fontColor: '#202124'
            },
            grid: {
                ...defaultTheme.grid,
                color: 'rgba(0, 0, 0, 0.1)',
                borderColor: 'rgba(0, 0, 0, 0.2)'
            }
        };
    }
    
    /**
     * Получение цвета для категории по имени или индексу
     */
    static getCategoryColor(categoryName, index = 0) {
        const theme = this.getDefaultTheme();
        
        // Фиксированные цвета для часто встречающихся категорий
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
        
        // Если категории нет в фиксированных, берем из палитры по индексу
        return theme.palette[index % theme.palette.length];
    }
}


// ============================================
// БАЗОВЫЙ КЛАСС ДЛЯ ВСЕХ ГРАФИКОВ
// ============================================

class BaseChart {
    constructor(canvasId, config = {}) {
        this.canvasId = canvasId;
        this.theme = ChartThemes.getDefaultTheme();
        this.config = this.mergeConfigs(config); // Теперь theme уже инициализирована
        this.chart = null;
        this.dataLabelsEnabled = true;
        
        // Проверяем существование canvas
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error(`Canvas элемент с id "${canvasId}" не найден`);
            throw new Error(`Canvas элемент с id "${canvasId}" не найден`);
        }
        
        this.ctx = this.canvas.getContext('2d');
		this.initializeEventListeners();
    }
	
	/**
     * Инициализация темы с защитой от undefined
     */
    initializeTheme(themeConfig) {
        const defaultTheme = ChartThemes.getDefaultTheme();
        
        if (themeConfig) {
            return {
                ...defaultTheme,
                ...themeConfig,
                typography: {
                    ...defaultTheme.typography,
                    ...themeConfig.typography
                },
                grid: {
                    ...defaultTheme.grid,
                    ...themeConfig.grid
                }
            };
        }
        
        return defaultTheme;
    }
	
	/**
     * Инициализация обработчиков событий
     */
    initializeEventListeners() {
        // Для будущей интерактивности
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
            this.canvas.addEventListener('mousemove', (e) => this.onCanvasHover(e));
        }
    }
	
	/**
     * Обработчик клика по canvas
     */
    onCanvasClick(event) {
        console.log(`Клик по графику ${this.canvasId}`, event);
        
        // Если график существует, можно добавить интерактивность
        if (this.chart) {
            const points = this.chart.getElementsAtEventForMode(
                event, 
                'nearest', 
                { intersect: true }, 
                true
            );
            
            if (points.length > 0) {
                const firstPoint = points[0];
                const datasetIndex = firstPoint.datasetIndex;
                const index = firstPoint.index;
                
                const label = this.chart.data.labels[index];
                const value = this.chart.data.datasets[datasetIndex].data[index];
                
                console.log(`Клик по элементу: ${label} = ${value}`);
                
                // В Этапе 3 здесь будет фильтрация таблицы
                // this.triggerFilter(label, datasetIndex);
            }
        }
    }
    
    /**
     * Обработчик наведения мыши
     */
    onCanvasHover(event) {
        // Базовая реализация - ничего не делаем
        // В Этапе 3 можно добавить подсветку элементов
    }
    
    /**
     * Расширенное объединение конфигураций (базовая + пользовательская)
     */
    mergeConfigs(userConfig) {
		// Инициализируем тему если еще не инициализирована
        if (!this.theme) {
            this.theme = ChartThemes.getDefaultTheme();
        }
		
        const defaultConfig = this.getDefaultConfig();
        const merged = this.deepMerge(defaultConfig, userConfig);
        
        // Применяем тему к конфигурации
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
    
    /**
     * Проверка, является ли значение объектом
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }
    
    /**
     * Применение темы к конфигурации
     */
    applyThemeToConfig(config) {
        if (!config.options) config.options = {};
        if (!config.options.plugins) config.options.plugins = {};
        
        // Настройка подписей данных
        if (this.dataLabelsEnabled) {
            config.options.plugins.customDataLabels = this.getDataLabelsConfig();
        }
        
        // Настройка сетки
        if (!config.options.scales) config.options.scales = {};
        
        // Применяем цвета темы
        this.applyThemeColors(config);
    }
    
    /**
     * Конфигурация для подписей данных
     */
    getDataLabelsConfig() {
        return {
            display: true,
            color: this.theme.typography.fontColor,
            font: {
                family: this.theme.typography.fontFamily,
                size: this.theme.typography.fontSize,
                weight: 'bold'
            },
            align: 'center',
            anchor: 'center',
            offset: 0,
            background: {
                color: 'rgba(255, 255, 255, 0.7)',
                padding: 4,
                borderRadius: 3
            },
            formatter: (value, context) => {
                return this.formatDataLabel(value, context);
            },
            displayCondition: (context) => {
                return this.shouldDisplayLabel(context);
            }
        };
    }
    
    /**
     * Форматирование подписи данных
     */
    formatDataLabel(value, context) {
        const chart = context.chart;
        const datasetIndex = context.datasetIndex;
        const dataIndex = context.dataIndex;
        
        // Определяем тип данных
        const dataset = chart.data.datasets[datasetIndex];
        const label = dataset.label || '';
        
        // Для валютных значений
        if (label.toLowerCase().includes('сумма') || 
            label.toLowerCase().includes('руб') ||
            label.toLowerCase().includes('₽')) {
            return ChartUtils.formatCurrency(value, '₽');
        }
        
        // Для процентных значений
        if (label.toLowerCase().includes('%') || 
            label.toLowerCase().includes('процент')) {
            return ChartUtils.formatPercentage(value / 100);
        }
        
        // Для количественных значений
        return ChartUtils.formatNumber(value);
    }
    
    /**
     * Условие отображения подписи
     */
    shouldDisplayLabel(context) {
        const value = context.dataset.data[context.dataIndex];
        const chart = context.chart;
        
        // Не отображаем нулевые значения
        if (!value || value === 0) return false;
        
        // Для круговых диаграмм скрываем маленькие сегменты
        if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
            const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            const percentage = (value / total) * 100;
            return percentage >= 3; // Показываем только сегменты > 3%
        }
        
        // Для столбчатых диаграмм скрываем маленькие столбцы
        if (chart.config.type === 'bar') {
            const maxValue = Math.max(...chart.data.datasets[0].data);
            return value >= maxValue * 0.05; // Показываем только > 5% от максимума
        }
        
        return true;
    }
    
    /**
     * Применение цветов темы
     */
    applyThemeColors(config) {
        // Применяем цвета к dataset если не заданы пользователем
        if (config.data && config.data.datasets) {
            config.data.datasets.forEach((dataset, index) => {
                if (!dataset.backgroundColor && !dataset.borderColor) {
                    dataset.backgroundColor = this.theme.palette[index % this.theme.palette.length];
                    dataset.borderColor = this.theme.palette[index % this.theme.palette.length];
                }
                
                // Настройки по умолчанию для разных типов графиков
                switch (config.type) {
                    case 'line':
                        dataset.borderWidth = dataset.borderWidth || 2;
                        dataset.pointRadius = dataset.pointRadius || 4;
                        dataset.pointHoverRadius = dataset.pointHoverRadius || 6;
                        dataset.fill = dataset.fill || false;
                        break;
                        
                    case 'bar':
                        dataset.borderWidth = dataset.borderWidth || 1;
                        dataset.borderRadius = dataset.borderRadius || 3;
                        break;
                        
                    case 'pie':
                    case 'doughnut':
                        dataset.borderWidth = dataset.borderWidth || 1;
                        break;
                }
            });
        }
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
                        callbacks: this.getTooltipCallbacks()
                    }
                }
            }
        };
    }
    
    /**
     * Колбэки для всплывающих подсказок
     */
    getTooltipCallbacks() {
        return {
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
        };
    }
    
    /**
     * Создание графика
     */
    create(data = null) {
        try {
			console.log(`BaseChart.create for ${this.canvasId}`);
			console.log('Data passed:', data);
			
            // Уничтожаем старый график если существует
            this.destroy();
            
            // Подготавливаем данные если переданы
            if (data) {
				console.log('Preparing data...');
                this.config.data = this.prepareData(data);
				console.log('Prepared data:', this.config.data);
			} else {
				console.log('No data provided');
            }
            
			// Проверяем конфигурацию
			console.log('Final config:', {
				type: this.config.type,
				dataLabels: this.config.data?.labels?.length,
				datasets: this.config.data?.datasets?.length
			});
			
            // Создаем график
            this.chart = new Chart(this.ctx, this.config);
			console.log('Chart.js chart created:', this.chart);
            
            // Сохраняем ссылку на график в canvas
            this.canvas.chartInstance = this.chart;
            
            console.log(`График создан: ${this.canvasId}`);
            return this.chart;
            
        } catch (error) {
            console.error(`Ошибка создания графика ${this.canvasId}:`, error);
            throw error;
        }
    }
    
    /**
     * Подготовка данных (должен быть переопределен в дочерних классах)
     */
    prepareData(rawData) {
        return {
            labels: [],
            datasets: []
        };
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
        this.chart.update('none'); // 'none', 'show', 'hide', 'reset', 'active'
        
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
        
        // Создаем временный canvas для экспорта
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = this.canvas.width;
        exportCanvas.height = this.canvas.height;
        
        const exportCtx = exportCanvas.getContext('2d');
        
        // Белый фон для экспорта
        exportCtx.fillStyle = 'white';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        
        // Копируем график
        exportCtx.drawImage(this.canvas, 0, 0);
        
        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.download = filename;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();
        
        return filename;
    }
    
    /**
     * Получение текущих данных графика
     */
    getData() {
        return this.chart ? this.chart.data : null;
    }
    
    /**
     * Получение текущих настроек графика
     */
    getConfig() {
        return this.config;
    }
}

// ============================================
// ИНТЕРАКТИВНЫЕ ВОЗМОЖНОСТИ ГРАФИКОВ
// ============================================

class InteractiveFeatures {
    /**
     * Инициализация интерактивности для графика
     */
    static initChartInteractivity(chartInstance, callbacks = {}) {
        if (!chartInstance || !chartInstance.canvas) return;
        
        const canvas = chartInstance.canvas;
        const chart = chartInstance.chart;
        
        // Добавляем класс для интерактивности
        canvas.classList.add('interactive-chart');
        
        // Сохраняем колбэки
        chartInstance.interactivityCallbacks = callbacks;
        
        // Обновляем обработчики событий
        canvas.removeEventListener('click', chartInstance.onCanvasClick);
        canvas.removeEventListener('mousemove', chartInstance.onCanvasHover);
        
        chartInstance.onCanvasClick = (e) => this.handleChartClick(e, chartInstance);
        chartInstance.onCanvasHover = (e) => this.handleChartHover(e, chartInstance);
        
        canvas.addEventListener('click', chartInstance.onCanvasClick);
        canvas.addEventListener('mousemove', chartInstance.onCanvasHover);
        
        // Добавляем контекстное меню
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e, chartInstance);
        });
    }
    
    /**
     * Обработка клика по графику
     */
    static handleChartClick(event, chartInstance) {
        const chart = chartInstance.chart;
        if (!chart) return;
        
        const points = chart.getElementsAtEventForMode(
            event, 
            'nearest', 
            { intersect: true }, 
            true
        );
        
        if (points.length > 0) {
            const firstPoint = points[0];
            const datasetIndex = firstPoint.datasetIndex;
            const index = firstPoint.index;
            
            const clickedData = this.getClickedData(chart, datasetIndex, index);
            
            // Вызываем колбэк если есть
            if (chartInstance.interactivityCallbacks.onClick) {
                chartInstance.interactivityCallbacks.onClick(clickedData, event);
            }
            
            // Подсветка элемента
            this.highlightElement(chart, datasetIndex, index);
            
            // Фильтрация основной таблицы (если приложение доступно)
            this.filterMainTable(clickedData);
        } else {
            // Сброс фильтров при клике в пустое место
            this.resetFilters();
        }
    }
    
    /**
     * Получение данных кликнутого элемента
     */
    static getClickedData(chart, datasetIndex, index) {
        const dataset = chart.data.datasets[datasetIndex];
        const label = chart.data.labels[index];
        const value = dataset.data[index];
        const color = dataset.backgroundColor[index] || dataset.backgroundColor;
        
        return {
            label,
            value,
            color,
            datasetLabel: dataset.label || '',
            datasetIndex,
            index,
            rawData: chart.data
        };
    }
    
    /**
     * Подсветка элемента графика
     */
    static highlightElement(chart, datasetIndex, index) {
        // Сбрасываем предыдущую подсветку
        chart.data.datasets.forEach((dataset, dsIndex) => {
            if (dataset.hoverBackgroundColor) {
                dataset.backgroundColor = dataset.originalBackgroundColor || dataset.backgroundColor;
                delete dataset.originalBackgroundColor;
            }
        });
        
        // Сохраняем оригинальные цвета
        const dataset = chart.data.datasets[datasetIndex];
        if (!dataset.originalBackgroundColor) {
            dataset.originalBackgroundColor = [...dataset.backgroundColor];
        }
        
        // Подсвечиваем выбранный элемент
        if (Array.isArray(dataset.backgroundColor)) {
            dataset.backgroundColor = dataset.backgroundColor.map((color, i) => 
                i === index ? this.darkenColor(color, 0.3) : this.lightenColor(color, 0.3)
            );
        } else {
            dataset.backgroundColor = this.darkenColor(dataset.backgroundColor, 0.3);
        }
        
        dataset.hoverBackgroundColor = dataset.backgroundColor;
        
        chart.update();
        
        // Автоматическое снятие подсветки через 3 секунды
        setTimeout(() => {
            if (dataset.originalBackgroundColor) {
                dataset.backgroundColor = dataset.originalBackgroundColor;
                delete dataset.originalBackgroundColor;
                delete dataset.hoverBackgroundColor;
                chart.update();
            }
        }, 3000);
    }
    
    /**
     * Фильтрация основной таблицы
     */
    static filterMainTable(clickedData) {
        if (!window.shoppingApp || !window.filterManager) return;
        
        // Определяем тип фильтрации по метке графика
        const label = clickedData.datasetLabel.toLowerCase();
        
        if (label.includes('категори') || clickedData.label.includes('🚗') || 
            clickedData.label.includes('🏠') || clickedData.label.includes('🛒')) {
            
            // Фильтрация по категории
            const categoryName = clickedData.label.replace(/[^\w\s]/g, '').trim();
            const categories = window.shoppingApp.categoriesCache || [];
            const category = categories.find(c => 
                c.name === categoryName || 
                `${c.icon} ${c.name}` === clickedData.label
            );
            
            if (category && window.filterManager) {
                window.filterManager.setFilters({ category: category.id });
                window.filterManager.notifyFilterChange();
            }
            
        } else if (label.includes('магазин') || label.includes('store')) {
            
            // Фильтрация по магазину
            const stores = window.shoppingApp.storesCache || [];
            const store = stores.find(s => s.shop === clickedData.label);
            
            if (store && window.filterManager) {
                window.filterManager.setFilters({ store: store.id });
                window.filterManager.notifyFilterChange();
            }
            
        } else if (label.includes('месяц') || label.includes('month')) {
            
            // Фильтрация по дате
            const monthMatch = clickedData.label.match(/(\w+)\s+(\d{4})/);
            if (monthMatch && window.filterManager) {
                const monthNames = {
                    'январь': '01', 'февраль': '02', 'март': '03',
                    'апрель': '04', 'май': '05', 'июнь': '06',
                    'июль': '07', 'август': '08', 'сентябрь': '09',
                    'октябрь': '10', 'ноябрь': '11', 'декабрь': '12'
                };
                
                const month = monthNames[monthMatch[1].toLowerCase()];
                const year = monthMatch[2];
                
                if (month) {
                    const dateFrom = `${year}-${month}-01`;
                    const dateTo = `${year}-${month}-31`;
                    
                    window.filterManager.setFilters({ 
                        dateFrom, 
                        dateTo 
                    });
                    window.filterManager.notifyFilterChange();
                }
            }
        }
        
        // Показываем уведомление
        this.showFilterNotification(clickedData.label);
    }
    
    /**
     * Показать уведомление о фильтрации
     */
    static showFilterNotification(filterLabel) {
        // Создаем или находим контейнер для уведомлений
        let notificationContainer = document.getElementById('chart-filter-notification');
        
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'chart-filter-notification';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #3498db;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 300px;
                display: none;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(notificationContainer);
            
            // Добавляем стили для анимации
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        notificationContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>Фильтр применен:</strong><br>
                    <span style="font-size: 14px;">${filterLabel}</span>
                </div>
                <button onclick="this.parentElement.parentElement.style.display='none'" 
                        style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 10px;">
                    ×
                </button>
            </div>
            <div style="margin-top: 8px; font-size: 12px;">
                Кликните по графику для сброса
            </div>
        `;
        
        notificationContainer.style.display = 'block';
        
        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            if (notificationContainer.style.display !== 'none') {
                notificationContainer.style.display = 'none';
            }
        }, 5000);
    }
    
    /**
     * Сброс фильтров
     */
    static resetFilters() {
        if (window.filterManager) {
            window.filterManager.resetFilters();
        }
        
        // Скрываем уведомление
        const notification = document.getElementById('chart-filter-notification');
        if (notification) {
            notification.style.display = 'none';
        }
    }
    
    /**
     * Обработка наведения мыши
     */
    static handleChartHover(event, chartInstance) {
        const chart = chartInstance.chart;
        if (!chart) return;
        
        // Можно добавить дополнительную интерактивность при наведении
        // Например, увеличение точки на линейном графике
        
        // Вызываем колбэк если есть
        if (chartInstance.interactivityCallbacks.onHover) {
            const points = chart.getElementsAtEventForMode(
                event, 
                'nearest', 
                { intersect: true }, 
                true
            );
            
            if (points.length > 0) {
                const firstPoint = points[0];
                const clickedData = this.getClickedData(chart, firstPoint.datasetIndex, firstPoint.index);
                chartInstance.interactivityCallbacks.onHover(clickedData, event);
            }
        }
    }
    
    /**
     * Показать контекстное меню
     */
    static showContextMenu(event, chartInstance) {
        // Создаем контекстное меню
        const menu = document.createElement('div');
        menu.className = 'chart-context-menu';
        menu.style.cssText = `
            position: absolute;
            top: ${event.clientY}px;
            left: ${event.clientX}px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
            min-width: 150px;
        `;
        
        menu.innerHTML = `
            <div class="menu-item" data-action="export">📥 Экспорт в PNG</div>
            <div class="menu-item" data-action="copy">📋 Копировать данные</div>
            <div class="menu-item" data-action="reset">🔄 Сбросить фильтры</div>
            <hr style="margin: 5px 0;">
            <div class="menu-item" data-action="toggle-labels">👁️ Переключить подписи</div>
            <div class="menu-item" data-action="change-type">🔄 Изменить тип графика</div>
        `;
        
        document.body.appendChild(menu);
        
        // Обработчики для пунктов меню
        menu.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleContextMenuAction(e.target.dataset.action, chartInstance);
                menu.remove();
            });
            
            item.addEventListener('mouseenter', () => {
                item.style.background = '#f5f5f5';
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = 'white';
            });
        });
        
        // Закрытие меню при клике вне его
        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    }
    
    /**
     * Обработка действий контекстного меню
     */
    static handleContextMenuAction(action, chartInstance) {
        switch (action) {
            case 'export':
                chartInstance.exportToPNG();
                break;
                
            case 'copy':
                this.copyChartData(chartInstance);
                break;
                
            case 'reset':
                this.resetFilters();
                break;
                
            case 'toggle-labels':
                if (window.chartManager) {
                    const enabled = !chartInstance.dataLabelsEnabled;
                    window.chartManager.toggleDataLabels(chartInstance.canvasId, enabled);
                }
                break;
                
            case 'change-type':
                this.showChartTypeSelector(chartInstance);
                break;
        }
    }
    
    /**
     * Копирование данных графика в буфер обмена
     */
    static copyChartData(chartInstance) {
        const chart = chartInstance.chart;
        if (!chart) return;
        
        const data = chart.data;
        let csv = 'Категория,Значение\n';
        
        data.labels.forEach((label, index) => {
            const value = data.datasets[0].data[index];
            csv += `"${label}",${value}\n`;
        });
        
        navigator.clipboard.writeText(csv).then(() => {
            console.log('Данные скопированы в буфер обмена');
            this.showToast('Данные скопированы!', 'success');
        }).catch(err => {
            console.error('Ошибка копирования:', err);
        });
    }
    
    /**
     * Показать выбор типа графика
     */
    static showChartTypeSelector(chartInstance) {
        const types = ['bar', 'pie', 'line', 'doughnut'];
        const typeNames = {
            'bar': 'Столбчатая',
            'pie': 'Круговая',
            'line': 'Линейная',
            'doughnut': 'Кольцевая'
        };
        
        const selector = document.createElement('div');
        selector.className = 'chart-type-selector';
        selector.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1001;
            min-width: 200px;
        `;
        
        selector.innerHTML = `
            <h4 style="margin-top: 0;">Выберите тип графика</h4>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${types.map(type => `
                    <button onclick="window.chartManager.changeChartType('${chartInstance.canvasId}', '${type}')"
                            style="padding: 10px; text-align: left; background: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                        ${typeNames[type]}
                    </button>
                `).join('')}
            </div>
            <button onclick="this.parentElement.remove()"
                    style="margin-top: 15px; padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">
                Отмена
            </button>
        `;
        
        document.body.appendChild(selector);
        
        // Закрытие при клике вне
        setTimeout(() => {
            const closeSelector = (e) => {
                if (!selector.contains(e.target)) {
                    selector.remove();
                    document.removeEventListener('click', closeSelector);
                }
            };
            document.addEventListener('click', closeSelector);
        }, 0);
    }
    
    /**
     * Показать всплывающее сообщение
     */
    static showToast(message, type = 'info') {
        // Реализация toast-уведомлений
        console.log(`[${type}] ${message}`);
        alert(message); // Временная реализация
    }
    
    /**
     * Затемнение цвета
     */
    static darkenColor(color, amount) {
        const hex = color.replace('#', '');
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
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
        const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * amount));
        const b = Math.min(255, (num & 0x0000FF) + Math.round(255 * amount));
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
}

// ============================================
// СРАВНЕНИЕ ПЕРИОДОВ
// ============================================

class PeriodComparison {
    /**
     * Создание графика сравнения периодов
     */
    static createPeriodComparisonChart(canvasId, purchases, options = {}) {
        const periods = options.periods || ['current_month', 'previous_month'];
        const comparisonData = this.prepareComparisonData(purchases, periods);
        
        const datasets = periods.map((period, index) => {
            const periodData = comparisonData[period];
            const color = ChartThemes.getDefaultTheme().palette[index];
            
            return {
                label: periodData.label,
                data: periodData.categories.map(c => c.amount),
                backgroundColor: this.adjustColorOpacity(color, 0.7),
                borderColor: color,
                borderWidth: 1
            };
        });
        
        const config = {
            type: 'bar',
            data: {
                labels: comparisonData.categories,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Сравнение периодов'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const datasetLabel = context.dataset.label;
                                const category = context.label;
                                
                                return `${datasetLabel}: ${ChartUtils.formatCurrency(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => ChartUtils.formatCurrency(value)
                        }
                    }
                }
            }
        };
        
        return config;
    }
    
    /**
     * Подготовка данных для сравнения
     */
    static prepareComparisonData(purchases, periods) {
        const result = {
            categories: [],
            current_month: { label: 'Текущий месяц', categories: [] },
            previous_month: { label: 'Прошлый месяц', categories: [] },
            current_year: { label: 'Текущий год', categories: [] },
            previous_year: { label: 'Прошлый год', categories: [] }
        };
        
        // Получаем все уникальные категории
        const allCategories = new Set();
        purchases.forEach(purchase => {
            if (purchase.category_name) {
                allCategories.add(purchase.category_name);
            }
        });
        
        result.categories = Array.from(allCategories).sort();
        
        // Заполняем данные для каждого периода
        periods.forEach(period => {
            const periodData = this.getPeriodData(purchases, period);
            result.categories.forEach(category => {
                const amount = periodData[category] || 0;
                result[period].categories.push({
                    name: category,
                    amount: amount
                });
            });
        });
        
        return result;
    }
    
    /**
     * Получение данных для периода
     */
    static getPeriodData(purchases, period) {
        const now = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'current_month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
                
            case 'previous_month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
                
            case 'current_year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
                
            case 'previous_year':
                startDate = new Date(now.getFullYear() - 1, 0, 1);
                endDate = new Date(now.getFullYear() - 1, 11, 31);
                break;
                
            default:
                return {};
        }
        
        // Фильтруем покупки по периоду
        const periodPurchases = purchases.filter(purchase => {
            if (!purchase.date) return false;
            const purchaseDate = new Date(purchase.date);
            return purchaseDate >= startDate && purchaseDate <= endDate;
        });
        
        // Группируем по категориям
        const categoryData = {};
        periodPurchases.forEach(purchase => {
            if (purchase.category_name) {
                const category = purchase.category_name;
                const amount = parseFloat(purchase.amount) || 0;
                
                if (!categoryData[category]) {
                    categoryData[category] = 0;
                }
                
                categoryData[category] += amount;
            }
        });
        
        return categoryData;
    }
    
    /**
     * Расчет разницы между периодами
     */
    static calculatePeriodDifference(currentData, previousData, category) {
        const currentAmount = currentData[category] || 0;
        const previousAmount = previousData[category] || 0;
        
        if (previousAmount === 0) {
            return currentAmount > 0 ? 100 : 0;
        }
        
        const difference = ((currentAmount - previousAmount) / previousAmount) * 100;
        return difference;
    }
    
    /**
     * Создание графика разницы периодов
     */
    static createDifferenceChart(canvasId, purchases, options = {}) {
        const currentData = this.getPeriodData(purchases, 'current_month');
        const previousData = this.getPeriodData(purchases, 'previous_month');
        
        const allCategories = new Set([
            ...Object.keys(currentData),
            ...Object.keys(previousData)
        ]);
        
        const categories = Array.from(allCategories).sort();
        const differences = categories.map(category => 
            this.calculatePeriodDifference(currentData, previousData, category)
        );
        
        const config = {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: 'Изменение, %',
                    data: differences,
                    backgroundColor: differences.map(diff => 
                        diff > 0 ? '#27ae60' : '#e74c3c'
                    ),
                    borderColor: differences.map(diff => 
                        diff > 0 ? '#229954' : '#c0392b'
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Изменение расходов по категориям'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const diff = context.raw;
                                const category = context.label;
                                const current = currentData[category] || 0;
                                const previous = previousData[category] || 0;
                                
                                return [
                                    `Категория: ${category}`,
                                    `Текущий: ${ChartUtils.formatCurrency(current)}`,
                                    `Прошлый: ${ChartUtils.formatCurrency(previous)}`,
                                    `Изменение: ${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: (value) => `${value}%`
                        }
                    }
                }
            }
        };
        
        return config;
    }
    
    /**
     * Регулировка прозрачности цвета
     */
    static adjustColorOpacity(color, opacity) {
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
    }
}

// ============================================
// МЕНЕДЖЕР КОНФИГУРАЦИЙ ГРАФИКОВ
// ============================================

class ConfigurationManager {
    constructor() {
        this.storageKey = 'chartConfigurations';
        this.defaultConfigs = this.getDefaultConfigurations();
    }
    
    /**
     * Конфигурации по умолчанию
     */
    getDefaultConfigurations() {
        return {
            'category-distribution-bar': {
                type: 'bar',
                options: {
                    plugins: {
                        title: { display: true, text: 'Расходы по категориям' }
                    }
                }
            },
            'category-distribution-pie': {
                type: 'pie',
                options: {
                    plugins: {
                        title: { display: true, text: 'Распределение по категориям' }
                    }
                }
            },
            'monthly-expenses': {
                type: 'bar',
                options: {
                    plugins: {
                        title: { display: true, text: 'Месячные расходы' }
                    }
                }
            },
            'store-comparison': {
                type: 'bar',
                options: {
                    indexAxis: 'y',
                    plugins: {
                        title: { display: true, text: 'Сравнение магазинов' }
                    }
                }
            }
        };
    }
    
    /**
     * Сохранение конфигурации графика
     */
    saveChartConfiguration(chartId, config) {
        try {
            const allConfigs = this.loadAllConfigurations();
            allConfigs[chartId] = {
                ...config,
                savedAt: new Date().toISOString()
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(allConfigs));
            console.log(`Конфигурация сохранена: ${chartId}`);
            return true;
        } catch (error) {
            console.error('Ошибка сохранения конфигурации:', error);
            return false;
        }
    }
    
    /**
     * Загрузка конфигурации графика
     */
    loadChartConfiguration(chartId) {
        const allConfigs = this.loadAllConfigurations();
        return allConfigs[chartId] || this.defaultConfigs[chartId] || null;
    }
    
    /**
     * Загрузка всех конфигураций
     */
    loadAllConfigurations() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Ошибка загрузки конфигураций:', error);
            return {};
        }
    }
    
    /**
     * Удаление конфигурации
     */
    deleteChartConfiguration(chartId) {
        const allConfigs = this.loadAllConfigurations();
        if (allConfigs[chartId]) {
            delete allConfigs[chartId];
            localStorage.setItem(this.storageKey, JSON.stringify(allConfigs));
            console.log(`Конфигурация удалена: ${chartId}`);
            return true;
        }
        return false;
    }
    
    /**
     * Экспорт конфигураций в файл
     */
    exportConfigurations(filename = 'chart-configs.json') {
        const configs = this.loadAllConfigurations();
        const dataStr = JSON.stringify(configs, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', filename);
        link.click();
    }
    
    /**
     * Импорт конфигураций из файла
     */
    importConfigurations(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedConfigs = JSON.parse(e.target.result);
                    const currentConfigs = this.loadAllConfigurations();
                    const mergedConfigs = { ...currentConfigs, ...importedConfigs };
                    
                    localStorage.setItem(this.storageKey, JSON.stringify(mergedConfigs));
                    console.log('Конфигурации импортированы');
                    resolve(mergedConfigs);
                } catch (error) {
                    reject(new Error('Неверный формат файла'));
                }
            };
            
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsText(file);
        });
    }
    
    /**
     * Сброс всех конфигураций
     */
    resetAllConfigurations() {
        localStorage.removeItem(this.storageKey);
        console.log('Все конфигурации сброшены');
    }
}

// ============================================
// КОНКРЕТНЫЕ ТИПЫ ГРАФИКОВ
// ============================================

class BarChart extends BaseChart {
    constructor(canvasId, config = {}) {
		// Передаем theme в config перед вызовом super
        const theme = ChartThemes.getDefaultTheme();
        super(canvasId, {
            type: 'bar',
            ...config,
			theme: theme // Добавляем theme в config
        });
    }
    
    getDefaultConfig() {
        const baseConfig = super.getDefaultConfig();
		const theme = this.theme || ChartThemes.getDefaultTheme(); // Защита от undefined
        
        return {
            ...baseConfig,
            options: {
                ...baseConfig.options,
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: this.theme.grid.color,
                            drawBorder: this.theme.grid.drawBorder,
                            borderColor: this.theme.grid.borderColor
                        },
                        ticks: {
                            font: {
                                family: this.theme.typography.fontFamily,
                                size: this.theme.typography.fontSize
                            },
                            color: this.theme.typography.fontColor
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: this.theme.grid.color,
                            drawBorder: this.theme.grid.drawBorder,
                            borderColor: this.theme.grid.borderColor
                        },
                        ticks: {
                            font: {
                                family: this.theme.typography.fontFamily,
                                size: this.theme.typography.fontSize
                            },
                            color: this.theme.typography.fontColor,
                            callback: (value) => {
                                return ChartUtils.formatNumber(value);
                            }
                        }
                    }
                }
            }
        };
    }
}

class PieChart extends BaseChart {
    constructor(canvasId, config = {}) {
		// Передаем theme в config перед вызовом super
        const theme = ChartThemes.getDefaultTheme();
        super(canvasId, {
            type: 'pie',
            ...config,
			theme: theme // Добавляем theme в config
        });
    }
    
    getDefaultConfig() {
        const baseConfig = super.getDefaultConfig();
        const theme = this.theme || ChartThemes.getDefaultTheme(); // Защита от undefined
        
		return {
            ...baseConfig,
            options: {
                ...baseConfig.options,
                cutout: '0%', // Для doughnut можно установить '50%'
                plugins: {
                    ...baseConfig.options.plugins,
                    legend: {
                        ...baseConfig.options.plugins.legend,
                        position: 'right'
                    }
                }
            }
        };
    }
}

class LineChart extends BaseChart {
    constructor(canvasId, config = {}) {
		// Передаем theme в config перед вызовом super
        const theme = ChartThemes.getDefaultTheme();
        super(canvasId, {
            type: 'line',
            ...config,
			theme: theme // Добавляем theme в config
        });
    }
    
    getDefaultConfig() {
        const baseConfig = super.getDefaultConfig();
		const theme = this.theme || ChartThemes.getDefaultTheme(); // Защита от undefined
        
        return {
            ...baseConfig,
            options: {
                ...baseConfig.options,
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: this.theme.grid.color,
                            drawBorder: this.theme.grid.drawBorder,
                            borderColor: this.theme.grid.borderColor
                        },
                        ticks: {
                            font: {
                                family: this.theme.typography.fontFamily,
                                size: this.theme.typography.fontSize
                            },
                            color: this.theme.typography.fontColor
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: this.theme.grid.color,
                            drawBorder: this.theme.grid.drawBorder,
                            borderColor: this.theme.grid.borderColor
                        },
                        ticks: {
                            font: {
                                family: this.theme.typography.fontFamily,
                                size: this.theme.typography.fontSize
                            },
                            color: this.theme.typography.fontColor,
                            callback: (value) => {
                                return ChartUtils.formatNumber(value);
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        tension: 0.4,
                        borderWidth: 2
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        };
    }
}

// ============================================
// ГЛАВНЫЙ КЛАСС CHART MANAGER
// ============================================

class ChartManager {
    constructor() {
        this.charts = new Map(); // canvasId -> chart instance
        this.theme = ChartThemes.getDefaultTheme();
        this.settings = this.getDefaultSettings();
        this.dataCache = new Map(); // Кэш данных
		this.dataProcessor = new DataProcessor();
		this.configManager = new ConfigurationManager();
        this.interactiveFeatures = InteractiveFeatures;
        this.periodComparison = PeriodComparison;
        
        console.log('ChartManager инициализирован с функциями Этапа 3');
    }
    
    /**
     * Настройки по умолчанию
     */
    getDefaultSettings() {
        return {
            autoUpdate: true,
            showDataLabels: true,
            exportQuality: 1.0,
            defaultChartType: 'bar',
            animationEnabled: true,
            responsive: true,
            maintainAspectRatio: false,
            theme: 'default' // 'default', 'contrast', 'dark'
        };
    }
	
	// ---
	/**
     * Создание графика через фабрику
     */
    createChartFromFactory(canvasId, chartType, data, options = {}) {
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
                    
                case 'heat-map':
                    config = ChartFactory.createHeatMap(
                        data.purchases,
                        options
                    );
                    break;
                    
                default:
                    throw new Error(`Тип графика "${chartType}" не поддерживается фабрикой`);
            }
            
            // Создаем график
            return this.createChart(canvasId, config.type, config.data, config.options);
            
        } catch (error) {
            console.error(`Ошибка создания графика через фабрику:`, error);
            return null;
        }
    }
    
    /**
     * Включение/выключение подписей данных
     */
    toggleDataLabels(canvasId, enabled = true) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            chart.dataLabelsEnabled = enabled;
            
            // Обновляем конфигурацию
            if (chart.config.options.plugins) {
                if (enabled) {
                    chart.config.options.plugins.customDataLabels = chart.getDataLabelsConfig();
                } else {
                    delete chart.config.options.plugins.customDataLabels;
                }
            }
            
            // Обновляем график
            if (chart.chart) {
                chart.chart.update();
            }
        }
    }
    
    /**
     * Изменение типа существующего графика
     */
    changeChartType(canvasId, newType) {
        const chart = this.charts.get(canvasId);
        if (!chart) {
            console.warn(`График ${canvasId} не найден`);
            return null;
        }
        
        // Сохраняем текущие данные
        const currentData = chart.getData();
        
        // Уничтожаем старый график
        chart.destroy();
        
        // Создаем новый график с теми же данными
        const newChart = this.createChart(canvasId, newType, currentData);
        
        return newChart;
    }
    
    /**
     * Добавление датасета к существующему графику
     */
    addDataset(canvasId, dataset) {
        const chart = this.getChart(canvasId);
        if (!chart || !chart.chart) return;
        
        // Добавляем датасет
        chart.chart.data.datasets.push(dataset);
        chart.chart.update();
    }
    
    /**
     * Создание комбинированного графика
     */
    createCombinedChart(canvasId, datasets, labels, options = {}) {
        const config = {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => ChartUtils.formatCurrency(value)
                        }
                    }
                },
                ...options
            }
        };
        
        return this.createChart(canvasId, 'bar', config.data, config.options);
    }
    
    /**
     * Создание панели графиков
     */
    createDashboard(containerId, chartsConfig) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Контейнер ${containerId} не найден`);
            return;
        }
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Создаем каждый график
        chartsConfig.forEach((config, index) => {
            const chartId = `dashboard-chart-${index}`;
            const chartContainer = document.createElement('div');
            chartContainer.className = 'dashboard-chart-container';
            chartContainer.innerHTML = `
                <div class="chart-header">
                    <h4>${config.title || `График ${index + 1}`}</h4>
                    <div class="chart-actions">
                        <button class="btn-icon" onclick="chartManager.exportChart('${chartId}')">
                            📥
                        </button>
                    </div>
                </div>
                <div class="chart-canvas-container">
                    <canvas id="${chartId}"></canvas>
                </div>
            `;
            
            container.appendChild(chartContainer);
            
            // Создаем график
            setTimeout(() => {
                this.createChartFromFactory(chartId, config.type, config.data, config.options);
            }, 100);
        });
    }
	// ---
    
    /**
     * Создание графика
     */
    createChart(canvasId, type = 'bar', data = null, customConfig = {}) {
        try {
			console.log(`createChart called: ${canvasId}, type: ${type}`);
			console.log('Data received:', data);
			
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
			
			console.log('Chart instance created:', chart);
            
            // Создаем график
            const chartInstance = chart.create(data);
			console.log('Chart.js instance:', chartInstance);
            
            // Сохраняем в коллекции
            this.charts.set(canvasId, chart);
            
            // Применяем текущие настройки
            this.applySettingsToChart(canvasId);
            
            console.log(`Создан график: ${canvasId} (тип: ${type})`);
            return chartInstance;
            
        } catch (error) {
            console.error(`Ошибка создания графика ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Создание графика распределения по категориям
     */
    createCategoryChart(canvasId, purchases, categories, type = 'bar') {
        const data = this.prepareCategoryData(purchases, categories);
        return this.createChart(canvasId, type, data);
    }
    
    /**
     * Создание графика месячных расходов
     */
    createMonthlyChart(canvasId, purchases, type = 'bar') {
        const data = this.prepareMonthlyData(purchases);
        return this.createChart(canvasId, type, data);
    }
    
    /**
     * Создание графика сравнения магазинов
     */
    createStoreChart(canvasId, purchases, stores, type = 'bar') {
        const data = this.prepareStoreData(purchases, stores);
        return this.createChart(canvasId, type, data);
    }
    
    /**
     * Подготовка данных для категорий
     */
    prepareCategoryData(purchases, categories) {
        const categoryStats = {};
        
        purchases.forEach(purchase => {
            const categoryId = purchase.category_id;
            if (!categoryId) return;
            
            if (!categoryStats[categoryId]) {
                const category = categories.find(c => c.id === categoryId);
                categoryStats[categoryId] = {
                    id: categoryId,
                    name: category ? category.name : `Категория #${categoryId}`,
                    icon: category ? category.icon : '❓',
                    color: category ? category.color : ChartThemes.getCategoryColor(null, categoryId),
                    amount: 0,
                    count: 0
                };
            }
            
            const amount = parseFloat(purchase.amount) || 0;
            categoryStats[categoryId].amount += amount;
            categoryStats[categoryId].count++;
        });
        
        // Сортируем по сумме
        const sortedCategories = Object.values(categoryStats)
            .sort((a, b) => b.amount - a.amount);
        
        return {
            labels: sortedCategories.map(c => `${c.icon} ${c.name}`),
            datasets: [{
                label: 'Сумма покупок, ₽',
                data: sortedCategories.map(c => c.amount),
                backgroundColor: sortedCategories.map((c, i) => 
                    ChartThemes.getCategoryColor(c.name, i)
                ),
                borderColor: sortedCategories.map((c, i) => 
                    ChartThemes.getCategoryColor(c.name, i)
                ),
                borderWidth: 1
            }]
        };
    }
    
    /**
     * Подготовка месячных данных
     */
    prepareMonthlyData(purchases) {
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
                    key: monthKey,
                    name: monthName,
                    amount: 0,
                    count: 0
                };
            }
            
            const amount = parseFloat(purchase.amount) || 0;
            monthlyStats[monthKey].amount += amount;
            monthlyStats[monthKey].count++;
        });
        
        // Сортируем по дате
        const sortedMonths = Object.values(monthlyStats)
            .sort((a, b) => a.key.localeCompare(b.key));
        
        return {
            labels: sortedMonths.map(m => m.name),
            datasets: [{
                label: 'Сумма, ₽',
                data: sortedMonths.map(m => m.amount),
                backgroundColor: this.theme.colors.primary,
                borderColor: this.theme.colors.primary,
                borderWidth: 1
            }]
        };
    }
    
    /**
     * Подготовка данных по магазинам
     */
    prepareStoreData(purchases, stores) {
        const storeStats = {};
        
        purchases.forEach(purchase => {
            const storeId = purchase.store_id;
            if (!storeId) return;
            
            if (!storeStats[storeId]) {
                const store = stores.find(s => s.id === storeId);
                storeStats[storeId] = {
                    id: storeId,
                    name: store ? store.shop : `Магазин #${storeId}`,
                    amount: 0,
                    count: 0
                };
            }
            
            const amount = parseFloat(purchase.amount) || 0;
            storeStats[storeId].amount += amount;
            storeStats[storeId].count++;
        });
        
        // Сортируем по сумме
        const sortedStores = Object.values(storeStats)
            .sort((a, b) => b.amount - a.amount);
        
        return {
            labels: sortedStores.map(s => s.name),
            datasets: [{
                label: 'Сумма, ₽',
                data: sortedStores.map(s => s.amount),
                backgroundColor: sortedStores.map((s, i) => 
                    ChartThemes.getCategoryColor(s.name, i)
                ),
                borderColor: sortedStores.map((s, i) => 
                    ChartThemes.getCategoryColor(s.name, i)
                ),
                borderWidth: 1
            }]
        };
    }
    
    /**
     * Применение настроек к графику
     */
    applySettingsToChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (!chart) return;
        
        // Здесь можно применить глобальные настройки
        // Например, показ/скрытие подписей данных
        
        if (this.settings.animationEnabled === false) {
            chart.config.options.animation = { duration: 0 };
        }
        
        // Обновляем график если он уже создан
        if (chart.chart) {
            chart.chart.update();
        }
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
    
    /**
     * Изменение темы
     */
    setTheme(themeName) {
        switch (themeName) {
            case 'contrast':
                this.theme = ChartThemes.getContrastTheme();
                break;
            case 'default':
            default:
                this.theme = ChartThemes.getDefaultTheme();
        }
        
        this.settings.theme = themeName;
        
        // Обновляем все графики с новой темой
        this.charts.forEach(chart => {
            chart.theme = this.theme;
            if (chart.chart) {
                chart.chart.update();
            }
        });
        
        console.log(`Тема изменена на: ${themeName}`);
    }
    
    /**
     * Сохранение настроек в localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem('chartManagerSettings', JSON.stringify(this.settings));
            console.log('Настройки сохранены');
        } catch (error) {
            console.error('Ошибка сохранения настроек:', error);
        }
    }
    
    /**
     * Загрузка настроек из localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('chartManagerSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
                console.log('Настройки загружены');
            }
        } catch (error) {
            console.error('Ошибка загрузки настроек:', error);
        }
        
        return this.settings;
    }
	
	/**
     * Создание canvas элемента если он не существует
     */
    ensureCanvas(canvasId, options = {}) {
        let canvas = document.getElementById(canvasId);
        
        if (!canvas) {
            const {
                width = 400,
                height = 300,
                parent = document.body,
                title = '',
                className = 'chart-canvas'
            } = options;
            
            // Создаем контейнер
            const container = document.createElement('div');
            container.className = 'chart-container';
            
            // Добавляем заголовок если есть
            if (title) {
                const titleEl = document.createElement('h4');
                titleEl.textContent = title;
                container.appendChild(titleEl);
            }
            
            // Создаем canvas
            canvas = document.createElement('canvas');
            canvas.id = canvasId;
            canvas.width = width;
            canvas.height = height;
            canvas.className = className;
            
            container.appendChild(canvas);
            parent.appendChild(container);
            
            console.log(`Canvas создан: ${canvasId}`);
        }
        
        return canvas;
    }
    
    /**
     * Создание графика с проверкой canvas
     */
    createChartSafe(canvasId, type = 'bar', data = null, customConfig = {}, canvasOptions = {}) {
        try {
            // Создаем canvas если нужно
            this.ensureCanvas(canvasId, canvasOptions);
            
            // Создаем график
            return this.createChart(canvasId, type, data, customConfig);
            
        } catch (error) {
            console.error(`Ошибка создания безопасного графика ${canvasId}:`, error);
            return null;
        }
    }
	
	/**
     * Создание интерактивного графика
     */
    createInteractiveChart(canvasId, type = 'bar', data = null, customConfig = {}, callbacks = {}) {
        const chart = this.createChart(canvasId, type, data, customConfig);
        
        if (chart && this.charts.get(canvasId)) {
            const chartInstance = this.charts.get(canvasId);
            InteractiveFeatures.initChartInteractivity(chartInstance, callbacks);
        }
        
        return chart;
    }
    
    /**
     * Создание графика сравнения периодов
     */
    createPeriodComparison(canvasId, purchases, options = {}) {
        const config = PeriodComparison.createPeriodComparisonChart(canvasId, purchases, options);
        return this.createInteractiveChart(canvasId, config.type, config.data, config.options, {
            onClick: (data) => {
                console.log('Клик по сравнению периодов:', data);
                // Дополнительная логика при клике
            }
        });
    }
    
    /**
     * Создание графика разницы периодов
     */
    createPeriodDifference(canvasId, purchases, options = {}) {
        const config = PeriodComparison.createDifferenceChart(canvasId, purchases, options);
        return this.createInteractiveChart(canvasId, config.type, config.data, config.options);
    }
    
    /**
     * Сохранение конфигурации графика
     */
    saveChartConfig(canvasId) {
        const chart = this.charts.get(canvasId);
        if (!chart) {
            console.warn(`График ${canvasId} не найден для сохранения`);
            return false;
        }
        
        const config = {
            type: chart.config.type,
            data: chart.getData(),
            options: chart.config.options
        };
        
        return this.configManager.saveChartConfiguration(canvasId, config);
    }
    
    /**
     * Загрузка сохраненной конфигурации
     */
    loadChartConfig(canvasId) {
        const config = this.configManager.loadChartConfiguration(canvasId);
        if (config) {
            console.log(`Конфигурация загружена: ${canvasId}`);
            return this.createChart(canvasId, config.type, config.data, config.options);
        }
        return null;
    }
    
    /**
     * Восстановление всех сохраненных графиков
     */
    restoreAllCharts() {
        const configs = this.configManager.loadAllConfigurations();
        Object.keys(configs).forEach(canvasId => {
            // Проверяем существование canvas
            if (document.getElementById(canvasId)) {
                this.loadChartConfig(canvasId);
            }
        });
    }
    
    /**
     * Создание дашборда сравнения
     */
    createComparisonDashboard(containerId, purchases, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Контейнер ${containerId} не найден`);
            return;
        }
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        const charts = [
            {
                id: 'comparison-1',
                title: 'Текущий vs Прошлый месяц',
                create: () => this.createPeriodComparison('comparison-1', purchases, {
                    periods: ['current_month', 'previous_month'],
                    title: 'Сравнение месяцев'
                })
            },
            {
                id: 'comparison-2',
                title: 'Изменение по категориям',
                create: () => this.createPeriodDifference('comparison-2', purchases, {
                    title: 'Динамика изменений'
                })
            },
            {
                id: 'comparison-3',
                title: 'Текущий vs Прошлый год',
                create: () => this.createPeriodComparison('comparison-3', purchases, {
                    periods: ['current_year', 'previous_year'],
                    title: 'Сравнение годов'
                })
            }
        ];
        
        charts.forEach((chartConfig, index) => {
            const chartContainer = document.createElement('div');
            chartContainer.className = 'comparison-chart-container';
            chartContainer.style.cssText = `
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            `;
            
            chartContainer.innerHTML = `
                <div class="chart-header">
                    <h4>${chartConfig.title}</h4>
                    <div class="chart-actions">
                        <button class="btn-icon" onclick="chartManager.saveChartConfig('${chartConfig.id}')">
                            💾
                        </button>
                        <button class="btn-icon" onclick="chartManager.exportChart('${chartConfig.id}')">
                            📥
                        </button>
                    </div>
                </div>
                <div class="chart-canvas-container">
                    <canvas id="${chartConfig.id}"></canvas>
                </div>
            `;
            
            container.appendChild(chartContainer);
            
            // Создаем график с задержкой
            setTimeout(() => {
                chartConfig.create();
            }, index * 200);
        });
    }

}

// ============================================
// ФАБРИКА ГРАФИКОВ
// ============================================

class ChartFactory {
    /**
     * Создание графика распределения по категориям
     */
    static createCategoryDistribution(purchases, categories, options = {}) {
        const dataProcessor = new DataProcessor();
        const processedData = dataProcessor.processCategoryData(purchases, categories);
        
        const config = {
            type: options.type || 'bar',
            data: {
                labels: processedData.labels,
                datasets: [{
                    label: 'Сумма покупок',
                    data: processedData.amounts,
                    backgroundColor: processedData.colors,
                    borderColor: processedData.colors,
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Распределение расходов по категориям',
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
        
        return config;
    }
    
    /**
     * Создание графика месячных расходов
     */
    static createMonthlyExpenses(purchases, options = {}) {
        const dataProcessor = new DataProcessor();
        const processedData = dataProcessor.processMonthlyData(purchases);
        
        const config = {
            type: options.type || 'bar',
            data: {
                labels: processedData.labels,
                datasets: [{
                    label: 'Сумма расходов',
                    data: processedData.amounts,
                    backgroundColor: options.color || '#3498db',
                    borderColor: options.color || '#2980b9',
                    borderWidth: 1
                }]
            },
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
        
        return config;
    }
    
    /**
     * Создание графика сравнения магазинов
     */
    static createStoreComparison(purchases, stores, options = {}) {
        const dataProcessor = new DataProcessor();
        const processedData = dataProcessor.processStoreData(purchases, stores);
        
        const config = {
            type: options.type || 'bar',
            data: {
                labels: processedData.labels,
                datasets: [{
                    label: 'Сумма покупок',
                    data: processedData.amounts,
                    backgroundColor: processedData.colors,
                    borderColor: processedData.colors,
                    borderWidth: 1
                }]
            },
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
                    [options.horizontal ? 'x' : 'y']: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => ChartUtils.formatCurrency(value)
                        }
                    }
                }
            }
        };
        
        return config;
    }
    
    /**
     * Создание графика динамики расходов
     */
    static createExpenseTrend(purchases, options = {}) {
        const dataProcessor = new DataProcessor();
        const processedData = dataProcessor.processTrendData(purchases, options.period);
        
        const config = {
            type: 'line',
            data: {
                labels: processedData.labels,
                datasets: [{
                    label: 'Сумма расходов',
                    data: processedData.amounts,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderColor: options.color || '#3498db',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
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
        
        return config;
    }
    
    /**
     * Создание тепловой карты расходов
     */
    static createHeatMap(purchases, options = {}) {
        const dataProcessor = new DataProcessor();
        const processedData = dataProcessor.processHeatMapData(purchases);
        
        const config = {
            type: 'matrix',
            data: {
                datasets: [{
                    label: 'Расходы',
                    data: processedData.data,
                    backgroundColor: (context) => {
                        const value = context.dataset.data[context.dataIndex].v;
                        const alpha = Math.min(value / processedData.maxValue, 1);
                        return `rgba(231, 76, 60, ${alpha})`;
                    },
                    borderWidth: 1,
                    borderColor: '#fff',
                    width: ({ chart }) => (chart.chartArea.width - 20) / 7,
                    height: ({ chart }) => (chart.chartArea.height - 20) / 5
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Тепловая карта расходов',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const item = items[0];
                                return `${item.rowLabel}, ${item.columnLabel}`;
                            },
                            label: (item) => {
                                return `Сумма: ${ChartUtils.formatCurrency(item.raw.v)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category',
                        labels: processedData.xLabels,
                        offset: true,
                        grid: { display: false }
                    },
                    y: {
                        type: 'category',
                        labels: processedData.yLabels,
                        offset: true,
                        grid: { display: false }
                    }
                }
            }
        };
        
        return config;
    }
}

// ============================================
// ОБРАБОТЧИК ДАННЫХ
// ============================================

class DataProcessor {
    /**
     * Обработка данных по категориям
     */
    processCategoryData(purchases, categories) {
        const categoryStats = {};
        
        purchases.forEach(purchase => {
            const categoryId = purchase.category_id;
            if (!categoryId) return;
            
            if (!categoryStats[categoryId]) {
                const category = categories.find(c => c.id === categoryId);
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
        
        return {
            labels: sorted.map(item => item.name),
            amounts: sorted.map(item => item.amount),
            colors: sorted.map(item => item.color)
        };
    }
    
    /**
     * Обработка месячных данных
     */
    processMonthlyData(purchases) {
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
        const sorted = Object.values(monthlyStats).sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        return {
            labels: sorted.map(item => item.name),
            amounts: sorted.map(item => item.amount)
        };
    }
    
    /**
     * Обработка данных по магазинам
     */
    processStoreData(purchases, stores) {
        const storeStats = {};
        
        purchases.forEach(purchase => {
            const storeId = purchase.store_id;
            if (!storeId) return;
            
            if (!storeStats[storeId]) {
                const store = stores.find(s => s.id === storeId);
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
        
        return {
            labels: sorted.map(item => item.name),
            amounts: sorted.map(item => item.amount),
            colors: sorted.map(item => item.color)
        };
    }
    
    /**
     * Обработка данных для тренда
     */
    processTrendData(purchases, period = 'monthly') {
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
        const sorted = Object.values(trendData).sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
        
        return {
            labels: sorted.map(item => item.name),
            amounts: sorted.map(item => item.amount)
        };
    }
    
    /**
     * Обработка данных для тепловой карты
     */
    processHeatMapData(purchases) {
        const heatMapData = {
            xLabels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            yLabels: ['Утро', 'День', 'Вечер', 'Ночь'],
            data: [],
            maxValue: 0
        };
        
        // Группируем по дням недели и времени суток
        const timeSlots = {
            0: 'Ночь',    // 0-6
            1: 'Утро',    // 6-12
            2: 'День',    // 12-18
            3: 'Вечер'    // 18-24
        };
        
        purchases.forEach(purchase => {
            if (!purchase.date) return;
            
            const date = new Date(purchase.date);
            const dayOfWeek = date.getDay(); // 0-6 (0 = воскресенье)
            const hour = date.getHours();
            
            // Преобразуем воскресенье (0) в 6 для нашего порядка
            const x = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const y = hour < 6 ? 3 : hour < 12 ? 0 : hour < 18 ? 1 : 2;
            
            const amount = parseFloat(purchase.amount) || 0;
            
            // Ищем существующую точку
            const existingPoint = heatMapData.data.find(point => 
                point.x === x && point.y === y
            );
            
            if (existingPoint) {
                existingPoint.v += amount;
            } else {
                heatMapData.data.push({ x, y, v: amount });
            }
            
            // Обновляем максимальное значение
            heatMapData.maxValue = Math.max(heatMapData.maxValue, amount);
        });
        
        return heatMapData;
    }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ И ГЛОБАЛЬНЫЙ ДОСТУП
// ============================================

// Создаем глобальный экземпляр ChartManager
console.log('Создание глобального ChartManager...');
window.chartManager = new ChartManager();
window.chartManager.loadSettings();

// Экспортируем классы для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChartManager,
        BaseChart,
        BarChart,
        PieChart,
        LineChart,
        ChartUtils,
        ChartThemes
    };
}

console.log('ChartManager готов к использованию');