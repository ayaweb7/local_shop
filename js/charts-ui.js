/**
 * charts-ui.js - Интерфейс управления графиками
 * 
 * Этот файл содержит весь код пользовательского интерфейса для страницы графиков,
 * включая обработчики событий, управление фильтрами, переключение типов графиков
 * и взаимодействие с ChartManager.
 * 
 * @requires charts.js - для ChartManager и классов графиков
 * @requires api.js - для загрузки данных
 * @requires chart-settings.js - для сохранения настроек
 * @requires chart-animations.js - для анимаций
 */

// ============================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ
// ============================================

/** @type {string} Текущий тип анализа (categories, months, years, stores, products, comparison, heatmap, combo) */
let currentChartType = 'categories';

/** @type {string} Текущий тип отображения (horizontalBar, bar, pie, doughnut) */
let currentViewType = 'horizontalBar';

/** @type {string} Текущий тип фильтра (all, year, month) */
let currentFilter = 'all';

/** @type {string|null} Выбранный год для фильтрации */
let currentYear = null;

/** @type {string|null} Выбранный месяц для фильтрации */
let currentMonth = null;

/** @type {boolean} Показывать подписи данных на графиках */
let showDataLabels = true;

/** @type {boolean} Показывать проценты на круговых диаграммах */
let showPercentages = false;

// ДОБАВИТЬ: глобальная переменная для доступа из других модулей
window.showPercentages = false;

/** @type {Object} Настройки для сравнения периодов */
let comparisonSettings = {
    type: 'year',
    year1: null,
    year2: null,
    quarter1: null,
    quarter2: null
};

/** @type {Object|null} Текущий выбранный месяц для тепловой карты */
let currentHeatmapMonth = null;

/** @type {string} Текущий период для совмещенного графика (month, week, day) */
let currentComboPeriod = 'month';

/** @type {string|null} Выбранный год для совмещенного графика */
let currentComboYear = null;

/** @type {string} Выбранная метрика для совмещенного графика (count, average) */
let currentComboMetric = 'count';

/** @type {ChartManager} Ссылка на глобальный менеджер графиков */
let chartManager;

/** @type {UnifiedDataProcessor} Процессор данных для графиков */
let unifiedProcessor;

/** @type {ChartSettingsManager} Менеджер настроек */
let settingsManager;

/** @type {Object} Названия месяцев для отображения */
const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

// Глобальная переменная для хранения текущего периода
let currentPeriodText = 'весь период';

// ДОБАВИТЬ глобальные переменные для заголовков
window.currentLeftTitle = '';
window.currentRightTitle = '';
window.currentPeriodText = 'весь период';

// ============================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ
// ============================================

/**
 * Инициализация страницы графиков
 * Вызывается при загрузке DOM
 */
async function initChartsPage() {
    console.log('Charts page initialized');
    
    // Получаем ссылки на глобальные объекты
    chartManager = window.chartManager;
    unifiedProcessor = new UnifiedDataProcessor();
    settingsManager = window.settingsManager;
    
    // Загружаем данные
    await loadData();
    
    // Настраиваем интерфейс
    setupFilters();
    setupChartTypeButtons();
    setupViewTypeButtons();
    setupExportControls();
    setupChartOptions();
    setupComparisonControls();
    setupHeatmapControls();
    setupComboControls();
    
    // Применяем сохраненные настройки
    if (settingsManager) {
        settingsManager.applyToUI();
    }
    
    // Настраиваем автосохранение
    setupAutoSave();
    
    // Создаем начальные графики
    updateCharts();
    
    // Настраиваем дополнительные эффекты
    setupAdditionalEffects();
}

// ============================================
// ЗАГРУЗКА ДАННЫХ
// ============================================

/**
 * Загрузка данных для графиков из API
 */
