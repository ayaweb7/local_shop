// app.js - версия С Tabulator и API category-filter
class ShoppingApp {
    constructor() {
        this.table = null;
        this.storesCache = [];
        this.categoriesCache = [];
        this.unitsCache = [];
		this.statisticsManager = null;
        
        // Инициализация отложена до полной загрузки DOM
    }

    async init() {
        console.log('ShoppingApp запущен');
        
        try {
            // Проверяем наличие DOM элементов
            if (!this.checkRequiredElements()) {
                throw new Error('Не все необходимые DOM элементы найдены');
            }

            // Загружаем кэши
            await this.loadAllCaches();
            
            // Инициализируем интерфейс
            this.initializeTable(); // Таблица инициализируется, но пока без данных
            this.setupEventListeners();
            this.initializePurchaseForm();
            
			// *** ИНИЦИАЛИЗИРУЕМ МЕНЕДЖЕРЫ ДО ЗАГРУЗКИ ДАННЫХ ***
            // Инициализируем менеджер фильтров
            this.initFilterManager();
			// Инициализируем менеджер статистики
			this.initStatisticsManager();
			
			// Загружаем данные (теперь менеджеры уже готовы)
            await this.loadPurchasesData();
            
            // Инициализируем информационную панель
			this.updateTableInfoPanel();
            
            console.log('ShoppingApp успешно инициализирован');
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showNotification('Ошибка загрузки: ' + error.message, 'error');
        }
    }

    /**
     * Проверка необходимых DOM элементов
     */
    checkRequiredElements() {
        const requiredElements = [
            'purchases-table',
            'add-purchase-btn',
            'refresh-btn',
            'purchase-modal'
        ];
        
        const missing = requiredElements.filter(id => !document.getElementById(id));
        
        if (missing.length > 0) {
            console.error('Отсутствуют DOM элементы:', missing);
            return false;
        }
        
        return true;
    }

    /**
     * Загрузка всех кэшей
     */
    async loadAllCaches() {
        console.log('Загрузка кэшей...');
        
        try {
            // Параллельная загрузка всех кэшей
            const [stores, categories, purchases] = await Promise.all([
                apiClient.getStores().catch(() => []),
                apiClient.getCategories().catch(() => []),
                apiClient.getPurchases().catch(() => [])
            ]);
            
            this.storesCache = stores;
            this.categoriesCache = categories;
            
            // Единицы измерения из покупок
            this.unitsCache = [...new Set(purchases
                .map(p => p.item)
                .filter(Boolean)
            )].sort();
            
            console.log('Кэши загружены:', {
                stores: this.storesCache.length,
                categories: this.categoriesCache.length,
                units: this.unitsCache.length
            });
            
        } catch (error) {
            console.error('Ошибка загрузки кэшей:', error);
            this.loadDefaultCaches();
        }
    }

    /**
     * Загрузка данных по умолчанию
     */
    loadDefaultCaches() {
        this.categoriesCache = [];
        this.storesCache = [];
        this.unitsCache = ['шт.', 'кг', 'г', 'л', 'мл', 'м', 'см'];
    }

    /**
     * Инициализация менеджера фильтров
     */
    initFilterManager() {
		console.log('initFilterManager вызван');
		console.log('window.filterManager:', window.filterManager);
		
		if (!window.filterManager) {
			console.error('filterManager не найден в глобальной области видимости');
			console.log('Проверьте, что filters.js загружен ДО app.js');
			return;
		}
		
        try {
            // Проверяем наличие элементов фильтров
            if (!document.getElementById('category-filter')) {
                console.warn('Элементы фильтров не найдены, FilterManager не будет инициализирован');
                return;
            }
            
            // Инициализируем менеджер фильтров
            if (window.filterManager) {
                filterManager.init((filters) => {
					console.log('Фильтры изменены (callback):', filters);
                    this.handleFilterChange(filters);
                });
                
                // Заполняем фильтры данными
                filterManager.populateCategoryFilter(this.categoriesCache);
				filterManager.populateStoreFilter(this.storesCache);
                
                console.log('FilterManager успешно инициализирован в app');
            } else {
                console.error('filterManager не найден. Убедитесь, что filters.js загружен');
            }
            
        } catch (error) {
            console.error('Ошибка инициализации FilterManager:', error);
        }
    }

