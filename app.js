// app.js - ПОЛНАЯ ВЕРСИЯ С Tabulator и API
class ShoppingApp {
    constructor() {
        this.storesCache = [];
        this.categoriesCache = [];
        this.unitsCache = [];
        this.init();
    }

    async init() {
        console.log('ShoppingApp запущен');
        
        try {
            // Загружаем кэши
            await this.loadStoresCache();
            await this.loadCategoriesAndUnitsCache();
            
            // Инициализируем интерфейс
            this.loadPurchasesData();
            this.setupEventListeners();
            this.initializePurchaseForm();
            
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

    // ЗАГРУЗКА КЭША КАТЕГОРИЙ И ЕДИНИЦ
    async loadCategoriesAndUnitsCache() {
        try {
            const purchases = await apiClient.getPurchases();
            
            // Категории
            this.categoriesCache = [...new Set(purchases
                .map(p => p.gruppa)
                .filter(Boolean)
            )].sort();
            
            // Единицы измерения
            this.unitsCache = [...new Set(purchases
                .map(p => p.item)
                .filter(Boolean)
            )].sort();
            
            console.log('Кэшировано категорий:', this.categoriesCache.length);
            console.log('Кэшировано единиц:', this.unitsCache.length);
            
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
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
				{ 
                    title: 'Категория', 
                    field: 'gruppa',
                    width: 120,
                    headerFilter: 'input'
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
            option.textContent = `${store.shop} (${store.address})`;
            select.appendChild(option);
        });
    }

    loadCategoriesIntoForm() {
        const select = document.getElementById('purchase-category');
        if (!select) return;
        
        select.innerHTML = '<option value="">Выберите категорию</option>';
        
        this.categoriesCache.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
        
        // Если категорий мало, добавляем стандартные
        if (this.categoriesCache.length < 5) {
            const defaultCats = ['Продукты', 'Химия', 'Бытовая техника', 'Одежда'];
            defaultCats.forEach(cat => {
                if (!this.categoriesCache.includes(cat)) {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    select.appendChild(option);
                }
            });
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
        document.getElementById('purchase-category').value = purchase.gruppa || '';
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
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }
        
        try {
            // В savePurchase() перед отправкой
			const formData = {
				date: document.getElementById('purchase-date').value,
				store_id: parseInt(document.getElementById('purchase-store').value),
				name: document.getElementById('purchase-name').value,
				gruppa: document.getElementById('purchase-category').value,
				price: parseFloat(document.getElementById('purchase-price').value),
				quantity: parseFloat(document.getElementById('purchase-quantity').value), // ← float
				item: document.getElementById('purchase-unit').value,
				characteristic: document.getElementById('purchase-characteristics').value,
				amount: parseFloat(document.getElementById('purchase-amount').value) // ← float
			};
            
            const purchaseId = document.getElementById('purchase-id').value;
            let result;
            
            if (purchaseId) {
                // Редактирование
                result = await apiClient.updatePurchase(purchaseId, formData);
            } else {
                // Добавление
                result = await apiClient.addPurchase(formData);
            }
            
            if (result.success) {
                this.showNotification(
                    purchaseId ? 'Покупка обновлена!' : 'Покупка добавлена!', 
                    'success'
                );
                
                // Закрываем форму и обновляем таблицу
                document.getElementById('purchase-modal').style.display = 'none';
                await this.refreshData();
                
            } else {
                throw new Error(result.error || 'Ошибка сохранения');
            }
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
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