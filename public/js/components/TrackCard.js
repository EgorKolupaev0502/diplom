import { createElement } from '../utils/dom.js';
import { getImageUrl } from '../utils/images.js';

export class TrackCard {
    static create(track) {
        const card = createElement('article', { 
            className: 'content-card',
            'data-type': 'track',
            'data-name': track.name,
            'data-artist': track.artist.name || track.artist,
            style: 'transition: all 0.3s ease-in-out;'
        });
        
        const img = createElement('img', {
            src: getImageUrl(track),
            alt: track.name,
            className: 'card-image',
            loading: 'lazy',
            onerror: "this.src='https://via.placeholder.com/174x174?text=Нет+изображения'"
        });
        
        const title = createElement('h3', { className: 'card-title' }, track.name);
        const artist = createElement('p', { className: 'card-description' }, 
            `${track.artist.name || track.artist}`);
        const plays = createElement('p', { className: 'card-description' }, 
            `${track.playcount || track.listeners || 'Нет данных'} прослушиваний`);
        
        card.append(img, title, artist, plays);
        return card;
    }
} 