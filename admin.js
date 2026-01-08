// admin.js - Административная панель
class AdminPanel {
    constructor() {
        this.citiesCache = null;
        this.init();
    }

    async init() {
        // Проверка аутентификации
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            window.location.href = 'index.html';
            return;
        }

        console.log('Админ-панель для пользователя:', session.user.email);
        
        // Сначала загружаем кэш городов
        await this.loadCitiesCache();
        
        this.initializeAdmin();
        this.setupEventListeners();
    }

    // ЗАГРУЗКА КЭША ГОРОДОВ
    async loadCitiesCache() {
        try {
            const { data, error } = await supabase
                .from('locality')
                .select('id, town_ru')
                .order('town_ru');
            
            if (error) throw error;
            
            this.citiesCache = data || [];
            console.log('Загружено городов в кэш:', this.citiesCache.length);
        } catch (error) {
            console.error('Ошибка загрузки кэша городов:', error);
        }
    }

    initializeAdmin() {
        this.initializeShopsTable();
        this.initializeCitiesTable();
    }

    // ТАБЛИЦА МАГАЗИНОВ - ИСПРАВЛЕННАЯ
    initializeShopsTable() {
        this.shopsTable = new Tabulator("#shops-table", {
            layout: "fitColumns",
            pagination: "local",
            paginationSize: 10,
            paginationSizeSelector: [5, 10, 20, 50],
            columns: [
                { 
                    title: "ID", 
                    field: "id", 
                    width: 80,
                    sorter: "number"
                },
                { 
                    title: "Название", 
                    field: "shop", 
                    editor: "input",
                    headerFilter: "input",
                    validator: "required"
                },
                { 
                    title: "Город", 
                    field: "locality_id",
                    editor: "select",
                    editorParams: {
                        values: this.getCitiesForDropdown(),
                        allowEmpty: false
                    },
                    formatter: (cell) => {
                        const cityId = cell.getValue();
                        const city = this.citiesCache.find(c => c.id === cityId);
                        return city ? city.town_ru : 'Не указан';
                    },
                    headerFilter: "select",
                    headerFilterParams: {
                        values: this.getCitiesForDropdown()
                    }
                },
                { 
                    title: "Улица", 
                    field: "street", 
                    editor: "input" 
                },
                { 
                    title: "Дом", 
                    field: "house", 
                    editor: "input",
                    width: 100
                },
                { 
                    title: "Телефон", 
                    field: "phone", 
                    editor: "input" 
                },
                { 
                    title: "Действия", 
                    formatter: this.actionsFormatter, 
                    cellClick: (e, cell) => {
                        const data = cell.getRow().getData();
                        if (e.target.classList.contains('edit-btn')) {
                            this.editShop(data);
                        } else if (e.target.classList.contains('delete-btn')) {
                            this.deleteShop(data.id);
                        }
                    },
                    width: 120,
                    headerSort: false
                }
            ],
            // Сохранение данных при редактировании
            cellEdited: (cell) => {
                this.saveShopEdit(cell.getRow().getData());
            }
        });

        this.loadShopsData();
    }

    // ЗАГРУЗКА ДАННЫХ МАГАЗИНОВ С JOIN
    async loadShopsData() {
        try {
            const { data, error } = await supabase
                .from('stores')
                .select(`
                    *,
                    locality:locality_id (town_ru, town_en, code)
                `)
                .order('id', { ascending: true });

            if (error) throw error;
            
            // Преобразуем данные для отображения
            const formattedData = (data || []).map(shop => ({
                ...shop,
                city_name: shop.locality?.town_ru || 'Не указан'
            }));
            
            this.shopsTable.setData(formattedData);
            console.log('Загружено магазинов:', formattedData.length);
        } catch (error) {
            console.error('Ошибка загрузки магазинов:', error);
            this.showNotification('Ошибка загрузки магазинов', 'error');
        }
    }

    // СОХРАНЕНИЕ ИЗМЕНЕНИЙ МАГАЗИНА
    async saveShopEdit(shopData) {
        try {
            // Подготавливаем данные для сохранения (убираем лишние поля)
            const { locality, city_name, ...cleanData } = shopData;
            
            const { error } = await supabase
                .from('stores')
                .update(cleanData)
                .eq('id', shopData.id);

            if (error) throw error;

            this.showNotification('Изменения сохранены', 'success');
        } catch (error) {
            console.error('Ошибка сохранения магазина:', error);
            this.showNotification('Ошибка сохранения', 'error');
            // Перезагружаем данные чтобы откатить изменения
            this.loadShopsData();
        }
    }

    // ФОРМАТТЕР КНОПОК ДЕЙСТВИЙ
    actionsFormatter(cell) {
        return `
            <button class="edit-btn" title="Редактировать">✏️</button>
            <button class="delete-btn" title="Удалить">🗑️</button>
        `;
    }

    // РЕДАКТИРОВАНИЕ МАГАЗИНА
    editShop(shopData) {
        console.log('Редактирование магазина:', shopData);
        this.showNotification(`Редактирование: ${shopData.shop}`, 'info');
    }

    // УДАЛЕНИЕ МАГАЗИНА
    async deleteShop(shopId) {
        if (!confirm('Вы уверены, что хотите удалить этот магазин?')) return;

        try {
            const { error } = await supabase
                .from('stores')
                .delete()
                .eq('id', shopId);

            if (error) throw error;

            this.showNotification('Магазин успешно удален', 'success');
            this.loadShopsData();
        } catch (error) {
            console.error('Ошибка удаления магазина:', error);
            this.showNotification('Ошибка удаления магазина', 'error');
        }
    }

    // ПОЛУЧЕНИЕ ГОРОДОВ ДЛЯ ВЫПАДАЮЩЕГО СПИСКА
    getCitiesForDropdown() {
        if (!this.citiesCache) return {};
        
        return this.citiesCache.reduce((acc, city) => {
            acc[city.id] = city.town_ru;
            return acc;
        }, {});
    }

    // ТАБЛИЦА ГОРОДОВ
    initializeCitiesTable() {
        this.citiesTable = new Tabulator("#cities-table", {
            layout: "fitColumns",
            pagination: "local",
            paginationSize: 10,
            columns: [
                { title: "ID", field: "id", width: 80 },
                { 
                    title: "Город (RU)", 
                    field: "town_ru", 
                    editor: "input",
                    headerFilter: "input"
                },
                { 
                    title: "Город (EN)", 
                    field: "town_en", 
                    editor: "input",
                    headerFilter: "input" 
                },
                { 
                    title: "Код", 
                    field: "code", 
                    editor: "input", 
                    width: 100 
                },
                { 
                    title: "Действия", 
                    formatter: this.actionsFormatter, 
                    cellClick: (e, cell) => {
                        const data = cell.getRow().getData();
                        if (e.target.classList.contains('delete-btn')) {
                            this.deleteCity(data.id);
                        }
                    },
                    width: 80,
                    headerSort: false
                }
            ],
            cellEdited: (cell) => {
                this.saveCityEdit(cell.getRow().getData());
            }
        });

        this.loadCitiesData();
    }

    // ОСТАЛЬНЫЕ МЕТОДЫ остаются без изменений...
    // (loadCitiesData, deleteCity, setupEventListeners, switchTab, addNewShop, addNewCity, showNotification)
    
    async saveCityEdit(cityData) {
        try {
            const { error } = await supabase
                .from('locality')
                .update(cityData)
                .eq('id', cityData.id);

            if (error) throw error;

            this.showNotification('Город сохранен', 'success');
            // Обновляем кэш
            await this.loadCitiesCache();
        } catch (error) {
            console.error('Ошибка сохранения города:', error);
            this.showNotification('Ошибка сохранения города', 'error');
            this.loadCitiesData();
        }
    }

    async loadCitiesData() {
        try {
            const { data, error } = await supabase
                .from('locality')
                .select('*')
                .order('town_ru', { ascending: true });

            if (error) throw error;
            
            this.citiesTable.setData(data || []);
        } catch (error) {
            console.error('Ошибка загрузки городов:', error);
            this.showNotification('Ошибка загрузки городов', 'error');
        }
    }

    async deleteCity(cityId) {
        if (!confirm('Вы уверены, что хотите удалить этот город?')) return;

        try {
            const { error } = await supabase
                .from('locality')
                .delete()
                .eq('id', cityId);

            if (error) throw error;

            this.showNotification('Город успешно удален', 'success');
            this.loadCitiesData();
            // Обновляем кэш
            await this.loadCitiesCache();
        } catch (error) {
            console.error('Ошибка удаления города:', error);
            this.showNotification('Ошибка удаления города', 'error');
        }
    }

    // НАСТРОЙКА СОБЫТИЙ
    setupEventListeners() {
        // Навигация по вкладкам
        document.getElementById('shops-tab').addEventListener('click', () => this.switchTab('shops'));
        document.getElementById('cities-tab').addEventListener('click', () => this.switchTab('cities'));
        
        // Кнопки управления
        document.getElementById('back-to-app').addEventListener('click', () => {
            window.location.href = 'app.html';
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            window.authManager.signOut();
        });

        // Кнопки добавления
        document.getElementById('add-shop').addEventListener('click', () => this.addNewShop());
        document.getElementById('add-city').addEventListener('click', () => this.addNewCity());
    }

    // ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`${tabName}-section`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    // ДОБАВЛЕНИЕ НОВОГО МАГАЗИНА
    addNewShop() {
        this.shopsTable.addRow({
            locality_id: this.citiesCache[0]?.id || null
        }, true).then(row => {
            const cells = row.getCells();
            // Начинаем редактирование с названия магазина
            cells[1].edit(); // Вторая колонка - название магазина
        });
    }

    // ДОБАВЛЕНИЕ НОВОГО ГОРОДА
    addNewCity() {
        this.citiesTable.addRow({}, true)
            .then(row => {
                row.getCells().forEach(cell => {
                    if (cell.getColumn().getDefinition().field !== 'id') {
                        cell.edit();
                    }
                });
            });
    }

    // УВЕДОМЛЕНИЯ
    showNotification(message, type = 'info') {
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

// ЗАПУСК АДМИН-ПАНЕЛИ
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
