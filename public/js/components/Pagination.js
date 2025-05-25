import { createElement } from '../utils/dom.js';

export class Pagination {
    constructor(container, options = {}) {
        this.container = container;
        this.currentPage = 1;
        this.totalPages = 1;
        this.onPageChange = options.onPageChange || (() => {});
        
        this.prevButton = container.querySelector('.pagination-button[data-action="prev"]');
        this.nextButton = container.querySelector('.pagination-button[data-action="next"]');
        this.pageInfo = container.querySelector('.current-page');
        
        this.bindEvents();
    }
    
    bindEvents() {
        if (this.prevButton) {
            this.prevButton.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.onPageChange(this.currentPage);
                    this.update();
                }
            });
        }
        
        if (this.nextButton) {
            this.nextButton.addEventListener('click', () => {
                if (this.currentPage < this.totalPages) {
                    this.currentPage++;
                    this.onPageChange(this.currentPage);
                    this.update();
                }
            });
        }
    }
    
    update(currentPage = this.currentPage, totalPages = this.totalPages) {
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        
        if (this.prevButton) {
            this.prevButton.disabled = currentPage <= 1;
        }
        
        if (this.nextButton) {
            this.nextButton.disabled = currentPage >= totalPages;
        }
        
        if (this.pageInfo) {
            this.pageInfo.textContent = `${currentPage} из ${totalPages}`;
        }
        
        this.container.style.display = totalPages > 1 ? 'flex' : 'none';
    }
    
    static create() {
        const container = createElement('div', { className: 'pagination' });
        
        const prevButton = createElement('button', {
            className: 'pagination-button',
            'data-action': 'prev'
        }, 'Назад');
        
        const pageInfo = createElement('span', { className: 'current-page' }, '1 из 1');
        
        const nextButton = createElement('button', {
            className: 'pagination-button',
            'data-action': 'next'
        }, 'Вперед');
        
        container.append(prevButton, pageInfo, nextButton);
        return container;
    }
} 