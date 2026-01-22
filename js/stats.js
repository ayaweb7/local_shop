/**
 * Класс StatisticsManager для управления статистикой
 */
class StatisticsManager {
    constructor() {
        this.stats = {
            categories: [],
            stores: [],
            monthly: [],
            daily: []
        };
        
        this.categoriesCache = [];
        this.storesCache = [];
        
        console.log('StatisticsManager создан');
    }

    /**
     * Инициализация менеджера статистики
     */
    init(categoriesCache = [], storesCache = []) {
        console.log('Инициализация StatisticsManager...');
        
        this.categoriesCache = categoriesCache || [];
        this.storesCache = storesCache || [];
        
        // Находим контейнеры
        this.containers = {
            categories: document.getElementById('categories-stats'),
            stores: document.getElementById('stores-stats'),
            monthly: document.getElementById('monthly-stats'),
            summary: document.getElementById('summary-stats')
        };
        
        console.log('Контейнеры найдены:', this.containers);
        
        return this;
    }

    /**
     * Расчет всей статистики
     */
    calculateAll(purchases) {
        console.log('Расчет статистики для', purchases?.length, 'покупок');
        
        if (!purchases || purchases.length === 0) {
            console.warn('Нет данных для расчета статистики');
            return this.stats;
        }
        
        this.stats = {
            categories: this.calculateCategoryStats(purchases),
            stores: this.calculateStoreStats(purchases),
            monthly: this.calculateMonthlyStats(purchases),
            daily: this.calculateDailyStats(purchases),
            summary: this.calculateSummary(purchases)
        };
        
        console.log('Статистика рассчитана:', {
            categories: this.stats.categories.length,
            stores: this.stats.stores.length,
            monthly: this.stats.monthly.length
        });
        
        return this.stats;
    }

    /**
     * Расчет статистики по категориям
     */
    calculateCategoryStats(purchases) {
        const stats = {};
        
        purchases.forEach(purchase => {
            const categoryId = purchase.category_id;
            
            if (!categoryId) {
                // Пропускаем покупки без категории
                return;
            }
            
            if (!stats[categoryId]) {
                // Ищем категорию в кэше
                const category = this.categoriesCache.find(c => c.id === categoryId);
                
                stats[categoryId] = {
                    id: categoryId,
                    name: category ? category.name : `Категория #${categoryId}`,
                    icon: category ? category.icon : '❓',
                    color: category ? category.color : '#6c757d',
                    count: 0,
                    amount: 0,
                    avgPrice: 0
                };
            }
            
            const amount = parseFloat(purchase.amount) || 0;
            const price = parseFloat(purchase.price) || 0;
            
            stats[categoryId].count++;
            stats[categoryId].amount += amount;
            
            // Обновляем среднюю цену
            if (price > 0) {
                const oldTotal = stats[categoryId].avgPrice * (stats[categoryId].count - 1);
                stats[categoryId].avgPrice = (oldTotal + price) / stats[categoryId].count;
            }
        });
        
        // Преобразуем в массив и сортируем
        const statsArray = Object.values(stats)
            .sort((a, b) => b.amount - a.amount);
        
        // Добавляем проценты
        const totalAmount = statsArray.reduce((sum, stat) => sum + stat.amount, 0);
        
        statsArray.forEach(stat => {
            stat.percentage = totalAmount > 0 ? (stat.amount / totalAmount * 100) : 0;
        });
        
        return statsArray;
    }

    /**
     * Расчет статистики по магазинам
     */
    calculateStoreStats(purchases) {
        const stats = {};
        
        purchases.forEach(purchase => {
            const storeId = purchase.store_id;
            
            if (!storeId) return;
            
            if (!stats[storeId]) {
                const store = this.storesCache.find(s => s.id === storeId);
                
                stats[storeId] = {
                    id: storeId,
                    name: store ? store.shop : `Магазин #${storeId}`,
                    address: store ? `${store.street}, ${store.house}` : '',
                    count: 0,
                    amount: 0,
                    avgReceipt: 0,
                    visits: new Set()
                };
            }
            
            const amount = parseFloat(purchase.amount) || 0;
            
            stats[storeId].count++;
            stats[storeId].amount += amount;
            stats[storeId].visits.add(purchase.date);
            
            // Средний чек (общая сумма / количество уникальных дат)
            stats[storeId].avgReceipt = stats[storeId].amount / stats[storeId].visits.size;
        });
        
        const statsArray = Object.values(stats)
            .sort((a, b) => b.amount - a.amount);
        
        // Преобразуем Set в число
        statsArray.forEach(stat => {
            stat.visitsCount = stat.visits.size;
            delete stat.visits;
        });
        
        return statsArray;
    }

