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
        const limit = options.limit || 20; // Ограничение количества категорий
        
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
        
        // Сортируем по сумме (для amount) или количеству (для count)
        const amountSorted = [...items].sort((a, b) => b.amount - a.amount).slice(0, limit);
        const countSorted = [...items].sort((a, b) => b.count - a.count).slice(0, limit);
        
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
    
    // Методы для stores и products будут реализованы позже
    _processStores(purchases, stores, options = {}) {
        return { amountData: { labels: [], datasets: [] }, countData: { labels: [], datasets: [] } };
    }
    
    _processProducts(purchases, options = {}) {
        return { amountData: { labels: [], datasets: [] }, countData: { labels: [], datasets: [] } };
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
            let chart;
            
            // Определяем тип графика и индексную ось
            const chartType = options.type;
            const indexAxis = options.indexAxis;
            
            if (chartType === 'horizontalBar') {
                // Горизонтальная гистограмма
                chart = new BarChart(canvasId, {
                    type: 'bar',
                    options: {
                        ...this._getCommonOptions(),
                        indexAxis: 'y',
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
                                    maxRotation: 0
                                }
                            }
                        }
                    }
                });
            } else {
                // Обычный график
                chart = chartType === 'pie' ? new PieChart(canvasId) : new BarChart(canvasId);
            }
            
            // Создаем график
            return chart.create(data);
            
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