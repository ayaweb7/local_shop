// admin.js - Административная панель (работает с PHP API)
class AdminPanel {
    constructor() {
        this.citiesCache = [];
        this.currentTab = 'shops';
		this.categoriesCache = [];
		
		// Проверяем, что apiClient загружен
        if (!window.apiClient) {
            console.error('❌ apiClient не загружен! Проверьте подключение api.js');
            this.showNotification('Ошибка: API клиент не загружен', 'error');
            return;
        }
		
        this.init();
    }

    async init() {
        console.log('Админ-панель запущена');
		
		// Дополнительная проверка
        if (!window.apiClient) {
            this.showNotification('Ошибка: API клиент не найден. Перезагрузите страницу.', 'error');
            return;
        }
        
        try {
            // Загружаем кэш городов для выпадающих списков
            await this.loadCitiesCache();
            
            // Инициализируем интерфейс
            this.setupEventListeners();
            this.loadInitialData();
            
        } catch (error) {
            console.error('Ошибка инициализации админ-панели:', error);
            this.showNotification('Ошибка загрузки: ' + error.message, 'error');
        }
    }

    // ЗАГРУЗКА КЭША ГОРОДОВ
    async loadCitiesCache() {
        try {
            const response = await apiClient.request('cities', 'GET');
            this.citiesCache = response.data || [];
            console.log('Загружено городов:', this.citiesCache.length);
        } catch (error) {
            console.error('Ошибка загрузки городов:', error);
            this.citiesCache = [];
        }
    }

    // НАСТРОЙКА СОБЫТИЙ
    setupEventListeners() {
        // Переключение вкладок
        document.getElementById('shops-tab').addEventListener('click', () => this.switchTab('shops'));
        document.getElementById('cities-tab').addEventListener('click', () => this.switchTab('cities'));
        
        // Кнопки управления
        document.getElementById('back-to-app').addEventListener('click', () => {
            window.location.href = 'app.html';
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Выйти из приложения?')) {
                window.location.href = 'index.html';
            }
        });

        // Кнопки добавления
        document.getElementById('add-shop').addEventListener('click', () => this.showShopForm());
        document.getElementById('add-city').addEventListener('click', () => this.showCityForm());
		
		// Обработчик кнопки "Отмена" в форме магазина
		document.getElementById('cancel-shop').addEventListener('click', () => {
			document.getElementById('shop-modal').style.display = 'none';
		});
		
		// Обработчик отправки формы магазина
		document.getElementById('shop-form').addEventListener('submit', (e) => {
			e.preventDefault();
			this.saveShop();
		});
		
		// Обработчики для категорий (переключение вкладок и кнопка добавления)
		document.getElementById('categories-tab').addEventListener('click', () => this.switchTab('categories'));
		document.getElementById('add-category').addEventListener('click', () => this.showCategoryForm());
		
		// Обработчик формы категорий
		document.getElementById('category-form').addEventListener('submit', (e) => {
			e.preventDefault();
			this.saveCategory();
		});

		// Кнопка отмены в форме категорий
		document.getElementById('cancel-category').addEventListener('click', () => {
			document.getElementById('category-modal').style.display = 'none';
		});