    /**
     * ЗАГРУЗКА ДАННЫХ И ОТОБРАЖЕНИЕ ТАБЛИЦЫ
     */
    async loadPurchasesData(filters = {}) {
        try {
            console.log('Загрузка данных покупок...');
            this.showLoading(true);
            
            const purchases = await apiClient.getPurchases(filters);
            console.log('Загружено покупок:', purchases.length);
            
            if (this.table) {
                this.table.setData(purchases);
            }
            
            this.showLoading(false);
			
			// Обновляем статистику
            this.updateStatistics(purchases);
			
			// Обновляем информационную панель
            this.updateTableInfoPanel();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showLoading(false, 'Ошибка: ' + error.message);
        }
    }

    /**
     * Показать/скрыть индикатор загрузки
     */
    showLoading(show, message = null) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
            if (message) {
                loadingEl.textContent = message;
            }
        }
    }

    /**
     * ИНИЦИАЛИЗАЦИЯ TABULATOR
     */
    initializeTable() {
        try {
            // Удаляем старую таблицу если есть
            const tableEl = document.getElementById('purchases-table');
            if (tableEl && tableEl._tabulator) {
                tableEl._tabulator.destroy();
            }
            
            this.table = new Tabulator('#purchases-table', {
                data: [], // Начальные данные - пустые
                layout: 'fitColumns',
                pagination: 'local',
                paginationSize: 20,
                paginationSizeSelector: [10, 20, 50, 100],
                movableColumns: true,
                responsiveLayout: 'collapse',
                height: 'calc(100vh - 200px)',
                groupBy: false,
                
                columns: this.getTableColumns(),
                
                // Обработчики событий
                rowClick: (e, row) => {
                    console.log('Row clicked:', row.getData());
                },
                
                rowUpdated: (row) => {
                    console.log('Row updated:', row.getData());
                },
                
                // Локализация
                locale: true,
                langs: {
                    'ru-ru': {
                        'pagination': {
                            'page_size': 'Записей на странице',
                            'first': 'Первая',
                            'first_title': 'Первая страница',
                            'last': 'Последняя',
                            'last_title': 'Последняя страница',
                            'prev': 'Предыдущая',
                            'prev_title': 'Предыдущая страница',
                            'next': 'Следующая',
                            'next_title': 'Следующая страница',
                            'all': 'Все'
                        }
                    }
                }
            });
			
			// *** ДЕЛАЕМ ТАБЛИЦУ ГЛОБАЛЬНОЙ ***
			window.purchasesTable = this.table;
            
            console.log('Таблица Tabulator инициализирована');
            
        } catch (error) {
            console.error('Ошибка инициализации таблицы:', error);
            throw error;
        }
    }

    /**
     * Получение конфигурации колонок таблицы
     */
    getTableColumns() {
        return [
            { 
                title: 'ID', 
                field: 'id', 
                width: 70,
                sorter: 'number',
                headerFilter: 'input',
                headerFilterPlaceholder: 'Фильтр...'
            },
            { 
                title: 'Дата', 
                field: 'date',
                width: 100,
                sorter: 'date',
                headerFilter: 'input',
                headerFilterPlaceholder: 'ГГГГ-ММ-ДД',
                formatter: (cell) => {
                    const date = cell.getValue();
                    return date ? new Date(date).toLocaleDateString('ru-RU') : '';
                }
            },
            {
                title: "Категория",
                field: "category_name",
                width: 120,
                headerFilter: "input",
                headerFilterPlaceholder: 'Фильтр...',
                formatter: (cell) => {
                    const row = cell.getRow().getData();
                    const category = this.categoriesCache.find(c => c.name === row.category_name);
                    if (category) {
                        return `${category.icon} ${row.category_name}`;
                    }
                    return row.category_name || row.gruppa || '-';
                },
                tooltip: true
            },
            { 
				title: 'Магазин', 
				field: 'store.shop',  // Проверьте имя поля в консоли
				width: 150,
				headerFilter: 'input',
				headerFilterPlaceholder: 'Поиск...',
			},
            { 
                title: 'Адрес', 
                field: 'full_address',
                width: 200,
                headerFilter: 'input',
                headerFilterPlaceholder: 'Поиск...',
				formatter: (cell) => {
					const value = cell.getValue();
					return value || '-';
				}
            },
            { 
                title: 'Товар', 
                field: 'name',
                width: 150,
                headerFilter: 'input',
                headerFilterPlaceholder: 'Поиск...'
            },
            {
                title: 'Характеристики',
                field: 'characteristic',
                width: 150,
                formatter: (cell) => cell.getValue() || '-',
                headerFilter: 'input',
                headerFilterPlaceholder: 'Поиск...'
            },
            { 
                title: 'Кол-во', 
                field: 'quantity',
                width: 90,
                hozAlign: 'right',
                headerFilter: 'number',
                headerFilterPlaceholder: 'Число...',
                formatter: (cell) => {
                    const row = cell.getRow().getData();
                    const quantity = parseFloat(cell.getValue());
					return `${!isNaN(quantity) ? quantity.toFixed(3) : '0.000'} ${row.item || 'шт.'}`;

                }
            },
            { 
                title: 'Цена, ₽', 
                field: 'price',
                width: 100,
                hozAlign: 'right',
                headerFilter: 'number',
                headerFilterPlaceholder: 'Число...',
                formatter: (cell) => {
                    const value = cell.getValue();
                    return value ? `${parseFloat(value).toFixed(2)} ₽` : '0.00 ₽';
                }
            },
            { 
                title: 'Сумма, ₽', 
                field: 'amount',
                width: 100,
                hozAlign: 'right',
                headerFilter: 'number',
                headerFilterPlaceholder: 'Число...',
                formatter: (cell) => {
                    const value = cell.getValue();
                    return value ? `${parseFloat(value).toFixed(2)} ₽` : '0.00 ₽';
                }
            },
            {
                title: 'Действия',
                width: 100,
                hozAlign: 'center',
                formatter: (cell) => {
					const row = cell.getRow();
					const data = row.getData();
					return `
						<button class="btn-icon edit-btn" title="Редактировать" data-id="${data.id}">
							✏️
						</button>
						<button class="btn-icon delete-btn" title="Удалить" data-id="${data.id}">
							🗑️
						</button>
					`;
				},
                cellClick: (e, cell) => {
                    const data = cell.getRow().getData();
					const target = e.target;
					
                    if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
                        this.showPurchaseForm(data);
                    } else if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
                        this.deletePurchase(data.id);
                    }
                }
            }
        ];
    }

    /**
     * НАСТРОЙКА СОБЫТИЙ
     */
    setupEventListeners() {
        // Безопасное добавление обработчиков
        this.addSafeEventListener('add-purchase-btn', 'click', () => {
            this.showPurchaseForm();
        });
        
        this.addSafeEventListener('refresh-btn', 'click', () => {
            this.refreshData();
        });
        
        this.addSafeEventListener('admin-btn', 'click', () => {
            window.location.href = 'admin.html';
        });
        
        this.addSafeEventListener('logout-btn', 'click', () => {
            if (confirm('Выйти из приложения?')) {
                window.location.href = 'index.html';
            }
        });
        
        // Кнопка скрыть/показать статистику
        this.addSafeEventListener('toggle-stats', 'click', () => {
            this.toggleStats();
        });
    }

    /**
     * Безопасное добавление обработчика события
     */
    addSafeEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler.bind(this));
            console.log(`Обработчик добавлен: ${elementId}.${event}`);
            return true;
        } else {
            console.warn(`Элемент #${elementId} не найден для добавления обработчика`);
            return false;
        }
    }

    /**
     * Обработчик изменения фильтров
     */
    handleFilterChange(filters) {
        console.log('Фильтры изменены:', filters);
        
        if (this.table) {
            const tabulatorFilters = filterManager.getTabulatorFilters();
            this.table.setFilter(tabulatorFilters);
			
			// Обновляем информационную панель после фильтрации
            setTimeout(() => {
                this.updateTableInfoPanel();
            }, 100);
        }
    }

    /**
     * ОБНОВЛЕНИЕ ДАННЫХ
     */
    async refreshData() {
        try {
            this.showLoading(true, 'Обновление...');
            
            // Обновляем кэши
            await this.loadAllCaches();
            
            // Перезагружаем данные
            await this.loadPurchasesData();
			
            // Обновляем фильтр категорий
            if (window.filterManager) {
                filterManager.populateCategoryFilter(this.categoriesCache);
            }
			
			// Обновляем панель
            this.updateTableInfoPanel();
            
            this.showNotification('Данные обновлены', 'success');
            
        } catch (error) {
            console.error('Ошибка обновления:', error);
            this.showNotification('Ошибка обновления: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // === ФОРМА ПОКУПКИ ===

    initializePurchaseForm() {
        this.loadStoresIntoForm();
        this.loadCategoriesIntoForm();
        this.loadUnitsIntoForm();
        this.setupFormEventListeners();
        this.setupModalHandlers();
        
        // Установка сегодняшней даты по умолчанию
        const dateInput = document.getElementById('purchase-date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    loadStoresIntoForm() {
        const select = document.getElementById('purchase-store');
        if (!select) return;
        
        select.innerHTML = '<option value="">Выберите магазин</option>';
        
        this.storesCache.forEach(store => {
            const option = document.createElement('option');
            option.value = store.id;
            option.textContent = `${store.shop} (${store.street}, ${store.house})`;
            select.appendChild(option);
        });
    }

    loadCategoriesIntoForm() {
        const select = document.getElementById('purchase-category');
        if (!select) return;
        
        select.innerHTML = '<option value="">Выберите категорию</option>';
        
        this.categoriesCache.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `${category.icon} ${category.name}`;
            option.dataset.icon = category.icon;
            option.dataset.color = category.color;
            select.appendChild(option);
        });
        
        if (this.categoriesCache.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Нет категорий. Добавьте в админ-панели.';
            option.disabled = true;
            select.appendChild(option);
        }
    }

    loadUnitsIntoForm() {
        const select = document.getElementById('purchase-unit');
        if (!select) return;
        
        select.innerHTML = '<option value="шт.">шт.</option>';
        
        this.unitsCache.forEach(unit => {
            if (unit !== 'шт.') {
                const option = document.createElement('option');
                option.value = unit;
                option.textContent = unit;
                select.appendChild(option);
            }
        });
    }

    setupFormEventListeners() {
        const form = document.getElementById('purchase-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePurchase();
        });
        
        this.addSafeEventListener('cancel-purchase', 'click', () => {
            document.getElementById('purchase-modal').style.display = 'none';
        });
        
        // Авторасчёт суммы при изменении цены или количества
        document.getElementById('purchase-price')?.addEventListener('input', () => this.autoCalculate());
        document.getElementById('purchase-quantity')?.addEventListener('input', () => this.autoCalculate());
    }

    autoCalculate() {
        const priceInput = document.getElementById('purchase-price');
        const quantityInput = document.getElementById('purchase-quantity');
        const amountInput = document.getElementById('purchase-amount');
        
        if (!priceInput || !quantityInput || !amountInput) return;
        
        const price = parseFloat(priceInput.value) || 0;
        const quantity = parseFloat(quantityInput.value) || 0;
        
        if (price > 0 && quantity > 0) {
            const amount = price * quantity;
            amountInput.value = amount.toFixed(2);
        }
    }

    setupModalHandlers() {
        const modal = document.getElementById('purchase-modal');
        const closeBtn = document.querySelector('.close-modal');
        
        if (!modal || !closeBtn) return;
        
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    showPurchaseForm(purchase = null) {
        const modal = document.getElementById('purchase-modal');
        const title = document.getElementById('purchase-modal-title');
        
        if (!modal || !title) return;
        
        if (purchase) {
            title.textContent = '✏️ Редактировать покупку';
            this.fillFormWithData(purchase);
        } else {
            title.textContent = '📝 Новая покупка';
            this.resetForm();
        }
        
        modal.style.display = 'block';
    }

    fillFormWithData(purchaseData) {
        document.getElementById('purchase-id').value = purchaseData.id || '';
        document.getElementById('purchase-date').value = purchaseData.date || '';
        document.getElementById('purchase-store').value = purchaseData.store_id || '';
        document.getElementById('purchase-name').value = purchaseData.name || '';
        
        // Устанавливаем категорию
        setTimeout(() => {
            const categorySelect = document.getElementById('purchase-category');
            if (categorySelect && purchaseData.category_id) {
                categorySelect.value = purchaseData.category_id;
            } else if (categorySelect && purchaseData.gruppa) {
                const category = this.categoriesCache.find(c => 
                    c.name === purchaseData.gruppa
                );
                if (category) {
                    categorySelect.value = category.id;
                }
            }
        }, 100);
        
        document.getElementById('purchase-price').value = purchaseData.price || '';
        document.getElementById('purchase-quantity').value = purchaseData.quantity || '1';
        document.getElementById('purchase-unit').value = purchaseData.item || 'шт.';
        document.getElementById('purchase-amount').value = purchaseData.amount || '';
        document.getElementById('purchase-characteristics').value = purchaseData.characteristic || '';
    }

    resetForm() {
        const form = document.getElementById('purchase-form');
        if (form) {
            form.reset();
        }
        
        document.getElementById('purchase-id').value = '';
        document.getElementById('purchase-date').valueAsDate = new Date();
        document.getElementById('purchase-quantity').value = '1';
        document.getElementById('purchase-unit').value = 'шт.';
        document.getElementById('purchase-category').value = '';
    }

    validateForm() {
        const required = [
            'purchase-date', 'purchase-store', 'purchase-name',
            'purchase-category', 'purchase-price', 'purchase-quantity'
        ];
        
        let isValid = true;
        
        required.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'red';
            } else {
                field.style.borderColor = '';
            }
        });
        
        return isValid;
    }

    async savePurchase() {
        if (!this.validateForm()) {
            this.showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
            return;
        }
        
        try {
            const formData = {
                date: document.getElementById('purchase-date').value,
                store_id: parseInt(document.getElementById('purchase-store').value),
                name: document.getElementById('purchase-name').value,
                category_id: parseInt(document.getElementById('purchase-category').value),
                price: parseFloat(document.getElementById('purchase-price').value),
                quantity: parseFloat(document.getElementById('purchase-quantity').value),
                item: document.getElementById('purchase-unit').value,
                characteristic: document.getElementById('purchase-characteristics').value,
                amount: parseFloat(document.getElementById('purchase-amount').value)
            };
            
            const purchaseId = document.getElementById('purchase-id').value;
            
            let result;
            if (purchaseId) {
                // Редактирование
                result = await apiClient.updatePurchase(purchaseId, formData);
                if (result.success) {
                    this.showNotification('Покупка обновлена!', 'success');
                    document.getElementById('purchase-modal').style.display = 'none';
                    await this.refreshData();
                }
            } else {
                // Добавление
                result = await apiClient.addPurchase(formData);
                if (result.success) {
                    this.showNotification('Покупка добавлена!', 'success');
                    document.getElementById('purchase-modal').style.display = 'none';
                    await this.refreshData();
                }
            }
            
        } catch (error) {
            console.error('Ошибка сохранения покупки:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async deletePurchase(id) {
        if (!confirm('Удалить эту покупку?')) return;
        
        try {
            const result = await apiClient.deletePurchase(id);
            
            if (result.success) {
                this.showNotification('Покупка удалена', 'success');
                await this.refreshData();
            } else {
                throw new Error(result.error || 'Ошибка удаления');
            }
            
        } catch (error) {
            console.error('Ошибка удаления:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    toggleStats() {
        console.log('toggleStats called - нужно реализовать');
        // TODO: реализовать переключение статистики
    }

    showNotification(message, type = 'info') {
        console.log(`[${type}] ${message}`);
        
        // Простая реализация - можно заменить на toast
        const color = type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3';
        alert(`[${type.toUpperCase()}] ${message}`);
    }
	
	/**
     * Инициализация менеджера статистики
     */
    initStatisticsManager() {
        console.log('Инициализация StatisticsManager...');
        
        if (!window.statisticsManager) {
            console.error('statisticsManager не найден');
            return;
        }
        
        this.statisticsManager = window.statisticsManager;
        this.statisticsManager.init(this.categoriesCache, this.storesCache);
        
        console.log('StatisticsManager инициализирован');
    }

    /**
     * Обновление статистики
     */
    updateStatistics(purchases = null) {
        if (!this.statisticsManager) {
            console.warn('statisticsManager не инициализирован');
            return;
        }
        
        const data = purchases || this.table?.getData() || [];
        
        if (data.length === 0) {
            console.warn('Нет данных для статистики');
            return;
        }
        
        this.statisticsManager.calculateAll(data);
        
        // Если на странице есть контейнеры статистики - отображаем
        if (document.getElementById('categories-stats')) {
            this.statisticsManager.displayAll();
        }
    }
	
	/**
     * Обновление информационной панели таблицы
     */
    updateTableInfoPanel() {
        if (!this.table) return;
        
        const data = this.table.getData();
        const filteredData = this.table.getData('active');
        
        // Основные показатели
        const totalRows = filteredData.length;
        const totalAmount = filteredData.reduce((sum, row) => sum + parseFloat(row.amount || 0), 0);
        const avgAmount = totalRows > 0 ? totalAmount / totalRows : 0;
        
        // Обновляем цифры
        document.getElementById('total-rows').textContent = totalRows;
        document.getElementById('total-amount').textContent = 
			this.formatNumberWithSpaces(totalAmount) + ' ₽';
		document.getElementById('avg-amount').textContent = 
			this.formatNumberWithSpaces(avgAmount) + ' ₽';
        
        // Обновляем статус
        this.updateTableStatus();
        
        // Обновляем информацию о фильтрах
        this.updateActiveFiltersInfo();
    }
	
	/**
	 * Форматирование числа с пробелами для тысяч
	 */
	formatNumberWithSpaces(number) {
		if (number === null || number === undefined) return '0';
		
		// Преобразуем в число
		const num = parseFloat(number);
		if (isNaN(num)) return '0';
		
		// Разделяем целую и дробную части
		const [integerPart, decimalPart] = num.toFixed(2).split('.');
		
		// Форматируем целую часть с пробелами
		const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
		
		// Возвращаем с дробной частью
		return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
	}
    
    /**
     * Обновление статуса таблицы
     */
    updateTableStatus() {
        const statusEl = document.getElementById('table-status');
        if (!statusEl) return;
        
        const totalData = this.table?.getData()?.length || 0;
        const filteredData = this.table?.getData('active')?.length || 0;
        
        if (totalData === filteredData || filteredData === 0) {
            statusEl.textContent = 'Все данные';
        } else {
            const percentage = Math.round((filteredData / totalData) * 100);
            statusEl.textContent = `Отфильтровано: ${filteredData} из ${totalData} записей (${percentage}%)`;
        }
    }
    
    /**
     * Обновление информации об активных фильтрах
     */
    updateActiveFiltersInfo() {
        const container = document.getElementById('active-filters-info');
        if (!container || !window.filterManager) return;
        
        const filters = filterManager.getCurrentFilters();
        const activeFilters = [];
        
        // Категория
        if (filters.category) {
            const category = this.categoriesCache.find(c => c.id == filters.category);
            if (category) {
                activeFilters.push({
                    type: 'category',
                    label: `${category.icon} ${category.name}`,
                    value: filters.category
                });
            }
        }
        
        // Магазин
        if (filters.store) {
            const store = this.storesCache.find(s => s.id == filters.store);
            if (store) {
                activeFilters.push({
                    type: 'store',
                    label: `🏪 ${store.shop}`,
                    value: filters.store
                });
            }
        }
        
        // Дата "от"
        if (filters.dateFrom) {
            activeFilters.push({
                type: 'dateFrom',
                label: `📅 с ${this.formatDate(filters.dateFrom)}`,
                value: filters.dateFrom
            });
        }
        
        // Дата "до"
        if (filters.dateTo) {
            activeFilters.push({
                type: 'dateTo',
                label: `📅 по ${this.formatDate(filters.dateTo)}`,
                value: filters.dateTo
            });
        }
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        // Добавляем бейджики фильтров
        activeFilters.forEach(filter => {
            const badge = document.createElement('span');
            badge.className = 'filter-badge';
            badge.innerHTML = `
                ${filter.label}
                <span class="remove-filter" data-type="${filter.type}">×</span>
            `;
            container.appendChild(badge);
        });
        
        // Добавляем обработчики для удаления фильтров
        container.querySelectorAll('.remove-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-type');
                this.removeFilter(type);
            });
        });
    }
    
    /**
     * Форматирование даты для отображения
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
     * Удаление конкретного фильтра
     */
    removeFilter(filterType) {
        if (!window.filterManager) return;
        
        const currentFilters = filterManager.getCurrentFilters();
        const newFilters = { ...currentFilters };
        
        switch (filterType) {
            case 'category':
                newFilters.category = null;
                if (filterManager.elements.categoryFilter) {
                    filterManager.elements.categoryFilter.value = '';
                }
                break;
                
            case 'store':
                newFilters.store = null;
                if (filterManager.elements.storeFilter) {
                    filterManager.elements.storeFilter.value = '';
                }
                break;
                
            case 'dateFrom':
                newFilters.dateFrom = null;
                if (filterManager.elements.dateFrom) {
                    filterManager.elements.dateFrom.value = '';
                }
                break;
                
            case 'dateTo':
                newFilters.dateTo = null;
                if (filterManager.elements.dateTo) {
                    filterManager.elements.dateTo.value = '';
                }
                break;
        }
        
        // Применяем новые фильтры
        filterManager.setFilters(newFilters);
        filterManager.notifyFilterChange();
        
        // Обновляем панель
        this.updateTableInfoPanel();
    }
	
}