    /**
     * Расчет месячной статистики
     */
    calculateMonthlyStats(purchases) {
        const stats = {};
        
        purchases.forEach(purchase => {
            if (!purchase.date) return;
            
            const date = new Date(purchase.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
            
            if (!stats[monthKey]) {
                stats[monthKey] = {
                    key: monthKey,
                    name: monthName,
                    count: 0,
                    amount: 0,
                    categories: new Set(),
                    stores: new Set()
                };
            }
            
            const amount = parseFloat(purchase.amount) || 0;
            
            stats[monthKey].count++;
            stats[monthKey].amount += amount;
            
            if (purchase.category_id) {
                stats[monthKey].categories.add(purchase.category_id);
            }
            
            if (purchase.store_id) {
                stats[monthKey].stores.add(purchase.store_id);
            }
        });
        
        const statsArray = Object.values(stats)
            .sort((a, b) => a.key.localeCompare(b.key));
        
        // Преобразуем Set в числа
        statsArray.forEach(stat => {
            stat.categoriesCount = stat.categories.size;
            stat.storesCount = stat.stores.size;
            delete stat.categories;
            delete stat.stores;
        });
        
        return statsArray;
    }

    /**
     * Расчет дневной статистики (последние 30 дней)
     */
    calculateDailyStats(purchases) {
        const stats = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        purchases.forEach(purchase => {
            if (!purchase.date) return;
            
            const date = new Date(purchase.date);
            if (date < thirtyDaysAgo) return;
            
            const dateKey = purchase.date; // YYYY-MM-DD
            
            if (!stats[dateKey]) {
                stats[dateKey] = {
                    date: purchase.date,
                    formattedDate: date.toLocaleDateString('ru-RU'),
                    count: 0,
                    amount: 0,
                    categories: new Set(),
                    stores: new Set()
                };
            }
            
            const amount = parseFloat(purchase.amount) || 0;
            
            stats[dateKey].count++;
            stats[dateKey].amount += amount;
            
            if (purchase.category_id) {
                stats[dateKey].categories.add(purchase.category_id);
            }
            
            if (purchase.store_id) {
                stats[dateKey].stores.add(purchase.store_id);
            }
        });
        
        const statsArray = Object.values(stats)
            .sort((a, b) => a.date.localeCompare(b.date));
        
        statsArray.forEach(stat => {
            stat.categoriesCount = stat.categories.size;
            stat.storesCount = stat.stores.size;
            delete stat.categories;
            delete stat.stores;
        });
        
        return statsArray;
    }

    /**
     * Расчет общей сводки
     */
    calculateSummary(purchases) {
        if (!purchases || purchases.length === 0) {
            return {
                totalCount: 0,
                totalAmount: 0,
                avgAmount: 0,
                categoriesCount: 0,
                storesCount: 0,
                period: 'Нет данных'
            };
        }
        
        const amounts = purchases.map(p => parseFloat(p.amount) || 0);
        const totalAmount = amounts.reduce((a, b) => a + b, 0);
        const avgAmount = totalAmount / purchases.length;
        
        const uniqueCategories = new Set(purchases.map(p => p.category_id).filter(Boolean));
        const uniqueStores = new Set(purchases.map(p => p.store_id).filter(Boolean));
        
        // Определяем период
        const dates = purchases
            .map(p => p.date ? new Date(p.date) : null)
            .filter(Boolean)
            .sort((a, b) => a - b);
        
        let period = 'Не определено';
        if (dates.length > 0) {
            const firstDate = dates[0];
            const lastDate = dates[dates.length - 1];
            
            period = `${firstDate.toLocaleDateString('ru-RU')} - ${lastDate.toLocaleDateString('ru-RU')}`;
        }
        
        return {
            totalCount: purchases.length,
            totalAmount,
            avgAmount,
            categoriesCount: uniqueCategories.size,
            storesCount: uniqueStores.size,
            period,
            maxAmount: Math.max(...amounts),
            minAmount: Math.min(...amounts)
        };
    }

    /**
     * Отображение всей статистики
     */
    displayAll() {
        console.log('Отображение всей статистики...');
        
        this.displayCategoriesStats();
        this.displayStoresStats();
        this.displayMonthlyStats();
        this.displaySummaryStats();
    }

    /**
     * Отображение статистики по категориям
     */
    displayCategoriesStats() {
        const container = this.containers.categories;
        if (!container || !this.stats.categories) return;
        
        const stats = this.stats.categories;
        const summary = this.stats.summary;
        
        if (stats.length === 0) {
            container.innerHTML = '<div class="no-data">Нет данных по категориям</div>';
            return;
        }
        
        let html = `
            <div class="stats-header">
                <h3>📊 Статистика по категориям</h3>
                <div class="stats-summary">
                    <span>${stats.length} категорий</span>
                    <span>${summary?.totalAmount?.toFixed(2) || '0'} ₽</span>
                </div>
            </div>
            <div class="stats-table">
                <div class="stats-row header">
                    <div class="stats-cell icon">Иконка</div>
                    <div class="stats-cell name">Категория</div>
                    <div class="stats-cell amount">Сумма</div>
                    <div class="stats-cell count">Кол-во</div>
                    <div class="stats-cell percent">Доля</div>
                </div>
        `;
        
        stats.forEach((stat, index) => {
            const percentage = stat.percentage || (stat.amount / summary.totalAmount * 100);
            
            html += `
                <div class="stats-row ${index % 2 === 0 ? 'even' : 'odd'}" 
                     style="--category-color: ${stat.color}">
                    <div class="stats-cell icon">${stat.icon}</div>
                    <div class="stats-cell name">${stat.name}</div>
                    <div class="stats-cell amount">${stat.amount.toFixed(2)} ₽</div>
                    <div class="stats-cell count">${stat.count} шт.</div>
                    <div class="stats-cell percent">
                        <div class="percent-bar" style="width: ${percentage}%"></div>
                        <span class="percent-text">${percentage.toFixed(1)}%</span>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Отображение статистики по магазинам
     */
    displayStoresStats() {
        const container = this.containers.stores;
        if (!container || !this.stats.stores) return;
        
        const stats = this.stats.stores;
        
        if (stats.length === 0) {
            container.innerHTML = '<div class="no-data">Нет данных по магазинам</div>';
            return;
        }
        
        let html = `
            <div class="stats-header">
                <h3>🏪 Статистика по магазинам</h3>
                <div class="stats-summary">
                    <span>${stats.length} магазинов</span>
                </div>
            </div>
            <div class="stats-table">
                <div class="stats-row header">
                    <div class="stats-cell">Магазин</div>
                    <div class="stats-cell">Адрес</div>
                    <div class="stats-cell">Сумма</div>
                    <div class="stats-cell">Кол-во</div>
                    <div class="stats-cell">Средний чек</div>
                    <div class="stats-cell">Посещений</div>
                </div>
        `;
        
        stats.forEach((stat, index) => {
            html += `
                <div class="stats-row ${index % 2 === 0 ? 'even' : 'odd'}">
                    <div class="stats-cell">${stat.name}</div>
                    <div class="stats-cell">${stat.address}</div>
                    <div class="stats-cell">${stat.amount.toFixed(2)} ₽</div>
                    <div class="stats-cell">${stat.count} шт.</div>
                    <div class="stats-cell">${stat.avgReceipt.toFixed(2)} ₽</div>
                    <div class="stats-cell">${stat.visitsCount} раз</div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Отображение месячной статистики
     */
    displayMonthlyStats() {
        const container = this.containers.monthly;
        if (!container || !this.stats.monthly) return;
        
        const stats = this.stats.monthly;
        
        if (stats.length === 0) {
            container.innerHTML = '<div class="no-data">Нет данных по месяцам</div>';
            return;
        }
        
        let html = `
            <div class="stats-header">
                <h3>📅 Месячная статистика</h3>
            </div>
            <div class="stats-table">
                <div class="stats-row header">
                    <div class="stats-cell">Месяц</div>
                    <div class="stats-cell">Сумма</div>
                    <div class="stats-cell">Кол-во</div>
                    <div class="stats-cell">Категорий</div>
                    <div class="stats-cell">Магазинов</div>
                    <div class="stats-cell">Средний чек</div>
                </div>
        `;
        
        stats.forEach((stat, index) => {
            const avgReceipt = stat.count > 0 ? stat.amount / stat.count : 0;
            
            html += `
                <div class="stats-row ${index % 2 === 0 ? 'even' : 'odd'}">
                    <div class="stats-cell">${stat.name}</div>
                    <div class="stats-cell">${stat.amount.toFixed(2)} ₽</div>
                    <div class="stats-cell">${stat.count} шт.</div>
                    <div class="stats-cell">${stat.categoriesCount}</div>
                    <div class="stats-cell">${stat.storesCount}</div>
                    <div class="stats-cell">${avgReceipt.toFixed(2)} ₽</div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Отображение сводной статистики
     */
    displaySummaryStats() {
        const container = this.containers.summary;
        if (!container || !this.stats.summary) return;
        
        const summary = this.stats.summary;
        
        let html = `
            <div class="stats-header">
                <h3>📋 Общая сводка</h3>
                <div class="stats-period">${summary.period}</div>
            </div>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="summary-icon">📊</div>
                    <div class="summary-title">Всего покупок</div>
                    <div class="summary-value">${summary.totalCount}</div>
                </div>
                
                <div class="summary-card">
                    <div class="summary-icon">💰</div>
                    <div class="summary-title">Общая сумма</div>
                    <div class="summary-value">${summary.totalAmount.toFixed(2)} ₽</div>
                </div>
                
                <div class="summary-card">
                    <div class="summary-icon">📈</div>
                    <div class="summary-title">Средняя покупка</div>
                    <div class="summary-value">${summary.avgAmount.toFixed(2)} ₽</div>
                </div>
                
                <div class="summary-card">
                    <div class="summary-icon">🏷️</div>
                    <div class="summary-title">Категорий</div>
                    <div class="summary-value">${summary.categoriesCount}</div>
                </div>
                
                <div class="summary-card">
                    <div class="summary-icon">🏪</div>
                    <div class="summary-title">Магазинов</div>
                    <div class="summary-value">${summary.storesCount}</div>
                </div>
                
                <div class="summary-card">
                    <div class="summary-icon">⬆️</div>
                    <div class="summary-title">Максимальный чек</div>
                    <div class="summary-value">${summary.maxAmount.toFixed(2)} ₽</div>
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    }

    /**
     * Экспорт статистики в CSV
     */
    exportToCSV(type = 'categories') {
        const stats = this.stats[type];
        if (!stats || stats.length === 0) {
            console.warn('Нет данных для экспорта');
            return;
        }
        
        let csv = '';
        
        switch (type) {
            case 'categories':
                csv = 'Категория,Сумма,Количество,Доля(%)\n';
                stats.forEach(stat => {
                    csv += `"${stat.name}",${stat.amount},${stat.count},${stat.percentage.toFixed(2)}\n`;
                });
                break;
                
            case 'stores':
                csv = 'Магазин,Адрес,Сумма,Количество,Средний чек,Посещений\n';
                stats.forEach(stat => {
                    csv += `"${stat.name}","${stat.address}",${stat.amount},${stat.count},${stat.avgReceipt},${stat.visitsCount}\n`;
                });
                break;
                
            case 'monthly':
                csv = 'Месяц,Сумма,Количество,Категорий,Магазинов\n';
                stats.forEach(stat => {
                    csv += `"${stat.name}",${stat.amount},${stat.count},${stat.categoriesCount},${stat.storesCount}\n`;
                });
                break;
        }
        
        // Создаем Blob и скачиваем
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `statistics_${type}_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Создаем глобальный экземпляр
console.log('Создание глобального statisticsManager...');
window.statisticsManager = new StatisticsManager();