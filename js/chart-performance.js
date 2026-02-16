/**
 * Chart Performance Optimizer
 * Оптимизация производительности графиков
 */

class ChartPerformanceOptimizer {
    constructor() {
        this.debounceTimers = {};
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 минут
        console.log('ChartPerformanceOptimizer инициализирован');
    }
    
    /**
     * Дебаунсинг для частых событий (изменение фильтров, ресайз)
     */
    debounce(func, wait = 300, key = 'default') {
        return (...args) => {
            clearTimeout(this.debounceTimers[key]);
            this.debounceTimers[key] = setTimeout(() => {
                func.apply(this, args);
                delete this.debounceTimers[key];
            }, wait);
        };
    }
    
    /**
     * Троттлинг для событий прокрутки
     */
    throttle(func, limit = 100) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Кэширование данных графика
     */
    cacheData(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Получение данных из кэша
     */
    getCachedData(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp < this.cacheTTL)) {
            console.log(`Данные получены из кэша: ${key}`);
            return cached.data;
        }
        return null;
    }
    
    /**
     * Очистка устаревшего кэша
     */
    clearExpiredCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheTTL) {
                this.cache.delete(key);
                console.log(`Удален устаревший кэш: ${key}`);
            }
        }
    }
    
    /**
     * Ленивая загрузка графиков (только видимые)
     */
    setupLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const canvas = entry.target;
                    if (canvas.dataset.lazy && !canvas.dataset.loaded) {
                        this.loadLazyChart(canvas);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        document.querySelectorAll('canvas[data-lazy="true"]').forEach(canvas => {
            observer.observe(canvas);
        });
    }
    
    /**
     * Загрузка ленивого графика
     */
    loadLazyChart(canvas) {
        console.log(`Ленивая загрузка графика: ${canvas.id}`);
        canvas.dataset.loaded = 'true';
        
        // Триггерим событие для загрузки данных
        const event = new CustomEvent('lazyload-chart', {
            detail: { canvasId: canvas.id }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * Оптимизация ресайза окон
     */
    optimizeResize() {
        const handleResize = this.debounce(() => {
            console.log('Оптимизированный ресайз');
            
            // Перерисовываем графики с новыми размерами
            if (window.chartManager) {
                window.chartManager.charts.forEach(chart => {
                    if (chart && chart.chart) {
                        chart.chart.resize();
                    }
                });
            }
        }, 250, 'resize');
        
        window.addEventListener('resize', handleResize);
    }
    
    /**
     * Предзагрузка данных для следующего типа графика
     */
    prefetchData(nextType) {
        console.log(`Предзагрузка данных для: ${nextType}`);
        
        // Здесь можно заранее загрузить данные для следующего типа
        // Например, если пользователь часто переключается между categories и months
        
        const cacheKey = `prefetch_${nextType}`;
        
        if (window.chartData && window.unifiedProcessor) {
            switch(nextType) {
                case 'categories':
                    const catData = window.unifiedProcessor.process(
                        'categories', 
                        window.chartData.purchases,
                        window.chartData.categories
                    );
                    this.cacheData(cacheKey, catData);
                    break;
                    
                case 'months':
                    const monthData = window.unifiedProcessor.process(
                        'months',
                        window.chartData.purchases
                    );
                    this.cacheData(cacheKey, monthData);
                    break;
            }
        }
    }
    
    /**
     * Мониторинг производительности
     */
    measurePerformance(func, label) {
        return (...args) => {
            const start = performance.now();
            const result = func.apply(this, args);
            const end = performance.now();
            
            console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
            
            return result;
        };
    }
}

// Создаем глобальный экземпляр
window.performanceOptimizer = new ChartPerformanceOptimizer();