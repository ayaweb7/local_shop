// api.js - Клиент для работы с PHP API
class APIClient {
    constructor() {
        this.baseURL = 'api/api.php';
        console.log('API Client initialized. Base URL:', this.baseURL);

    }

    // УНИВЕРСАЛЬНЫЙ МЕТОД ДЛЯ ЗАПРОСОВ
    async request(endpoint, method = 'GET', data = null) {
		const url = `${this.baseURL}?request=${endpoint}`;
		console.log(`🚀 API ${method} ${url}`, data);
		
		const options = {
			method: method,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		};

		if (data && (method === 'POST' || method === 'PUT')) {
			options.body = JSON.stringify(data);
			console.log('📦 Request body:', options.body);
		}

		try {
			const response = await fetch(url, options);
			
			// ВАЖНО: Получаем сырой текст
			const rawText = await response.text();
			console.log(`📨 Response status: ${response.status}`);
			console.log('📄 Raw response (first 500 chars):', rawText.substring(0, 500));
			
			// Пробуем распарсить JSON
			let result;
			try {
				result = JSON.parse(rawText);
			} catch (jsonError) {
				console.error('❌ JSON parse failed. Full response:', rawText);
				
				// Если в ответе есть HTML с ошибкой PHP, покажем её
				if (rawText.includes('<b>') || rawText.includes('PHP')) {
					throw new Error(`PHP Error in response: ${rawText.split('<b>')[1]?.split('</b>')[0] || rawText.substring(0, 200)}`);
				}
				throw new Error(`Invalid JSON: ${rawText.substring(0, 100)}...`);
			}
			
			console.log('✅ Parsed result:', result);
			
			if (!response.ok) {
				throw new Error(result.error || `HTTP ${response.status}`);
			}
			
			if (result.error) {
				throw new Error(result.error);
			}
			
			return result;
			
		} catch (error) {
			console.error('💥 API request failed:', error);
			this.showNotification(`Ошибка API: ${error.message}`, 'error');
			throw error;
		}
	}

    // ПОКУПКИ
    async getPurchases() {
        const result = await this.request('purchases', 'GET');
        return result.data || [];
    }

    async addPurchase(purchaseData) {
        const result = await this.request('purchases', 'POST', purchaseData);
        return result;
    }

    async deletePurchase(id) {
        const result = await this.request(`purchases/${id}`, 'DELETE');
        return result;
    }

    // МАГАЗИНЫ
    async getStores() {
        const result = await this.request('stores', 'GET');
        return result.data || [];
    }

    // ГОРОДА
    async getCities() {
        const result = await this.request('cities', 'GET');
        return result.data || [];
    }
	
	// КАТЕГОРИИ
	async getCategories() {
		const result = await this.request('categories', 'GET');
		return result.data || [];
	}

	async addCategory(categoryData) {
		const result = await this.request('categories', 'POST', categoryData);
		return result;
	}

	async updateCategory(id, categoryData) {
		const result = await this.request(`categories/${id}`, 'PUT', categoryData);
		return result;
	}

	async deleteCategory(id) {
		const result = await this.request(`categories/${id}`, 'DELETE');
		return result;
	}

    // УПРОЩЕННАЯ АВТОРИЗАЦИЯ (заглушка)
    async signIn(email, password) {
        // На первом этапе просто возвращаем успех
        return { 
            success: true, 
            user: { email: email, id: 1 } 
        };
    }

    async signOut() {
        // Просто очищаем возможные данные
        console.log('User signed out');
        return { success: true };
    }
	
	// В класс APIClient в api.js ДОБАВЬТЕ:
	async updatePurchase(id, purchaseData) {
		const result = await this.request(`purchases/${id}`, 'PUT', purchaseData);
		return result;
	}

	// Также добавьте метод для получения уникальных категорий и единиц:
	async getUniqueCategories() {
		const purchases = await this.getPurchases();
		const categories = [...new Set(purchases.map(p => p.gruppa).filter(Boolean))];
		return categories.sort();
	}

	async getUniqueUnits() {
		const purchases = await this.getPurchases();
		const units = [...new Set(purchases.map(p => p.item).filter(Boolean))];
		return units.sort();
	}
	
	// УВЕДОМЛЕНИЯ (временная реализация)
    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
        alert(`[${type.toUpperCase()}] ${message}`);
    }
}

// Создаем глобальный экземпляр
window.apiClient = new APIClient();