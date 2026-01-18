// js/charts.js - Основной класс для работы с графиками
class ChartsApp {
    constructor() {
        this.currentFilters = {
            period: 'all',
            year: null,
            month: null
        };
        
        this.currentChartType = 'categories'; // По умолчанию
        this.charts = {
            left: null,
            right: null
        };
		
        this.init();
    }
    
    async init() {
        console.log('ChartsApp инициализирован');
        
        try {
            // Загружаем доступные годы из БД
            await this.loadAvailableYears();
            
            // Настраиваем обработчики
            this.setupEventListeners();
            
            // Загружаем и отображаем графики
            await this.loadAndRenderCharts();
            
        } catch (error) {
            console.error('Ошибка инициализации ChartsApp:', error);
            this.showNotification('Ошибка загрузки графиков: ' + error.message, 'error');
        }
    }
    // ---- New
	// Настройка обработчиков событий
    setupEventListeners() {
        // Тип периода
        document.getElementById('period-filter')?.addEventListener('change', (e) => {
            this.handlePeriodChange(e.target.value);
        });
        
        // Применение фильтров
        document.getElementById('apply-filters')?.addEventListener('click', () => {
            this.applyFilters();
        });
        
        // Сброс фильтров
        document.getElementById('reset-filters')?.addEventListener('click', () => {
            this.resetFilters();
        });
        
        // Выбор типа графика
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectChartType(e.target.dataset.type);
            });
        });
    }
    
    // Выбор типа графика
    selectChartType(type) {
        this.currentChartType = type;
        
        // Обновляем активную кнопку
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.type === type) {
                btn.classList.add('active');
            }
        });
        
        // Перерисовываем графики
        this.loadAndRenderCharts();
    }
    
    // Загрузка и отображение графиков
    async loadAndRenderCharts() {
        try {
            this.showLoading(true);
            const purchases = await this.loadFilteredPurchases();
            
            if (purchases.length === 0) {
                this.showNoDataMessage();
                return;
            }
            
            // Создаём графики в зависимости от выбранного типа
            this.createChartsByType(purchases);
            
            this.showLoading(false);
            
        } catch (error) {
            console.error('Ошибка:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
            this.showLoading(false);
        }
    }
    
    // Создание графиков по типу
    createChartsByType(purchases) {
        // Уничтожаем старые графики
        if (this.charts.left) this.charts.left.destroy();
        if (this.charts.right) this.charts.right.destroy();
        
        // Обновляем заголовки
        this.updateChartTitles();
        
        // Создаём графики в зависимости от типа
        switch (this.currentChartType) {
            case 'categories':
                this.createCategoryCharts(purchases);
                break;
            case 'months':
                this.createMonthlyCharts(purchases);
                break;
            case 'years':
                this.createYearlyCharts(purchases);
                break;
            case 'stores':
                this.createStoreCharts(purchases);
                break;
            case 'products':
                this.createProductCharts(purchases);
                break;
        }
    }
    
    // Обновление заголовков
    updateChartTitles() {
        const titles = {
            categories: ['Расходы по категориям', 'Покупки по категориям'],
            months: ['Расходы по месяцам', 'Покупки по месяцам'],
            years: ['Расходы по годам', 'Покупки по годам'],
            stores: ['Расходы по магазинам', 'Покупки по магазинам'],
            products: ['Топ товаров по сумме', 'Топ товаров по количеству']
        };
        
        document.getElementById('left-chart-title').textContent = titles[this.currentChartType][0];
        document.getElementById('right-chart-title').textContent = titles[this.currentChartType][1];
    }
    
    // 1. ГРАФИКИ ПО КАТЕГОРИЯМ
    createCategoryCharts(purchases) {
        const categoryStats = this.aggregateByCategory(purchases);
        
        // Левый график: суммы
        this.charts.left = this.createBarChart(
            'left-chart',
            categoryStats.map(item => `${item.icon} ${item.name}`),
            categoryStats.map(item => item.amount),
            categoryStats.map(item => item.color),
            'Сумма, ₽',
            true
        );
        
        // Правый график: количества
        this.charts.right = this.createBarChart(
            'right-chart',
            categoryStats.map(item => `${item.icon} ${item.name}`),
            categoryStats.map(item => item.count),
            categoryStats.map(item => item.color),
            'Количество, шт.',
            true
        );
    }
    
    // 2. ГРАФИКИ ПО МЕСЯЦАМ
    createMonthlyCharts(purchases) {
        const monthlyStats = this.aggregateByMonth(purchases);
        
        this.charts.left = this.createBarChart(
            'left-chart',
            monthlyStats.map(item => item.month),
            monthlyStats.map(item => item.amount),
            '#007bff',
            'Сумма, ₽',
            false
        );
        
        this.charts.right = this.createBarChart(
            'right-chart',
            monthlyStats.map(item => item.month),
            monthlyStats.map(item => item.count),
            '#28a745',
            'Количество, шт.',
            false
        );
    }
    
    // 3. ГРАФИКИ ПО ГОДАМ
    createYearlyCharts(purchases) {
        const yearlyStats = this.aggregateByYear(purchases);
        
        this.charts.left = this.createBarChart(
            'left-chart',
            yearlyStats.map(item => item.year),
            yearlyStats.map(item => item.amount),
            '#6f42c1',
            'Сумма, ₽',
            false
        );
        
        this.charts.right = this.createBarChart(
            'right-chart',
            yearlyStats.map(item => item.year),
            yearlyStats.map(item => item.count),
            '#fd7e14',
            'Количество, шт.',
            false
        );
    }
    
    // 4. ГРАФИКИ ПО МАГАЗИНАМ
    createStoreCharts(purchases) {
        const storeStats = this.aggregateByStore(purchases);
        
        // Берем топ-10
        const topStores = storeStats.slice(0, 10);
        
        this.charts.left = this.createBarChart(
            'left-chart',
            topStores.map(item => item.name),
            topStores.map(item => item.amount),
            this.generateColors(topStores.length),
            'Сумма, ₽',
            true
        );
        
        this.charts.right = this.createBarChart(
            'right-chart',
            topStores.map(item => item.name),
            topStores.map(item => item.count),
            this.generateColors(topStores.length),
            'Количество, шт.',
            true
        );
    }
    
    // 5. ГРАФИКИ ПО ТОВАРАМ
    createProductCharts(purchases) {
        const productStats = this.aggregateByProduct(purchases);
        
        // Берем топ-10
        const topProducts = productStats.slice(0, 10);
        
        this.charts.left = this.createBarChart(
            'left-chart',
            topProducts.map(item => item.name),
            topProducts.map(item => item.amount),
            this.generateColors(topProducts.length),
            'Сумма, ₽',
            true
        );
        
        this.charts.right = this.createBarChart(
            'right-chart',
            topProducts.map(item => item.name),
            topProducts.map(item => item.count),
            this.generateColors(topProducts.length),
            'Количество, шт.',
            true
        );
    }
    
    // ===== АГРЕГАЦИОННЫЕ МЕТОДЫ =====
    
    aggregateByCategory(purchases) {
        const stats = {};
        
        purchases.forEach(purchase => {
            const catId = purchase.category_id;
            if (!catId) return;
            
            if (!stats[catId]) {
                stats[catId] = {
                    id: catId,
                    name: purchase.category_name || 'Без категории',
                    icon: purchase.category_icon || '📦',
                    color: purchase.category_color || '#6c757d',
                    amount: 0,
                    count: 0
                };
            }
            
            stats[catId].amount += purchase.amount || 0;
            stats[catId].count++;
        });
        
        return Object.values(stats)
            .sort((a, b) => b.amount - b.amount);
    }
    
    aggregateByMonth(purchases) {
        const stats = {};
        
        purchases.forEach(purchase => {
            if (!purchase.date) return;
            
            const date = new Date(purchase.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
            
            if (!stats[monthKey]) {
                stats[monthKey] = {
                    key: monthKey,
                    month: monthName,
                    amount: 0,
                    count: 0
                };
            }
            
            stats[monthKey].amount += purchase.amount || 0;
            stats[monthKey].count++;
        });
        
        return Object.values(stats)
            .sort((a, b) => a.key.localeCompare(b.key));
    }
    
    aggregateByYear(purchases) {
        const stats = {};
        
        purchases.forEach(purchase => {
            if (!purchase.date) return;
            
            const year = purchase.date.split('-')[0];
            
            if (!stats[year]) {
                stats[year] = {
                    year: year,
                    amount: 0,
                    count: 0
                };
            }
            
            stats[year].amount += purchase.amount || 0;
            stats[year].count++;
        });
        
        return Object.values(stats)
            .sort((a, b) => a.year.localeCompare(b.year));
    }
    
    aggregateByStore(purchases) {
        const stats = {};
        
        purchases.forEach(purchase => {
            const storeId = purchase.store_id;
            if (!storeId) return;
            
            if (!stats[storeId]) {
                stats[storeId] = {
                    id: storeId,
                    name: purchase.store?.shop || 'Неизвестный магазин',
                    amount: 0,
                    count: 0
                };
            }
            
            stats[storeId].amount += purchase.amount || 0;
            stats[storeId].count++;
        });
        
        return Object.values(stats)
            .sort((a, b) => b.amount - a.amount);
    }
    
    aggregateByProduct(purchases) {
        const stats = {};
        
        purchases.forEach(purchase => {
            const productName = purchase.name;
            if (!productName) return;
            
            if (!stats[productName]) {
                stats[productName] = {
                    name: productName,
                    amount: 0,
                    count: 0
                };
            }
            
            stats[productName].amount += purchase.amount || 0;
            stats[productName].count++;
        });
        
        return Object.values(stats)
            .sort((a, b) => b.amount - a.amount);
    }
    
    // ===== УНИВЕРСАЛЬНЫЙ МЕТОД СОЗДАНИЯ ГРАФИКА =====
    
    createBarChart(canvasId, labels, data, colors, label, horizontal = true) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;
        
        // Если colors - строка, делаем массив одинаковых цветов
        const backgroundColor = typeof colors === 'string' 
            ? Array(data.length).fill(colors)
            : colors;
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: backgroundColor,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                indexAxis: horizontal ? 'y' : 'x',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${label}: ${context.parsed.x.toLocaleString('ru-RU')}`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('ru-RU')
                        }
                    }
                }
            }
        });
        
        return chart;
    }
    
	// ---- New
	
    // Загрузка доступных годов из БД
    async loadAvailableYears() {
        try {
            // Используем существующий API или создадим новый эндпоинт
            const purchases = await apiClient.getPurchases();
            
            // Извлекаем уникальные годы из дат покупок
            const yearsSet = new Set();
            purchases.forEach(purchase => {
                if (purchase.date) {
                    const year = purchase.date.split('-')[0];
                    yearsSet.add(year);
                }
            });
            
            const years = Array.from(yearsSet).sort((a, b) => b - a); // Сортировка по убыванию
            
            // Заполняем выпадающий список
            const yearSelect = document.getElementById('year-filter');
            if (yearSelect) {
                yearSelect.innerHTML = '<option value="">Выберите год</option>';
                years.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    yearSelect.appendChild(option);
                });
            }
            
            console.log('Доступные годы:', years);
            
        } catch (error) {
            console.error('Ошибка загрузки годов:', error);
        }
    }
    
    // Обработка изменения типа периода
    handlePeriodChange(period) {
        const yearGroup = document.getElementById('year-filter-group');
        const monthGroup = document.getElementById('month-filter-group');
        
        switch (period) {
            case 'all':
                yearGroup.style.display = 'none';
                monthGroup.style.display = 'none';
                break;
            case 'year':
                yearGroup.style.display = 'flex';
                monthGroup.style.display = 'none';
                break;
            case 'month':
                yearGroup.style.display = 'flex';
                monthGroup.style.display = 'flex';
                break;
        }
    }
    
    // Применение фильтров
    applyFilters() {
        const period = document.getElementById('period-filter').value;
        const year = document.getElementById('year-filter').value;
        const month = document.getElementById('month-filter').value;
        
        this.currentFilters = {
            period: period,
            year: period === 'all' ? null : year,
            month: period === 'month' ? month : null
        };
        
        console.log('Применены фильтры:', this.currentFilters);
        this.loadAndRenderCharts();
    }
    
    // Сброс фильтров
    resetFilters() {
        document.getElementById('period-filter').value = 'all';
        document.getElementById('year-filter').value = '';
        document.getElementById('month-filter').value = '1';
        
        this.currentFilters = {
            period: 'all',
            year: null,
            month: null
        };
        
        this.handlePeriodChange('all');
        this.loadAndRenderCharts();
    }
    
    // Загрузка покупок с учётом фильтров
    async loadFilteredPurchases() {
        // Пока загружаем все данные, фильтрацию на клиенте
        // Позже можно добавить фильтрацию на сервере
        const allPurchases = await apiClient.getPurchases();
        
        return allPurchases.filter(purchase => {
            if (!this.currentFilters.year) return true;
            
            const purchaseYear = purchase.date ? purchase.date.split('-')[0] : null;
            if (!purchaseYear) return false;
            
            if (this.currentFilters.year && purchaseYear !== this.currentFilters.year) {
                return false;
            }
            
            if (this.currentFilters.month) {
                const purchaseMonth = purchase.date ? purchase.date.split('-')[1] : null;
                if (!purchaseMonth || parseInt(purchaseMonth) !== parseInt(this.currentFilters.month)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    // Генерация цветов для графиков
    generateColors(count) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
            '#EF476F', '#FFD166', '#06D6A0', '#073B4C', '#7209B7',
            '#F15BB5', '#9B5DE5', '#00BBF9', '#00F5D4', '#FB5607'
        ];
        
        // Если нужно больше цветов, чем есть в палитре, повторяем
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        
        return result;
    }
    
    // Уничтожение всех графиков
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
    
    // Показ заглушки при отсутствии данных
    showChartPlaceholder(canvasElement, message) {
        const container = canvasElement.parentElement;
        
        // Удаляем старые заглушки
        const oldPlaceholder = container.querySelector('.chart-placeholder');
        if (oldPlaceholder) {
            oldPlaceholder.remove();
        }
        
        // Добавляем новую
        const placeholder = document.createElement('div');
        placeholder.className = 'chart-placeholder';
        placeholder.textContent = message;
        container.appendChild(placeholder);
    }
    
    // Сообщение об отсутствии данных
    showNoDataMessage() {
        const chartContainers = document.querySelectorAll('.chart-container canvas');
        chartContainers.forEach(canvas => {
            this.showChartPlaceholder(canvas, 'Нет данных для выбранного периода');
        });
    }
    
    // Индикатор загрузки
    showLoading(show) {
        const containers = document.querySelectorAll('.chart-container');
        containers.forEach(container => {
            const canvas = container.querySelector('canvas');
            const placeholder = container.querySelector('.chart-placeholder');
            
            if (show) {
                if (canvas) canvas.style.opacity = '0.3';
                if (placeholder) placeholder.textContent = 'Загрузка данных...';
            } else {
                if (canvas) canvas.style.opacity = '1';
            }
        });
    }
    
    // Уведомления
    showNotification(message, type = 'info') {
        console.log(`[${type}] ${message}`);
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}