// ============================================
// ИНТЕРАКТИВНОСТЬ
// ============================================
/**
* Выбор фильтра
*/
function applyChartFilter() {
    try {
        const filterJson = localStorage.getItem('shoppingTracker_chartFilter');
        const timestamp = localStorage.getItem('shoppingTracker_filterTimestamp');
        
        if (!filterJson || !timestamp) return;
        
        // Проверяем, не устарел ли фильтр (больше 30 минут)
        const filterAge = Date.now() - parseInt(timestamp);
        if (filterAge > 30 * 60 * 1000) {
            console.log('Фильтр устарел, очищаем');
            clearChartFilter();
            return;
        }
        
        const filter = JSON.parse(filterJson);
        console.log('Применение фильтра из графика:', filter);
        
        // Применяем фильтр в зависимости от типа
        applyFilterToTable(filter);
        
        // Показываем уведомление о примененном фильтре
        showAppliedFilterNotification(filter);
        
    } catch (error) {
        console.error('Ошибка применения фильтра:', error);
    }
}

/**
* Формирование таблицы при выборе фильтра
*/
function applyFilterToTable(filter) {
    if (!window.purchasesTable) {
        console.warn('Таблица не загружена, не могу применить фильтр');
        return;
    }
    
    let filterConfig = [];
    
    switch(filter.type) {
        case 'categories':
            // Фильтр по категории
            filterConfig.push({
                field: "category_name",
                type: "like",
                value: filter.label
            });
            break;
            
        case 'stores':
            // Фильтр по магазину
            if (filter.cleanLabel) {
                filterConfig.push({
                    field: "store.shop",
                    type: "like",
                    value: filter.cleanLabel
                });
            }
            break;
            
        case 'months':
            // Фильтр по месяцу
            if (filter.monthNumber) {
                filterConfig.push({
                    field: "date",
                    type: "function",
                    value: function(cellValue) {
                        if (!cellValue) return false;
                        const date = new Date(cellValue);
                        return (date.getMonth() + 1) === filter.monthNumber;
                    }
                });
            }
            break;
            
        case 'years':
            // Фильтр по году
            if (filter.year) {
                filterConfig.push({
                    field: "date",
                    type: "function",
                    value: function(cellValue) {
                        if (!cellValue) return false;
                        const date = new Date(cellValue);
                        return date.getFullYear() === filter.year;
                    }
                });
            }
            break;
            
        case 'products':
            // Фильтр по товару
            if (filter.cleanLabel) {
                filterConfig.push({
                    field: "name",
                    type: "like",
                    value: filter.cleanLabel
                });
            }
            break;
    }
    
    // Применяем фильтр к таблице
    if (filterConfig.length > 0) {
        window.purchasesTable.setFilter(filterConfig);
        
        // Показываем количество отфильтрованных записей
        const filteredCount = window.purchasesTable.getData("active").length;
        console.log(`Применен фильтр: ${filter.label}, найдено: ${filteredCount} записей`);
    }
}

