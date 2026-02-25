class ChartsApp {
    constructor() {
        this.chartManager = window.chartManager;
        this.unifiedProcessor = new UnifiedDataProcessor();
        this.currentChartType = 'categories';
        this.currentFilter = 'all';
        this.data = {};
    }
    
    async init() {
        await this.loadData();
        this.setupFilters();
        this.setupChartTypeButtons();
        this.updateCharts();
    }
    
    async loadData() {
        try {
			window.chartData = {
				purchases: await apiClient.getPurchases(),
				categories: await apiClient.getCategories(),
				stores: await apiClient.getStores()
			};
			
			console.log('Данные загружены:', {
				purchases: window.chartData.purchases?.length,
				categories: window.chartData.categories?.length,
				stores: window.chartData.stores?.length
			});
			
			// Обновляем список годов в фильтрах
			updateYearFilter();
			
		} catch (error) {
			console.error('Ошибка загрузки данных:', error);
		}
    }
    
    async setupFilters() {
        const periodFilter = document.getElementById('period-filter');
		const yearFilter = document.getElementById('year-filter');
		const monthFilter = document.getElementById('month-filter');
		const applyBtn = document.getElementById('apply-filters');
		const resetBtn = document.getElementById('reset-filters');
		
		periodFilter.addEventListener('change', function() {
			const value = this.value;
			const yearGroup = document.getElementById('year-filter-group');
			const monthGroup = document.getElementById('month-filter-group');
			
			if (value === 'year') {
				yearGroup.style.display = 'block';
				monthGroup.style.display = 'none';
				currentFilter = 'year';
			} else if (value === 'month') {
				yearGroup.style.display = 'block';
				monthGroup.style.display = 'block';
				currentFilter = 'month';
			} else {
				yearGroup.style.display = 'none';
				monthGroup.style.display = 'none';
				currentFilter = 'all';
			}
		});
		
		applyBtn.addEventListener('click', updateCharts);
		resetBtn.addEventListener('click', function() {
			periodFilter.value = 'all';
			document.getElementById('year-filter-group').style.display = 'none';
			document.getElementById('month-filter-group').style.display = 'none';
			currentFilter = 'all';
			currentYear = null;
			currentMonth = null;
			updateCharts();
		});
    }
    
	async updateYearFilter() {
		if (!window.chartData || !window.chartData.purchases) return;
		
		const years = unifiedProcessor.getAvailableYears(window.chartData.purchases);
		const yearSelect = document.getElementById('year-filter');
		
		yearSelect.innerHTML = '<option value="">Выберите год</option>';
		years.forEach(year => {
			yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
		});
	}
	
	async updateMonthFilter() {
		if (!window.chartData || !window.chartData.purchases) return;
		
		const yearSelect = document.getElementById('year-filter');
		const selectedYear = yearSelect.value;
		const monthSelect = document.getElementById('month-filter');
		
		if (!selectedYear) {
			// Если год не выбран, показываем все месяцы
			monthSelect.innerHTML = '<option value="">Выберите месяц</option>';
			for (let i = 1; i <= 12; i++) {
				monthSelect.innerHTML += `<option value="${i}">${monthNames[i-1]}</option>`;
			}
			return;
		}
		
		// Получаем только месяцы, которые есть в данных для выбранного года
		const availableMonths = unifiedProcessor.getAvailableMonths(
			window.chartData.purchases, 
			selectedYear
		);
		
		monthSelect.innerHTML = '<option value="">Выберите месяц</option>';
		availableMonths.forEach(month => {
			monthSelect.innerHTML += `<option value="${month.value}">${month.name}</option>`;
		});
	}

	// Добавьте обработчик изменения года
	document.getElementById('year-filter').addEventListener('change', function() {
		updateMonthFilter();
		// Можно автоматически применить фильтр
		// updateCharts();
	});
	
	async setupChartTypeButtons() {
		document.querySelectorAll('.chart-type-btn').forEach(btn => {
			btn.addEventListener('click', function() {
				// Снимаем активный класс со всех кнопок
				document.querySelectorAll('.chart-type-btn').forEach(b => {
					b.classList.remove('active');
				});
				
				// Добавляем активный класс текущей кнопке
				this.classList.add('active');
				
				// Обновляем текущий тип
				currentChartType = this.dataset.type;
				
				// Обновляем графики
				updateCharts();
			});
		});
	}
	
	async updateCharts() {
		console.log(`Обновление графиков: тип=${currentChartType}, фильтр=${currentFilter}`);
		
		if (!window.chartData || !window.chartData.purchases) {
			console.warn('Нет данных для графиков');
			return;
		}
		
		// УНИЧТОЖАЕМ старую пару графиков перед созданием новой
		chartManager.destroyChartPair('left-chart', 'right-chart');
		
		// Фильтруем данные
		let filteredPurchases = [...window.chartData.purchases];
		
		if (currentFilter === 'year') {
			const yearSelect = document.getElementById('year-filter');
			currentYear = yearSelect.value;
			if (currentYear) {
				filteredPurchases = unifiedProcessor.filterByYear(filteredPurchases, currentYear);
			}
		} else if (currentFilter === 'month') {
			const yearSelect = document.getElementById('year-filter');
			const monthSelect = document.getElementById('month-filter');
			currentYear = yearSelect.value;
			currentMonth = monthSelect.value;
			if (currentYear && currentMonth) {
				filteredPurchases = unifiedProcessor.filterByYearMonth(
					filteredPurchases, 
					currentYear, 
					currentMonth
				);
			}
		}
		
		console.log(`После фильтрации: ${filteredPurchases.length} покупок`);
		
		// Создаем графики в зависимости от типа
		switch(currentChartType) {
			case 'categories':
				createCategoryCharts(filteredPurchases);
				break;
			case 'months':
				createMonthlyCharts(filteredPurchases);
				break;
			case 'years':
				createYearlyCharts(filteredPurchases);
				break;
			case 'stores':
				createStoreCharts(filteredPurchases);
				break;
			case 'products':
				createProductCharts(filteredPurchases);
				break;
		}
	}
	
	async createCategoryCharts(purchases) {
		console.log('Создание графиков по категориям');
		
		chartManager.createCategoryPair(
			{ left: 'left-chart', right: 'right-chart' },
			purchases,
			window.chartData.categories,
			{
				limit: 25 // Показываем топ-25 категорий
			}
		);
	}
	
	async createMonthlyCharts(purchases) {
		console.log('Создание графиков по месяцам');
		
		chartManager.createMonthlyPair(
			{ left: 'left-chart', right: 'right-chart' },
			purchases
		);
	}
	
	async createYearlyCharts(purchases) {
		console.log('Создание графиков по годам');
		
		chartManager.createYearlyPair(
			{ left: 'left-chart', right: 'right-chart' },
			purchases
		);
	}
	
	async createStoreCharts(purchases) {
		console.log('Создание графиков по магазинам');
		// Реализовать позже
	}
	
	async createProductCharts(purchases) {
		console.log('Создание графиков по товарам');
		// Реализовать позже
	}
	
    // ... все остальные методы
}

// Экспортируем класс
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartsApp;
}