/**
 * Модуль управления фильтрами для приложения Shopping Tracker
 * Отвечает за работу фильтров, их состояние и применение onFilterChangeCallback
 */

class FilterManager {
    constructor() {
        // Текущие значения фильтров
        this.currentFilters = {
            category: null,
            dateFrom: null,
            dateTo: null,
            store: null  // Добавим для будущего расширения
        };
        
        // Кэши категорий и магазинов для отображения в фильтре
        this.categoriesCache = [];
		this.storesCache = [];
        
        // Коллбэк для применения фильтров
        this.onFilterChangeCallback = null;
		
		console.log('FilterManager создан');
        
        // DOM элементы
        this.elements = {};
    }

    /**
     * Инициализация менеджера фильтров
     * @param {Function} onFilterChange - функция, вызываемая при изменении фильтров
     */
    init(onFilterChange) {
		console.log('FilterManager init начат');
		
        this.onFilterChangeCallback = onFilterChange;
        this.cacheDomElements();
        this.setupEventListeners();
        
        console.log('FilterManager инициализирован');
    }

    /**
     * Кэширование DOM элементов фильтров
     */
    cacheDomElements() {
        this.elements = {
            categoryFilter: document.getElementById('category-filter'),
            dateFrom: document.getElementById('date-from'),
            dateTo: document.getElementById('date-to'),
            applyBtn: document.getElementById('apply-filters'),
            resetBtn: document.getElementById('reset-filters'),
			storeFilter: document.getElementById('store-filter')
        };
		
		console.log('Найдены элементы:', this.elements);
        
        // Если нет элементов - выходим
        if (!this.elements.categoryFilter) {
            console.error('Не найден элемент #category-filter');
            return;
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
		console.log('Настройка обработчиков событий...');
		
        if (!this.elements.applyBtn) {
            console.error('Элементы фильтров не найдены в DOM');
            return;
        }

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
		} else {
            console.warn('Не найден элемент #reset-filters');
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
            this.elements.dateFrom.addEventListener('change', () => {
				console.log('Дата "от" изменена:', e.target.value);
                this.currentFilters.dateFrom = e.target.value || null;
				this.notifyFilterChange();
            });
        }
        
        if (this.elements.dateTo) {
            this.elements.dateTo.addEventListener('change', () => {
				console.log('Дата "до" изменена:', e.target.value);
                this.currentFilters.dateTo = e.target.value || null;
				this.notifyFilterChange();
            });
        }
    }

    /**
     * Заполнение фильтра категорий
     * @param {Array} categories - массив категорий из API
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
        
        // Очищаем и заполняем заново
        this.elements.categoryFilter.innerHTML = '<option value="">Все категории</option>';
        
        this.categoriesCache.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.icon ?
				`${category.icon} ${category.name}`:
				category.name;
            option.title = category.description || category.name;
            
            // Добавляем стиль через dataset для будущего использования
            option.dataset.color = category.color;
            option.dataset.icon = category.icon;
            
            this.elements.categoryFilter.appendChild(option);
        });
        
        // Восстанавливаем выбранное значение
        if (currentValue) {
            this.elements.categoryFilter.value = currentValue;
        }
        
        console.log(`Фильтр категорий заполнен: ${categories.length} категорий`);
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
     * Применение фильтров из UI
     */
    applyFilters() {
		console.log('Применение фильтров...');
		
		// Собираем значения
        this.currentFilters = {
            category: this.elements.categoryFilter?.value || null,
            dateFrom: this.elements.dateFrom?.value || null,
            dateTo: this.elements.dateTo?.value || null,
            store: this.elements.storeFilter?.value || null
        };
		
		console.log('Текущие фильтры:', this.currentFilters);
        
		// Уведомляем об изменении
        this.notifyFilterChange();
    }