async function loadData() {
    try {
        window.chartData = {
            purchases: await apiClient.getPurchases(),
            categories: await apiClient.getCategories(),
            stores: await apiClient.getStores()
        };
        
        console.log('Данные загружены:', {
            purchases: window.chartData.purchases?.length,
            categories: window.chartData.categories?.length,
            stores: window.chartData.stores?.length
        });
        
        // Обновляем список годов в фильтрах
        updateYearFilter();
        
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

// ============================================
// ФИЛЬТРЫ
// ============================================

/**
 * Настройка фильтров периода
 */
function setupFilters() {
    const periodFilter = document.getElementById('period-filter');
    const yearFilter = document.getElementById('year-filter');
    const monthFilter = document.getElementById('month-filter');
    const applyBtn = document.getElementById('apply-filters');
    const resetBtn = document.getElementById('reset-filters');
    
    if (!periodFilter) {
        console.warn('Элементы фильтров не найдены');
        return;
    }
    
    periodFilter.addEventListener('change', function() {
        const value = this.value;
        const yearGroup = document.getElementById('year-filter-group');
        const monthGroup = document.getElementById('month-filter-group');
        
        if (value === 'year') {
            yearGroup.style.display = 'block';
            monthGroup.style.display = 'none';
            currentFilter = 'year';
        } else if (value === 'month') {
            yearGroup.style.display = 'block';
            monthGroup.style.display = 'block';
            currentFilter = 'month';
        } else {
            yearGroup.style.display = 'none';
            monthGroup.style.display = 'none';
            currentFilter = 'all';
            currentYear = null;
            currentMonth = null;
        }
    });
    
    applyBtn?.addEventListener('click', updateCharts);
    
    resetBtn?.addEventListener('click', function() {
        periodFilter.value = 'all';
        document.getElementById('year-filter-group').style.display = 'none';
        document.getElementById('month-filter-group').style.display = 'none';
        currentFilter = 'all';
        currentYear = null;
        currentMonth = null;
        updateCharts();
    });
    
    // Обработчик изменения года
    yearFilter?.addEventListener('change', function() {
        currentYear = this.value || null;
        updateMonthFilter();
    });
    
    // Обработчик изменения месяца
    monthFilter?.addEventListener('change', function() {
        currentMonth = this.value || null;
    });
}

/**
 * Обновление списка доступных годов в фильтре
 */
function updateYearFilter() {
    if (!window.chartData || !window.chartData.purchases) return;
    
    const years = unifiedProcessor.getAvailableYears(window.chartData.purchases);
    const yearSelect = document.getElementById('year-filter');
    
    if (!yearSelect) return;
    
    yearSelect.innerHTML = '<option value="">Выберите год</option>';
    years.forEach(year => {
        yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
    });
}

/**
 * Обновление списка доступных месяцев в фильтре
 */
function updateMonthFilter() {
    if (!window.chartData || !window.chartData.purchases) return;
    
    const yearSelect = document.getElementById('year-filter');
    const selectedYear = yearSelect?.value;
    const monthSelect = document.getElementById('month-filter');
    
    if (!monthSelect) return;
    
    if (!selectedYear) {
        // Если год не выбран, показываем все месяцы
        monthSelect.innerHTML = '<option value="">Выберите месяц</option>';
        for (let i = 1; i <= 12; i++) {
            monthSelect.innerHTML += `<option value="${i}">${monthNames[i-1]}</option>`;
        }
        return;
    }
    
    // Получаем только месяцы, которые есть в данных для выбранного года
    const availableMonths = unifiedProcessor.getAvailableMonths(
        window.chartData.purchases, 
        selectedYear
    );
    
    monthSelect.innerHTML = '<option value="">Выберите месяц</option>';
    availableMonths.forEach(month => {
        monthSelect.innerHTML += `<option value="${month.value}">${month.name}</option>`;
    });
}

// ============================================
// УПРАВЛЕНИЕ ТИПАМИ ГРАФИКОВ
// ============================================

/**
 * Настройка кнопок выбора типа анализа
 */
function setupChartTypeButtons() {
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Снимаем активный класс со всех кнопок
            document.querySelectorAll('.chart-type-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Обновляем текущий тип
            currentChartType = this.dataset.type;
            
            // Обновляем графики
            updateCharts();
        });
    });
}

/**
 * Настройка кнопок выбора типа отображения
 */
function setupViewTypeButtons() {
    document.querySelectorAll('.view-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Снимаем активный класс
            document.querySelectorAll('.view-type-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Обновляем текущий тип отображения
            currentViewType = this.dataset.view;
            
            // Обновляем графики
            updateCharts();
        });
    });
}

// ============================================
// ОСНОВНАЯ ФУНКЦИЯ ОБНОВЛЕНИЯ ГРАФИКОВ
// ============================================

/**
 * Обновление всех графиков в соответствии с текущими настройками
 */
