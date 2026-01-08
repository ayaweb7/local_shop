// app.js - Основное приложение
class ShoppingApp {
    constructor() {
        this.storesCache = null; // Добавляем кэш магазинов
        this.init();
    }

    async init() {
        // Проверяем, что пользователь аутентифицирован
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        console.log('Запуск приложения для пользователя:', session.user.email);
        
        // Сначала загружаем кэш магазинов
        await this.loadStoresCache();
        this.loadPurchasesData();
        this.setupEventListeners();
        this.initializePurchaseForm();
    }

    // ЗАГРУЗКА КЭША МАГАЗИНОВ
    async loadStoresCache() {
        try {
            const { data, error } = await supabase
                .from('stores')
                .select(`
                    *,
                    locality:locality_id (town_ru)
                `)
                .order('shop', { ascending: true });

            if (error) throw error;
            
            this.storesCache = data || [];
            console.log('Загружено магазинов в кэш:', this.storesCache.length);
        } catch (error) {
            console.error('Ошибка загрузки кэша магазинов:', error);
            this.storesCache = [];
        }
    }

    // ОСНОВНАЯ ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ И ОТОБРАЖЕНИЯ ДАННЫХ
    async loadPurchasesData() {
        try {
            console.log("Начинаем загрузку данных...");
            const allRows = [];
            const pageSize = 1000;
            let from = 0;
            let hasMoreData = true;
            let safeExitCounter = 0;
            const maxSafePages = 10;

            while (hasMoreData && safeExitCounter < maxSafePages) {
                safeExitCounter++;

                let to = from + pageSize - 1;
                console.log(`Пытаемся загрузить блок: с ${from} по ${to}`);

                // ОБНОВЛЕННЫЙ ЗАПРОС С JOIN
                const { data: pageData, error } = await supabase
                    .from('shops')
                    .select(`
                        *,
                        store:store_id (
                            shop,
                            street,
                            house,
                            locality:locality_id (
                                town_ru
                            )
                        )
                    `)
                    .order('id', { ascending: true })
                    .range(from, to);

                if (error) {
                    if (error.message && error.message.includes('416') || error.code === 'PGRST301') {
                        console.log('Достигнут конец данных. Загрузка завершена.');
                        hasMoreData = false;
                        break;
                    } else {
                        console.error('Критическая ошибка при загрузке страницы:', error);
                        throw new Error(`Ошибка Supabase: ${error.message || JSON.stringify(error)}`);
                    }
                }

                if (!pageData || pageData.length === 0) {
                    console.log('Получен пустой ответ. Загрузка завершена.');
                    hasMoreData = false;
                    break;
                }

                // ОБРАБАТЫВАЕМ ДАННЫЕ С JOIN
                const processedData = pageData.map(row => ({
                    ...row,
                    // Формируем адрес для отображения
                    full_address: this.formatAddress(row.store)
                }));

                allRows.push(...processedData);
                from += pageSize;
                console.log(`Успешно загружено: ${pageData.length} записей. Всего: ${allRows.length}`);

                if (pageData.length < pageSize) {
                    console.log(`Получено неполная страница (${pageData.length}/${pageSize}). Загрузка завершена.`);
                    hasMoreData = false;
                }
            }

            console.log('Всего загружено записей:', allRows.length);
            
            // Скрываем надпись "Загрузка..."
            document.getElementById('loading').style.display = 'none';

            // Инициализируем таблицу со ВСЕМИ данными
            this.initializeTable(allRows);
            
        } catch (error) {
            console.error('Общая ошибка:', error);
            document.getElementById('loading').textContent = 'Ошибка при загрузке данных: ' + error.message;
        }
    }

    // ФОРМИРОВАНИЕ АДРЕСА ИЗ КОМПОНЕНТОВ
    formatAddress(store) {
        if (!store) return 'Не указан';
        
        const parts = [];
        if (store.locality?.town_ru) parts.push(store.locality.town_ru);
        if (store.street && store.street !== 'Empty') parts.push(`ул. ${store.street}`);
        if (store.house && store.house !== 'Empty') parts.push(`д. ${store.house}`);
        
        return parts.length > 0 ? parts.join(', ') : 'Адрес не указан';
    }

