/**
 * Класс для мониторинга производительности
 */
export class PerformanceMonitor {
    static init() {
        // Начинаем отслеживать загрузку страницы
        performance.mark('pageStart');
        
        window.addEventListener('load', () => {
            // Замеряем время загрузки страницы
            performance.mark('pageEnd');
            performance.measure('pageLoad', 'pageStart', 'pageEnd');
            
            const pageLoadTime = performance.getEntriesByName('pageLoad')[0].duration;
            console.log(`Время загрузки страницы: ${pageLoadTime.toFixed(2)}ms`);
            
            // Проверяем производительность
            this.checkPerformance(pageLoadTime);
        });
    }
    
    static checkPerformance(loadTime) {
        // Проверяем время загрузки (2 секунды = 2000ms)
        if (loadTime > 2000) {
            console.warn(`Время загрузки (${loadTime.toFixed(2)}ms) превышает рекомендуемые 2000ms`);
            this.suggestOptimizations();
        }
    }
    
    static suggestOptimizations() {
        const suggestions = [
            'Оптимизируйте изображения',
            'Используйте кэширование',
            'Минимизируйте JavaScript и CSS',
            'Используйте ленивую загрузку изображений',
            'Уменьшите количество HTTP-запросов'
        ];
        
        console.info('Рекомендации по оптимизации:');
        suggestions.forEach(suggestion => console.info(`- ${suggestion}`));
    }
} 