function updateCharts() {
    console.log(`Обновление графиков: тип=${currentChartType}, фильтр=${currentFilter}`);
    
    if (!window.chartData || !window.chartData.purchases) {
        console.warn('Нет данных для графиков');
        return;
    }
    
    // Уничтожаем старую пару графиков перед созданием новой
    chartManager.destroyChartPair('left-chart', 'right-chart');
    
    // Фильтруем данные
    let filteredPurchases = [...window.chartData.purchases];
    
	// Формируем текст периода
	let periodText = 'весь период';
	
    if (currentFilter === 'year' && currentYear) {
        // filteredPurchases = unifiedProcessor.filterByYear(filteredPurchases, currentYear);
		periodText = `${currentYear} год`;
    } else if (currentFilter === 'month' && currentYear && currentMonth) {
        filteredPurchases = unifiedProcessor.filterByYearMonth(
            filteredPurchases, 
            currentYear, 
            currentMonth
        );
		const monthNames = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
                           'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
        periodText = `${monthNames[parseInt(currentMonth)-1]} ${currentYear} года`;
    }
    
	// Сохраняем глобально
    currentPeriodText = periodText;
	
    console.log(`После фильтрации: ${filteredPurchases.length} покупок`);
    
    // Управление видимостью специальных панелей
    document.getElementById('comparison-controls').style.display = 
        currentChartType === 'comparison' ? 'block' : 'none';
    document.getElementById('heatmap-controls').style.display = 
        currentChartType === 'heatmap' ? 'block' : 'none';
    document.getElementById('combo-controls').style.display = 
        currentChartType === 'combo' ? 'block' : 'none';
    
    // Обновляем заголовки в зависимости от типа
    updateChartTitles(currentChartType, periodText);
	
	// Создаем графики в зависимости от типа
    switch(currentChartType) {
        case 'categories':
            createCategoryCharts(filteredPurchases);
            break;
        case 'months':
            createMonthlyCharts(filteredPurchases);
            break;
        case 'years':
            createYearlyCharts(filteredPurchases);
            break;
        case 'stores':
            createStoreCharts(filteredPurchases);
            break;
        case 'products':
            createProductCharts(filteredPurchases);
            break;
        case 'comparison':
            createComparisonCharts(window.chartData.purchases); // Используем все данные для сравнения
            break;
        case 'heatmap':
            createHeatmapCharts(window.chartData.purchases);
            break;
        case 'combo':
            createComboCharts(window.chartData.purchases);
            break;
    }
}

/**
 * Обновление заголовков графиков
 */
function updateChartTitles(chartType, periodText) {
    let leftTitle = '';
    let rightTitle = '';
    
    switch(chartType) {
        case 'categories':
            leftTitle = `ТОП-10 категорий по сумме расходов за ${periodText}`;
            rightTitle = `ТОП-10 категорий по количеству покупок за ${periodText}`;
            break;
        case 'months':
            leftTitle = `Месячные расходы за ${periodText}`;
            rightTitle = `Количество покупок по месяцам за ${periodText}`;
            break;
        case 'years':
            leftTitle = `Годовые расходы за ${periodText}`;
            rightTitle = `Количество покупок по годам за ${periodText}`;
            break;
        case 'stores':
            leftTitle = `ТОП-10 магазинов по сумме расходов за ${periodText}`;
            rightTitle = `ТОП-10 магазинов по количеству покупок за ${periodText}`;
            break;
        case 'products':
            leftTitle = `ТОП-10 товаров по сумме расходов за ${periodText}`;
            rightTitle = `ТОП-10 товаров по количеству покупок за ${periodText}`;
            break;
        default:
            leftTitle = `Сумма расходов за ${periodText}`;
            rightTitle = `Количество покупок за ${periodText}`;
    }
    
    const leftTitleElem = document.getElementById('left-chart-title');
    const rightTitleElem = document.getElementById('right-chart-title');
    
    if (leftTitleElem) leftTitleElem.textContent = leftTitle;
    if (rightTitleElem) rightTitleElem.textContent = rightTitle;
    
    // Сохраняем заголовки для экспорта
    window.currentLeftTitle = leftTitle;
    window.currentRightTitle = rightTitle;
}

// ============================================
// ФУНКЦИИ СОЗДАНИЯ КОНКРЕТНЫХ ГРАФИКОВ
// ============================================

