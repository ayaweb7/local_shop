// app.js - ПОЛНАЯ ВЕРСИЯ С Tabulator и API
class ShoppingApp {
    constructor() {
        this.storesCache = [];
        this.categoriesCache = [];
        this.unitsCache = [];
		// this.chartManager = new ChartManager();
        this.init();
		this.currentFilters = {
			category: null,
			dateFrom: null,
			dateTo: null
		};
    }

    async init() {
        console.log('ShoppingApp запущен');
        
        try {
            // Загружаем кэши
            await this.loadStoresCache();
            await this.loadCategoriesAndUnitsCache();
			await this.loadCategoriesCache(); // ← НОВОЕ
			await this.loadUnitsCache();
            
            // Инициализируем интерфейс
            this.loadPurchasesData();
            this.setupEventListeners();
            this.initializePurchaseForm();
			
			// Инициализируем графики после загрузки данных
            setTimeout(() => {
                this.chartManager.initCharts();
            }, 1000);
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showNotification('Ошибка загрузки: ' + error.message, 'error');
        }
    }

    // ЗАГРУЗКА КЭША МАГАЗИНОВ
    async loadStoresCache() {
        try {
            this.storesCache = await apiClient.getStores();
            console.log('Загружено магазинов:', this.storesCache.length);
        } catch (error) {
            console.error('Ошибка загрузки магазинов:', error);
            this.storesCache = [];
        }
    }
	
	// НОВЫЙ МЕТОД - Загрузка кэша категорий
	async loadCategoriesCache() {
		try {
			const categories = await apiClient.getCategories();
			this.categoriesCache = categories;
			console.log('Загружено категорий:', categories.length);
		} catch (error) {
			console.error('Ошибка загрузки категорий:', error);
			this.categoriesCache = [];
		}
	}

    // ЗАГРУЗКА КЭША КАТЕГОРИЙ И ЕДИНИЦ
    async loadUnitsCache() {
        try {
			// Теперь загружаем категории из API, а не из покупок
			const [purchases, categories] = await Promise.all([
				apiClient.getPurchases(),
				apiClient.getCategories()
			]);
			
			this.categoriesCache = categories;
			
			// Единицы измерения по-прежнему из покупок
			this.unitsCache = [...new Set(purchases
				.map(p => p.item)
				.filter(Boolean)
			)].sort();
			
			console.log('Кэшировано категорий:', this.categoriesCache.length);
			console.log('Кэшировано единиц:', this.unitsCache.length);
			
		} catch (error) {
			console.error('Ошибка загрузки категорий и единиц:', error);
			this.loadDefaultCategoriesAndUnits();
		}
	}

    // ЗАГРУЗКА ДАННЫХ И ОТОБРАЖЕНИЕ ТАБЛИЦЫ
    async loadPurchasesData() {
        try {
            console.log('Загрузка данных покупок...');
            document.getElementById('loading').style.display = 'block';
            
            const purchases = await apiClient.getPurchases();
            console.log('Загружено покупок:', purchases.length);
            
            document.getElementById('loading').style.display = 'none';
            this.initializeTable(purchases);
			// const stats = this.calculateCategoryStats(purchases);
			// this.displayCategoryStats(stats);
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            document.getElementById('loading').textContent = 
                'Ошибка: ' + error.message;
        }
    }

