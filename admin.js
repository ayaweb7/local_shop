// admin.js - Административная панель (работает с PHP API)
class AdminPanel {
    constructor() {
        this.citiesCache = [];
        this.currentTab = 'shops';
		
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
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${shops.map(shop => `
                    <tr>
                        <td>${shop.id}</td>
                        <td>${shop.shop}</td>
                        <td>${shop.city_name || 'Не указан'}</td>
                        <td>${shop.street}, д. ${shop.house}</td>
                        <td>${shop.phone || '-'}</td>
                        <td class="actions">
                            <button class="edit-btn" onclick="adminPanel.editShop(${shop.id})" title="Редактировать">✏️</button>
                            <button class="delete-btn" onclick="adminPanel.deleteShop(${shop.id})" title="Удалить">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.appendChild(table);
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

    async saveShop() {
		try {
			const formData = {
				shop: document.getElementById('shop-name').value.trim(),
				locality_id: parseInt(document.getElementById('shop-city').value),
				street: document.getElementById('shop-street').value.trim(),
				house: document.getElementById('shop-house').value.trim(),
				phone: document.getElementById('shop-phone').value.trim()
			};
			
			console.log('Данные формы:', formData);
			// Временно добавьте в начало saveShop()
			console.log('Проверка полей:');
			console.log('shop-name:', document.getElementById('shop-name')?.value);
			console.log('shop-city:', document.getElementById('shop-city')?.value);
			console.log('shop-street:', document.getElementById('shop-street')?.value);
			console.log('shop-house:', document.getElementById('shop-house')?.value);
			console.log('shop-phone:', document.getElementById('shop-phone')?.value);
			
			// ВАЛИДАЦИЯ
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
				// Редактирование
				console.log('Редактирование магазина ID:', shopId);
				result = await apiClient.request(`stores/${shopId}`, 'PUT', formData);
			} else {
				// Добавление
				console.log('Добавление нового магазина');
				result = await apiClient.request('stores', 'POST', formData);
			}
			
			if (result.success) {
				this.showNotification(
					shopId ? 'Магазин обновлён!' : 'Магазин добавлен!', 
					'success'
				);
				
				// Закрываем модальное окно
				document.getElementById('shop-modal').style.display = 'none';
				
				// Обновляем данные
				await this.loadShopsData();
				await this.loadCitiesCache(); // Обновляем кэш
				
			} else {
				throw new Error(result.error || 'Ошибка сохранения');
			}
			
		} catch (error) {
			console.error('Ошибка сохранения магазина:', error);
			this.showNotification('Ошибка: ' + error.message, 'error');
		}
	}

    async editShop(shopId) {
		try {
			console.log('Редактирование магазина ID:', shopId);
			
			// Загружаем все магазины
			const response = await apiClient.request('stores', 'GET');
			const shops = response.data || [];
			const shop = shops.find(s => s.id === shopId);
			
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

    // ФОРМА ГОРОДА
    showCityForm(city = null) {
        const modal = this.createModal();
        const isEdit = !!city;
        
        modal.innerHTML = `
            <div class="modal-content">
                <h3>${isEdit ? '✏️ Редактировать город' : '➕ Добавить город'}</h3>
                <form id="city-form" class="admin-form">
                    <input type="hidden" id="city-id" value="${city ? city.id : ''}">
                    
                    <div class="form-group">
                        <label for="city-name-ru">Город (русский) *</label>
                        <input type="text" id="city-name-ru" value="${city ? city.town_ru : ''}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="city-name-en">Город (английский)</label>
                        <input type="text" id="city-name-en" value="${city ? city.town_en : ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="city-code">Код *</label>
                        <input type="text" id="city-code" value="${city ? city.code : ''}" required maxlength="20">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">💾 Сохранить</button>
                        <button type="button" class="btn-secondary cancel-btn">Отмена</button>
                    </div>
                </form>
            </div>
        `;
        
        // Добавляем обработчики
        const form = modal.querySelector('#city-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCity(city);
        });
        
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    async saveCity(originalCity) {
        try {
            const formData = {
                town_ru: document.getElementById('city-name-ru').value,
                town_en: document.getElementById('city-name-en').value,
                code: document.getElementById('city-code').value
            };
            
            // Валидация
            if (!formData.town_ru || !formData.code) {
                this.showNotification('Заполните обязательные поля (отмечены *)', 'error');
                return;
            }
            
            const cityId = document.getElementById('city-id').value;
            let result;
            
            if (cityId) {
                // Редактирование
                result = await apiClient.request(`cities/${cityId}`, 'PUT', formData);
            } else {
                // Добавление
                result = await apiClient.request('cities', 'POST', formData);
            }
            
            if (result.success) {
                this.showNotification(
                    cityId ? 'Город обновлён!' : 'Город добавлен!', 
                    'success'
                );
                
                // Закрываем модальное окно
                document.querySelector('.modal-overlay')?.remove();
                
                // Обновляем данные
                await this.loadCitiesData();
                await this.loadCitiesCache(); // Обновляем кэш
                
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
            // Загружаем данные города
            const response = await apiClient.request('cities', 'GET');
            const cities = response.data || [];
            const city = cities.find(c => c.id === cityId);
            
            if (city) {
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