/**
* Создаём баннер фильтра
*/
function showAppliedFilterNotification(filter) {
    // Создаем баннер фильтра
    const filterBanner = document.createElement('div');
    filterBanner.id = 'applied-filter-banner';
    filterBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span>Применен фильтр: <strong>${filter.label}</strong></span>
            <button id="clear-applied-filter" class="btn-small btn-secondary">× Очистить</button>
        </div>
    `;
    
    filterBanner.style.cssText = `
        background: #e3f2fd;
        border: 1px solid #2196f3;
        border-radius: 4px;
        padding: 10px 15px;
        margin: 10px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    
    // Вставляем перед таблицей
    const tableContainer = document.querySelector('.table-container');
    if (tableContainer) {
        tableContainer.insertBefore(filterBanner, tableContainer.firstChild);
    }
    
    // Обработчик очистки
    document.getElementById('clear-applied-filter').addEventListener('click', function() {
        clearChartFilter();
        if (window.purchasesTable) {
            window.purchasesTable.clearFilter();
        }
        filterBanner.remove();
    });
}

/**
* Очистка фильтра
*/
function clearChartFilter() {
    localStorage.removeItem('shoppingTracker_chartFilter');
    localStorage.removeItem('shoppingTracker_filterTimestamp');
    console.log('Фильтр очищен');
}

