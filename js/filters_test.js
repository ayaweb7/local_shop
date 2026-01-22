/**
 * Модуль управления фильтрами - УПРОЩЕННАЯ РАБОЧАЯ ВЕРСИЯ
 */

class FilterManager {
    constructor() {
        this.currentFilters = {
            category: null,
            store: null,
            dateFrom: null,
            dateTo: null
        };
        
        this.categoriesCache = [];
        this.storesCache = [];
        this.onFilterChangeCallback = null;
        
        console.log('FilterManager создан');
    }

    /**
     * Инициализация
     */
    init(onFilterChange) {
        console.log('FilterManager init начат');
        
        this.onFilterChangeCallback = onFilterChange;
        
        // Ищем элементы
        this.elements = {
            categoryFilter: document.getElementById('category-filter'),
            storeFilter: document.getElementById('store-filter'),
            dateFrom: document.getElementById('date-from'),
            dateTo: document.getElementById('date-to'),
            applyBtn: document.getElementById('apply-filters'),
            resetBtn: document.getElementById('reset-filters')
        };
        
        console.log('Найдены элементы:', this.elements);
        
        // Если нет элементов - выходим
        if (!this.elements.categoryFilter) {
            console.error('Не найден элемент #category-filter');
            return;
        }
        
        // Настраиваем обработчики
        this.setupEventListeners();
        
        console.log('FilterManager успешно инициализирован');
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        console.log('Настройка обработчиков событий...');
        
        // Кнопка "Применить"
        if (this.elements.applyBtn) {
            this.elements.applyBtn.addEventListener('click', () => {
                console.log('Кнопка "Применить" нажата');
                this.applyFilters();
            });
        } else {
            console.warn('Не найден элемент #apply-filters');
        }
        
        // Кнопка "Сбросить"
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => {
                console.log('Кнопка "Сбросить" нажата');
                this.resetFilters();
            });
        }
        
        // Автофильтрация при изменении категории
        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.addEventListener('change', (e) => {
                console.log('Категория изменена:', e.target.value);
                this.currentFilters.category = e.target.value || null;
                this.notifyFilterChange();
            });
        }
        
        // Автофильтрация при изменении магазина
        if (this.elements.storeFilter) {
            this.elements.storeFilter.addEventListener('change', (e) => {
                console.log('Магазин изменен:', e.target.value);
                this.currentFilters.store = e.target.value || null;
                this.notifyFilterChange();
            });
        }
        
        // Автофильтрация при изменении дат
        if (this.elements.dateFrom) {
            this.elements.dateFrom.addEventListener('change', (e) => {
                console.log('Дата "от" изменена:', e.target.value);
                this.currentFilters.dateFrom = e.target.value || null;
                this.notifyFilterChange();
            });
        }
        
        if (this.elements.dateTo) {
            this.elements.dateTo.addEventListener('change', (e) => {
                console.log('Дата "до" изменена:', e.target.value);
                this.currentFilters.dateTo = e.target.value || null;
                this.notifyFilterChange();
            });
        }
    }

    /**
     * Заполнение фильтра категорий
     */
    populateCategoryFilter(categories) {
        console.log('Заполнение фильтра категорий:', categories);
        
        this.categoriesCache = categories || [];
        
        if (!this.elements.categoryFilter) {
            console.warn('categoryFilter не найден для заполнения');
            return;
        }
        
        // Сохраняем текущее значение
        const currentValue = this.elements.categoryFilter.value;
        
        // Очищаем и заполняем
        this.elements.categoryFilter.innerHTML = '<option value="">Все категории</option>';
        
        this.categoriesCache.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.icon ? 
                `${category.icon} ${category.name}` : 
                category.name;
            this.elements.categoryFilter.appendChild(option);
        });
        
        // Восстанавливаем значение
        if (currentValue) {
            this.elements.categoryFilter.value = currentValue;
        }
        
        console.log(`Категорий в фильтре: ${this.categoriesCache.length}`);
    }

    /**
     * Заполнение фильтра магазинов
     */
    populateStoreFilter(stores) {
        console.log('Заполнение фильтра магазинов:', stores);
        
        this.storesCache = stores || [];
        
        if (!this.elements.storeFilter) {
            console.warn('storeFilter не найден для заполнения');
            return;
        }
        
        const currentValue = this.elements.storeFilter.value;
        this.elements.storeFilter.innerHTML = '<option value="">Все магазины</option>';
        
        this.storesCache.forEach(store => {
            const option = document.createElement('option');
            option.value = store.id;
            option.textContent = store.shop || store.name || 'Магазин';
            this.elements.storeFilter.appendChild(option);
        });
        
        if (currentValue) {
            this.elements.storeFilter.value = currentValue;
        }
        
        console.log(`Магазинов в фильтре: ${this.storesCache.length}`);
    }

    /**
     * Применение фильтров
     */
    applyFilters() {
        console.log('Применение фильтров...');
        
        // Собираем значения
        this.currentFilters = {
            category: this.elements.categoryFilter?.value || null,
            store: this.elements.storeFilter?.value || null,
            dateFrom: this.elements.dateFrom?.value || null,
            dateTo: this.elements.dateTo?.value || null
        };
        
        console.log('Текущие фильтры:', this.currentFilters);
        
        // Уведомляем об изменении
        this.notifyFilterChange();
    }

    /**
     * Сброс фильтров
     */
    resetFilters() {
        console.log('Сброс фильтров');
        
        // Сбрасываем значения
        if (this.elements.categoryFilter) this.elements.categoryFilter.value = '';
        if (this.elements.storeFilter) this.elements.storeFilter.value = '';
        if (this.elements.dateFrom) this.elements.dateFrom.value = '';
        if (this.elements.dateTo) this.elements.dateTo.value = '';
        
        // Сбрасываем внутреннее состояние
        this.currentFilters = {
            category: null,
            store: null,
            dateFrom: null,
            dateTo: null
        };
        
        // Уведомляем об изменении
        this.notifyFilterChange();
        
        console.log('Фильтры сброшены');
    }

    /**
     * Уведомление об изменении фильтров
     */
    notifyFilterChange() {
        console.log('Уведомление об изменении фильтров:', this.currentFilters);
        
        if (typeof this.onFilterChangeCallback === 'function') {
            this.onFilterChangeCallback(this.currentFilters);
        } else {
            console.warn('onFilterChangeCallback не установлен');
        }
    }

    /**
     * Получение фильтров для Tabulator
     */
    getTabulatorFilters() {
        const filters = [];
        
        // Фильтр по категории
        if (this.currentFilters.category) {
            filters.push({
                field: "category_id",
                type: "=",
                value: parseInt(this.currentFilters.category)
            });
        }
        
        // Фильтр по магазину (если есть поле store_id)
        if (this.currentFilters.store) {
            filters.push({
                field: "store_id",
                type: "=",
                value: parseInt(this.currentFilters.store)
            });
        }
        
        // Фильтр по дате "от"
        if (this.currentFilters.dateFrom) {
            filters.push({
                field: "date",
                type: ">=",
                value: this.currentFilters.dateFrom
            });
        }
        
        // Фильтр по дате "до"
        if (this.currentFilters.dateTo) {
            filters.push({
                field: "date",
                type: "<=",
                value: this.currentFilters.dateTo
            });
        }
        
        console.log('Фильтры для Tabulator:', filters);
        return filters;
    }

    /**
     * Получение текущих фильтров
     */
    getCurrentFilters() {
        return { ...this.currentFilters };
    }
}

// Создаем глобальный экземпляр
console.log('Создание глобального filterManager...');
window.filterManager = new FilterManager();
console.log('Глобальный filterManager создан:', window.filterManager);