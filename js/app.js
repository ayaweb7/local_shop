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
            
			// ВЫЗЫВАЕМ СОБЫТИЕ о готовности таблицы
			document.dispatchEvent(new Event('purchasesTableReady'));
            
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
                headerFilterPlaceholder: 'Поиск'
            },
            { 
                title: 'Дата', 
                field: 'date',
                width: 110, // 100
                sorter: 'date',
                headerFilter: 'input',
                headerFilterPlaceholder: 'ДД.ММ.ГГГГ',
                // Кастомная функция форматирования для отображения
				formatter: (cell) => {
					const value = cell.getValue();
					return this.formatDisplayDate(value);
				},
				// Кастомная функция для фильтрации
				headerFilterFunc: (headerValue, rowValue, rowData, filterParams) => {
					if (!headerValue) return true;
					
					// Преобразуем введенное значение ДД.ММ.ГГГГ в объект Date
					const parts = headerValue.split('.');
					if (parts.length !== 3) return false;
					
					const day = parseInt(parts[0], 10);
					const month = parseInt(parts[1], 10) - 1;
					const year = parseInt(parts[2], 10);
					
					const filterDate = new Date(year, month, day);
					
					// Преобразуем дату из строки YYYY-MM-DD в объект Date
					const rowDateParts = rowValue.split('-');
					const rowDate = new Date(
						parseInt(rowDateParts[0], 10),
						parseInt(rowDateParts[1], 10) - 1,
						parseInt(rowDateParts[2], 10)
					);
					
					// Сравниваем даты (без учета времени)
					return filterDate.toDateString() === rowDate.toDateString();
				}
            },
            {
                title: "Категория",
                field: "category_name",
                width: 150, // 120
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
				field: 'store_name',  // Проверьте имя поля в консоли
				width: 120, // 150
				headerFilter: 'input',
				headerFilterPlaceholder: 'Поиск...',
				// РАЗРЕШАЕМ ПЕРЕНОС СЛОВ
				formatter: (cell) => {
					const value = cell.getValue();
					return value ? value : '-';
				},
				cssClass: 'cell-wrap-text', // Добавляем CSS класс
				variableHeight: true // Разрешаем переменную высоту строки
			},
            { 
                title: 'Адрес', 
                field: 'full_address',
                width: 140, // 200
                headerFilter: 'input',
                headerFilterPlaceholder: 'Поиск...',
				formatter: (cell) => {
					const value = cell.getValue();
					return value || '-';
				},
				cssClass: 'cell-wrap-text', // Добавляем CSS класс
				variableHeight: true // Разрешаем переменную высоту строки
            },
            { 
                title: 'Товар', 
                field: 'name',
                width: 110, // 150
                headerFilter: 'input',
                headerFilterPlaceholder: 'Поиск...'
            },
            {
                title: 'Характеристики',
                field: 'characteristic',
                width: 200, // 150
                formatter: (cell) => {
					const row = cell.getRow().getData();
					const characteristic = row.characteristic || '';
					const keywords = row.search_keywords || '';
					
					// Формируем HTML для отображения
					let html = `<div class="characteristic-cell">`;
					
					// Основная характеристика
					html += `<div class="characteristic-main">${characteristic || '-'}</div>`;
					
					// Ключевые слова (если есть)
					if (keywords && keywords.trim() !== '') {
						html += `<div class="characteristic-keywords">🔑 <em>${keywords}</em></div>`;
					} else {
						html += `<div class="characteristic-keywords text-muted">🔑 <em>нет ключевых слов</em></div>`;
					}
					
					html += `</div>`;
					return html;
				},
                headerFilter: 'input',
                headerFilterPlaceholder: 'Поиск...',
				cssClass: 'cell-wrap-text cell-small-font', // Специальный класс для характеристик
				variableHeight: true, // Разрешаем переменную высоту строки
				tooltip: true // Всплывающая подсказка при наведении
            },
            { 
                title: 'Кол-во', 
                field: 'quantity',
                width: 80, // 90
                hozAlign: 'right',
                headerFilter: 'number',
                headerFilterPlaceholder: 'Число...',
                formatter: (cell) => {
                    const row = cell.getRow().getData();
                    const quantity = parseFloat(cell.getValue());
					return `${!isNaN(quantity) ? quantity.toFixed(3) : '0.000'} ${row.item || 'шт.'}`;
				},
				cssClass: 'cell-wrap-text', // Добавляем CSS класс
				variableHeight: true // Разрешаем переменную высоту строки
            },
            { 
                title: 'Цена, ₽', 
                field: 'price',
                width: 90, // 100
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
                width: 90, // 100
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
                width: 120, // 100
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
	 * Форматирование даты для отображения
	 */
	formatDisplayDate(dateStr) {
		if (!dateStr) return '';
		const [year, month, day] = dateStr.split('-');
		return `${day}.${month}.${year}`;
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
		
		// ДОБАВЛЯЕМ: загрузка последних значений формы
		// Небольшая задержка, чтобы элементы успели заполниться
		setTimeout(() => {
			this.applyLastFormValues();
		}, 100);
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
		
		// ДОБАВЛЯЕМ: обработчик кнопки копирования
		this.addSafeEventListener('copy-last', 'click', () => {
			this.applyLastFormValues();
			this.showNotification('Данные из последней покупки скопированы', 'info');
		});
		
		// ДОБАВЛЯЕМ: кнопка очистки сохранённых значений
		this.addSafeEventListener('clear-last', 'click', () => {
			if (confirm('Очистить сохранённый шаблон? Следующая новая покупка будет с пустыми полями.')) {
				this.clearLastFormValues();
				this.showNotification('Сохранённый шаблон очищен', 'success');
			}
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
			
			// Пытаемся применить последние значения
			const hasLastValues = this.applyLastFormValues();
			
			// Если нет сохранённых значений, устанавливаем сегодняшнюю дату
			if (!hasLastValues) {
				const dateInput = document.getElementById('purchase-date');
				if (dateInput && !dateInput.value) {
					dateInput.valueAsDate = new Date();
					dateInput.value = new Date().toISOString().split('T')[0];
				}
			}
			
			// Устанавливаем фокус на поле "Товар" для быстрого ввода
			setTimeout(() => {
				document.getElementById('purchase-name').focus();
			}, 150);
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
		
		// ДОБАВЛЯЕМ: заполнение поля ключевых слов
		const keywordsField = document.getElementById('purchase-keywords');
		if (keywordsField) {
			keywordsField.value = purchaseData.search_keywords || '';
		}
    }

    resetForm() {
        const form = document.getElementById('purchase-form');
        if (form) {
            form.reset();
        }
        
		// Сбрасываем ID (для новой записи)
        document.getElementById('purchase-id').value = '';
		
		
        // Устанавливаем дату по умолчанию (сегодня)
		const dateInput = document.getElementById('purchase-date');
		if (dateInput) {
			dateInput.valueAsDate = new Date();
			dateInput.value = new Date().toISOString().split('T')[0];
		}
        
		// Сбрасываем количество на 1
		const quantityField = document.getElementById('purchase-quantity');
		if (quantityField) {
			quantityField.value = '1';
		}
		
        // Сбрасываем единицу измерения на "шт."
		const unitSelect = document.getElementById('purchase-unit');
		if (unitSelect) {
			unitSelect.value = 'шт.';
		}
		
		// Сбрасываем цену и сумму
		const priceField = document.getElementById('purchase-price');
		const amountField = document.getElementById('purchase-amount');
		if (priceField) priceField.value = '';
		if (amountField) amountField.value = '';
		
        // Сбрасываем поле категории
		const categorySelect = document.getElementById('purchase-category');
		if (categorySelect) categorySelect.value = '';
		
		// Сбрасываем поле магазина
		const storeSelect = document.getElementById('purchase-store');
		if (storeSelect) storeSelect.value = '';
		
		// ДОБАВЛЯЕМ: сброс поля ключевых слов
		const keywordsField = document.getElementById('purchase-keywords');
		if (keywordsField) {
			keywordsField.value = '';
		}
		
		console.log('Форма сброшена к значениям по умолчанию');
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
			
			// ДОБАВЛЯЕМ: поле ключевых слов
			const keywordsField = document.getElementById('purchase-keywords');
			if (keywordsField) {
				formData.search_keywords = keywordsField.value;
			}
            
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
					
					// ДОБАВЛЯЕМ: сохраняем последние значения формы
					this.saveLastFormValues();
					
                    // Спрашиваем, нужно ли добавить ещё одну покупку
					const addAnother = confirm('Покупка добавлена. Добавить ещё одну?');
					
					if (addAnother) {
						// Очищаем форму, но оставляем сохранённые значения (дата, магазин, категория)
						this.resetForm();
						this.applyLastFormValues();
						// Устанавливаем фокус на поле "Товар"
						document.getElementById('purchase-name').focus();
					} else {
						document.getElementById('purchase-modal').style.display = 'none';
						await this.refreshData();
					}
				}
			}
            
        } catch (error) {
            console.error('Ошибка сохранения покупки:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }
	
	/**
     * Сохранить и продолжить заполнение
     */
	async saveAndContinue() {
		await this.savePurchase(); // Сохраняем
		// После сохранения очищаем поля, но оставляем магазин/категорию
		// document.getElementById('purchase-name').value = '';
		document.getElementById('purchase-price').value = '';
		document.getElementById('purchase-quantity').value = '1';
		document.getElementById('purchase-amount').value = '';
		// document.getElementById('purchase-characteristics').value = '';
		document.getElementById('purchase-name').focus();
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
	
	/**
	 * Сохранить последние значения формы в localStorage
	 */
	saveLastFormValues() {
		const formData = {
			store_id: document.getElementById('purchase-store').value,
			category_id: document.getElementById('purchase-category').value,
			name: document.getElementById('purchase-name').value,
			characteristic: document.getElementById('purchase-characteristics').value,
			search_keywords: document.getElementById('purchase-keywords')?.value || '',
			item: document.getElementById('purchase-unit').value,
			date: document.getElementById('purchase-date').value,
			timestamp: Date.now()
		};
		
		// Сохраняем только если есть значения
		if (formData.store_id || formData.category_id || formData.name) {
			localStorage.setItem('last_purchase_form', JSON.stringify(formData));
			console.log('Последние значения формы сохранены:', {
				date: formData.date,
				store: formData.store_id,
				category: formData.category_id,
				name: formData.name,
				characteristic: formData.characteristic?.substring(0, 50) + '...',
				keywords: formData.search_keywords
			});
		}
	}

	/**
	 * Загрузить последние значения формы из localStorage
	 */
	loadLastFormValues() {
		try {
			const saved = localStorage.getItem('last_purchase_form');
			if (!saved) return null;
			
			const formData = JSON.parse(saved);
			
			// Проверяем, не устарели ли данные (более 1 часа)
			if (formData.timestamp && (Date.now() - formData.timestamp) > 60 * 60 * 1000) {
				localStorage.removeItem('last_purchase_form');
				return null;
			}
			
			return formData;
		} catch (error) {
			console.error('Ошибка загрузки последних значений:', error);
			return null;
		}
	}

	/**
	 * Применить последние значения к форме
	 */
	applyLastFormValues() {
		const lastValues = this.loadLastFormValues();
		if (!lastValues) return false;
		
		let applied = false;
		
		// Применяем дату
		if (lastValues.date) {
			const dateField = document.getElementById('purchase-date');
			if (dateField) {
				dateField.value = lastValues.date;
				applied = true;
			}
		}
		
		// Применяем магазин
		if (lastValues.store_id) {
			const storeSelect = document.getElementById('purchase-store');
			if (storeSelect && storeSelect.querySelector(`option[value="${lastValues.store_id}"]`)) {
				storeSelect.value = lastValues.store_id;
				applied = true;
			}
		}
		
		// Применяем категорию
		if (lastValues.category_id) {
			const categorySelect = document.getElementById('purchase-category');
			if (categorySelect && categorySelect.querySelector(`option[value="${lastValues.category_id}"]`)) {
				categorySelect.value = lastValues.category_id;
				applied = true;
			}
		}
		
		// Применяем единицу измерения
		if (lastValues.item) {
			const unitSelect = document.getElementById('purchase-unit');
			if (unitSelect && unitSelect.querySelector(`option[value="${lastValues.item}"]`)) {
				unitSelect.value = lastValues.item;
				applied = true;
			}
		}
		
		// Применяем название товара
		if (lastValues.name) {
			const nameField = document.getElementById('purchase-name');
			if (nameField) {
				nameField.value = lastValues.name;
				applied = true;
			}
		}
		
		// Применяем ключевые слова
		if (lastValues.search_keywords) {
			const keywordsField = document.getElementById('purchase-keywords');
			if (keywordsField) {
				keywordsField.value = lastValues.search_keywords;
				applied = true;
			}
		}
		
		// Применяем характеристики товара
		if (lastValues.characteristic) {
			const characteristicField = document.getElementById('purchase-characteristics');
			if (characteristicField) {
				characteristicField.value = lastValues.characteristic;
				applied = true;
			}
		}
		
		if (applied) {
			console.log('Применены последние значения формы');
			// Дополнительно: после заполнения формы можно автоматически рассчитать сумму
			this.autoCalculate();
		}
		
		return applied;
	}

	/**
	 * Очистить последние значения формы (для кнопки сброса)
	 */
	clearLastFormValues() {
		localStorage.removeItem('last_purchase_form');
		console.log('Последние значения формы очищены');
	}
	
}


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
	    
    // Создаем и инициализируем приложение
    window.shoppingApp = new ShoppingApp();
    window.shoppingApp.init();
});