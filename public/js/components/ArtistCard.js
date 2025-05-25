import { createElement } from '../utils/dom.js';
import { getImageUrl } from '../utils/images.js';

export class ArtistCard {
    static create(artist) {
        const card = createElement('article', { 
            className: 'content-card',
            'data-type': 'artist',
            'data-name': artist.name,
            style: 'transition: all 0.3s ease-in-out;'
        });
        
        const img = createElement('img', {
            src: getImageUrl(artist),
            alt: artist.name,
            className: 'card-image',
            loading: 'lazy',
            onerror: "this.src='https://via.placeholder.com/174x174?text=Нет+изображения'"
        });
        
        const title = createElement('h3', { className: 'card-title' }, artist.name);
        const description = createElement('p', { className: 'card-description' }, 
            `${artist.listeners || 'Нет данных'} слушателей`);
        
        card.append(img, title, description);
        return card;
    }
} 