/**
 * Создание графиков по категориям
 * @param {Array} purchases - отфильтрованные покупки
 */
function createCategoryCharts(purchases) {
    console.log('Создание графиков по категориям, тип:', currentViewType);
    
	// Обновляем заголовки перед созданием графиков
    updateChartTitles('categories', currentPeriodText);
	
    chartManager.createCategoryPair(
        { left: 'left-chart', right: 'right-chart' },
        purchases,
        window.chartData.categories,
        {
            type: currentViewType,
			limit: 10,
            leftTitle: window.currentLeftTitle,
            rightTitle: window.currentRightTitle
        }
    );
}

/**
 * Создание графиков по месяцам
 * @param {Array} purchases - отфильтрованные покупки
 */
function createMonthlyCharts(purchases) {
    console.log('Создание графиков по месяцам, тип:', currentViewType);
    
	// Обновляем заголовки перед созданием графиков
	updateChartTitles('months', currentPeriodText);
	
    // Для месяцев ограничиваем допустимые типы
    // let allowedType = currentViewType;
    // if (allowedType === 'pie' || allowedType === 'doughnut') {
    //     allowedType = 'bar'; // По умолчанию вертикальная
    // }
    
    chartManager.createMonthlyPair(
        { left: 'left-chart', right: 'right-chart' },
        purchases,
        {
            type: currentViewType,
            leftTitle: window.currentLeftTitle,
            rightTitle: window.currentRightTitle
        }
    );
}

/**
 * Создание графиков по годам
 * @param {Array} purchases - отфильтрованные покупки
 */
function createYearlyCharts(purchases) {
    console.log('Создание графиков по годам, тип:', currentViewType);
    
	// Обновляем заголовки перед созданием графиков
	updateChartTitles('years', currentPeriodText);
	
    // let allowedType = currentViewType;
    // if (allowedType === 'pie' || allowedType === 'doughnut') {
    //     allowedType = 'bar';
    // }
    
    chartManager.createYearlyPair(
        { left: 'left-chart', right: 'right-chart' },
        purchases,
        {
            type: currentViewType,
            leftTitle: window.currentLeftTitle,
            rightTitle: window.currentRightTitle
        }
    );
}

/**
 * Создание графиков по магазинам
 * @param {Array} purchases - отфильтрованные покупки
 */
function createStoreCharts(purchases) {
    console.log('Создание графиков по магазинам, тип:', currentViewType);
    
	// Обновляем заголовки перед созданием графиков
	updateChartTitles('stores', currentPeriodText);
	
    if (!window.chartData.stores || window.chartData.stores.length === 0) {
        console.warn('Нет данных о магазинах');
        document.getElementById('left-chart-title').textContent = 'Нет данных о магазинах';
        document.getElementById('right-chart-title').textContent = 'Нет данных о магазинах';
        return;
    }
    
    chartManager.createStorePair(
        { left: 'left-chart', right: 'right-chart' },
        purchases,
        window.chartData.stores,
        {
            type: currentViewType,
            limit: 10,
            leftTitle: window.currentLeftTitle,
            rightTitle: window.currentRightTitle
        }
    );
}

/**
 * Создание графиков по товарам
 * @param {Array} purchases - отфильтрованные покупки
 */
function createProductCharts(purchases) {
    console.log('Создание графиков по товарам, тип:', currentViewType);
    
	// Обновляем заголовки перед созданием графиков
	updateChartTitles('products', currentPeriodText);
	
    // let allowedType = currentViewType;
    // Для товаров лучше подходит горизонтальная
    // if (allowedType === 'pie' || allowedType === 'doughnut') {
    //     allowedType = 'horizontalBar';
    // }
    
    chartManager.createProductPair(
        { left: 'left-chart', right: 'right-chart' },
        purchases,
        {
            type: currentViewType,
            limit: 10,
            leftTitle: window.currentLeftTitle,
            rightTitle: window.currentRightTitle
        }
    );
}

/**
 * Создание графиков сравнения периодов
 * @param {Array} purchases - все покупки
 */
