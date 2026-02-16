/**
 * Chart Animations Manager
 * Управление анимациями графиков
 */

class ChartAnimationManager {
    constructor() {
        this.isAnimating = false;
        this.animationQueue = [];
        console.log('ChartAnimationManager инициализирован');
    }
    
    /**
     * Плавное обновление графика
     */
    smoothUpdate(chart, newData, duration = 800) {
        return new Promise((resolve) => {
            if (!chart || !chart.data) {
                resolve(false);
                return;
            }
            
            // Сохраняем старые данные
            const oldData = JSON.parse(JSON.stringify(chart.data));
            
            // Анимируем переход
            chart.data = newData;
            chart.update({
                duration: duration,
                easing: 'easeInOutQuart',
                lazy: false,
                
                onProgress: (animation) => {
                    // Можно добавить индикатор прогресса
                },
                
                onComplete: () => {
                    console.log('Анимация обновления завершена');
                    resolve(true);
                }
            });
        });
    }
    
    /**
     * Эффект "пульсации" для элемента
     */
    pulseElement(element, duration = 500) {
        if (!element) return;
        
        element.style.transition = `all ${duration}ms ease`;
        element.style.transform = 'scale(1.05)';
        element.style.boxShadow = '0 0 20px rgba(52,152,219,0.5)';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
            element.style.boxShadow = 'none';
        }, duration);
    }
    
    /**
     * Плавная прокрутка к элементу
     */
    smoothScrollTo(element, offset = 20) {
        if (!element) return;
        
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
    
    /**
     * Анимированное появление статистики
     */
    animateStatsValue(element, startValue, endValue, duration = 1000) {
        if (!element) return;
        
        const startTime = performance.now();
        const isCurrency = element.dataset.type === 'currency';
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Функция плавности
            const easeOutQuart = 1 - Math.pow(1 - progress, 3);
            
            const currentValue = startValue + (endValue - startValue) * easeOutQuart;
            
            if (isCurrency) {
                element.textContent = ChartUtils.formatCurrency(currentValue);
            } else {
                element.textContent = ChartUtils.formatNumber(currentValue, 0);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    /**
     * Плавное переключение вкладок
     */
    switchTab(oldTab, newTab) {
        if (!oldTab || !newTab) return;
        
        oldTab.style.transition = 'all 0.3s ease';
        newTab.style.transition = 'all 0.3s ease';
        
        oldTab.style.opacity = '0';
        oldTab.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            oldTab.style.display = 'none';
            newTab.style.display = 'block';
            
            setTimeout(() => {
                newTab.style.opacity = '1';
                newTab.style.transform = 'translateX(0)';
            }, 50);
        }, 300);
    }
    
    /**
     * Эффект "волны" при клике
     */
    createRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.background = 'rgba(255,255,255,0.6)';
        ripple.style.borderRadius = '50%';
        ripple.style.transform = 'scale(0)';
        ripple.style.transition = 'transform 0.6s ease-out';
        ripple.style.pointerEvents = 'none';
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.style.transform = 'scale(2)';
            ripple.style.opacity = '0';
        }, 50);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }
}

// Создаем глобальный экземпляр
window.animationManager = new ChartAnimationManager();