    // ИНИЦИАЛИЗАЦИЯ TABULATOR
    initializeTable(data) {
        // Удаляем старую таблицу если есть
        const tableEl = document.getElementById('purchases-table');
        if (tableEl._tabulator) {
            tableEl._tabulator.destroy();
        }
        
        this.table = new Tabulator('#purchases-table', {
            data: data,
            layout: 'fitColumns',
            pagination: 'local',
            paginationSize: 20,
            paginationSizeSelector: [10, 20, 50, 100],
            movableColumns: true,
            height: '100%',
            columns: [
                { 
                    title: 'ID', 
                    field: 'id', 
                    width: 70,
                    sorter: 'number' 
                },
                { 
                    title: 'Дата', 
                    field: 'date',
                    width: 100,
                    sorter: 'date',
                    formatter: (cell) => {
                        const date = cell.getValue();
                        return date ? new Date(date).toLocaleDateString('ru-RU') : '';
                    }
                },
				// В initializeTable добавьте колонку с иконкой категории:
				{
					title: "Категория",
					field: "category_name",
					width: 120,
					headerFilter: "input",
					formatter: (cell) => {
						const row = cell.getRow().getData();
						if (row.category_icon && row.category_name) {
							return `${row.category_icon} ${row.category_name}`;
						}
						return row.gruppa || '-'; // Для старых записей
					},
					tooltip: true
				},
				{ 
                    title: 'Магазин', 
                    field: 'store.shop',
                    width: 150,
                    headerFilter: 'input'
                },
                { 
                    title: 'Адрес', 
                    field: 'full_address',
                    width: 200,
                    headerFilter: 'input'
                },
                { 
                    title: 'Товар', 
                    field: 'name',
                    width: 150,
                    headerFilter: 'input'
                },
                {
                    title: 'Характеристики',
                    field: 'characteristic',
                    width: 150,
                    formatter: (cell) => cell.getValue() || '-'
                },
                { 
                    title: 'Кол-во', 
                    field: 'quantity',
                    width: 90,
                    hozAlign: 'right',
                    formatter: (cell) => {
                        const row = cell.getRow();
                        return `${cell.getValue()} ${row.getData().item}`;
                    }
                },
                { 
                    title: 'Цена, ₽', 
                    field: 'price',
                    width: 100,
                    hozAlign: 'right',
                    formatter: 'money',
                    formatterParams: {
                        symbol: '₽',
                        symbolAfter: true,
                        thousand: ' ',
                        decimal: '.',
                        precision: 2
                    }
                },
                { 
                    title: 'Сумма, ₽', 
                    field: 'amount',
                    width: 100,
                    hozAlign: 'right',
                    formatter: 'money',
                    formatterParams: {
                        symbol: '₽',
                        symbolAfter: true,
                        thousand: ' ',
                        decimal: '.',
                        precision: 2
                    }
                },
                {
                    title: 'Действия',
                    width: 100,
                    hozAlign: 'center',
                    formatter: () => `
                        <button class="edit-btn" title="Редактировать">✏️</button>
                        <button class="delete-btn" title="Удалить">🗑️</button>
                    `,
                    cellClick: (e, cell) => {
                        const data = cell.getRow().getData();
                        if (e.target.classList.contains('edit-btn')) {
                            this.showPurchaseForm(data);
                        } else if (e.target.classList.contains('delete-btn')) {
                            this.deletePurchase(data.id);
                        }
                    }
                }
            ]
        });
    }