function createComparisonCharts(purchases) {
    console.log('Создание графиков сравнения периодов', comparisonSettings);
    
    if (!comparisonSettings.year1 || !comparisonSettings.year2) {
        console.warn('Не выбраны периоды для сравнения');
        return;
    }
    
    chartManager.createComparisonPair(
        { left: 'left-chart', right: 'right-chart' },
        purchases,
        {
            type: currentViewType === 'pie' ? 'line' : currentViewType,
            year1: comparisonSettings.year1,
            year2: comparisonSettings.year2,
            quarter1: comparisonSettings.quarter1,
            quarter2: comparisonSettings.quarter2,
            comparisonType: comparisonSettings.type
        }
    );
}

/**
 * Создание тепловых карт
 * @param {Array} purchases - все покупки
 */
function createHeatmapCharts(purchases) {
    console.log('Создание тепловых карт');
    
    if (!currentHeatmapMonth) {
        const available = unifiedProcessor.getAvailableMonthsForHeatmap(purchases);
        if (available.length === 0) {
            console.warn('Нет данных для тепловой карты');
            return;
        }
        currentHeatmapMonth = available[0];
    }
    
    chartManager.createHeatmapPair(
        { left: 'left-chart', right: 'right-chart' },
        purchases,
        {
            year: currentHeatmapMonth.year,
            month: currentHeatmapMonth.month
        }
    );
    
    // Обновляем заголовки
    document.getElementById('left-chart-title').innerHTML = 
        `🔥 Суммы: ${currentHeatmapMonth.display}`;
    document.getElementById('right-chart-title').innerHTML = 
        `📊 Количество покупок: ${currentHeatmapMonth.display}`;
}

/**
 * Создание совмещенных графиков
 * @param {Array} purchases - все покупки
 */
function createComboCharts(purchases) {
    console.log('Создание совмещенных графиков', {
        period: currentComboPeriod,
        year: currentComboYear,
        metric: currentComboMetric
    });
    
    let leftTitle, rightTitle;
    
    if (currentComboMetric === 'count') {
        leftTitle = `💰 Сумма + Количество (${getPeriodNameRu(currentComboPeriod)})`;
        rightTitle = `💰 Сумма + Количество (${currentComboYear || 'все годы'})`;
    } else {
        leftTitle = `💰 Сумма + Средний чек (${getPeriodNameRu(currentComboPeriod)})`;
        rightTitle = `💰 Сумма + Средний чек (${currentComboYear || 'все годы'})`;
    }
    
    chartManager.createComboPair(
        { left: 'left-chart', right: 'right-chart' },
        purchases,
        {
            period: currentComboPeriod,
            year: currentComboYear ? parseInt(currentComboYear) : null,
            leftTitle: leftTitle,
            rightTitle: rightTitle,
            metric: currentComboMetric
        }
    );
}

// ============================================
// УПРАВЛЕНИЕ ПОДПИСЯМИ ДАННЫХ
// ============================================

/**
 * Настройка чекбоксов для подписей данных
 */
function setupChartOptions() {
    const labelsCheckbox = document.getElementById('show-data-labels');
    const percentagesCheckbox = document.getElementById('show-percentages');
    
    labelsCheckbox?.addEventListener('change', function() {
        showDataLabels = this.checked;
        updateAllChartsDataLabels();
    });
    
    percentagesCheckbox?.addEventListener('change', function() {
        showPercentages = this.checked;
		
		// Обновляем глобальную переменную для круговых диаграмм
        window.showPercentages = showPercentages;
        updateAllChartsDataLabels();
    });
}

/**
 * Обновление подписей на всех графиках
 */
function updateAllChartsDataLabels() {
    if (!window.chartManager) return;
    
    // Обновляем все одиночные графики
	window.chartManager.charts.forEach((chart, canvasId) => {
        if (chart && chart.chart) {
            updateChartDataLabels(chart);
        }
    });
    
    // Обновляем пары графиков
    window.chartManager.chartPairs.forEach((pair, key) => {
        if (pair.leftChart && pair.leftChart.chart) {
            updateChartDataLabels(pair.leftChart);
        }
        if (pair.rightChart && pair.rightChart.chart) {
            updateChartDataLabels(pair.rightChart);
        }
    });
}

/**
 * Обновление подписей на конкретном графике
 * (исправленная версия - только целые числа)
 * @param {Object} chartInstance - экземпляр графика
 */