// ============================================
// ПРОГРЕСС-БАР ДЛЯ ЭКСПОРТА БОЛЬШИХ ДАННЫХ
// ============================================
// Прогресс-бар для больших экспортов
class ExportProgressBar {
    constructor() {
        this.element = null;
    }
    
    show(total) {
        if (this.element) this.hide();
        
        this.element = document.createElement('div');
        this.element.className = 'export-progress';
        this.element.innerHTML = `
            <div class="progress-container">
                <div class="progress-header">Экспорт данных</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-stats">
                    <span class="progress-count">0/${total}</span>
                    <span class="progress-percent">0%</span>
                </div>
            </div>
        `;
        
        // Стили
        const style = document.createElement('style');
        style.textContent = `
            .export-progress {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: white;
                border-radius: 10px;
                padding: 15px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                z-index: 10001;
                min-width: 300px;
            }
            
            .progress-container {
                width: 100%;
            }
            
            .progress-header {
                font-weight: bold;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            .progress-bar {
                height: 20px;
                background: #ecf0f1;
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #3498db, #2ecc71);
                transition: width 0.3s ease;
                border-radius: 10px;
            }
            
            .progress-stats {
                display: flex;
                justify-content: space-between;
                font-size: 12px;
                color: #7f8c8d;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.element);
        
        this.element.total = total;
    }
    
    update(current) {
        if (!this.element) return;
        
        const total = this.element.total;
        const percent = Math.round((current / total) * 100);
        
        const fill = this.element.querySelector('.progress-fill');
        const count = this.element.querySelector('.progress-count');
        const percentEl = this.element.querySelector('.progress-percent');
        
        if (fill) fill.style.width = percent + '%';
        if (count) count.textContent = `${current}/${total}`;
        if (percentEl) percentEl.textContent = percent + '%';
        
        if (current >= total) {
            setTimeout(() => this.hide(), 1000);
        }
    }
    
    hide() {
        if (this.element) {
            this.element.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                    this.element = null;
                }
            }, 300);
        }
    }
}

// Использование
const progressBar = new ExportProgressBar();


// ЗАПУСК ПРИЛОЖЕНИЯ
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, что apiClient загружен
    if (!window.apiClient) {
        console.error('apiClient не найден! Проверьте подключение api.js');
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.textContent = 'Ошибка: apiClient не загружен. Проверьте консоль.';
        }
        return;
    }
	// Ждем загрузки таблицы
    setTimeout(() => {
        applyChartFilter();
    }, 1000);
    
    // Создаем и инициализируем приложение
    window.shoppingApp = new ShoppingApp();
    window.shoppingApp.init();
});