    // НАСТРОЙКА СОБЫТИЙ
    setupEventListeners() {
        // Кнопка добавления
        document.getElementById('add-purchase-btn').addEventListener('click', () => {
            this.showPurchaseForm();
        });
        
        // Кнопка обновления
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });
        
        // Кнопка админ-панели
        document.getElementById('admin-btn').addEventListener('click', () => {
            window.location.href = 'admin.html';
        });
        
        // Кнопка выхода
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Выйти из приложения?')) {
                window.location.href = 'index.html';
            }
        });
		
		// Фильтры
		document.getElementById('apply-filters').addEventListener('click', () => {
			this.applyFilters();
		});
		
		document.getElementById('reset-filters').addEventListener('click', () => {
			this.resetFilters();
		});
		
		// Автофильтрация при изменении категории
		document.getElementById('category-filter').addEventListener('change', (e) => {
			this.currentFilters.category = e.target.value || null;
			this.filterTable();
		});
		
		// Заполняем фильтр категорий
		this.populateCategoryFilter();
		
		// Кнопка скрыть/показать статистику
		document.getElementById('toggle-stats').addEventListener('click', () => {
			this.toggleStats();
		});
    }
	
	
	// Заполнение фильтра категорий
	populateCategoryFilter() {
		const filterSelect = document.getElementById('category-filter');
		if (!filterSelect) return;
		
		filterSelect.innerHTML = '<option value="">Все категории</option>';
		
		this.categoriesCache.forEach(category => {
			const option = document.createElement('option');
			option.value = category.id;
			option.textContent = `${category.icon} ${category.name}`;
			filterSelect.appendChild(option);
		});
	}

	// Применение фильтров
	applyFilters() {
		const dateFrom = document.getElementById('date-from').value;
		const dateTo = document.getElementById('date-to').value;
		
		this.currentFilters = {
			category: document.getElementById('category-filter').value || null,
			dateFrom: dateFrom || null,
			dateTo: dateTo || null
		};
		
		this.filterTable();
	}

	// Сброс фильтров
	resetFilters() {
		document.getElementById('category-filter').value = '';
		document.getElementById('date-from').value = '';
		document.getElementById('date-to').value = '';
		
		this.currentFilters = {
			category: null,
			dateFrom: null,
			dateTo: null
		};
		
		this.filterTable();
	}

	// Фильтрация таблицы
	filterTable() {
		if (!this.table) return;
		
		const filters = [];
		
		// Фильтр по категории
		if (this.currentFilters.category) {
			filters.push({
				field: "category_id",
				type: "=",
				value: parseInt(this.currentFilters.category)
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
		
		// Применяем фильтры к таблице
		this.table.setFilter(filters);
		
		// Показываем активные фильтры
		this.showActiveFilters();
	}

	// Показ активных фильтров
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
			if (this.currentFilters.dateFrom) period.push(`с ${this.currentFilters.dateFrom}`);
			if (this.currentFilters.dateTo) period.push(`по ${this.currentFilters.dateTo}`);
			activeFilters.push(period.join(' '));
		}
		
		if (activeFilters.length > 0) {
			console.log('Активные фильтры:', activeFilters.join(', '));
		}
	}
	

    // ОБНОВЛЕНИЕ ДАННЫХ
    async refreshData() {
        try {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('loading').textContent = 'Обновление...';
            
            // Обновляем кэши
            await this.loadStoresCache();
            await this.loadCategoriesAndUnitsCache();
            
            // Перезагружаем данные
            await this.loadPurchasesData();
            
            this.showNotification('Данные обновлены', 'success');
            
        } catch (error) {
            console.error('Ошибка обновления:', error);
            this.showNotification('Ошибка обновления: ' + error.message, 'error');
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

    // Обновите метод loadCategoriesIntoForm:
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
		
		// Если категорий мало, добавляем сообщение
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
	
	// Обновите loadCategoriesAndUnitsCache:
	async loadCategoriesAndUnitsCache() {
		try {
			// Теперь загружаем категории из API, а не из покупок
			const [purchases, categories] = await Promise.all([
				apiClient.getPurchases(),
				apiClient.getCategories()
			]);
			
			this.categoriesCache = categories;
			
			// Единицы измерения по-прежнему из покупок
			this.unitsCache = [...new Set(purchases
				.map(p => p.item)
				.filter(Boolean)
			)].sort();
			
			console.log('Кэшировано категорий:', this.categoriesCache.length);
			console.log('Кэшировано единиц:', this.unitsCache.length);
			
		} catch (error) {
			console.error('Ошибка загрузки категорий и единиц:', error);
			this.loadDefaultCategoriesAndUnits();
		}
	}


    setupFormEventListeners() {
        const form = document.getElementById('purchase-form');
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePurchase();
        });
        
        // Кнопка отмены
        document.getElementById('cancel-purchase').addEventListener('click', () => {
            document.getElementById('purchase-modal').style.display = 'none';
        });
        
        // Авторасчёт суммы при изменении цены или количества
        document.getElementById('purchase-price').addEventListener('input', this.autoCalculate.bind(this));
        document.getElementById('purchase-quantity').addEventListener('input', this.autoCalculate.bind(this));
    }

    autoCalculate() {
        const price = parseFloat(document.getElementById('purchase-price').value) || 0;
        const quantity = parseFloat(document.getElementById('purchase-quantity').value) || 0;
        
        if (price > 0 && quantity > 0) {
            const amount = price * quantity;
            document.getElementById('purchase-amount').value = amount.toFixed(2);
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

    fillFormWithData(purchase) {
        document.getElementById('purchase-id').value = purchase.id || '';
        document.getElementById('purchase-date').value = purchase.date || '';
        document.getElementById('purchase-store').value = purchase.store_id || '';
        document.getElementById('purchase-name').value = purchase.name || '';
		
        // Категория - устанавливаем значение после загрузки списка
		setTimeout(() => {
			const categorySelect = document.getElementById('purchase-category');
			if (categorySelect && purchaseData.category_id) {
				categorySelect.value = purchaseData.category_id;
			} else if (categorySelect && purchaseData.gruppa) {
				// Для старых записей пытаемся найти категорию по имени
				const category = this.categoriesCache.find(c => 
					c.name === purchaseData.gruppa
				);
				if (category) {
					categorySelect.value = category.id;
				}
			}
		}, 100);
		
        document.getElementById('purchase-price').value = purchase.price || '';
        document.getElementById('purchase-quantity').value = purchase.quantity || '1';
        document.getElementById('purchase-unit').value = purchase.item || 'шт.';
        document.getElementById('purchase-amount').value = purchase.amount || '';
        document.getElementById('purchase-characteristics').value = purchase.characteristic || '';
    }

    resetForm() {
        document.getElementById('purchase-form').reset();
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
            // В savePurchase() перед отправкой
			const formData = {
				date: document.getElementById('purchase-date').value,
				store_id: parseInt(document.getElementById('purchase-store').value),
				name: document.getElementById('purchase-name').value,
				category_id: parseInt(document.getElementById('purchase-category').value), // ← НОВОЕ
				price: parseFloat(document.getElementById('purchase-price').value),
				quantity: parseFloat(document.getElementById('purchase-quantity').value), // ← float
				item: document.getElementById('purchase-unit').value,
				characteristic: document.getElementById('purchase-characteristics').value,
				amount: parseFloat(document.getElementById('purchase-amount').value) // ← float
			};
            
            const purchaseId = document.getElementById('purchase-id').value;
            
            
            if (purchaseId) {
                // Редактирование
                const result = await apiClient.updatePurchase(purchaseId, formData);
				if (result.success) {
					this.showNotification('Покупка обновлена!', 'success');
					document.getElementById('purchase-modal').style.display = 'none';
					await this.refreshData();
				}
            } else {
                // Добавление
                const result = await apiClient.addPurchase(formData);
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
	
	
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    loadDefaultCategoriesAndUnits() {
        this.categoriesCache = [
            'Продукты', 'Химия', 'Бытовая техника', 'Одежда', 
            'Электроника', 'Мебель', 'Стройматериалы', 'Автотовары'
        ];
        
        this.unitsCache = ['шт.', 'кг', 'г', 'л', 'мл', 'м', 'см'];
    }

    showNotification(message, type = 'info') {
        // Простая реализация - можно заменить на красивый toast
        console.log(`[${type}] ${message}`);
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}



// ЗАПУСК ПРИЛОЖЕНИЯ
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, что apiClient загружен
    if (!window.apiClient) {
        console.error('apiClient не найден! Проверьте подключение api.js');
        document.getElementById('loading').textContent = 
            'Ошибка: apiClient не загружен. Проверьте консоль.';
        return;
    }
    
    window.shoppingApp = new ShoppingApp();
});