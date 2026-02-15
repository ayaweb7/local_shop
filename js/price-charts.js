/**
 * Shopping Tracker - Price Charts
 * Визуализация анализа цен
 */

class PriceCharts {
    constructor() {
        this.charts = {};
        console.log('PriceCharts инициализирован');
    }
    
    /**
     * Создание линейного графика цен
     */
    createLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas ${canvasId} не найден`);
            return null;
        }
        
        // Уничтожаем старый график
        this.destroyChart(canvasId);
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Динамика цены',
                        font: { size: 16, weight: 'bold' },
                        padding: { top: 10, bottom: 20 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.raw || 0;
                                return `${label}: ${value.toFixed(2)} ₽`;
                            },
                            afterLabel: (context) => {
                                const purchase = this.findPurchaseByDate(context.label);
                                if (purchase) {
                                    return [
                                        `Количество: ${purchase.quantity} ${purchase.item}`,
                                        `Магазин: ${purchase.store_name || 'Неизвестно'}`,
                                        purchase.characteristic ? `Хар-ка: ${purchase.characteristic}` : null
                                    ].filter(Boolean);
                                }
                                return null;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: options.yAxisLabel || 'Цена, ₽',
                            font: { size: 12, weight: 'bold' }
                        },
                        ticks: {
                            callback: (value) => `${value.toFixed(2)} ₽`
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: { size: 11 }
                        }
                    }
                },
                layout: {
                    padding: { bottom: 20, left: 10, right: 20 }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts[canvasId] = chart;
        
        return chart;
    }
    
    /**
     * Создание пузырьковой диаграммы
     */
    createBubbleChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        this.destroyChart(canvasId);
        
        const ctx = canvas.getContext('2d');
        
        const config = {
            type: 'bubble',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: options.title || 'Цена и объем покупок по магазинам',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const point = context.raw;
                                const datasetLabel = context.dataset.label || '';
                                return [
                                    `${datasetLabel}`,
                                    `Дата: ${point.x.toLocaleDateString('ru-RU')}`,
                                    `Цена: ${point.y.toFixed(2)} ₽`,
                                    `Количество: ${point.quantity} ${point.unit}`,
                                    point.characteristic ? `Хар-ка: ${point.characteristic}` : null
                                ].filter(Boolean);
                            }
                        }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: options.yAxisLabel || 'Цена, ₽',
                            font: { size: 12, weight: 'bold' }
                        },
                        ticks: {
                            callback: (value) => `${value.toFixed(2)} ₽`
                        }
                    },
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month',
                            displayFormats: {
                                month: 'MMM YYYY'
                            }
                        },
                        title: {
                            display: true,
                            text: 'Дата покупки',
                            font: { size: 12, weight: 'bold' }
                        }
                    }
                }
            }
        };
        
        const chart = new Chart(ctx, config);
        this.charts[canvasId] = chart;
        
        return chart;
    }
    
    /**
     * Вспомогательный метод для поиска покупки по дате
     */
    findPurchaseByDate(dateStr) {
        // Будет переопределен в price-analysis.html
        return null;
    }
    
    /**
     * Уничтожение графика
     */
    destroyChart(canvasId) {
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
            delete this.charts[canvasId];
        }
    }
    
    /**
     * Уничтожение всех графиков
     */
    destroyAll() {
        Object.keys(this.charts).forEach(id => this.destroyChart(id));
    }
}

// Создаем глобальный экземпляр
window.priceCharts = new PriceCharts();