/**
 * Создает DOM элемент с заданными атрибутами и содержимым
 * @param {string} tag - Тег элемента
 * @param {Object} attributes - Атрибуты элемента
 * @param {string|Node|Array} content - Содержимое элемента
 * @returns {HTMLElement} Созданный элемент
 */
export function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    if (Array.isArray(content)) {
        element.append(...content);
    } else if (content instanceof Node) {
        element.appendChild(content);
    } else {
        element.textContent = content;
    }
    
    return element;
} 