    /**
     * Сброс всех фильтров
     */
    resetFilters() {
		console.log('Сброс фильтров');
		
		// Сбрасываем значения
        if (this.elements.categoryFilter) {
            this.elements.categoryFilter.value = '';
        }
		if (this.elements.storeFilter) {
            this.elements.storeFilter.value = '';
        }
        if (this.elements.dateFrom) {
            this.elements.dateFrom.value = '';
        }
        if (this.elements.dateTo) {
            this.elements.dateTo.value = '';
        }
        
		// Сбрасываем внутреннее состояние
        this.currentFilters = {
            category: null,
            dateFrom: null,
            dateTo: null,
            store: null
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
		
        if (typeof this.onFilterChange === 'function') {
            this.onFilterChangeCallback(this.currentFilters);
		} else {
            console.warn('onFilterChangeCallback не установлен');
        }
    }

    /**
     * Получение фильтров для Tabulator
     * @returns {Array} массив фильтров для Tabulator
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
     * Получение фильтров для API запроса
     * @returns {Object} параметры для API
     */
    getApiFilters() {
        const params = {};
        
        if (this.currentFilters.category) {
            params.category_id = this.currentFilters.category;
        }
        
        if (this.currentFilters.dateFrom) {
            params.date_from = this.currentFilters.dateFrom;
        }
        
        if (this.currentFilters.dateTo) {
            params.date_to = this.currentFilters.dateTo;
        }
        
        return params;
    }

    /**
     * Показ активных фильтров в UI
     */
    showActiveFilters() {
        const activeFilters = [];
        
        if (this.currentFilters.category) {
            const category = this.categoriesCache.find(c => c.id == this.currentFilters.category);
            if (category) {
                activeFilters.push(`${category.icon} ${category.name}`);
            }
        }
        
        if (this.currentFilters.dateFrom || this.currentFilters.dateTo) {
            const period = [];
            if (this.currentFilters.dateFrom) period.push(`с ${this.formatDate(this.currentFilters.dateFrom)}`);
            if (this.currentFilters.dateTo) period.push(`по ${this.formatDate(this.currentFilters.dateTo)}`);
            activeFilters.push(period.join(' '));
        }
        
        // Можно добавить отображение в UI
        const filterInfo = document.getElementById('active-filters-info');
        if (filterInfo) {
            if (activeFilters.length > 0) {
                filterInfo.innerHTML = `
                    <strong>Активные фильтры:</strong> 
                    ${activeFilters.join(', ')}
                    <button id="clear-all-filters" class="btn-small">×</button>
                `;
                
                // Добавляем обработчик для кнопки очистки
                document.getElementById('clear-all-filters').addEventListener('click', () => {
                    this.resetFilters();
                });
                
                filterInfo.style.display = 'block';
            } else {
                filterInfo.style.display = 'none';
            }
        }
        
        console.log('Активные фильтры:', activeFilters.join(', '));
    }

    /**
     * Форматирование даты для отображения
     * @param {string} dateStr - строка с датой
     * @returns {string} отформатированная дата
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Получение текущих фильтров
     * @returns {Object} текущие фильтры
     */
    getCurrentFilters() {
        return { ...this.currentFilters };
    }

    /**
     * Установка фильтров программно
     * @param {Object} filters - новые фильтры
     */
    setFilters(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        
        // Обновляем UI
        if (filters.category !== undefined && this.elements.categoryFilter) {
            this.elements.categoryFilter.value = filters.category || '';
        }
        
        if (filters.dateFrom !== undefined && this.elements.dateFrom) {
            this.elements.dateFrom.value = filters.dateFrom || '';
        }
        
        if (filters.dateTo !== undefined && this.elements.dateTo) {
            this.elements.dateTo.value = filters.dateTo || '';
        }
        
        this.notifyFilterChange();
    }
}

// Создаем глобальный экземпляр для использования во всем приложении
console.log('Создание глобального filterManager...');
window.filterManager = new FilterManager();
console.log('Глобальный filterManager создан:', window.filterManager);

// Экспортируем для использования в модулях (если используется модульная система)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FilterManager, filterManager };
}