		// Закрытие модальных окон по клику вне
		document.querySelectorAll('.modal').forEach(modal => {
			modal.addEventListener('click', (e) => {
				if (e.target === modal) {
					modal.style.display = 'none';
				}
			});
		});
    }

    // ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
    switchTab(tabName) {
        // Обновляем активные классы
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Активируем выбранную вкладку
        document.getElementById(`${tabName}-section`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        this.currentTab = tabName;
        
        // Загружаем данные для вкладки
        if (tabName === 'shops') {
            this.loadShopsData();
        } else if (tabName === 'cities') {
            this.loadCitiesData();
        } else if (tabName === 'categories') {
			this.loadCategoriesData();
}
    }

    // ЗАГРУЗКА НАЧАЛЬНЫХ ДАННЫХ
    loadInitialData() {
        if (this.currentTab === 'shops') {
            this.loadShopsData();
        } else {
            this.loadCitiesData();
        }
    }

    // === МАГАЗИНЫ ===

    async loadShopsData() {
        try {
            console.log('Загрузка магазинов...');
            
            const response = await apiClient.request('stores', 'GET');
            const shops = response.data || [];
            
            console.log('Загружено магазинов:', shops.length);
            this.displayShopsTable(shops);
            
        } catch (error) {
            console.error('Ошибка загрузки магазинов:', error);
            this.showNotification('Ошибка загрузки магазинов: ' + error.message, 'error');
        }
    }

    displayShopsTable(shops) {
		
		// Сохраняем данные для экспорта
		window.shopsData = shops;
	
        const container = document.getElementById('shops-table');
        if (!container) return;
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        if (shops.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет магазинов. Добавьте первый магазин.</p>';
            return;
        }
        
        // Создаём таблицу
        const table = document.createElement('table');
        table.className = 'admin-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Город</th>
                    <th>Адрес</th>
                    <th>Телефон</th>
					<th>Дата добавления</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${shops.map(shop => {
					// Форматируем дату для отображения
					const dateStr = shop.date_store ? new Date(shop.date_store).toLocaleDateString('ru-RU') : '-';
                
					return `
						<tr>
							<td>${shop.id}</td>
							<td>${shop.shop}</td>
							<td>${shop.city_name || 'Не указан'}</td>
							<td>${shop.street}, д. ${shop.house}</td>
							<td>${shop.phone || '-'}</td>
							<td>${dateStr}</td>
							<td class="actions">
								<button class="edit-btn" onclick="adminPanel.editShop(${shop.id})" title="Редактировать">✏️</button>
								<button class="delete-btn" onclick="adminPanel.deleteShop(${shop.id})" title="Удалить">🗑️</button>
							</td>
						</tr>
					`;
                }).join('')}
            </tbody>
        `;
        
        container.appendChild(table);
    }
	
	// Поиск магазина по его ID
	async findShopById(shopId) {
		const response = await apiClient.request('stores', 'GET');
		const shops = response.data || [];
		return shops.find(s => s.id === shopId);
	}

    // ФОРМА МАГАЗИНА
    // ПОКАЗАТЬ ФОРМУ МАГАЗИНА
	showShopForm(shop = null) {
		const modal = document.getElementById('shop-modal');
		const title = document.getElementById('shop-modal-title');
		const form = document.getElementById('shop-form');
		
		if (!modal || !title || !form) {
			console.error('Элементы формы магазина не найдены');
			return;
		}
		
		const isEdit = !!shop;
		
		// Обновляем заголовок
		title.textContent = isEdit ? '✏️ Редактировать магазин' : '➕ Добавить магазин';
		
		// Заполняем поля
		document.getElementById('shop-id').value = shop ? shop.id : '';
		document.getElementById('shop-name').value = shop ? shop.shop : '';
		document.getElementById('shop-street').value = shop ? shop.street : '';
		document.getElementById('shop-house').value = shop ? shop.house : '';
		document.getElementById('shop-phone').value = shop ? shop.phone || '' : '';
		
		// ДОБАВЛЯЕМ: заполнение поля даты
		const dateField = document.getElementById('shop-date');
		if (dateField) {
			if (shop && shop.date_store) {
				// Если редактирование и дата есть - подставляем её
				dateField.value = shop.date_store;
			} else {
				// Если добавление нового - устанавливаем сегодняшнюю дату
				const today = new Date().toISOString().split('T')[0];
				dateField.value = today;
			}
		}
		
		// Заполняем выпадающий список городов
		const citySelect = document.getElementById('shop-city');
		citySelect.innerHTML = '<option value="">Выберите город</option>';
		
		this.citiesCache.forEach(city => {
			const option = document.createElement('option');
			option.value = city.id;
			option.textContent = city.town_ru;
			
			// Выбираем город магазина при редактировании
			if (shop && shop.locality_id === city.id) {
				option.selected = true;
			}
			
			citySelect.appendChild(option);
		});
		
		// Если редактируем и город не выбран, выбираем первый
		if (shop && shop.locality_id && !citySelect.value) {
			citySelect.value = shop.locality_id;
		}
		
		// Показываем модальное окно
		modal.style.display = 'block';
		
		// Сохраняем текущий магазин для использования в saveShop
		this.currentShop = shop;
	}

	// УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ (добавьте в setupEventListeners)
	setupModalHandlers() {
		const modal = document.getElementById('shop-modal');
		const closeBtn = document.querySelector('.close-modal');
		
		if (!modal) return;
		
		// Закрытие по клику вне модального окна
		window.addEventListener('click', (e) => {
			if (e.target === modal) {
				modal.style.display = 'none';
			}
		});
	}

    // Сохранение магазина
	async saveShop() {
		try {
			const formData = {
				shop: document.getElementById('shop-name').value.trim(),
				locality_id: parseInt(document.getElementById('shop-city').value),
				street: document.getElementById('shop-street').value.trim(),
				house: document.getElementById('shop-house').value.trim(),
				phone: document.getElementById('shop-phone').value.trim(),
				// ДОБАВЛЯЕМ поле даты
				date_store: document.getElementById('shop-date').value
			};
			
			// Валидация
			let isValid = true;
			const errors = [];
			
			if (!formData.shop) {
				errors.push('Название магазина');
				document.getElementById('shop-name').style.borderColor = 'red';
				isValid = false;
			} else {
				document.getElementById('shop-name').style.borderColor = '';
			}
			
			if (!formData.locality_id || isNaN(formData.locality_id)) {
				errors.push('Город');
				document.getElementById('shop-city').style.borderColor = 'red';
				isValid = false;
			} else {
				document.getElementById('shop-city').style.borderColor = '';
			}
			
			if (!formData.street) {
				errors.push('Улица');
				document.getElementById('shop-street').style.borderColor = 'red';
				isValid = false;
			} else {
				document.getElementById('shop-street').style.borderColor = '';
			}
			
			if (!formData.house) {
				errors.push('Дом');
				document.getElementById('shop-house').style.borderColor = 'red';
				isValid = false;
			} else {
				document.getElementById('shop-house').style.borderColor = '';
			}
			
			if (!isValid) {
				this.showNotification(`Заполните обязательные поля: ${errors.join(', ')}`, 'error');
				return;
			}
			
			const shopId = document.getElementById('shop-id').value;
			let result;
			
			if (shopId) {
				// Редактирование - используем POST с id в теле
				result = await apiClient.request(`stores`, 'POST', {
					...formData,
					id: parseInt(shopId)
				});
			} else {
				// Добавление
				result = await apiClient.request('stores', 'POST', formData);
			}
			
			if (result && result.success) {
				this.showNotification(shopId ? 'Магазин обновлён!' : 'Магазин добавлен!', 'success');
				document.getElementById('shop-modal').style.display = 'none';
				await this.loadShopsData();
				
				// Обновляем глобальные данные для экспорта
				const shopsResponse = await apiClient.request('stores', 'GET');
				window.shopsData = shopsResponse.data || [];
				
			} else {
				throw new Error(result?.error || 'Ошибка сохранения');
			}
		} catch (error) {
			console.error('Ошибка сохранения магазина:', error);
			this.showNotification('Ошибка: ' + error.message, 'error');
		}
	}

    // Редактирование магазина
	async editShop(shopId) {
		try {
			console.log('Редактирование магазина ID:', shopId);
			const shop = await this.findShopById(shopId);
			
			if (shop) {
				console.log('Найден магазин:', shop);
				this.showShopForm(shop);
			} else {
				throw new Error('Магазин не найден');
			}
		} catch (error) {
			console.error('Ошибка загрузки магазина:', error);
			this.showNotification('Ошибка: ' + error.message, 'error');
		}
	}

	async deleteShop(shopId) {
		if (!confirm('Удалить этот магазин? Это действие нельзя отменить.')) {
			return;
		}
		
		try {
			console.log('Удаление магазина ID:', shopId);
			const result = await apiClient.request(`stores/${shopId}`, 'DELETE');
			
			if (result.success) {
				this.showNotification('Магазин удалён', 'success');
				await this.loadShopsData();
			} else {
				throw new Error(result.error || 'Ошибка удаления');
			}
			
		} catch (error) {
			console.error('Ошибка удаления магазина:', error);
			this.showNotification('Ошибка: ' + error.message, 'error');
		}
	}

    // === ГОРОДА ===

    async loadCitiesData() {
        try {
            console.log('Загрузка городов...');
            
            const response = await apiClient.request('cities', 'GET');
            const cities = response.data || [];
            
            console.log('Загружено городов:', cities.length);
            this.displayCitiesTable(cities);
            
        } catch (error) {
            console.error('Ошибка загрузки городов:', error);
            this.showNotification('Ошибка загрузки городов: ' + error.message, 'error');
        }
    }

    displayCitiesTable(cities) {
		
		// Сохраняем данные для экспорта
		window.citiesData = cities;
		
        const container = document.getElementById('cities-table');
        if (!container) return;
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        if (cities.length === 0) {
            container.innerHTML = '<p class="empty-message">Нет городов. Добавьте первый город.</p>';
            return;
        }
        
        // Создаём таблицу
        const table = document.createElement('table');
        table.className = 'admin-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Город (RU)</th>
                    <th>Город (EN)</th>
                    <th>Код</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${cities.map(city => `
                    <tr>
                        <td>${city.id}</td>
                        <td>${city.town_ru}</td>
                        <td>${city.town_en || '-'}</td>
                        <td>${city.code}</td>
                        <td class="actions">
                            <button class="edit-btn" onclick="adminPanel.editCity(${city.id})" title="Редактировать">✏️</button>
                            <button class="delete-btn" onclick="adminPanel.deleteCity(${city.id})" title="Удалить">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.appendChild(table);
    }
	
	// Поиск города по его ID
	async findCityById(cityId) {
		const response = await apiClient.request('cities', 'GET');
		const cities = response.data || [];
		return cities.find(c => c.id === cityId);
	}

    // ФОРМА ГОРОДА
    showCityForm(city = null) {
		// Проверяем, существует ли уже модальное окно для города
		let modal = document.getElementById('city-modal');
		
		if (!modal) {
			// Создаем модальное окно, если его нет
			modal = document.createElement('div');
			modal.id = 'city-modal';
			modal.className = 'modal';
			modal.innerHTML = `
				<div class="modal-content">
					<span class="close-modal">&times;</span>
					<h3 id="city-modal-title">Добавление города</h3>
					<form id="city-form" class="admin-form">
						<input type="hidden" id="city-id">
						
						<div class="form-group">
							<label for="city-name-ru">Город (русский) *</label>
							<input type="text" id="city-name-ru" required>
						</div>
						
						<div class="form-group">
							<label for="city-name-en">Город (английский)</label>
							<input type="text" id="city-name-en">
						</div>
						
						<div class="form-group">
							<label for="city-code">Код *</label>
							<input type="text" id="city-code" required maxlength="20">
						</div>
						
						<div class="form-actions">
							<button type="submit" class="btn-primary">💾 Сохранить</button>
							<button type="button" id="cancel-city" class="btn-secondary">Отмена</button>
						</div>
					</form>
				</div>
			`;
			document.body.appendChild(modal);
			
			// Добавляем обработчики
			modal.querySelector('#city-form').addEventListener('submit', (e) => {
				e.preventDefault();
				this.saveCity();
			});
			
			modal.querySelector('#cancel-city').addEventListener('click', () => {
				modal.style.display = 'none';
			});
			
			modal.querySelector('.close-modal').addEventListener('click', () => {
				modal.style.display = 'none';
			});
			
			window.addEventListener('click', (e) => {
				if (e.target === modal) {
					modal.style.display = 'none';
				}
			});
		}
		
		const title = document.getElementById('city-modal-title');
		const idField = document.getElementById('city-id');
		const nameRuField = document.getElementById('city-name-ru');
		const nameEnField = document.getElementById('city-name-en');
		const codeField = document.getElementById('city-code');
		
		const isEdit = !!city;
		title.textContent = isEdit ? '✏️ Редактировать город' : '➕ Добавить город';
		
		idField.value = city ? city.id : '';
		nameRuField.value = city ? city.town_ru : '';
		nameEnField.value = city ? city.town_en || '' : '';
		codeField.value = city ? city.code : '';
		
		modal.style.display = 'block';
	}

    async saveCity() {
		try {
			const formData = {
				town_ru: document.getElementById('city-name-ru').value.trim(),
				town_en: document.getElementById('city-name-en').value.trim(),
				code: document.getElementById('city-code').value.trim()
			};
			
			// Валидация
			if (!formData.town_ru || !formData.code) {
				this.showNotification('Заполните обязательные поля (отмечены *)', 'error');
				return;
			}
			
			const cityId = document.getElementById('city-id').value;
			let result;
			
			if (cityId) {
				// Редактирование - используем POST с id в теле
				result = await apiClient.request('cities', 'POST', {
					...formData,
					id: parseInt(cityId)
				});
			} else {
				// Добавление
				result = await apiClient.request('cities', 'POST', formData);
			}
			
			if (result && result.success) {
				this.showNotification(
					cityId ? 'Город обновлён!' : 'Город добавлен!', 
					'success'
				);
				
				document.getElementById('city-modal').style.display = 'none';
				
				await this.loadCitiesData();
			} else {
				throw new Error(result.error || 'Ошибка сохранения');
			}
			
		} catch (error) {
			console.error('Ошибка сохранения города:', error);
			this.showNotification('Ошибка: ' + error.message, 'error');
		}
	}

    async editCity(cityId) {
        try {
            console.log('Редактирование города ID:', cityId);
			const city = await this.findCityById(cityId);
            
            if (city) {
				console.log('Найден город:', city);
                this.showCityForm(city);
            } else {
                throw new Error('Город не найден');
            }
            
        } catch (error) {
            console.error('Ошибка загрузки города:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }

    async deleteCity(cityId) {
        if (!confirm('Удалить этот город? Это действие нельзя отменить.')) {
            return;
        }
        
        try {
            const result = await apiClient.request(`cities/${cityId}`, 'DELETE');
            
            if (result.success) {
                this.showNotification('Город удалён', 'success');
                await this.loadCitiesData();
                await this.loadCitiesCache(); // Обновляем кэш
            } else {
                throw new Error(result.error || 'Ошибка удаления');
            }
            
        } catch (error) {
            console.error('Ошибка удаления города:', error);
            this.showNotification('Ошибка: ' + error.message, 'error');
        }
    }
	
	// ===== МЕТОДЫ ДЛЯ КАТЕГОРИЙ =====

	async loadCategoriesData() {
		try {
			console.log('Загрузка категорий...');
			
			const response = await apiClient.request('categories', 'GET');
			const categories = response.data || [];
			
			console.log('Загружено категорий:', categories.length);
			this.displayCategoriesTable(categories);
			this.categoriesCache = categories; // Сохраняем в кэш
			
		} catch (error) {
			console.error('Ошибка загрузки категорий:', error);
			this.showNotification('Ошибка загрузки категорий: ' + error.message, 'error');
		}
	}

	displayCategoriesTable(categories) {
		
		// Сохраняем данные для экспорта
		window.categoriesData = categories;
		
		const container = document.getElementById('categories-table');
		if (!container) return;
		
		container.innerHTML = '';
		
		if (categories.length === 0) {
			container.innerHTML = '<p class="empty-message">Нет категорий. Добавьте первую категорию.</p>';
			return;
		}
		
		const table = document.createElement('table');
		table.className = 'admin-table';
		table.innerHTML = `
			<thead>
				<tr>
					<th width="50">Иконка</th>
					<th>Название</th>
					<th>Описание</th>
					<th width="80">Цвет</th>
					<th width="80">Порядок</th>
					<th width="100">Действия</th>
				</tr>
			</thead>
			<tbody>
				${categories.map(category => `
					<tr>
						<td style="font-size: 20px; text-align: center">${category.icon}</td>
						<td><strong>${category.name}</strong></td>
						<td>${category.description || '-'}</td>
						<td><div style="width: 20px; height: 20px; background: ${category.color}; border-radius: 3px;"></div></td>
						<td>${category.sort_order}</td>
						<td class="actions">
							<button class="edit-btn" onclick="adminPanel.editCategory(${category.id})" title="Редактировать">✏️</button>
							<button class="delete-btn" onclick="adminPanel.deleteCategory(${category.id})" title="Удалить">🗑️</button>
						</td>
					</tr>
				`).join('')}
			</tbody>
		`;
		
		container.appendChild(table);
	}
	
	// Поиск категории по его ID
	async findCategoryById(categoryId) {
		const response = await apiClient.request('categories', 'GET');
		const categories = response.data || [];
		return categories.find(c => c.id === categoryId);
	}

	// ФОРМА КАТЕГОРИИ
	showCategoryForm(category = null) {
		const modal = document.getElementById('category-modal');
		const title = document.getElementById('category-modal-title');
		const form = document.getElementById('category-form');
		
		if (!modal || !title || !form) return;
		
		const isEdit = !!category;
		title.textContent = isEdit ? '✏️ Редактировать категорию' : '➕ Добавить категорию';
		
		// Заполняем поля
		document.getElementById('category-id').value = category ? category.id : '';
		document.getElementById('category-name').value = category ? category.name : '';
		document.getElementById('category-icon').value = category ? category.icon : '📦';
		document.getElementById('category-color').value = category ? category.color : '#007bff';
		document.getElementById('category-description').value = category ? category.description || '' : '';
		document.getElementById('category-order').value = category ? category.sort_order : 100;
		
		modal.style.display = 'block';
		this.currentCategory = category;
	}

	async saveCategory() {
		try {
			const formData = {
				name: document.getElementById('category-name').value.trim(),
				icon: document.getElementById('category-icon').value.trim(),
				color: document.getElementById('category-color').value,
				description: document.getElementById('category-description').value.trim(),
				sort_order: parseInt(document.getElementById('category-order').value)
			};
			
			// Валидация
			if (!formData.name) {
				this.showNotification('Название категории обязательно', 'error');
				return;
			}
			
			const categoryId = document.getElementById('category-id').value;
			let result;
			
			if (categoryId) {
				// Редактирование - используем POST с id в теле
				result = await apiClient.request(`categories`, 'POST', {
					...formData,
					id: parseInt(categoryId)
				});
			} else {
				// Добавление
				result = await apiClient.request('categories', 'POST', formData);
			}
			
			if (result && result.success) {
				this.showNotification(
					categoryId ? 'Категория обновлена!' : 'Категория добавлена!', 
					'success'
				);
				
				document.getElementById('category-modal').style.display = 'none';
				await this.loadCategoriesData();
			} else {
				throw new Error(result?.error || 'Ошибка сохранения');
			}
			
		} catch (error) {
			console.error('Ошибка сохранения категории:', error);
			this.showNotification('Ошибка: ' + error.message, 'error');
		}
	}

	async editCategory(categoryId) {
		try {
			console.log('Редактирование категории ID:', categoryId);
			const category = await this.findCategoryById(categoryId);
			
			if (category) {
				console.log('Найдена категория:', category);
				this.showCategoryForm(category);
			} else {
				throw new Error('Категория не найдена');
			}
			
		} catch (error) {
			console.error('Ошибка загрузки категории:', error);
			this.showNotification('Ошибка: ' + error.message, 'error');
		}
	}

	async deleteCategory(categoryId) {
		if (!confirm('Удалить эту категорию?')) return;
		
		try {
			const result = await apiClient.request(`categories/${categoryId}`, 'DELETE');
			
			if (result.success) {
				this.showNotification('Категория удалена', 'success');
				await this.loadCategoriesData();
			} else {
				throw new Error(result.error || 'Ошибка удаления');
			}
			
		} catch (error) {
			console.error('Ошибка удаления категории:', error);
			this.showNotification('Ошибка: ' + error.message, 'error');
		}
	}

    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    createModal() {
        // Удаляем старые модальные окна
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        
        // Создаём новое
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        document.body.appendChild(overlay);
        return overlay;
    }

    showNotification(message, type = 'info') {
        console.log(`[${type}] ${message}`);
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

// ЗАПУСК АДМИН-ПАНЕЛИ
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});