    initializeTable(data) {
        // Инициализируем Tabulator со ВСЕМИ данными
        this.table = new Tabulator('#purchases-table', {
            data: data,
            layout: "fitColumns",
            pagination: "local",
            paginationSize: 20,
            paginationSizeSelector: [10, 20, 50, 100, 500],
            movableColumns: true,
            maxHeight: "100%",
            columns: [
                {
                    title: "ID",
                    field: "id",
                    width: 80,
                    hozAlign: "left",
                    sorter: "number"
                },
                {
                    title: "Дата",
                    field: "date",
                    width: 100,
                    hozAlign: "center",
                    headerFilter: "input",
                    sorter: "date",
                    sorterParams: { format: "yyyy-MM-dd" },
                    formatter: (cell) => {
                        const dateValue = cell.getValue();
                        if (!dateValue) return '-';
                        const dateObj = new Date(dateValue + 'T00:00:00');
                        return dateObj.toLocaleDateString('ru-RU');
                    }
                },
                { 
                    title: "Товар", 
                    field: "name", 
                    width: 150,
                    headerFilter: "input",
                    tooltip: true
                },
                { 
                    title: "Магазин", 
                    field: "store.shop",
                    width: 150,
                    headerFilter: "input",
                    formatter: (cell) => {
                        const store = cell.getRow().getData().store;
                        return store?.shop || 'Не указан';
                    }
                },
                { 
                    title: "Адрес", 
                    field: "full_address",
                    width: 250,
                    headerFilter: "input",
                    formatter: (cell) => {
                        const store = cell.getRow().getData().store;
                        return this.formatAddress(store);
                    },
                    tooltip: true
                },
                {
                    title: "Категория",
                    field: "gruppa",
                    width: 150,
                    headerFilter: "input",
                    tooltip: true
                },
                {
                    title: "Кол-во",
                    field: "quantity",
                    width: 100,
                    hozAlign: "right",
                    sorter: "number",
                    formatter: (cell) => {
                        const quantity = cell.getValue();
                        const item = cell.getRow().getData().item;
                        return quantity ? `${quantity} ${item || 'шт.'}` : '-';
                    }
                },
                {
                    title: "Цена, ₽",
                    field: "price",
                    width: 100,
                    hozAlign: "right",
                    sorter: "number",
                    formatter: "money",
                    formatterParams: {
                        symbol: "₽",
                        symbolAfter: true,
                        thousand: " ",
                        decimal: ".",
                        precision: 2
                    }
                },
                {
                    title: "Сумма, ₽",
                    field: "amount",
                    width: 100,
                    hozAlign: "right",
                    sorter: "number",
                    formatter: "money",
                    formatterParams: {
                        symbol: "₽",
                        symbolAfter: true,
                        thousand: " ",
                        decimal: ".",
                        precision: 2
                    }
                },
                {
                    title: "Характеристики",
                    field: "characteristic",
                    width: 150,
                    headerFilter: "input",
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return value || '-';
                    },
                    tooltip: true
                },
                {
                    title: "Действия",
                    width: 100,
                    hozAlign: "center",
                    formatter: (cell) => {
                        return `
                            <button class="edit-purchase-btn" title="Редактировать">✏️</button>
                            <button class="delete-purchase-btn" title="Удалить">🗑️</button>
                        `;
                    },
                    cellClick: (e, cell) => {
                        const rowData = cell.getRow().getData();
                        if (e.target.classList.contains('edit-purchase-btn')) {
                            this.showPurchaseForm(rowData);
                        } else if (e.target.classList.contains('delete-purchase-btn')) {
                            this.deletePurchase(rowData.id);
                        }
                    }
                }
            ],
            tooltips: true
        });
    }

    setupEventListeners() {
        // Новая кнопка админ-панели
        document.getElementById('admin-btn').addEventListener('click', () => {
            window.location.href = 'admin.html';
        });
        
        // Кнопка добавления покупки
        document.getElementById('add-purchase-btn').addEventListener('click', () => {
            this.showPurchaseForm();
        });
        
        // Кнопка выхода
        document.getElementById('logout-btn').addEventListener('click', () => {
            window.authManager.signOut();
        });

        // Кнопка обновления данных
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });
    }

    // ОБНОВЛЕНИЕ ДАННЫХ
    async refreshData() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('loading').textContent = 'Обновление данных...';
        
        // Перезагружаем кэш магазинов
        await this.loadStoresCache();
        
        // Очищаем таблицу перед загрузкой новых данных
        const tableElement = document.getElementById('purchases-table');
        if (tableElement._tabulator) {
            tableElement._tabulator.destroy();
        }
        
        await this.loadPurchasesData();
    }

    // ИНИЦИАЛИЗАЦИЯ ФОРМЫ ПОКУПКИ
    initializePurchaseForm() {
        this.loadStoresIntoForm();
		this.loadCategoriesAndUnits();
        this.setupFormEventListeners();
        this.setupModalHandlers();
    }

    // ЗАГРУЗКА МАГАЗИНОВ В ВЫПАДАЮЩИЙ СПИСОК
    loadStoresIntoForm() {
        const storeSelect = document.getElementById('purchase-store');
        if (!storeSelect) {
            console.error('Элемент purchase-store не найден!');
            return;
        }
        
        storeSelect.innerHTML = '<option value="">Выберите магазин</option>';
        
        this.storesCache.forEach(store => {
            const option = document.createElement('option');
            option.value = store.id;
            option.textContent = `${store.shop} (${this.formatAddress(store)})`;
            storeSelect.appendChild(option);
        });
    }

	// АВТОМАТИЧЕСКОЕ ЗАПОЛНЕНИЕ КАТЕГОРИЙ И ЕДИНИЦ ИЗ БАЗЫ
	async loadCategoriesAndUnits() {
		try {
			console.log('Загрузка категорий и единиц из базы...');
			
			// Загружаем ВСЕ уникальные категории из базы
			const { data: categoriesData, error: categoriesError } = await supabase
				.from('shops')
				.select('gruppa')
				.not('gruppa', 'is', null)
				.order('gruppa');

			if (categoriesError) throw categoriesError;
			
			// Извлекаем уникальные категории и сортируем
			const uniqueCategories = [...new Set(categoriesData.map(item => item.gruppa))].filter(Boolean);
			console.log('Найдено категорий:', uniqueCategories.length);
			
			this.populateSelect('purchase-category', uniqueCategories, 'Выберите категорию');
			
			// Загружаем ВСЕ уникальные единицы измерения из базы
			const { data: unitsData, error: unitsError } = await supabase
				.from('shops')
				.select('item')
				.not('item', 'is', null)
				.order('item');

			if (unitsError) throw unitsError;
			
			// Извлекаем уникальные единицы и сортируем
			const uniqueUnits = [...new Set(unitsData.map(item => item.item))].filter(Boolean);
			console.log('Найдено единиц измерения:', uniqueUnits.length);
			
			this.populateSelect('purchase-unit', uniqueUnits, 'шт.', true);
			
		} catch (error) {
			console.error('Ошибка загрузки категорий и единиц:', error);
			// В случае ошибки используем стандартные значения
			this.loadDefaultCategoriesAndUnits();
		}
	}

	// ЗАПОЛНЕНИЕ SELECT ЭЛЕМЕНТА С ПРАВИЛЬНЫМИ АТРИБУТАМИ
	populateSelect(selectId, values, defaultValue = '', isUnit = false) {
		const select = document.getElementById(selectId);
		if (!select) {
			console.error('Элемент не найден:', selectId);
			return;
		}
		
		// Сохраняем текущее значение если есть
		const currentValue = select.value;
		
		// Очищаем и создаем заново
		select.innerHTML = '';
		
		// Добавляем заголовок для категорий
		if (!isUnit) {
			const defaultOption = document.createElement('option');
			defaultOption.value = '';
			defaultOption.textContent = 'Выберите категорию';
			defaultOption.disabled = true;
			defaultOption.selected = true;
			select.appendChild(defaultOption);
		}
		
		// Добавляем значения из базы
		values.forEach(value => {
			if (value && value.trim() !== '') {
				const option = document.createElement('option');
				option.value = value;
				option.textContent = value;
				select.appendChild(option);
			}
		});
		
		// Для единиц измерения добавляем стандартные значения если из базы мало данных
		if (isUnit && values.length < 3) {
			const defaultUnits = ['шт.', 'кг', 'г', 'л', 'мл', 'упак.', 'банка', 'бутылка', 'пачка'];
			defaultUnits.forEach(unit => {
				if (!values.includes(unit)) {
					const option = document.createElement('option');
					option.value = unit;
					option.textContent = unit;
					select.appendChild(option);
				}
			});
		}
		
		// Восстанавливаем предыдущее значение если оно есть в новых опциях
		if (currentValue && Array.from(select.options).some(opt => opt.value === currentValue)) {
			select.value = currentValue;
		} else if (isUnit && defaultValue) {
			select.value = defaultValue;
		}
		
		// Устанавливаем атрибут size для выпадающего списка если много элементов
		if (values.length > 10) {
			select.setAttribute('size', '6'); // Показывать 6 элементов с прокруткой
		} else {
			select.removeAttribute('size');
		}
		
		console.log(`Заполнен ${selectId}: ${values.length} элементов`);
	}

	// РЕЗЕРВНЫЙ МЕТОД ДЛЯ СТАНДАРТНЫХ ЗНАЧЕНИЙ
	loadDefaultCategoriesAndUnits() {
		console.log('Используются стандартные категории и единицы');
		
		const defaultCategories = [
			'Авто', 'Баня', 'Бензин', 'БытоТехника', 'Ветряк', 'Дерево', 'Инструмент', 'Коммуналка',
			'Лакокрасочные', 'Мебель', 'Посуда', 'Продукты', 'Расходники', 'Сад', 'Сантехника',
			'Собака', 'Стройматериалы', 'Текстиль', 'Химия', 'Электрика'
		];
		
		const defaultUnits = ['шт.', 'кг.', 'л.', 'м.', 'мл', 'кв.м.', 'куб.м.', 'кВт/ч'];
		
		this.populateSelect('purchase-category', defaultCategories, 'Выберите категорию');
		this.populateSelect('purchase-unit', defaultUnits, 'шт.', true);
	}

    // ОБРАБОТЧИКИ СОБЫТИЙ ФОРМЫ - ИСПРАВЛЕННАЯ ЛОГИКА РАСЧЕТОВ
	setupFormEventListeners() {
		const form = document.getElementById('purchase-form');
		const priceInput = document.getElementById('purchase-price');
		const quantityInput = document.getElementById('purchase-quantity');
		const amountInput = document.getElementById('purchase-amount');
		
		if (!form || !priceInput || !quantityInput || !amountInput) {
			console.error('Элементы формы не найдены!');
			return;
		}
		
		// УБИРАЕМ авторасчет при изменении цены или количества
		// Вместо этого добавляем кнопку для предложения расчета
		
		// Создаем кнопку для предложения расчета
		this.createCalculateButton();
		
		// Отправка формы
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			this.savePurchase();
		});
		
		// Установка сегодняшней даты по умолчанию
		const dateInput = document.getElementById('purchase-date');
		if (dateInput) {
			dateInput.valueAsDate = new Date();
		}
	}

	// СОЗДАНИЕ КНОПКИ ДЛЯ ПРЕДЛОЖЕНИЯ РАСЧЕТА
	createCalculateButton() {
		const amountGroup = document.getElementById('purchase-amount').closest('.form-group');
		if (!amountGroup) return;
		
		// Создаем контейнер для кнопки
		const buttonContainer = document.createElement('div');
		buttonContainer.style.marginTop = '5px';
		buttonContainer.style.display = 'flex';
		buttonContainer.style.gap = '5px';
		buttonContainer.style.alignItems = 'center';
		
		// Создаем кнопку расчета
		const calcButton = document.createElement('button');
		calcButton.type = 'button';
		calcButton.textContent = '📐 Рассчитать';
		calcButton.className = 'btn-secondary';
		calcButton.style.padding = '4px 8px';
		calcButton.style.fontSize = '11px';
		calcButton.title = 'Предложить расчет на основе цены и количества';
		
		// Создаем подсказку
		const hint = document.createElement('span');
		hint.textContent = '(цена × количество)';
		hint.style.fontSize = '10px';
		hint.style.color = '#6c757d';
		hint.style.fontStyle = 'italic';
		
		// Добавляем обработчик для кнопки расчета
		calcButton.addEventListener('click', () => {
			this.suggestCalculation();
		});
		
		buttonContainer.appendChild(calcButton);
		buttonContainer.appendChild(hint);
		amountGroup.appendChild(buttonContainer);
	}

	// ПРЕДЛОЖЕНИЕ РАСЧЕТА (не автоматическое)
	suggestCalculation() {
		const price = parseFloat(document.getElementById('purchase-price').value) || 0;
		const quantity = parseFloat(document.getElementById('purchase-quantity').value) || 0;
		const currentAmount = parseFloat(document.getElementById('purchase-amount').value) || 0;
		
		if (price > 0 && quantity > 0) {
			const suggestedAmount = price * quantity;
			
			// Предлагаем расчет только если поле пустое или пользователь согласится
			if (currentAmount === 0) {
				document.getElementById('purchase-amount').value = suggestedAmount.toFixed(2);
				this.showNotification(`Предложена стоимость: ${suggestedAmount.toFixed(2)} ₽`, 'info');
			} else {
				// Если уже есть значение, спрашиваем подтверждение
				const confirmUpdate = confirm(
					`Текущая стоимость: ${currentAmount.toFixed(2)} ₽\n` +
					`Предлагаемая: ${suggestedAmount.toFixed(2)} ₽\n\n` +
					`Заменить текущее значение?`
				);
				
				if (confirmUpdate) {
					document.getElementById('purchase-amount').value = suggestedAmount.toFixed(2);
				}
			}
		} else {
			this.showNotification('Укажите цену и количество для расчета', 'error');
		}
	}

    // УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ
    setupModalHandlers() {
        const modal = document.getElementById('purchase-modal');
        const closeBtn = document.querySelector('.close-modal');
        const cancelBtn = document.getElementById('cancel-purchase');
        
        if (!modal || !closeBtn || !cancelBtn) {
            console.error('Элементы модального окна не найдены!');
            return;
        }
        
        const closeModal = () => {
            modal.style.display = 'none';
            this.resetForm();
        };
        
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // Закрытие по клику вне модального окна
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // ПОКАЗАТЬ ФОРМУ (ДОБАВИТЬ ИЛИ РЕДАКТИРОВАТЬ)
    showPurchaseForm(purchaseData = null) {
        const modal = document.getElementById('purchase-modal');
        const title = document.getElementById('purchase-modal-title');
        
        if (!modal || !title) {
            console.error('Модальное окно не найдено!');
            return;
        }
        
        if (purchaseData) {
            // Режим редактирования
            title.textContent = '✏️ Редактировать покупку';
            this.fillFormWithData(purchaseData);
        } else {
            // Режим добавления
            title.textContent = '📝 Новая покупка';
            this.resetForm();
        }
        
        modal.style.display = 'block';
    }

    // ОБНОВИТЕ метод fillFormWithData для корректного заполнения категорий:
	fillFormWithData(purchaseData) {
		document.getElementById('purchase-id').value = purchaseData.id || '';
		document.getElementById('purchase-date').value = purchaseData.date || '';
		document.getElementById('purchase-store').value = purchaseData.store_id || '';
		document.getElementById('purchase-name').value = purchaseData.name || '';
		
		// Для категории - устанавливаем значение после загрузки списка
		setTimeout(() => {
			document.getElementById('purchase-category').value = purchaseData.gruppa || '';
		}, 100);
		
		document.getElementById('purchase-price').value = purchaseData.price || '';
		document.getElementById('purchase-quantity').value = purchaseData.quantity || '1';
		
		// Для единицы измерения - устанавливаем значение после загрузки списка
		setTimeout(() => {
			document.getElementById('purchase-unit').value = purchaseData.item || 'шт.';
		}, 100);
		
		// Стоимость берем напрямую из базы (ручной ввод)
		document.getElementById('purchase-amount').value = purchaseData.amount || '';
		document.getElementById('purchase-characteristics').value = purchaseData.characteristic || '';
	}

    // РАСЧЕТ СУММЫ В ФОРМЕ
    calculateFormTotal() {
        const price = parseFloat(document.getElementById('purchase-price').value) || 0;
        const quantity = parseFloat(document.getElementById('purchase-quantity').value) || 0;
        const total = price * quantity;
        document.getElementById('total-amount').textContent = total.toFixed(2);
    }

    // СБРОС ФОРМЫ - ОБНОВЛЕННАЯ ВЕРСИЯ
	resetForm() {
		document.getElementById('purchase-form').reset();
		document.getElementById('purchase-id').value = '';
		document.getElementById('purchase-date').valueAsDate = new Date();
		document.getElementById('purchase-quantity').value = '1';
		document.getElementById('purchase-unit').value = 'шт.';
		
		// Очистка ошибок
		document.querySelectorAll('.error-message').forEach(el => {
			el.textContent = '';
		});
		document.querySelectorAll('.form-group').forEach(el => {
			el.classList.remove('error');
		});
	}

    // ВАЛИДАЦИЯ ФОРМЫ
    validateForm() {
        let isValid = true;
        
        const fields = [
            { id: 'purchase-date', message: 'Укажите дату покупки' },
            { id: 'purchase-store', message: 'Выберите магазин' },
            { id: 'purchase-name', message: 'Введите название товара' },
            { id: 'purchase-price', message: 'Укажите цену товара' },
            { id: 'purchase-quantity', message: 'Укажите количество' }
        ];
        
        // Сброс предыдущих ошибок
        fields.forEach(field => {
            const inputElement = document.getElementById(field.id);
            if (!inputElement) return;
            
            const errorElement = document.getElementById(field.id.replace('purchase-', '') + '-error');
            const formGroup = inputElement.closest('.form-group');
            
            if (formGroup) formGroup.classList.remove('error');
            if (errorElement) errorElement.textContent = '';
            
            // Проверка на заполненность
            if (!inputElement.value.trim()) {
                if (formGroup) formGroup.classList.add('error');
                if (errorElement) errorElement.textContent = field.message;
                isValid = false;
            }
            
            // Дополнительная проверка для числовых полей
            if (field.id.includes('price') || field.id.includes('quantity')) {
                const value = parseFloat(inputElement.value);
                if (isNaN(value) || value <= 0) {
                    if (formGroup) formGroup.classList.add('error');
                    if (errorElement) errorElement.textContent = 'Значение должно быть больше 0';
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    // ОБНОВИТЕ метод savePurchase для использования ручного ввода стоимости:
	async savePurchase() {
		if (!this.validateForm()) {
			this.showNotification('Пожалуйста, исправьте ошибки в форме', 'error');
			return;
		}
		
		try {
			// Получаем выбранный магазин для названия
			const storeId = parseInt(document.getElementById('purchase-store').value);
			const selectedStore = this.storesCache.find(store => store.id === storeId);
			
			const formData = {
				date: document.getElementById('purchase-date').value,
				store_id: storeId,
				shop: selectedStore ? selectedStore.shop : 'Неизвестный магазин',
				name: document.getElementById('purchase-name').value,
				gruppa: document.getElementById('purchase-category').value,
				price: parseFloat(document.getElementById('purchase-price').value),
				quantity: parseFloat(document.getElementById('purchase-quantity').value),
				item: document.getElementById('purchase-unit').value,
				characteristic: document.getElementById('purchase-characteristics').value,
				amount: parseFloat(document.getElementById('purchase-amount').value) // ← Берем РУЧНОЙ ввод
			};
			
			const purchaseId = document.getElementById('purchase-id').value;
			let result;
			
			if (purchaseId) {
				// Редактирование существующей записи
				result = await supabase
					.from('shops')
					.update(formData)
					.eq('id', purchaseId);
			} else {
				// Добавление новой записи
				result = await supabase
					.from('shops')
					.insert([formData]);
			}
			
			if (result.error) throw result.error;
			
			this.showNotification(
				purchaseId ? 'Покупка обновлена!' : 'Покупка добавлена!', 
				'success'
			);
			
			// Закрываем модальное окно и обновляем таблицу
			document.getElementById('purchase-modal').style.display = 'none';
			this.refreshData();
			
		} catch (error) {
			console.error('Ошибка сохранения покупки:', error);
			this.showNotification('Ошибка при сохранении покупки: ' + error.message, 'error');
		}
	}

    // УДАЛЕНИЕ ПОКУПКИ
    async deletePurchase(purchaseId) {
        if (!confirm('Вы уверены, что хотите удалить эту покупку?')) return;
        
        try {
            const { error } = await supabase
                .from('shops')
                .delete()
                .eq('id', purchaseId);
                
            if (error) throw error;
            
            this.showNotification('Покупка удалена!', 'success');
            this.refreshData();
        } catch (error) {
            console.error('Ошибка удаления покупки:', error);
            this.showNotification('Ошибка при удалении покупки', 'error');
        }
    }

    // УВЕДОМЛЕНИЯ
    showNotification(message, type = 'info') {
        // Временная реализация
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

// Запускаем приложение когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
    window.shoppingApp = new ShoppingApp();
});
