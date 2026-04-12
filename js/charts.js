/**
 * Shopping Tracker - Enhanced Chart Manager
 */

// ============================================
// 1. КОНСТАНТЫ И УТИЛИТЫ
// ============================================
/** КОММЕНТАРИИ
 * Класс: ChartUtils
 * Назначение: Утилитарные функции для работы с графиками - форматирование чисел, валюты,
 *             работа с цветами, генерация идентификаторов.
 * 
 * Все методы статические, не требуют создания экземпляра класса.
 * Используется всеми классами системы графиков для единообразного форматирования.
 * 
 * Основные возможности:
 * - Форматирование валюты (с пробелами между разрядами)
 * - Форматирование чисел и процентов
 * - Генерация уникальных идентификаторов
 * - Затемнение и осветление цветов (для границ, теней, hover-эффектов)
 * 
 * @example
 * // Форматирование суммы
 * ChartUtils.formatCurrency(1234.56); // "1 234.56 ₽"
 * 
 * // Затемнение цвета
 * ChartUtils.darkenColor('#3498db', 0.2); // цвет на 20% темнее
 */

class ChartUtils {
    /**
     * Форматирование валюты с пробелами (исправленная версия)
     */
    static formatCurrency(value, currency = '₽') {
        if (value === null || value === undefined || isNaN(value)) {
            return `0 ${currency}`;
        }
        
        // Преобразуем в число и округляем до 2 знаков
        let num = parseFloat(value);
        if (isNaN(num)) return `0 ${currency}`;
        
        // Округляем до 2 знаков после запятой
        num = Math.round(num * 100) / 100;
        
        // Разделяем целую и дробную части
        const [integerPart, decimalPart] = num.toFixed(2).split('.');
        
        // Форматируем целую часть с пробелами (каждые 3 цифры)
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        
        // Возвращаем отформатированное значение
        if (decimalPart && decimalPart !== '00') {
            return `${formattedInteger}.${decimalPart} ${currency}`;
        }
        return `${formattedInteger} ${currency}`;
    }
    