function updateChartDataLabels(chartInstance) {
    if (!chartInstance || !chartInstance.chart) return;
    
    const chart = chartInstance.chart;
    const config = chart.config;
    
    if (!config.options.plugins) config.options.plugins = {};
    if (!config.options.plugins.datalabels) config.options.plugins.datalabels = {};
    
    // Обновляем видимость
	config.options.plugins.datalabels.display = showDataLabels;
	// Временно добавьте в updateChartDataLabels:
	console.log('updateChartDataLabels called for chart type:', config.type);
	console.log('Formatter set to:', config.options.plugins.datalabels.formatter.toString());
    
	// ЕДИНЫЙ ФОРМАТТЕР ДЛЯ ВСЕХ ТИПОВ ГРАФИКОВ - ТОЛЬКО ЦЕЛЫЕ ЧИСЛА
    config.options.plugins.datalabels.formatter = (value, context) => {
        // Округляем до целого
        const rounded = Math.round(value);
        const datasetLabel = context.dataset.label || '';
        const chartType = config.type;
        
        // Для круговых диаграмм
        if (chartType === 'pie' || chartType === 'doughnut') {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((rounded / total) * 100) : 0;
            
            if (window.showPercentages) {
                return percentage + '%';
            }
            return ChartUtils.formatNumber(rounded, 0);
        }
        
        // Для всех остальных типов (bar, horizontalBar, line)
        // Всегда показываем целое число без копеек
        return ChartUtils.formatNumber(rounded, 0);
    };
    
    // Обновляем цвет и стиль для лучшей читаемости
    config.options.plugins.datalabels.color = '#333';
    config.options.plugins.datalabels.font = {
        weight: 'bold',
        size: 11
    };
    
    // Для круговых диаграмм - белый текст
    if (config.type === 'pie' || config.type === 'doughnut') {
        config.options.plugins.datalabels.color = '#333';
        config.options.plugins.datalabels.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
    }
    
    chart.update();
}

// ============================================
// ЭКСПОРТ ГРАФИКОВ
// ============================================

/**
 * Настройка кнопок экспорта
 */
function setupExportControls() {
    document.getElementById('export-left')?.addEventListener('click', () => {
        chartManager.exportChartToPNG('left-chart', {
            includeTitle: true,
            includeLegend: true
        });
    });
    
    document.getElementById('export-right')?.addEventListener('click', () => {
        chartManager.exportChartToPNG('right-chart', {
            includeTitle: true,
            includeLegend: true
        });
    });
    
    document.getElementById('export-both')?.addEventListener('click', () => {
        chartManager.exportChartToPNG('left-chart');
        setTimeout(() => {
            chartManager.exportChartToPNG('right-chart');
        }, 500);
    });
    
    document.getElementById('export-all')?.addEventListener('click', () => {
        chartManager.exportBothChartsAsCollage({
            quality: 1.0,
            backgroundColor: 'white'
        });
    });
}

// ============================================
// СПЕЦИАЛЬНЫЕ ФУНКЦИИ ДЛЯ СРАВНЕНИЯ ПЕРИОДОВ
// ============================================

/**
 * Настройка элементов управления сравнением периодов
 */
