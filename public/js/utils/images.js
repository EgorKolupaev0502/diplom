/**
 * Получает URL изображения исполнителя или трека
 * @param {Object} item - объект исполнителя или трека
 * @returns {string} - ссылка на изображение или заглушку
 */
export function getImageUrl(item) {
    if (!item.image || !Array.isArray(item.image)) {
        return 'https://via.placeholder.com/174x174?text=Нет+изображения';
    }
    
    // Ищем первую не пустую ссылку на изображение, начиная с самой большой
    for (let i = item.image.length - 1; i >= 0; i--) {
        if (item.image[i]['#text']) {
            return item.image[i]['#text'];
        }
    }
    
    return 'https://via.placeholder.com/174x174?text=Нет+изображения';
} 