    /**
     * Форматирование числа с пробелами (исправленная версия)
     */
    static formatNumber(value, decimals = 0) {
        if (value === null || value === undefined || isNaN(value)) {
            return '0';
        }
        
        let num = parseFloat(value);
        if (isNaN(num)) return '0';
        
        // Округляем до нужного количества знаков
        const factor = Math.pow(10, decimals);
        num = Math.round(num * factor) / factor;
        
        // Разделяем целую и дробную части
        const [integerPart, decimalPart] = num.toFixed(decimals).split('.');
        
        // Форматируем целую часть с пробелами
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        
        if (decimals > 0 && decimalPart) {
            return `${formattedInteger}.${decimalPart}`;
        }
        return formattedInteger;
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
// 2. ТЕМЫ И ЦВЕТОВЫЕ ПАЛИТРЫ (УЛУЧШЕННАЯ ВЕРСИЯ)
// ============================================
/** КОММЕНТАРИИ
 * Класс: ChartThemes
 * Назначение: Управление цветовыми темами и палитрами для всех графиков приложения.
 * 
 * Обеспечивает единообразное цветовое оформление:
 * - Базовая цветовая палитра для категорий
 * - Специальные цвета для месяцев (по сезонам)
 * - Стабильные цвета для годов (на основе года)
 * - Фиксированные цвета для предопределённых категорий
 * 
 * Основные возможности:
 * - Получение темы по умолчанию (getDefaultTheme)
 * - Получение цвета для категории (getCategoryColor)
 * - Получение цвета для месяца (getMonthColor) - зимние/синие, весенние/зелёные и т.д.
 * - Получение стабильного цвета для года (getYearColor)
 * - Контрастная тема для специальных случаев (getContrastTheme)
 * 
 * @example
 * // Получить цвет для января (зимний, оттенок синего)
 * const janColor = ChartThemes.getMonthColor(1);
 * 
 * // Получить цвет для 2023 года (стабильный, всегда одинаковый для этого года)
 * const yearColor = ChartThemes.getYearColor(2023);
 */

class ChartThemes {
    static getDefaultTheme() {
        return {
            colors: {
                primary: '#3498db', // Первичный - яркий синий
                secondary: '#2ecc71', // Вторичный - яркий зелёный
                success: '#27ae60', // Успех - тёмный зелёный
                danger: '#e74c3c', // Опасность - яркий красный
                warning: '#f39c12', // Предупреждение - жёлтый
                info: '#17a2b8', // Информация - синий
                light: '#f8f9fa', // Светлый - светлый серый
                dark: '#343a40' // Тёмный - тёмный серый
            },
            
            // Цветовая палитра для категорий
            palette: [
                '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
                '#EF476F', '#FFD166', '#06D6A0', '#073B4C', '#7209B7',
                '#F94144', '#F3722C', '#F8961E', '#F9C74F', '#90BE6D',
                '#43AA8B', '#577590', '#277DA1', '#F72585', '#7209B7',
                '#3A0CA3', '#4361EE', '#4CC9F0', '#4895EF', '#560BAD'
            ],
            
            // Специальные цвета для месяцев (по сезонам)
            monthColors: {
                // Зима (декабрь, январь, февраль) - оттенки синего
                12: '#0000CD', // Декабрь - средний синий
                1: '#4169E1',  // Январь - королевский синий
                2: '#00BFFF',   // Февраль - морозное небо
                
                // Весна (март, апрель, май) - оттенки зеленого
                3: '#98FB98',   // Март - бледный зелёный
                4: '#008000',   // Апрель - зеленый
                5: '#00FF00',   // Май - лайм
                
                // Лето (июнь, июль, август) - оттенки красного/оранжевого
                6: '#FA8072',   // Июнь - лососевый
                7: '#FF0000',   // Июль - красный
                8: '#FFA500',   // Август - оранжевый
                
                // Осень (сентябрь, октябрь, ноябрь) - желто-коричневые
                9: '#FFE4B5',   // Сентябрь - мокасиновый
                10: '#F0E68C',  // Октябрь - светлый хаки
                11: '#BDB76B'   // Ноябрь - тёмный хаки
            },
            
            // Цвета для годов (случайные, но предсказуемые)
            yearColors: [
                '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6',
                '#1ABC9C', '#E67E22', '#27AE60', '#2980B9', '#8E44AD',
                '#16A085', '#D35400', '#C0392B', '#7F8C8D', '#2C3E50'
            ],
            
            // Стили текста
            typography: {
                fontFamily: "'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif",
                fontSize: 12,
                fontColor: '#333333'
            }
        };
    }
    
    /**
     * Получение цвета для месяца по его номеру (1-12)
     */
    static getMonthColor(month) {
        const theme = this.getDefaultTheme();
        return theme.monthColors[month] || theme.palette[month % theme.palette.length];
    }
    
    /**
     * Получение цвета для года (стабильный, на основе года)
     */
    static getYearColor(year) {
        const theme = this.getDefaultTheme();
        // Используем год для индекса, чтобы цвет был стабильным для одного года
        const index = (year * 7) % theme.yearColors.length;
        return theme.yearColors[index];
    }
    
    /**
     * Получение цвета для категории
     */
    static getCategoryColor(categoryName, index = 0) {
        const theme = this.getDefaultTheme();
        
        const fixedColors = {
            'Авто': '#DC3545',
			'Баня': '#6F42C1',
            'Бензин': '#FFC107',
            'БытоТехника': '#20C997',
            'Ветряк': '#17A2B8',
            'Дерево': '#F7F995',
            'Инструмент': '#FD7E14',
            'Коммуналка': '#E3FBC6',
			'Лакокрасочные': '#E83E8C',
            'Мебель': '#795548',
            'Посуда': '#FF9FF3',
            'Продукты': '#E7F98B',
			'Расходники': '#DDECF9',
			'Сад': '#2ECC71',
			'Сантехника': '#3498DB',
			'Собака': '#FFE7D1',
			'Стройматериалы': '#95A5A6',
			'Текстиль': '#9B59B6',
			'Химия': '#1ABC9C',
			'Электрика': '#F1C40F'
        };
        
        if (categoryName && fixedColors[categoryName]) {
            return fixedColors[categoryName];
        }
        
        return theme.palette[index % theme.palette.length];
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
}

// ============================================
// 3. ОБРАБОТЧИК ДАННЫХ ДЛЯ ГРАФИКОВ (УПРОЩЕННАЯ ВЕРСИЯ)
// ============================================
/** КОММЕНТАРИИ
 * Класс: DataProcessor
 * Назначение: Базовая обработка данных для создания графиков в формате Chart.js.
 * 
 * Преобразует сырые данные из БД в структуру, понятную библиотеке Chart.js.
 * Обеспечивает обратную совместимость со старым кодом.
 * 
 * Основные возможности:
 * - Обработка данных по категориям (с иконками и цветами)
 * - Обработка месячных данных (агрегация по месяцам)
 * - Обработка данных по магазинам (с формированием ТОП-10)
 * - Обработка трендовых данных (daily/weekly/monthly)
 * 
 * @example
 * const processor = new DataProcessor();
 * const chartData = processor.processCategoryData(purchases, categories);
 * // Возвращает: { labels: ['Продукты', 'Химия'], datasets: [{ data: [1000, 500] }] }
 */

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
                data: result.map(item => DataProcessor.roundAmount(item.amount)), // ОКРУГЛЕНИЕ
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
                data: result.map(item => DataProcessor.roundAmount(item.amount)), // ОКРУГЛЕНИЕ
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
                data: result.map(item => DataProcessor.roundAmount(item.amount)), // ОКРУГЛЕНИЕ
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
                data: result.map(item => DataProcessor.roundAmount(item.amount)), // ОКРУГЛЕНИЕ
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderColor: '#3498db',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
    }
	
	/**
     * Вспомогательный метод для округления чисел
     */
	static roundAmount(value) {
		return Math.round(value * 100) / 100;
	}
}

// ============================================
// 4. БАЗОВЫЙ КЛАСС ДЛЯ ВСЕХ ГРАФИКОВ
// ============================================
/** КОММЕНТАРИИ
 * Класс: BaseChart
 * Назначение: Базовый класс для всех типов графиков. Содержит общую логику
 *             создания, обновления, настройки анимаций и экспорта.
 * 
 * Это абстрактный класс, от которого наследуются конкретные типы (BarChart, PieChart).
 * Инкапсулирует работу с Canvas и Chart.js API.
 * 
 * Основные возможности:
 * - Создание графика с заданной конфигурацией (create)
 * - Обновление данных с анимацией (update)
 * - Уничтожение графика с очисткой памяти (destroy)
 * - Управление подписями данных (updateDataLabelsVisibility)
 * - Экспорт в PNG с высоким разрешением (exportToPNG)
 * - Настройка анимаций и переходов
 * 
 * @example
 * // Создание графика (обычно используется через фабрику или дочерние классы)
 * const chart = new BaseChart('my-canvas', { type: 'bar' });
 * chart.create(chartData);
 * 
 * @property {string} canvasId - ID canvas-элемента
 * @property {Object} config - Конфигурация Chart.js
 * @property {Chart} chart - Экземпляр Chart.js
 */

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
     * Базовая конфигурация графика с анимациями
     */
    getDefaultConfig() {
		return {
			type: this.chartType || 'bar',
			data: { labels: [], datasets: [] },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				
				// ===== АНИМАЦИИ =====
				animation: {
					duration: 800,                    // Длительность анимации
					easing: 'easeInOutQuart',         // Функция плавности
					
					// Анимация для всех типов графиков
					animateScale: true,                // Масштабирование при появлении
					animateRotate: true,               // Вращение для круговых
					
					// Колбэки для отладки
					onProgress: (animation) => {
						// Можно добавить индикатор загрузки
					},
					onComplete: (animation) => {
						console.log('Анимация завершена');
					}
				},
				
				// Анимация переходов при обновлении данных
				transitions: {
					active: {
						animation: {
							duration: 400
						}
					},
					resize: {
						animation: {
							duration: 0  // Отключаем анимацию при ресайзе
						}
					}
				},
				
				// ===== ЭФФЕКТЫ ПРИ НАВЕДЕНИИ =====
				hover: {
					mode: 'nearest',
					intersect: true,
					animationDuration: 200  // Плавность при наведении
				},
				
				// ===== НАСТРОЙКИ ЭЛЕМЕНТОВ =====
				elements: {
					// Для столбчатых диаграмм
					bar: {
						backgroundColor: 'rgba(52, 152, 219, 0.8)',
						borderColor: '#2980b9',
						borderWidth: 1,
						borderRadius: 4,                // Скругленные углы
						hoverBackgroundColor: '#3498db',
						hoverBorderColor: '#2980b9',
						hoverBorderWidth: 2
					},
					
					// Для линейных графиков
					line: {
						tension: 0.3,                   // Сглаживание линий
						borderWidth: 2,
						borderColor: '#3498db',
						backgroundColor: 'transparent',
						fill: false,
						hoverBorderWidth: 3
					},
					
					// Для точек на линиях
					point: {
						radius: 3,
						hoverRadius: 5,
						backgroundColor: '#3498db',
						hoverBackgroundColor: '#e74c3c',
						borderWidth: 1,
						hoverBorderWidth: 2
					},
					
					// Для круговых диаграмм
					arc: {
						backgroundColor: '#3498db',
						borderColor: '#fff',
						borderWidth: 2,
						hoverBackgroundColor: '#e74c3c',
						hoverBorderColor: '#fff',
						hoverBorderWidth: 3,
						hoverOffset: 8                     // Смещение при наведении
					}
				},
				
				// ===== ПЛАВНЫЕ ТУЛТИПЫ =====
				plugins: {
					tooltip: {
						enabled: true,
						mode: 'index',
						intersect: false,
						animation: {
							duration: 200,
							easing: 'easeOutCubic'
						},
						backgroundColor: 'rgba(0, 0, 0, 0.8)',
						titleColor: '#fff',
						bodyColor: '#fff',
						borderColor: '#3498db',
						borderWidth: 2,
						padding: 10,
						cornerRadius: 6,
						titleFont: { size: 14, weight: 'bold' },
						bodyFont: { size: 13 }
					},
					
					// Анимированные подписи данных
					datalabels: {
						display: true,
						color: '#333',
						font: { size: 11, weight: 'bold' },
						anchor: 'end',
						align: 'top',
						offset: 4,
						
						// ИСПРАВЛЕННЫЙ ФОРМАТТЕР - только целые числа
						formatter: (value, context) => {
							const rounded = Math.round(value);
							const datasetLabel = context.dataset.label || '';
							
							// Для круговых диаграмм
							if (context.chart.config.type === 'pie' || context.chart.config.type === 'doughnut') {
								const total = context.dataset.data.reduce((a, b) => a + b, 0);
								const percentage = total > 0 ? Math.round((rounded / total) * 100) : 0;
								
								if (window.showPercentages) {
									return percentage + '%';
								}
								return ChartUtils.formatNumber(rounded, 0);
							}
							
							// Для остальных типов
							return ChartUtils.formatNumber(rounded, 0);
						},
						
						// Анимация подписей
						animation: {
							duration: 300,
							easing: 'easeOutQuad'
						}
					},
					
					// Анимированная легенда
					legend: {
						display: true,
						position: 'top',
						labels: {
							usePointStyle: true,
							pointStyle: 'circle',
							padding: 15,
							font: { size: 12 },
							
							// Анимация при наведении на легенду
							generateLabels: (chart) => {
								const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
								
								labels.forEach(label => {
									label.hiddenStyle = {
										backgroundColor: 'rgba(0,0,0,0.2)',
										borderColor: 'rgba(0,0,0,0.2)'
									};
								});
								
								return labels;
							}
						},
						
						// Плавное скрытие/показ
						onClick: (e, legendItem, legend) => {
							const index = legendItem.datasetIndex;
							const ci = legend.chart;
							
							// Плавное скрытие с анимацией
							ci.setDatasetVisibility(index, !ci.isDatasetVisible(index));
							ci.update({
								duration: 400,
								easing: 'easeInOutQuad'
							});
						}
					}
				},
				
				// ===== ПРОЧИЕ НАСТРОЙКИ =====
				layout: {
					padding: {
						top: 30,
						right: 20,
						bottom: 20,
						left: 20
					}
				}
			}
		};
	}
	
	/**
     * Форматирование подписи данных (исправленная версия)
     */
    formatDataLabel(value, context, chartType) {
		// Округляем значение до 2 знаков
		// let roundedValue = Math.round(value * 100) / 100;
		
		// Округляем значение до целого числа
		let roundedValue = Math.round(value);
		
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
                return `${ChartUtils.formatNumber(roundedValue, 0)}\n(${percentage}%)`;
            }
            
			// Для столбчатых диаграмм - только целое число
            return ChartUtils.formatNumber(roundedValue, 0); // Без символа валюты в подписи
        }
        
        // Для количественных значений
		if (datasetLabel.toLowerCase().includes('количество')) {
			return ChartUtils.formatNumber(roundedValue, 0);
		}
		
		// По умолчанию
		return ChartUtils.formatNumber(roundedValue, 0);
    }
	
	/**
	 * Конфигурация подписей для разных типов графиков (исправленная версия)
	 */
	getDataLabelsConfig(chartType) {
		const baseConfig = {
			color: '#333',
			font: {
				weight: 'bold',
				size: 11
			},
			// ОСНОВНОЙ ФОРМАТТЕР - только целые числа
			formatter: (value, context) => {
				// Округляем значение
				// const rounded = Math.round(value * 100) / 100;
				
				// Округляем до целого числа
				const rounded = Math.round(value);
				return ChartUtils.formatNumber(rounded, 0);
			}
		};
		
		switch(chartType) {
			case 'bar':
				return {
					...baseConfig,
					anchor: 'end',
					align: 'top',
					offset: 2,
					clamp: true,
					backgroundColor: 'rgba(255, 255, 255, 0.7)',
					borderRadius: 3,
					padding: { left: 4, right: 4, top: 2, bottom: 2 }
				};
				
			case 'horizontalBar':
				return {
					...baseConfig,
					anchor: 'end',
					align: 'right',
					offset: 4,
					clamp: true,
					backgroundColor: 'rgba(255, 255, 255, 0.7)',
					borderRadius: 3,
					padding: { left: 4, right: 4, top: 2, bottom: 2 }
				};
				
			case 'pie':
			case 'doughnut':
				return {
					...baseConfig,
					anchor: 'end',
					align: 'center',
					color: '#333',
					textShadow: '0 1px 2px rgba(0,0,0,0.5)',
					backgroundColor: 'rgba(255, 255, 255, 0.7)',
					borderRadius: 3,
					font: { size: 11, weight: 'bold' },
					formatter: (value, context) => {
						const rounded = Math.round(value);
						const total = context.dataset.data.reduce((a, b) => a + b, 0);
						const percentage = total > 0 ? Math.round((rounded / total) * 100) : 0;
						
						// Если включены проценты, показываем их, иначе сумму
						if (window.showPercentages) {
							return percentage + '%';
						}
						return ChartUtils.formatNumber(rounded, 0);
					}
				};
				
			default:
				return baseConfig;
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
			
			// Применяем настройки подписей перед созданием графика
			if (this.config.options && this.config.options.plugins) {
				this.config.options.plugins.datalabels = {
					...this.getDataLabelsConfig(this.chartType),
					display: window.showDataLabels !== undefined ? window.showDataLabels : true
				};
			}
            
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
// 6. ФАБРИКА ГРАФИКОВ
// ============================================
/** КОММЕНТАРИИ
 * Класс: ChartFactory
 * Назначение: Фабрика для создания типовых конфигураций графиков.
 * 
 * Упрощает создание часто используемых типов графиков:
 * - Распределение по категориям
 * - Месячные расходы
 * - Сравнение магазинов
 * - Динамика расходов (тренды)
 * 
 * Все методы возвращают готовую конфигурацию для передачи в BaseChart.
 * Автоматически применяет форматирование валют, подписи осей и заголовки.
 * 
 * @example
 * // Создать конфигурацию для графика по категориям
 * const config = ChartFactory.createCategoryDistribution(
 *   purchases, 
 *   categories,
 *   { type: 'pie', title: 'Мои расходы' }
 * );
 * 
 * @see BaseChart
 * @see ChartManager
 */

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
/** КОММЕНТАРИИ
 * Класс: ChartManager
 * Назначение: Центральный менеджер для создания и управления всеми графиками приложения
 * 
 * Основные возможности:
 * - Создание одиночных графиков различных типов (bar, pie, line)
 * - Создание пар графиков (сумма/количество) для сравнения
 * - Управление жизненным циклом графиков (создание, обновление, удаление)
 * - Экспорт графиков в PNG
 * - Сохранение состояния графиков
 * 
 * Использование:
 * @example
 * const manager = new ChartManager();
 * manager.createChart('canvas-id', 'bar', data);
 * manager.createChartPair('left-id', 'right-id', 'categories', purchases, categories);
 */

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
				leftTitle: options.leftTitle || 'ТОП-10 категорий по сумме расходов',
                rightTitle: options.rightTitle || 'ТОП-10 категорий по количеству покупок',
				limit: options.limit || 10
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
				leftTitle: options.leftTitle || 'ТОП-10 магазинов по сумме расходов',
				rightTitle: options.rightTitle || 'ТОП-10 магазинов по количеству покупок',
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
				leftTitle: options.leftTitle || 'ТОП-10 товаров по сумме расходов',
				rightTitle: options.rightTitle || 'ТОП-10 товаров по количеству покупок',
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
		// Получаем заголовок из HTML (уже с периодом)
		let title = window.currentLeftTitle || 'График покупок';
    
		// Если график правый, используем правый заголовок
		const canvasId = chart.canvas?.id;
		if (canvasId === 'right-chart' && window.currentRightTitle) {
			title = window.currentRightTitle;
		}
		
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
		ctx.fillText('Shopping Tracker NikArt© ' + new Date().getFullYear(), width - (20 * scale), height - (10 * scale));
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
		
		// Заголовок коллажа с периодом
		const title = `Сравнительный анализ: ${this.getChartTypeName(currentChartType)} (${window.currentPeriodText || 'весь период'})`;
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
	
	/**
     * Создание пары графиков сравнения периодов
     */
    createComparisonPair(canvasIds, purchases, options = {}) {
        console.log('Создание графиков сравнения периодов');
        
        // Обрабатываем данные через UnifiedDataProcessor
        const processedData = this.unifiedProcessor.comparePeriods(purchases, options);
        
        // Создаем пару графиков
        const pair = new ChartPair(
            canvasIds.left || 'left-chart',
            canvasIds.right || 'right-chart',
            {
                type: options.type || 'line',
                leftTitle: options.leftTitle || `Сравнение сумм: ${options.year1} vs ${options.year2}`,
                rightTitle: options.rightTitle || `Сравнение количества: ${options.year1} vs ${options.year2}`,
                showAmount: true,
                showCount: true,
                dataType: 'comparison'
            }
        );
        
        const charts = pair.create({
            amountData: processedData.amountData,
            countData: processedData.countData
        });
        
        // Сохраняем пару
        this.chartPairs.set(`${canvasIds.left}-${canvasIds.right}`, pair);
        
        // Добавляем статистику в заголовок
        this.addComparisonStats(processedData.meta);
        
        return charts;
    }
    
    /**
     * Добавление статистики сравнения
     */
    addComparisonStats(meta) {
        const container = document.querySelector('.comparison-stats');
        if (!container) return;
        
        const changePercent = meta.period2Total > 0 ? 
            ((meta.period1Total - meta.period2Total) / meta.period2Total * 100).toFixed(1) : 
            0;
        
        const changeSymbol = meta.difference >= 0 ? '📈' : '📉';
        const changeClass = meta.difference >= 0 ? 'positive' : 'negative';
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-title">${meta.year1} год</div>
                    <div class="stat-value">${ChartUtils.formatCurrency(meta.period1Total)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">${meta.year2} год</div>
                    <div class="stat-value">${ChartUtils.formatCurrency(meta.period2Total)}</div>
                </div>
                <div class="stat-card ${changeClass}">
                    <div class="stat-title">Изменение ${changeSymbol}</div>
                    <div class="stat-value">${ChartUtils.formatCurrency(Math.abs(meta.difference))}</div>
                    <div class="stat-percent">${changePercent}%</div>
                </div>
            </div>
        `;
    }
	
	/**
	 * ТЕПЛОВЫЕ КАРТЫ
     * Создание пары тепловых карт
     */
    createHeatmapPair(canvasIds, purchases, options = {}) {
        console.log('Создание тепловых карт', options);
        
        // Обрабатываем данные через UnifiedDataProcessor
        const processedData = this.unifiedProcessor.processHeatmapData(purchases, options);
        
        // Создаем уникальные ID для подграфиков
        const amountCanvasId = canvasIds.left || 'left-chart';
        const countCanvasId = canvasIds.right || 'right-chart';
        
        // Создаем левый график (суммы)
        const amountChart = this.createHeatmap(
            amountCanvasId,
            processedData.amountData,
            {
                title: options.leftTitle || `Тепловая карта: ${processedData.meta.monthName} ${processedData.meta.year} (суммы)`,
                type: 'heatmap',
                maxValue: processedData.meta.maxAmount,
                unit: '₽'
            }
        );
        
        // Создаем правый график (количество)
        const countChart = this.createHeatmap(
            countCanvasId,
            processedData.countData,
            {
                title: options.rightTitle || `Тепловая карта: ${processedData.meta.monthName} ${processedData.meta.year} (количество)`,
                type: 'heatmap',
                maxValue: processedData.meta.maxCount,
                unit: 'шт'
            }
        );
        
        // Сохраняем графики
        if (amountChart) this.charts.set(amountCanvasId, amountChart);
        if (countChart) this.charts.set(countCanvasId, countChart);
        
        // Добавляем статистику
        this.addHeatmapStats(processedData.meta);
        
        return { amountChart, countChart };
    }
    
    /**
     * Создание одиночной тепловой карты
     */
    createHeatmap(canvasId, data, options = {}) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error(`Canvas ${canvasId} не найден`);
                return null;
            }
            
            // Уничтожаем старый график
            this.destroyChart(canvasId);
            
            const ctx = canvas.getContext('2d');
            
            // Создаем конфигурацию для тепловой карты
            const config = {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: data.datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y', // Горизонтальная группировка по неделям
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || 'Тепловая карта',
                            font: { size: 16, weight: 'bold' },
                            padding: 20
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                generateLabels: function(chart) {
                                    const datasets = chart.data.datasets;
                                    return datasets.map((dataset, i) => ({
                                        text: dataset.label,
                                        fillStyle: dataset.backgroundColor[0] || '#ccc',
                                        strokeStyle: dataset.borderColor,
                                        hidden: false,
                                        index: i
                                    }));
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                title: (context) => {
                                    const dataset = context[0].dataset;
                                    const label = context[0].label;
                                    return `${dataset.label}, ${label}`;
                                },
                                label: (context) => {
                                    const value = context.raw;
                                    const maxValue = options.maxValue || 100;
                                    const intensity = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
                                    
                                    if (options.unit === '₽') {
                                        return [`Сумма: ${ChartUtils.formatCurrency(value)}`,
                                                `Интенсивность: ${intensity}%`];
                                    } else {
                                        return [`Количество: ${ChartUtils.formatNumber(value, 0)} ${options.unit}`,
                                                `Интенсивность: ${intensity}%`];
                                    }
                                }
                            },
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            cornerRadius: 6
                        },
                        datalabels: {
                            display: true,
                            color: '#333',
                            font: { size: 10, weight: 'bold' },
                            formatter: (value) => {
                                if (value === 0) return '';
                                if (options.unit === '₽') {
                                    return ChartUtils.formatCurrency(value, '', 0);
                                }
                                return ChartUtils.formatNumber(value, 0);
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { display: false },
                            ticks: {
                                callback: (value) => {
                                    if (options.unit === '₽') {
                                        return ChartUtils.formatCurrency(value, '', 0);
                                    }
                                    return ChartUtils.formatNumber(value, 0);
                                }
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { autoSkip: false }
                        }
                    },
                    layout: {
                        padding: { top: 20, bottom: 20, left: 10, right: 20 }
                    }
                }
            };
            
            const chart = new Chart(ctx, config);
            
            // Сохраняем в canvas
            canvas.chartInstance = chart;
            
            console.log(`Тепловая карта создана: ${canvasId}`);
            return chart;
            
        } catch (error) {
            console.error(`Ошибка создания тепловой карты ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Добавление статистики тепловой карты
     */
    addHeatmapStats(meta) {
        const container = document.querySelector('.heatmap-stats');
        if (!container) return;
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-title">Период</div>
                    <div class="stat-value">${meta.monthName} ${meta.year}</div>
                    <div class="stat-desc">${meta.weeksCount} недель</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Всего потрачено</div>
                    <div class="stat-value">${ChartUtils.formatCurrency(meta.totalAmount)}</div>
                    <div class="stat-desc">${meta.totalCount} покупок</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Максимум в день</div>
                    <div class="stat-value">${ChartUtils.formatCurrency(meta.maxAmount)}</div>
                    <div class="stat-desc">${meta.totalCount > 0 ? 
                        `Средний чек: ${ChartUtils.formatCurrency(meta.totalAmount / meta.totalCount)}` : 
                        'Нет данных'}</div>
                </div>
            </div>
        `;
    }
	
	/**
	 * СОВМЕЩЁННЫЙ ГРАФИК
     * Создание пары совмещенных графиков
     */
    createComboPair(canvasIds, purchases, options = {}) {
        console.log('Создание совмещенных графиков', options);
        
        // Обрабатываем данные
        const processedData = this.unifiedProcessor.processComboData(purchases, options);
        
        // Создаем левый график (сумма + количество)
        const leftChart = this.createComboChart(
            canvasIds.left || 'left-chart',
            processedData.amountCountData,
            {
                title: options.leftTitle || `Сумма и количество покупок (${this._getPeriodName(options.period)})`,
                leftAxisLabel: 'Сумма, ₽',
                rightAxisLabel: 'Количество, шт',
                colors: ['#3498db', '#e74c3c']
            }
        );
        
        // Создаем правый график (сумма + средний чек)
        const rightChart = this.createComboChart(
            canvasIds.right || 'right-chart',
            processedData.amountAverageData,
            {
                title: options.rightTitle || `Сумма и средний чек (${this._getPeriodName(options.period)})`,
                leftAxisLabel: 'Сумма, ₽',
                rightAxisLabel: 'Средний чек, ₽',
                colors: ['#2ecc71', '#f39c12']
            }
        );
        
        // Сохраняем графики
        if (leftChart) {
            this.charts.set(canvasIds.left || 'left-chart', leftChart);
            this._makeChartInteractive(leftChart, canvasIds.left, 'combo', 'left');
        }
        
        if (rightChart) {
            this.charts.set(canvasIds.right || 'right-chart', rightChart);
            this._makeChartInteractive(rightChart, canvasIds.right, 'combo', 'right');
        }
        
        // Добавляем статистику
        this.addComboStats(processedData.meta);
        
        return { leftChart, rightChart, meta: processedData.meta };
    }
    
    /**
     * Создание одиночного совмещенного графика
     */
    createComboChart(canvasId, data, options = {}) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error(`Canvas ${canvasId} не найден`);
                return null;
            }
            
            // Уничтожаем старый график
            this.destroyChart(canvasId);
            
            const ctx = canvas.getContext('2d');
            
            // Конфигурация для совмещенного графика
            const config = {
                type: 'bar', // Базовый тип, но datasets переопределяют
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: options.title || 'Совмещенный график',
                            font: { size: 16, weight: 'bold' },
                            padding: { top: 10, bottom: 20 }
                        },
                        legend: {
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 15,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleFont: { size: 14, weight: 'bold' },
                            bodyFont: { size: 13 },
                            padding: 12,
                            cornerRadius: 6,
                            callbacks: {
                                label: (context) => {
                                    const label = context.dataset.label || '';
                                    const value = context.raw || 0;
                                    
                                    if (label.includes('Сумма') || label.includes('₽')) {
                                        return `${label}: ${ChartUtils.formatCurrency(value)}`;
                                    } else if (label.includes('Количество')) {
                                        return `${label}: ${ChartUtils.formatNumber(value, 0)} шт`;
                                    } else {
                                        return `${label}: ${ChartUtils.formatCurrency(value)}`;
                                    }
                                }
                            }
                        },
                        datalabels: {
                            display: (context) => {
                                // Показываем подписи только для столбцов с большими значениями
                                const dataset = context.dataset;
                                if (dataset.type === 'bar') {
                                    const value = context.raw;
                                    const maxValue = Math.max(...dataset.data);
                                    return value > maxValue * 0.1; // Показываем только >10% от максимума
                                }
                                return false; // Не показываем подписи на линии
                            },
                            anchor: 'end',
                            align: 'top',
                            offset: 4,
                            color: '#333',
                            font: { size: 11, weight: 'bold' },
                            formatter: (value, context) => {
                                const datasetLabel = context.dataset.label || '';
                                if (datasetLabel.includes('Сумма')) {
                                    return ChartUtils.formatCurrency(value, '', 0);
                                }
                                return ChartUtils.formatNumber(value, 0);
                            }
                        }
                    },
                    scales: {
                        // Левая ось Y (для столбцов)
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: options.leftAxisLabel || 'Сумма, ₽',
                                font: { size: 12, weight: 'bold' }
                            },
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                callback: (value) => ChartUtils.formatCurrency(value, '', 0)
                            }
                        },
                        // Правая ось Y (для линии)
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: options.rightAxisLabel || 'Количество',
                                font: { size: 12, weight: 'bold' }
                            },
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false // Не рисуем сетку на правой оси
                            },
                            ticks: {
                                callback: (value) => {
                                    if (options.rightAxisLabel.includes('₽')) {
                                        return ChartUtils.formatCurrency(value, '', 0);
                                    }
                                    return ChartUtils.formatNumber(value, 0);
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                maxRotation: 45,
                                font: { size: 11 }
                            }
                        }
                    }
                }
            };
            
            const chart = new Chart(ctx, config);
            
            // Сохраняем в canvas
            canvas.chartInstance = chart;
            
            console.log(`Совмещенный график создан: ${canvasId}`);
            return chart;
            
        } catch (error) {
            console.error(`Ошибка создания совмещенного графика ${canvasId}:`, error);
            return null;
        }
    }
    
    /**
     * Добавление интерактивности для совмещенного графика
     */
    _makeChartInteractive(chart, canvasId, chartType, side) {
        if (!chart || !chart.canvas) return;
        
        chart.canvas.style.cursor = 'pointer';
        chart.canvas.dataset.chartType = chartType;
        chart.canvas.dataset.side = side;
        
        // Добавляем обработчик клика
        chart.options.onClick = (event, elements) => {
            if (elements && elements.length > 0) {
                const element = elements[0];
                const label = chart.data.labels[element.index];
                const value = chart.data.datasets[element.datasetIndex].data[element.index];
                
                console.log(`Клик на ${canvasId}: ${label} = ${value}`);
                
                // Сохраняем фильтр
                const filter = {
                    type: 'combo',
                    period: label,
                    value: value,
                    side: side,
                    timestamp: Date.now()
                };
                
                this.setActiveFilter(filter);
                this.showSimpleNotification(`Выбран период: ${label}`);
            }
        };
        
        chart.update();
    }
    
    /**
     * Получение названия периода
     */
    _getPeriodName(period) {
        const names = {
            'day': 'дни',
            'week': 'недели',
            'month': 'месяцы',
            'quarter': 'кварталы',
            'year': 'годы'
        };
        return names[period] || period;
    }
    
    /**
     * Добавление статистики совмещенного графика
     */
    addComboStats(meta) {
        const container = document.querySelector('.combo-stats');
        if (!container) return;
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-title">Период</div>
                    <div class="stat-value">${meta.year || 'Все годы'}</div>
                    <div class="stat-desc">${meta.periodsCount} ${this._getPeriodName(meta.period)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Всего потрачено</div>
                    <div class="stat-value">${ChartUtils.formatCurrency(meta.totalAmount)}</div>
                    <div class="stat-desc">${meta.totalCount} покупок</div>
                </div>
                <div class="stat-card">
                    <div class="stat-title">Средний чек</div>
                    <div class="stat-value">${ChartUtils.formatCurrency(meta.overallAverage)}</div>
                    <div class="stat-desc">
                        Макс сумма: ${ChartUtils.formatCurrency(meta.maxAmount)}<br>
                        Макс покупок: ${ChartUtils.formatNumber(meta.maxCount, 0)} шт
                    </div>
                </div>
            </div>
        `;
    }

}

// ============================================
// 8. УНИФИЦИРОВАННЫЙ ОБРАБОТЧИК ДАННЫХ (ДЛЯ AMOUNT/COUNT)
// ============================================
/** КОММЕНТАРИИ
 * Класс: UnifiedDataProcessor
 * Назначение: Унифицированный процессор данных для парных графиков (сумма/количество).
 * 
 * Это основной класс обработки данных в приложении. В отличие от простого DataProcessor,
 * возвращает сразу два набора данных: для левого графика (суммы) и правого (количество).
 * 
 * Основные возможности:
 * - Обработка категорий (горизонтальные гистограммы)
 * - Обработка месяцев (вертикальные гистограммы с цветами по сезонам)
 * - Обработка годов (стабильные цвета для каждого года)
 * - Обработка магазинов и товаров (ТОП-10)
 * - Сравнение периодов (год vs год)
 * - Тепловые карты (дни × недели)
 * - Совмещённые графики (сумма + количество/средний чек)
 * 
 * @example
 * const processor = new UnifiedDataProcessor();
 * const { amountData, countData } = processor.process(
 *   'categories',
 *   purchases,
 *   categories,
 *   { limit: 10 }
 * );
 * // amountData - для левого графика (суммы)
 * // countData - для правого графика (количество)
 */

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
        const limit = options.limit || 10; // Лимит 10
        
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
		
		// ИСПОЛЬЗУЕМ НОВЫЙ МЕТОД ДЛЯ ЦВЕТОВ МЕСЯЦЕВ
		const monthColors = items.map(item => ChartThemes.getMonthColor(item.month));
        
        // Формируем данные для amount (сумма)
        const amountData = {
            labels: items.map(item => item.name),
            datasets: [{
                label: 'Сумма расходов, ₽',
                data: items.map(item => item.amount),
                backgroundColor: monthColors, // Разные цвета для каждого месяца
				borderColor: monthColors.map(color => ChartUtils.darkenColor(color, 0.2)),
                borderWidth: 1
            }]
        };
        
        // Формируем данные для count (количество)
        const countData = {
            labels: items.map(item => item.name),
            datasets: [{
                label: 'Количество покупок',
                data: items.map(item => item.count),
                backgroundColor: monthColors, // Те же цвета
				borderColor: monthColors.map(color => ChartUtils.darkenColor(color, 0.2)),
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
                    name: `${year}`,  // Только год, без слова "год"
                    amount: 0,
                    count: 0
                };
            }
            
            stats[year].amount += parseFloat(purchase.amount) || 0;
            stats[year].count += 1;
        });
        
        // Сортируем по году
        const items = Object.values(stats).sort((a, b) => a.year - b.year);
        
		// ИСПОЛЬЗУЕМ НОВЫЙ МЕТОД ДЛЯ ЦВЕТОВ ГОДОВ
		const yearColors = items.map(item => ChartThemes.getYearColor(item.year));
		
        // Формируем данные
        const amountData = {
            labels: items.map(item => item.name),
            datasets: [{
                label: 'Сумма расходов',
                data: items.map(item => item.amount),
                backgroundColor: yearColors,
				borderColor: yearColors.map(color => ChartUtils.darkenColor(color, 0.2)),
                borderWidth: 1
            }]
        };
        
        const countData = {
            labels: items.map(item => item.name),
            datasets: [{
                label: 'Количество покупок',
                data: items.map(item => item.count),
                backgroundColor: yearColors,
				borderColor: yearColors.map(color => ChartUtils.darkenColor(color, 0.2)),
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
		
		// Упрощённые метки - только название магазина
		// Формируем данные для amount (сумма)
		const amountData = {
			labels: amountSorted.map(item => {
				// Сокращаем длинные названия магазинов
				const name = item.name.length > 20 ? 
					item.name.substring(0, 20) + '...' : 
					item.name;
				return `${name}`;
			}),
			datasets: [{
				label: 'Сумма покупок',
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
				// Сокращаем длинные названия магазинов
				const name = item.name.length > 20 ? 
					item.name.substring(0, 20) + '...' : 
					item.name;
				return `${name}`;
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
					name: productName,  // Только название товара
					amount: 0,
					count: 0
				};
			}
			
			stats[key].amount += parseFloat(purchase.amount) || 0;
			stats[key].count += 1;
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
		
		// Простые метки - только название товара
		// Формируем данные для amount (сумма)
		const amountData = {
			labels: amountSorted.map(item => item.name),
			datasets: [{
				label: 'Сумма покупок',
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
			labels: countSorted.map(item => item.name),
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
	
	/**
	 * СРАВНЕНИЕ ПЕРИОДОВ
     * Сравнение двух периодов (год vs год)
     * Возвращает данные для обоих графиков: суммы и количества
     */
    comparePeriods(purchases, options = {}) {
        console.log('Сравнение периодов', options);
        
        const year1 = options.year1 || new Date().getFullYear();
        const year2 = options.year2 || year1 - 1;
        const type = options.type || 'year'; // 'year', 'month', 'quarter'
        
        // Фильтруем данные по периодам
        const period1Data = this.filterByPeriod(purchases, year1, type);
        const period2Data = this.filterByPeriod(purchases, year2, type);
        
        // Агрегируем данные
        const period1Amount = this._aggregateByTime(period1Data, type, 'amount');
        const period2Amount = this._aggregateByTime(period2Data, type, 'amount');
        
        const period1Count = this._aggregateByTime(period1Data, type, 'count');
        const period2Count = this._aggregateByTime(period2Data, type, 'count');
        
        // Подготавливаем метки в зависимости от типа периода
        const labels = this.getPeriodLabels(type, year1);
        
        // Формируем данные для левого графика (суммы)
        const amountData = {
            labels: labels,
            datasets: [
                {
                    label: `${year1} год`,
                    data: labels.map((_, i) => period1Amount[i] || 0),
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: `${year2} год`,
                    data: labels.map((_, i) => period2Amount[i] || 0),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    borderDash: [5, 5] // Пунктир для второго периода
                }
            ]
        };
        
        // Формируем данные для правого графика (количества)
        const countData = {
            labels: labels,
            datasets: [
                {
                    label: `${year1} год`,
                    data: labels.map((_, i) => period1Count[i] || 0),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: `${year2} год`,
                    data: labels.map((_, i) => period2Count[i] || 0),
                    borderColor: '#9b59b6',
                    backgroundColor: 'rgba(155, 89, 182, 0.2)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    borderDash: [5, 5]
                }
            ]
        };
        
        console.log('Данные для сравнения подготовлены:', {
            year1, year2, type,
            labelsCount: labels.length,
            amountDataPoints: amountData.datasets[0].data.length,
            countDataPoints: countData.datasets[0].data.length
        });
        
        return {
            amountData: amountData,
            countData: countData,
            meta: {
                year1: year1,
                year2: year2,
                type: type,
                period1Total: period1Amount.reduce((a, b) => a + b, 0),
                period2Total: period2Amount.reduce((a, b) => a + b, 0),
                difference: period1Amount.reduce((a, b) => a + b, 0) - 
                           period2Amount.reduce((a, b) => a + b, 0)
            }
        };
    }
    
    /**
     * Фильтрация данных по периоду
     */
    filterByPeriod(purchases, year, type = 'year') {
        return purchases.filter(purchase => {
            if (!purchase.date) return false;
            const date = new Date(purchase.date);
            
            switch(type) {
                case 'year':
                    return date.getFullYear() === year;
                case 'month':
                    // Для месячного сравнения нужен месяц и год
                    const targetMonth = Math.floor((date.getMonth() + 1) / 2) * 2; // Группировка по 2 месяца
                    return date.getFullYear() === year;
                case 'quarter':
                    const quarter = Math.floor(date.getMonth() / 3) + 1;
                    return date.getFullYear() === year;
                default:
                    return date.getFullYear() === year;
            }
        });
    }
    
    /**
     * Агрегация данных по времени
     */
    _aggregateByTime(purchases, type, mode = 'amount') {
        const aggregation = {};
        
        purchases.forEach(purchase => {
            const date = new Date(purchase.date);
            let periodKey;
            
            switch(type) {
                case 'year':
                    // Агрегация по месяцам внутри года
                    periodKey = date.getMonth(); // 0-11
                    break;
                case 'month':
                    // По дням месяца (группировка по неделям)
                    periodKey = Math.floor((date.getDate() - 1) / 7); // 0-3 недели
                    break;
                case 'quarter':
                    // По месяцам внутри квартала
                    const quarter = Math.floor(date.getMonth() / 3);
                    periodKey = date.getMonth() - (quarter * 3); // 0-2 месяца в квартале
                    break;
                default:
                    periodKey = date.getMonth();
            }
            
            if (!aggregation[periodKey]) {
                aggregation[periodKey] = {
                    amount: 0,
                    count: 0
                };
            }
            
            aggregation[periodKey].amount += parseFloat(purchase.amount) || 0;
            aggregation[periodKey].count += 1;
        });
        
        // Преобразуем в массив, заполняя пропуски
        const maxPeriods = type === 'year' ? 12 : 
                          type === 'month' ? 4 : 
                          type === 'quarter' ? 3 : 12;
        
        const result = [];
        for (let i = 0; i < maxPeriods; i++) {
            result.push(aggregation[i] ? aggregation[i][mode] : 0);
        }
        
        return result;
    }
    
    /**
     * Получение меток для периода
     */
    getPeriodLabels(type, year) {
        switch(type) {
            case 'year':
                const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 
                                   'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
                return monthNames;
                
            case 'month':
                return ['1-7', '8-14', '15-21', '22-31'];
                
            case 'quarter':
                return ['Янв-Мар', 'Апр-Июн', 'Июл-Сен', 'Окт-Дек'];
                
            default:
                return Array(12).fill().map((_, i) => `Период ${i + 1}`);
        }
    }
    
    /**
     * Получение доступных годов для сравнения
     */
    getAvailableYearsForComparison(purchases) {
        const years = new Set();
        
        purchases.forEach(purchase => {
            if (purchase.date) {
                const date = new Date(purchase.date);
                years.add(date.getFullYear());
            }
        });
        
        return Array.from(years).sort((a, b) => b - a); // По убыванию
    }
	
    /**
	 * ТЕПЛОВАЯ КАРТА
     * Обработка данных для тепловой карты
     * @param {Array} purchases - массив покупок
     * @param {Object} options - { year, month }
     * @returns {Object} { amountData, countData }
     */
    processHeatmapData(purchases, options = {}) {
        console.log('Обработка данных для тепловой карты', options);
        
        const year = options.year || new Date().getFullYear();
        const month = options.month || new Date().getMonth() + 1;
        
        // Фильтруем покупки за указанный месяц
        const monthPurchases = purchases.filter(p => {
            if (!p.date) return false;
            const date = new Date(p.date);
            return date.getFullYear() === year && (date.getMonth() + 1) === month;
        });
        
        console.log(`Покупок за ${year}.${month}: ${monthPurchases.length}`);
        
        // Определяем дни недели и недели месяца
        const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        
        // Получаем первый день месяца
        const firstDay = new Date(year, month - 1, 1);
        // Получаем последний день месяца
        const lastDay = new Date(year, month, 0);
        
        // Определяем количество недель в месяце
        const weeksCount = Math.ceil((lastDay.getDate() + (firstDay.getDay() || 7) - 1) / 7);
        
        // Создаем матрицу для тепловой карты
        const amountMatrix = this._createEmptyMatrix(weeksCount, 7);
        const countMatrix = this._createEmptyMatrix(weeksCount, 7);
        
        // Заполняем матрицы данными
        monthPurchases.forEach(purchase => {
            const date = new Date(purchase.date);
            const day = date.getDate();
            const weekday = date.getDay(); // 0 = Вс, 1 = Пн, ..., 6 = Сб
            
            // Преобразуем в наш формат (Пн = 0, Вс = 6)
            let weekdayIndex = weekday === 0 ? 6 : weekday - 1;
            
            // Определяем номер недели в месяце
            const weekNumber = Math.ceil((day + (firstDay.getDay() || 7) - 1) / 7) - 1;
            
            if (weekNumber < weeksCount) {
                amountMatrix[weekNumber][weekdayIndex] += parseFloat(purchase.amount) || 0;
                countMatrix[weekNumber][weekdayIndex] += 1;
            }
        });
        
        // Подготавливаем данные для Chart.js (кастомный heatmap)
        const amountData = this._prepareHeatmapDataset(amountMatrix, weekdays, weeksCount, 'amount');
        const countData = this._prepareHeatmapDataset(countMatrix, weekdays, weeksCount, 'count');
        
        // Добавляем мета-информацию
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                           'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        
        return {
            amountData: amountData,
            countData: countData,
            meta: {
                year: year,
                month: month,
                monthName: monthNames[month - 1],
                weeksCount: weeksCount,
                totalAmount: amountMatrix.flat().reduce((a, b) => a + b, 0),
                totalCount: countMatrix.flat().reduce((a, b) => a + b, 0),
                maxAmount: Math.max(...amountMatrix.flat()),
                maxCount: Math.max(...countMatrix.flat())
            }
        };
    }
    
    /**
     * Создание пустой матрицы
     */
    _createEmptyMatrix(rows, cols) {
        return Array(rows).fill().map(() => Array(cols).fill(0));
    }
    
    /**
     * Подготовка данных для тепловой карты
     */
    _prepareHeatmapDataset(matrix, weekdays, weeksCount, mode) {
        // Создаем данные в формате для heatmap
        const datasets = [];
        
        // Определяем цветовую шкалу в зависимости от режима
        const colorScale = mode === 'amount' 
            ? ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20']
            : ['#fff3e0', '#ffe0b2', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100'];
        
        // Находим максимальное значение для нормализации
        const maxValue = Math.max(...matrix.flat());
        
        // Создаем тепловую карту как матрицу точек
        for (let week = 0; week < weeksCount; week++) {
            const weekData = matrix[week];
            
            // Определяем цвет на основе значения
            const backgroundColor = weekData.map(value => {
                if (value === 0) return '#f5f5f5'; // Серый для нулевых значений
                const intensity = Math.min(9, Math.floor((value / maxValue) * 10) || 0);
                return colorScale[intensity];
            });
            
            datasets.push({
                label: `Неделя ${week + 1}`,
                data: weekData,
                backgroundColor: backgroundColor,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                borderWidth: 1,
                borderRadius: 4,
                barPercentage: 0.9,
                categoryPercentage: 0.9
            });
        }
        
        return {
            labels: weekdays,
            datasets: datasets,
            maxValue: maxValue
        };
    }
    
    /**
     * Получение доступных месяцев для тепловой карты
     */
    getAvailableMonthsForHeatmap(purchases) {
        const months = new Set();
        
        purchases.forEach(purchase => {
            if (purchase.date) {
                const date = new Date(purchase.date);
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                months.add(`${year}-${month.toString().padStart(2, '0')}`);
            }
        });
        
        return Array.from(months)
            .sort()
            .reverse()
            .map(key => {
                const [year, month] = key.split('-');
                const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
                                   'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
                return {
                    key: key,
                    year: parseInt(year),
                    month: parseInt(month),
                    monthName: monthNames[parseInt(month) - 1],
                    display: `${monthNames[parseInt(month) - 1]} ${year}`
                };
            });
    }
	
	/**
	 * СОВМЕЩЁННЫЙ ГРАФИК
     * Обработка данных для совмещенного графика
     * @param {Array} purchases - массив покупок
     * @param {Object} options - { period, year }
     * @returns {Object} { amountCountData, amountAverageData }
     */
    processComboData(purchases, options = {}) {
        console.log('Обработка данных для совмещенного графика', options);
        
        const period = options.period || 'month'; // month, week, day
        const year = options.year || null;
        
        // Фильтруем по году если указан
        let filteredPurchases = purchases;
        if (year) {
            filteredPurchases = purchases.filter(p => {
                if (!p.date) return false;
                const date = new Date(p.date);
                return date.getFullYear() === year;
            });
        }
        
        // Агрегируем данные по периодам
        const aggregatedData = this._aggregateByPeriod(filteredPurchases, period);
        
        // Подготавливаем метки
        const labels = this._getPeriodLabels(aggregatedData, period, year);
        
        // Данные для левого графика: сумма + количество
        const amountCountData = {
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Сумма расходов, ₽',
                    data: aggregatedData.map(d => d.amount),
                    backgroundColor: 'rgba(52, 152, 219, 0.7)',
                    borderColor: '#2980b9',
                    borderWidth: 1,
                    borderRadius: 4,
                    order: 2,
                    yAxisID: 'y' // Левая ось
                },
                {
                    type: 'line',
                    label: 'Количество покупок',
                    data: aggregatedData.map(d => d.count),
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#e74c3c',
                    tension: 0.3,
                    fill: false,
                    order: 1,
                    yAxisID: 'y1' // Правая ось
                }
            ]
        };
        
        // Данные для правого графика: сумма + средний чек
        const amountAverageData = {
            labels: labels,
            datasets: [
                {
                    type: 'bar',
                    label: 'Сумма расходов, ₽',
                    data: aggregatedData.map(d => d.amount),
                    backgroundColor: 'rgba(46, 204, 113, 0.7)',
                    borderColor: '#27ae60',
                    borderWidth: 1,
                    borderRadius: 4,
                    order: 2,
                    yAxisID: 'y'
                },
                {
                    type: 'line',
                    label: 'Средний чек, ₽',
                    data: aggregatedData.map(d => d.average),
                    borderColor: '#f39c12',
                    backgroundColor: 'rgba(243, 156, 18, 0.1)',
                    borderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#f39c12',
                    tension: 0.3,
                    fill: false,
                    order: 1,
                    yAxisID: 'y1'
                }
            ]
        };
        
        // Добавляем мета-информацию
        const totalAmount = aggregatedData.reduce((sum, d) => sum + d.amount, 0);
        const totalCount = aggregatedData.reduce((sum, d) => sum + d.count, 0);
        const overallAverage = totalCount > 0 ? totalAmount / totalCount : 0;
        
        return {
            amountCountData: amountCountData,
            amountAverageData: amountAverageData,
            meta: {
                period: period,
                year: year,
                totalAmount: totalAmount,
                totalCount: totalCount,
                overallAverage: overallAverage,
                periodsCount: aggregatedData.length,
                maxAmount: Math.max(...aggregatedData.map(d => d.amount)),
                maxCount: Math.max(...aggregatedData.map(d => d.count))
            }
        };
    }
    
    /**
     * Агрегация данных по периодам
     */
    _aggregateByPeriod(purchases, period) {
        const aggregation = {};
        
        purchases.forEach(purchase => {
            if (!purchase.date) return;
            
            const date = new Date(purchase.date);
            let periodKey;
            
            switch(period) {
                case 'day':
                    periodKey = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    // Получаем номер недели в году
                    const start = new Date(date.getFullYear(), 0, 1);
                    const days = Math.floor((date - start) / (24 * 60 * 60 * 1000));
                    const weekNumber = Math.ceil((days + start.getDay() + 1) / 7);
                    periodKey = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
                    break;
                case 'month':
                default:
                    periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                    break;
            }
            
            if (!aggregation[periodKey]) {
                aggregation[periodKey] = {
                    key: periodKey,
                    date: date,
                    amount: 0,
                    count: 0,
                    sumPrice: 0,
                    priceCount: 0
                };
            }
            
            const amount = parseFloat(purchase.amount) || 0;
            const price = parseFloat(purchase.price) || 0;
            
            aggregation[periodKey].amount += amount;
            aggregation[periodKey].count += 1;
            aggregation[periodKey].sumPrice += price;
            aggregation[periodKey].priceCount += 1;
        });
        
        // Преобразуем в массив и сортируем по дате
        let result = Object.values(aggregation)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Добавляем средний чек
        result = result.map(item => ({
            ...item,
            average: item.count > 0 ? item.amount / item.count : 0,
            averagePrice: item.priceCount > 0 ? item.sumPrice / item.priceCount : 0
        }));
        
        return result;
    }
    
    /**
     * Получение меток для периодов
     */
    _getPeriodLabels(aggregatedData, period, year) {
        return aggregatedData.map(item => {
            const date = new Date(item.date);
            
            switch(period) {
                case 'day':
                    return date.toLocaleDateString('ru-RU', { 
                        day: 'numeric', 
                        month: 'short' 
                    });
                    
                case 'week':
                    const weekMatch = item.key.match(/W(\d+)/);
                    const weekNum = weekMatch ? weekMatch[1] : '';
                    return `Нед ${weekNum}`;
                    
                case 'month':
                default:
                    return date.toLocaleDateString('ru-RU', { 
                        month: 'short', 
                        year: year ? undefined : 'numeric' 
                    });
            }
        });
    }
    
    /**
     * Получение доступных годов для совмещенного графика
     */
    getAvailableYearsForCombo(purchases) {
        const years = new Set();
        
        purchases.forEach(purchase => {
            if (purchase.date) {
                const date = new Date(purchase.date);
                years.add(date.getFullYear());
            }
        });
        
        return Array.from(years).sort((a, b) => b - a);
    }

	
}

// ============================================
// 9. КЛАСС ДЛЯ УПРАВЛЕНИЯ ПАРОЙ ГРАФИКОВ
// ============================================
/** КОММЕНТАРИИ
 * Класс: ChartPair
 * Назначение: Управление парой связанных графиков (левый и правый).
 * 
 * Ключевой класс для визуализации, обеспечивающий синхронное отображение
 * двух графиков: слева обычно сумма расходов, справа - количество покупок.
 * 
 * Особенности:
 * - Автоматическое уничтожение старых графиков перед созданием новых
 * - Плавные анимации появления и затухания (fadeOut)
 * - Разные настройки для разных типов графиков (horizontalBar, bar, pie)
 * - Сохранение заголовков и синхронизация состояния
 * - Поддержка интерактивности (при необходимости)
 * 
 * @example
 * // Создание пары графиков
 * const pair = new ChartPair('left-chart', 'right-chart', {
 *   type: 'horizontalBar',
 *   leftTitle: 'Сумма расходов',
 *   rightTitle: 'Количество покупок'
 * });
 * 
 * // Создание с данными
 * pair.create({ amountData, countData });
 * 
 * // Экспорт обоих графиков
 * pair.exportToPNG('my-charts');
 * 
 * @see ChartManager - использует этот класс для всех парных графиков
 */

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
     * Создание пары графиков с анимацией
     */
	create(dataPair, customOptions = {}) {
		const options = { ...this.config, ...customOptions };
		
		// Добавляем эффект "затухания" старых графиков
		this.fadeOutOldCharts();
		
		// Уничтожаем старые графики
		this.destroy();
		
		// Небольшая задержка для визуального эффекта
		setTimeout(() => {
			// Создаем новые графики
			if (options.showAmount && dataPair.amountData) {
				const chartOptions = this._getChartOptions('left', options);
				
				// Добавляем CSS класс для анимации появления
				const canvas = document.getElementById(this.leftCanvasId);
				if (canvas) {
					canvas.classList.add('chart-appear');
					setTimeout(() => canvas.classList.remove('chart-appear'), 1000);
				}
				
				this.leftChart = this._createSingleChart(this.leftCanvasId, dataPair.amountData, chartOptions);
				this._updateChartTitle(this.leftCanvasId, options.leftTitle);
			}
			
			// Аналогично для правого графика
			if (options.showCount && dataPair.countData) {
				const chartOptions = this._getChartOptions('right', options);
				
				const canvas = document.getElementById(this.rightCanvasId);
				if (canvas) {
					canvas.classList.add('chart-appear');
					setTimeout(() => canvas.classList.remove('chart-appear'), 1000);
				}
				
				this.rightChart = this._createSingleChart(this.rightCanvasId, dataPair.countData, chartOptions);
				this._updateChartTitle(this.rightCanvasId, options.rightTitle);
			}
		}, 150); // Задержка для эффекта
		
		return { left: this.leftChart, right: this.rightChart };
	}

	/**
	 * Плавное затухание старых графиков
	 */
	fadeOutOldCharts() {
		const leftCanvas = document.getElementById(this.leftCanvasId);
		const rightCanvas = document.getElementById(this.rightCanvasId);
		
		[leftCanvas, rightCanvas].forEach(canvas => {
			if (canvas) {
				canvas.style.transition = 'opacity 0.3s ease';
				canvas.style.opacity = '0';
				
				setTimeout(() => {
					canvas.style.opacity = '1';
				}, 300);
			}
		});
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
			const isAmountChart = options.isAmountChart;
			
			// Общие настройки для легенды
			const legendConfig = {
				display: true,
				position: 'top',
				labels: {
					// Убираем символ валюты из легенды
					generateLabels: (chart) => {
						const datasets = chart.data.datasets;
						return datasets.map((dataset, i) => ({
							text: isAmountChart ? dataset.label.replace('₽', '').trim() : dataset.label,
							fillStyle: dataset.backgroundColor,
							hidden: false,
							index: i
						}));
					}
				}
			};
			
			// Определяем, какой класс использовать
			if (chartType === 'pie' || chartType === 'doughnut') {
				chart = new PieChart(canvasId, {
					type: chartType,
					options: {
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								position: 'right',
								labels: {
									generateLabels: (chart) => {
										const data = chart.data;
										if (data.labels.length && data.datasets.length) {
											return data.labels.map((label, i) => {
												const dataset = data.datasets[0];
												const value = dataset.data[i];
												const total = dataset.data.reduce((a, b) => a + b, 0);
												const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
												
												// ОЧИЩАЕМ метку от символов валюты и лишнего текста
												let cleanLabel = label
													.replace(/₽/g, '')
													.replace(/\d+\.\d+ ₽/g, '')
													.trim();
												
												// Для правого графика (количество) не показываем валюту
												if (!isAmountChart) {
													return {
														text: `${cleanLabel}: ${ChartUtils.formatNumber(value, 0)} шт. (${percentage}%)`,
														fillStyle: dataset.backgroundColor[i],
														strokeStyle: dataset.borderColor?.[i] || dataset.backgroundColor[i],
														lineWidth: 1,
														hidden: false,
														index: i
													};
												}
												
												// Для левого графика (сумма) показываем только сумму и проценты без символа ₽
												return {
													text: `${cleanLabel}: ${ChartUtils.formatNumber(value, 0)} (${percentage}%)`,
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
							},
							tooltip: {
								callbacks: {
									label: (context) => {
										const value = context.raw;
										const total = context.dataset.data.reduce((a, b) => a + b, 0);
										const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
										if (isAmountChart) {
											return `${ChartUtils.formatCurrency(value)} (${percentage}%)`;
										}
										return `${ChartUtils.formatNumber(value, 0)} шт. (${percentage}%)`;
									}
								}
							}
						}
					}
				});
			} else if (chartType === 'horizontalBar') {
				// Горизонтальная гистограмма с правильными метками
				chart = new BarChart(canvasId, {
					type: 'bar',
					options: {
						responsive: true,
						maintainAspectRatio: false,
						indexAxis: 'y', // КЛЮЧЕВОЙ ПАРАМЕТР
						plugins: {
							legend: legendConfig,
							tooltip: {
								callbacks: {
									label: (context) => {
										const value = context.raw || 0;
										if (isAmountChart) {
											return `${ChartUtils.formatCurrency(value)}`;
                                    }
                                    return `${ChartUtils.formatNumber(value, 0)} шт.`;
                                }
                            }
                        }
                    },
						scales: {
							x: {
								beginAtZero: true,
								ticks: {
									callback: (value) => {
										if (isAmountChart) {
											return ChartUtils.formatNumber(value, 0);
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
			} else { // 'bar' (вертикальная) и 'line'
				// Вертикальная гистограмма и линии
				chart = new BarChart(canvasId, {
					type: chartType === 'line' ? 'line' : 'bar',
					options: {
						responsive: true,
						maintainAspectRatio: false,
						indexAxis: 'x', // Это значение по умолчанию, но для ясности
						plugins: {
							legend: legendConfig,
							tooltip: {
								callbacks: {
									label: (context) => {
										const value = context.raw || 0;
										if (isAmountChart) {
											return `${ChartUtils.formatCurrency(value)}`;
                                    }
                                    return `${ChartUtils.formatNumber(value, 0)} шт.`;
                                }
                            }
                        }
                    },
						scales: {
							y: {
								beginAtZero: true,
								ticks: {
									callback: (value) => {
										if (isAmountChart) {
											return ChartUtils.formatNumber(value, 0);
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
// 10. ИНИЦИАЛИЗАЦИЯ И ГЛОБАЛЬНЫЙ ДОСТУП
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