function setupComparisonControls() {
    const comparisonTypeSelect = document.getElementById('comparison-type');
    const period1YearSelect = document.getElementById('period1-year');
    const period2YearSelect = document.getElementById('period2-year');
    const period1QuarterSelect = document.getElementById('period1-quarter');
    const period2QuarterSelect = document.getElementById('period2-quarter');
    const applyBtn = document.getElementById('apply-comparison');
    const swapBtn = document.getElementById('swap-periods');
    
    if (!comparisonTypeSelect) return;
    
    function populateYearSelects() {
        if (!window.chartData || !window.chartData.purchases) return;
        
        const years = unifiedProcessor.getAvailableYearsForComparison(window.chartData.purchases);
        
        period1YearSelect.innerHTML = years.map(year => 
            `<option value="${year}">${year} год</option>`
        ).join('');
        
        period2YearSelect.innerHTML = years.map(year => 
            `<option value="${year}">${year} год</option>`
        ).join('');
        
        if (years.length >= 2) {
            period1YearSelect.value = years[0];
            period2YearSelect.value = years[1];
            
            comparisonSettings.year1 = parseInt(years[0]);
            comparisonSettings.year2 = parseInt(years[1]);
        }
    }
    
    comparisonTypeSelect.addEventListener('change', function() {
        comparisonSettings.type = this.value;
        const showQuarterSelects = this.value === 'quarter';
        period1QuarterSelect.style.display = showQuarterSelects ? 'block' : 'none';
        period2QuarterSelect.style.display = showQuarterSelects ? 'block' : 'none';
    });
    
    period1YearSelect.addEventListener('change', function() {
        comparisonSettings.year1 = parseInt(this.value);
    });
    
    period2YearSelect.addEventListener('change', function() {
        comparisonSettings.year2 = parseInt(this.value);
    });
    
    period1QuarterSelect.addEventListener('change', function() {
        comparisonSettings.quarter1 = parseInt(this.value);
    });
    
    period2QuarterSelect.addEventListener('change', function() {
        comparisonSettings.quarter2 = parseInt(this.value);
    });
    
    applyBtn.addEventListener('click', function() {
        if (!comparisonSettings.year1 || !comparisonSettings.year2) {
            alert('Выберите оба периода для сравнения');
            return;
        }
        
        if (comparisonSettings.year1 === comparisonSettings.year2) {
            alert('Выберите разные периоды для сравнения');
            return;
        }
        
        updateCharts();
    });
    
    swapBtn.addEventListener('click', function() {
        const tempYear = comparisonSettings.year1;
        comparisonSettings.year1 = comparisonSettings.year2;
        comparisonSettings.year2 = tempYear;
        
        period1YearSelect.value = comparisonSettings.year1;
        period2YearSelect.value = comparisonSettings.year2;
        updateCharts();
    });
    
    setTimeout(populateYearSelects, 1000);
}

// ============================================
// ФУНКЦИИ ДЛЯ ТЕПЛОВОЙ КАРТЫ
// ============================================

/**
 * Настройка элементов управления тепловой картой
 */
function setupHeatmapControls() {
    const monthSelect = document.getElementById('heatmap-month-select');
    
    if (!monthSelect) return;
    
    function populateMonthSelect() {
        if (!window.chartData || !window.chartData.purchases) return;
        
        const availableMonths = unifiedProcessor.getAvailableMonthsForHeatmap(window.chartData.purchases);
        
        monthSelect.innerHTML = availableMonths.map(m => 
            `<option value="${m.key}">${m.display}</option>`
        ).join('');
        
        if (availableMonths.length > 0) {
            monthSelect.value = availableMonths[0].key;
            const [year, month] = availableMonths[0].key.split('-');
            currentHeatmapMonth = {
                year: parseInt(year),
                month: parseInt(month),
                display: availableMonths[0].display
            };
        }
    }
    
    monthSelect.addEventListener('change', function() {
        const [year, month] = this.value.split('-');
        currentHeatmapMonth = {
            year: parseInt(year),
            month: parseInt(month),
            display: this.options[this.selectedIndex].text
        };
        
        if (currentChartType === 'heatmap') {
            updateCharts();
        }
    });
    
    document.querySelectorAll('input[name="heatmap-metric"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (currentChartType === 'heatmap') {
                updateCharts();
            }
        });
    });
    
    setTimeout(populateMonthSelect, 1000);
}

// ============================================
// ФУНКЦИИ ДЛЯ СОВМЕЩЕННОГО ГРАФИКА
// ============================================

/**
 * Настройка элементов управления совмещенным графиком
 */
function setupComboControls() {
    const periodSelect = document.getElementById('combo-period');
    const yearSelect = document.getElementById('combo-year');
    const metricSelect = document.getElementById('combo-metric');
    
    if (!periodSelect) return;
    
    function populateYearSelect() {
        if (!window.chartData || !window.chartData.purchases) return;
        
        const years = unifiedProcessor.getAvailableYearsForCombo(window.chartData.purchases);
        
        yearSelect.innerHTML = '<option value="">Все годы</option>';
        years.forEach(year => {
            yearSelect.innerHTML += `<option value="${year}">${year} год</option>`;
        });
        
        if (years.length > 0) {
            yearSelect.value = years[0];
            currentComboYear = years[0];
        }
    }
    
    periodSelect.addEventListener('change', function() {
        currentComboPeriod = this.value;
        if (currentChartType === 'combo') updateCharts();
    });
    
    yearSelect.addEventListener('change', function() {
        currentComboYear = this.value || null;
        if (currentChartType === 'combo') updateCharts();
    });
    
    metricSelect.addEventListener('change', function() {
        currentComboMetric = this.value;
        if (currentChartType === 'combo') updateCharts();
    });
    
    setTimeout(populateYearSelect, 1000);
}

