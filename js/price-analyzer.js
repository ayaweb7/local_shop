/**
 * Shopping Tracker - Price Analyzer
 * Класс для нормализации и анализа цен товаров
 */

class PriceAnalyzer {
    constructor() {
        this.apiClient = window.apiClient;
        this.normalizedUnits = ['г', 'мл', 'см']; // Единицы, требующие нормализации
        this.baseUnits = {
            'г': 'кг',
            'мл': 'л',
            'см': 'м'
        };
        console.log('PriceAnalyzer инициализирован');
    }
    
    /**
     * Загрузка данных о покупках товара
     */
    async loadProductData(categoryId, productName, characteristic = null, dateFrom = null, dateTo = null, searchMode = 'exact') {
		console.log('Загрузка данных товара:', { categoryId, productName, characteristic, searchMode });
        
        try {
            // Формируем URL запроса
            let url = `api/api.php?request=product-prices&category_id=${categoryId}&product_name=${encodeURIComponent(productName)}&search_mode=${searchMode}`;
            
            if (characteristic) {
                url += `&characteristic=${encodeURIComponent(characteristic)}`;
            }
            
            if (dateFrom) {
                url += `&date_from=${dateFrom}`;
            }
            
            if (dateTo) {
                url += `&date_to=${dateTo}`;
            }
            
            const response = await fetch(url);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Ошибка загрузки данных');
            }
            
            console.log(`Загружено покупок: ${result.data.purchases.length}`);
            
            // Нормализуем цены
            const normalizedPurchases = this.normalizePurchases(result.data.purchases);
            
            return {
                ...result.data,
                purchases: normalizedPurchases
            };
            
        } catch (error) {
            console.error('Ошибка загрузки данных товара:', error);
            throw error;
        }
    }
    
    /**
     * Нормализация цен покупок
     */
    normalizePurchases(purchases) {
        return purchases.map(purchase => {
            const normalized = this.normalizePrice(
                parseFloat(purchase.price),
                parseFloat(purchase.quantity),
                purchase.item
            );
            
            return {
                ...purchase,
                ...normalized,
                displayPrice: this.formatPrice(normalized.pricePerUnit, normalized.normalizedUnit),
                displayOriginal: `${purchase.price} ₽/${purchase.item}`
            };
        });
    }
    
    /**
     * Нормализация цены к базовой единице
     */
    normalizePrice(price, quantity, unit) {
        // По умолчанию - без нормализации
        const result = {
            normalized: false,
            originalPrice: price,
            originalQuantity: quantity,
            originalUnit: unit,
            pricePerUnit: price,
            normalizedUnit: unit,
            normalizedQuantity: quantity,
            conversionFactor: 1
        };
        
        // Проверяем, нужно ли нормализовать
        if (this.normalizedUnits.includes(unit)) {
            switch (unit) {
                case 'г':
                    // г → кг (цена за кг)
                    result.pricePerUnit = (price * 1000) / quantity;
                    result.normalizedUnit = 'кг.';
                    result.normalizedQuantity = quantity / 1000;
                    result.conversionFactor = 1000;
                    result.normalized = true;
                    break;
                    
                case 'мл':
                    // мл → л (цена за литр)
                    result.pricePerUnit = (price * 1000) / quantity;
                    result.normalizedUnit = 'л.';
                    result.normalizedQuantity = quantity / 1000;
                    result.conversionFactor = 1000;
                    result.normalized = true;
                    break;
                    
                case 'см':
                    // см → м (цена за метр)
                    result.pricePerUnit = (price * 100) / quantity;
                    result.normalizedUnit = 'м.';
                    result.normalizedQuantity = quantity / 100;
                    result.conversionFactor = 100;
                    result.normalized = true;
                    break;
            }
        }
        
        return result;
    }
    
    /**
     * Форматирование цены с единицей измерения
     */
    formatPrice(price, unit) {
        return `${price.toFixed(2)} ₽/${unit}`;
    }
    
    /**
     * Получение ключа для группировки товара
     */
    getProductKey(purchase) {
        // Основа: категория + название
        let key = `${purchase.category_id}_${purchase.name}`;
        
        // Если есть характеристика - добавляем первое слово
        if (purchase.characteristic && purchase.characteristic.trim() !== '') {
            const firstWord = purchase.characteristic.split(/[\s,;.-]/)[0];
            if (firstWord && firstWord.length > 0) {
                key += `_${firstWord}`;
            }
        }
        
        return key;
    }
    
    /**
     * Подготовка данных для линейного графика
     */
    prepareLineChartData(purchases, showNormalized = true) {
		if (!purchases || purchases.length < 2) {
			return null;
		}
		
		const sorted = [...purchases].sort((a, b) => new Date(a.date) - new Date(b.date));
		
		// Определяем диапазон дат для настройки шкалы
		const dates = sorted.map(p => new Date(p.date));
		const minDate = new Date(Math.min(...dates));
		const maxDate = new Date(Math.max(...dates));
		const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
		
		// Определяем единицу времени
		let timeUnit = 'month';
		let displayFormat = 'MMM YYYY'; // Простой формат: "мар 2025"
		
		if (daysDiff <= 31) {
			timeUnit = 'day';
			displayFormat = 'DD MMM'; // "23 мар"
		} else if (daysDiff <= 90) {
			timeUnit = 'week';
			displayFormat = 'MMM DD'; // "мар 23"
		}
		
		const labels = sorted.map(p => new Date(p.date));
    
		const data = sorted.map(p => 
			showNormalized && p.normalized ? p.pricePerUnit : parseFloat(p.price)
		);
		
		const unit = showNormalized && sorted[0].normalized 
			? sorted[0].normalizedUnit 
			: sorted[0].originalUnit;
		
		const minValue = Math.min(...data);
		const maxValue = Math.max(...data);
		const range = maxValue - minValue;
		const padding = range * 0.1;
		
		return {
			labels: labels,
			datasets: [{
				label: `Цена, ₽/${unit}`,
				data: data,
				borderColor: '#3498db',
				backgroundColor: 'rgba(52, 152, 219, 0.1)',
				borderWidth: 2,
				pointRadius: 4,
				pointHoverRadius: 6,
				pointBackgroundColor: '#2980b9',
				tension: 0.3,
				fill: false
			}],
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						type: 'time',
						time: {
							unit: timeUnit,
							displayFormats: {
								day: 'DD MMM',      // "23 мар"
								week: 'MMM DD',      // "мар 23"
								month: 'MMM YYYY'    // "мар 2025"
							},
							tooltipFormat: 'DD MMM YYYY' // для всплывающих подсказок
						},
						title: {
							display: true,
							text: 'Дата'
						},
						ticks: {
							maxRotation: 45,
							minRotation: 45
						}
					},
					y: {
						beginAtZero: false,
						min: Math.max(0, minValue - padding),
						max: maxValue + padding,
						ticks: {
							callback: function(value) {
								return value.toFixed(2) + ' ₽';
							}
						},
						title: {
							display: true,
							text: `Цена (₽/${unit})`
						}
					}
				},
				plugins: {
					tooltip: {
						callbacks: {
							title: function(context) {
								const date = new Date(context[0].label);
								return date.toLocaleDateString('ru-RU', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								});
							},
							label: function(context) {
								return `${context.dataset.label}: ${context.raw.toFixed(2)} ₽`;
							}
						}
					}
				}
			}
		};
	}
    
    /**
     * Подготовка данных для пузырьковой диаграммы
     */
    prepareBubbleChartData(purchases) {
		if (!purchases || purchases.length === 0) {
			return null;
		}
		
		// Группируем по магазинам
		const stores = {};
		const storeColors = [
			'rgba(52, 152, 219, 0.7)',  // Синий
			'rgba(46, 204, 113, 0.7)',  // Зеленый
			'rgba(155, 89, 182, 0.7)',  // Фиолетовый
			'rgba(241, 196, 15, 0.7)',  // Желтый
			'rgba(230, 126, 34, 0.7)',  // Оранжевый
			'rgba(231, 76, 60, 0.7)'    // Красный
		];
		
		// Определяем диапазон дат
		const dates = purchases.map(p => new Date(p.date));
		const minDate = new Date(Math.min(...dates));
		const maxDate = new Date(Math.max(...dates));
		const daysDiff = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
		
		// Определяем единицу времени в зависимости от периода
		let timeUnit = 'month';
		let displayFormat = 'MMM YYYY'; // "мар 2025"
		
		if (daysDiff <= 31) {
			timeUnit = 'day';
			displayFormat = 'DD MMM'; // "23 мар"
		} else if (daysDiff <= 90) {
			timeUnit = 'week';
			displayFormat = 'MMM DD'; // "мар 23"
		}
		
		// Собираем все цены для вычисления диапазона
		const allPrices = [];
		
		purchases.forEach(p => {
			const storeId = p.store_id;
			const storeName = p.store_name || `Магазин #${storeId}`;
			const price = p.normalized ? p.pricePerUnit : parseFloat(p.price);
			allPrices.push(price);
			
			if (!stores[storeId]) {
				stores[storeId] = {
					label: storeName,
					data: [],
					backgroundColor: storeColors[Object.keys(stores).length % storeColors.length]
				};
			}
			
			const date = new Date(p.date);
			const radius = Math.max(8, Math.min(20, p.quantity * 3));
			
			stores[storeId].data.push({
				x: date,
				y: price,
				r: radius,
				originalPrice: p.price,
				quantity: p.quantity,
				unit: p.item,
				characteristic: p.characteristic
			});
		});
		
		const minPrice = Math.min(...allPrices);
		const maxPrice = Math.max(...allPrices);
		const range = maxPrice - minPrice;
		const padding = range * 0.1;
		
		return {
			datasets: Object.values(stores),
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: false,
						min: Math.max(0, minPrice - padding),
						max: maxPrice + padding,
						title: {
							display: true,
							text: 'Цена (₽)'
						},
						ticks: {
							callback: function(value) {
								return value.toFixed(2) + ' ₽';
							}
						}
					},
					x: {
						type: 'time',
						time: {
							unit: timeUnit,
							displayFormats: {
								day: 'DD MMM',
								week: 'MMM DD',
								month: 'MMM YYYY'
							},
							tooltipFormat: 'DD MMM YYYY' // ВАЖНО: формат для всплывающих подсказок
						},
						title: {
							display: true,
							text: 'Дата'
						},
						ticks: {
							maxRotation: 45,
							minRotation: 45,
							source: 'auto',
							// Явно задаём формат для меток
							callback: function(value, index, values) {
								if (!value) return '';
								const date = new Date(value);
								
								if (timeUnit === 'day') {
									return date.toLocaleDateString('ru-RU', { 
										day: 'numeric', 
										month: 'short' 
									}).replace('.', '');
								} else if (timeUnit === 'week') {
									return date.toLocaleDateString('ru-RU', { 
										month: 'short', 
										day: 'numeric' 
									}).replace('.', '');
								} else {
									return date.toLocaleDateString('ru-RU', { 
										month: 'short', 
										year: 'numeric' 
									}).replace('.', '');
								}
							}
						}
					}
				},
				plugins: {
					tooltip: {
						callbacks: {
							title: function(context) {
								// Показываем точную дату в тултипе
								const date = new Date(context[0].raw.x);
								return date.toLocaleDateString('ru-RU', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								});
							},
							label: function(context) {
								const dataset = context.dataset;
								const dataPoint = dataset.data[context.dataIndex];
								return [
									`🏪 ${dataset.label}`,
									`💰 ${dataPoint.y.toFixed(2)} ₽`,
									`📦 ${dataPoint.quantity} ${dataPoint.unit}`,
									`📝 ${dataPoint.characteristic || 'характеристики не указаны'}`
								];
							}
						}
					}
				}
			}
		};
	}
    
    /**
     * Расчет статистики цен
     */
    calculateStatistics(purchases) {
        if (!purchases || purchases.length === 0) {
            return null;
        }
        
        const prices = purchases.map(p => parseFloat(p.price));
        const normalizedPrices = purchases
            .filter(p => p.normalized)
            .map(p => p.pricePerUnit);
        
        const first = purchases[0];
        const last = purchases[purchases.length - 1];
        
        // Изменение цены
        const firstPrice = parseFloat(first.price);
        const lastPrice = parseFloat(last.price);
        const priceChange = lastPrice - firstPrice;
        const priceChangePercent = firstPrice > 0 
            ? ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1)
            : 0;
        
        // Тренд
        let trend = 'stable';
        if (priceChangePercent > 5) trend = 'rising';
        if (priceChangePercent < -5) trend = 'falling';
        
        // Эмодзи для тренда
        const trendEmoji = {
            'rising': '📈',
            'falling': '📉',
            'stable': '➡️'
        };
        
        return {
            count: purchases.length,
            minPrice: Math.min(...prices).toFixed(2),
            maxPrice: Math.max(...prices).toFixed(2),
            avgPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
            firstPrice: firstPrice.toFixed(2),
            lastPrice: lastPrice.toFixed(2),
            priceChange: priceChange.toFixed(2),
            priceChangePercent: priceChangePercent,
            trend: trend,
            trendEmoji: trendEmoji[trend],
            totalAmount: purchases.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2),
            totalQuantity: purchases.reduce((sum, p) => sum + parseFloat(p.quantity), 0).toFixed(3),
            
            // Нормализованная статистика
            hasNormalized: normalizedPrices.length > 0,
            normalizedCount: normalizedPrices.length,
            normalizedMin: normalizedPrices.length > 0 ? Math.min(...normalizedPrices).toFixed(2) : null,
            normalizedMax: normalizedPrices.length > 0 ? Math.max(...normalizedPrices).toFixed(2) : null,
            normalizedAvg: normalizedPrices.length > 0 
                ? (normalizedPrices.reduce((a, b) => a + b, 0) / normalizedPrices.length).toFixed(2)
                : null,
            
            // Первая и последняя покупка
            firstDate: first.date,
            lastDate: last.date,
            firstStore: first.store_name,
            lastStore: last.store_name
        };
    }
    
    /**
     * Проверка, достаточно ли данных для анализа
     */
    hasEnoughData(purchases, minRequired = 2) {
        return purchases && purchases.length >= minRequired;
    }
}

// Создаем глобальный экземпляр
window.priceAnalyzer = new PriceAnalyzer();