// ============================================
// АВТОСОХРАНЕНИЕ НАСТРОЕК
// ============================================

/**
 * Настройка автосохранения настроек
 */
function setupAutoSave() {
    const saveHandler = () => {
        if (settingsManager) {
            settingsManager.captureFromUI();
        }
    };
    
    document.querySelectorAll('.chart-type-btn, .view-type-btn').forEach(btn => {
        btn.addEventListener('click', () => setTimeout(saveHandler, 100));
    });
    
    document.getElementById('period-filter')?.addEventListener('change', saveHandler);
    document.getElementById('year-filter')?.addEventListener('change', saveHandler);
    document.getElementById('month-filter')?.addEventListener('change', saveHandler);
    document.getElementById('show-data-labels')?.addEventListener('change', saveHandler);
    document.getElementById('show-percentages')?.addEventListener('change', saveHandler);
    
    window.addEventListener('beforeunload', () => {
        if (settingsManager) {
            settingsManager.captureFromUI();
        }
    });
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Получение названия периода на русском
 * @param {string} period - идентификатор периода
 * @returns {string} название периода
 */
function getPeriodNameRu(period) {
    const names = {
        'day': 'по дням',
        'week': 'по неделям',
        'month': 'по месяцам'
    };
    return names[period] || period;
}

/**
 * Анимация статистики при обновлении
 */
function animateStatsOnUpdate() {
    const statsValues = document.querySelectorAll('.stat-value[data-animate]');
    statsValues.forEach(stat => {
        const value = parseFloat(stat.textContent.replace(/[^\d.-]/g, ''));
        if (!isNaN(value) && window.animationManager) {
            stat.dataset.type = stat.textContent.includes('₽') ? 'currency' : 'number';
            window.animationManager.animateStatsValue(stat, 0, value, 800);
        }
    });
}

/**
 * Настройка дополнительных эффектов
 */
function setupAdditionalEffects() {
    // Эффекты при наведении на кнопки
    document.querySelectorAll('.chart-type-btn, .btn-primary, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (window.animationManager) {
                window.animationManager.createRipple(e, this);
            }
        });
    });
    
    // Анимация появления графиков
    document.addEventListener('chartsCreated', function() {
        document.querySelectorAll('canvas').forEach(canvas => {
            canvas.classList.add('chart-appear');
        });
    });
    
    // Плавная прокрутка к графику
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target && window.animationManager) {
                window.animationManager.smoothScrollTo(target);
            }
        });
    });
    
    // Кнопка сброса настроек
    document.getElementById('reset-settings')?.addEventListener('click', () => {
        if (settingsManager && confirm('Сбросить все настройки к значениям по умолчанию?')) {
            settingsManager.resetSettings();
            settingsManager.applyToUI();
            location.reload();
        }
    });
    
    // Предзагрузка данных при наведении
    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const type = btn.dataset.type;
            if (window.performanceOptimizer) {
                window.performanceOptimizer.prefetchData(type);
            }
        });
    });
    
    // Ленивая загрузка графиков
    document.addEventListener('lazyload-chart', (e) => {
        const { canvasId } = e.detail;
        console.log(`Загрузка графика: ${canvasId}`);
    });
    
    // Анимация статистики при загрузке
    setTimeout(animateStatsOnUpdate, 500);
}

// ============================================
// ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
// ============================================

// Основные функции инициализации и обновления
window.initChartsPage = initChartsPage;
window.updateCharts = updateCharts;

// Функции создания графиков (для обратной совместимости)
window.createCategoryCharts = createCategoryCharts;
window.createMonthlyCharts = createMonthlyCharts;
window.createYearlyCharts = createYearlyCharts;
window.createStoreCharts = createStoreCharts;
window.createProductCharts = createProductCharts;
window.createComparisonCharts = createComparisonCharts;
window.createHeatmapCharts = createHeatmapCharts;
window.createComboCharts = createComboCharts;

// Функции управления подписями
window.updateAllChartsDataLabels = updateAllChartsDataLabels;
window.updateChartDataLabels = updateChartDataLabels;

// Вспомогательные функции
window.getPeriodNameRu = getPeriodNameRu;
window.animateStatsOnUpdate = animateStatsOnUpdate;