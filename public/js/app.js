import lastFmApi from './api.js';

/**
 * Вспомогательная функция для получения URL изображения исполнителя или трека
 * @param {Object} item - объект исполнителя или трека
 * @returns {string} - ссылка на изображение или заглушку
 */
function getImageUrl(item) {
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

/**
 * Создает DOM элемент с заданными атрибутами и содержимым
 * @param {string} tag - Тег элемента
 * @param {Object} attributes - Атрибуты элемента
 * @param {string|Node|Array} content - Содержимое элемента
 * @returns {HTMLElement} Созданный элемент
 */
function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Устанавливаем атрибуты
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Добавляем содержимое
    if (Array.isArray(content)) {
        element.append(...content);
    } else if (content instanceof Node) {
        element.appendChild(content);
    } else {
        element.textContent = content;
    }
    
    return element;
}

/**
 * Основной класс приложения
 */
class App {
    constructor() {
        // Ждем полной загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Инициализация приложения
     */
    init() {
        // Инициализация API
        this.initializeApi();
        
        // Состояние приложения
        this.state = {
            currentPage: {
                artists: 1,
                tracks: 1,
                search: 1
            },
            itemsPerPage: 10,
            searchType: 'all',
            lastSearchQuery: ''
        };

        console.log('Инициализация приложения:', {
            itemsPerPage: this.state.itemsPerPage
        });

        // Находим все необходимые элементы
        this.findElements();
        
        // Проверяем, что все элементы найдены
        if (!this.validateElements()) {
            console.error('Не все элементы найдены на странице');
            return;
        }

        // Инициализация пагинации
        this.initializePagination();
        
        // Привязываем обработчики событий
        this.bindEvents();
        
        // Загружаем начальные данные
        this.loadInitialData();
    }

    /**
     * Находит все необходимые элементы на странице
     */
    findElements() {
        this.searchForm = document.querySelector('.search-form');
        this.searchInput = document.querySelector('.search-input');
        this.searchTypeSelect = document.querySelector('.search-type');
        this.popularArtistsSection = document.querySelector('.popular-section:first-child');
        this.popularArtistsContainer = this.popularArtistsSection?.querySelector('.content-grid');
        this.popularTracksSection = document.querySelector('.popular-section:nth-child(2)');
        this.popularTracksContainer = this.popularTracksSection?.querySelector('.content-grid');
        this.searchResultsSection = document.querySelector('.popular-section:nth-child(3)');
        this.searchResultsContainer = this.searchResultsSection?.querySelector('.content-grid');
        this.detailsSection = document.querySelector('.details-section');
        this.errorContainer = document.querySelector('.error-message');
        this.loadingIndicator = document.querySelector('.loading-indicator');
    }

    /**
     * Проверяет наличие всех необходимых элементов
     */
    validateElements() {
        return (
            this.searchForm &&
            this.searchInput &&
            this.searchTypeSelect &&
            this.popularArtistsSection &&
            this.popularArtistsContainer &&
            this.popularTracksSection &&
            this.popularTracksContainer &&
            this.searchResultsSection &&
            this.searchResultsContainer &&
            this.detailsSection &&
            this.errorContainer &&
            this.loadingIndicator
        );
    }

    /**
     * Загружает начальные данные
     */
    async loadInitialData() {
        try {
            this.setLoading(true);
            await Promise.all([
                this.loadTopArtists(),
                this.loadTopTracks()
            ]);
        } catch (error) {
            this.showError('Не удалось загрузить начальные данные');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Инициализирует API с ключом
     */
    initializeApi() {
        const API_KEY = 'efdc3fccaa2645cab4caa4f3e16908ac';
        lastFmApi.initialize(API_KEY);
    }

    /**
     * Инициализирует пагинацию
     */
    initializePagination() {
        // Пагинация для артистов
        this.artistsPagination = {
            container: this.popularArtistsSection.querySelector('.pagination'),
            prevButton: this.popularArtistsSection.querySelector('.pagination-button[data-action="prev"]'),
            nextButton: this.popularArtistsSection.querySelector('.pagination-button[data-action="next"]'),
            pageInfo: this.popularArtistsSection.querySelector('.current-page')
        };

        // Пагинация для треков
        this.tracksPagination = {
            container: this.popularTracksSection.querySelector('.pagination'),
            prevButton: this.popularTracksSection.querySelector('.pagination-button[data-action="prev"]'),
            nextButton: this.popularTracksSection.querySelector('.pagination-button[data-action="next"]'),
            pageInfo: this.popularTracksSection.querySelector('.current-page')
        };

        // Пагинация для поиска
        this.searchPagination = {
            container: this.searchResultsSection.querySelector('.pagination'),
            prevButton: this.searchResultsSection.querySelector('.pagination-button[data-action="prev"]'),
            nextButton: this.searchResultsSection.querySelector('.pagination-button[data-action="next"]'),
            pageInfo: this.searchResultsSection.querySelector('.current-page')
        };

        // Проверяем инициализацию пагинации
        if (!this.validatePagination()) {
            console.error('Не удалось инициализировать пагинацию');
            return;
        }
    }

    /**
     * Проверяет корректность инициализации пагинации
     */
    validatePagination() {
        const validatePaginationObject = (pagination) => {
            return pagination.container && 
                   pagination.prevButton && 
                   pagination.nextButton && 
                   pagination.pageInfo;
        };

        return validatePaginationObject(this.artistsPagination) &&
               validatePaginationObject(this.tracksPagination) &&
               validatePaginationObject(this.searchPagination);
    }

    /**
     * Привязывает обработчики событий
     */
    bindEvents() {
        // Обработчик формы поиска
        if (this.searchForm) {
        this.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
                console.log('Форма поиска отправлена');
            this.handleSearch();
        });
        }

        // Обработчик выбора типа поиска
        if (this.searchTypeSelect) {
            this.searchTypeSelect.addEventListener('change', () => {
                console.log('Изменен тип поиска:', this.searchTypeSelect.value);
                this.state.searchType = this.searchTypeSelect.value;
                if (this.state.lastSearchQuery) {
                    this.handleSearch();
                }
            });
        }

        // Обработчики пагинации для артистов
        if (this.artistsPagination.prevButton && this.artistsPagination.nextButton) {
            this.artistsPagination.prevButton.addEventListener('click', async () => {
                if (this.state.currentPage.artists > 1) {
                    console.log('Переход на предыдущую страницу артистов');
                    this.state.currentPage.artists--;
                    await this.loadTopArtists();
                }
            });
            
            this.artistsPagination.nextButton.addEventListener('click', async () => {
                console.log('Переход на следующую страницу артистов');
                this.state.currentPage.artists++;
                await this.loadTopArtists();
            });
        }

        // Обработчики пагинации для треков
        if (this.tracksPagination.prevButton && this.tracksPagination.nextButton) {
            this.tracksPagination.prevButton.addEventListener('click', async () => {
                if (this.state.currentPage.tracks > 1) {
                    console.log('Переход на предыдущую страницу треков');
                    this.state.currentPage.tracks--;
                    await this.loadTopTracks();
                }
            });
            
            this.tracksPagination.nextButton.addEventListener('click', async () => {
                console.log('Переход на следующую страницу треков');
                this.state.currentPage.tracks++;
                await this.loadTopTracks();
            });
        }

        // Обработчики пагинации для поиска
        if (this.searchPagination.prevButton && this.searchPagination.nextButton) {
            this.searchPagination.prevButton.addEventListener('click', async () => {
                if (this.state.currentPage.search > 1) {
                    console.log('Переход на предыдущую страницу поиска');
                    this.state.currentPage.search--;
                    await this.handleSearch(false);
                }
            });
            
            this.searchPagination.nextButton.addEventListener('click', async () => {
                console.log('Переход на следующую страницу поиска');
                this.state.currentPage.search++;
                await this.handleSearch(false);
            });
        }

        // Обработчик клика по карточкам
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.content-card');
            if (card) {
                console.log('Клик по карточке:', card.dataset);
                const type = card.dataset.type;
                const name = card.dataset.name;
                const artist = card.dataset.artist;
                
                if (type === 'artist') {
                    this.showArtistDetails(name);
                } else if (type === 'track') {
                    this.showTrackDetails(name, artist);
                }
            }
        });
    }

    /**
     * Обновляет состояние пагинации
     * @param {Object} pagination - Объект пагинации
     * @param {number} currentPage - Текущая страница
     * @param {number} totalPages - Всего страниц
     */
    updatePagination(pagination, currentPage, totalPages) {
        if (!pagination || !pagination.prevButton || !pagination.nextButton || !pagination.pageInfo) {
            console.error('Некорректный объект пагинации:', pagination);
            return;
        }

        console.log('Обновление пагинации:', { currentPage, totalPages });

        // Обновляем состояние кнопок
        pagination.prevButton.disabled = currentPage <= 1;
        pagination.nextButton.disabled = currentPage >= totalPages;
        
        // Обновляем информацию о текущей странице
        pagination.pageInfo.textContent = `${currentPage} из ${totalPages}`;

        // Показываем/скрываем контейнер пагинации
        pagination.container.style.display = totalPages > 1 ? 'flex' : 'none';

        console.log('Состояние кнопок:', {
            prev: pagination.prevButton.disabled,
            next: pagination.nextButton.disabled,
            page: pagination.pageInfo.textContent
        });
    }

    /**
     * Показывает детальную информацию об исполнителе
     * @param {string} artistName - Имя исполнителя
     */
    async showArtistDetails(artistName) {
        try {
            this.setLoading(true);
            const [info, topTracks] = await Promise.all([
                lastFmApi.getArtistInfo(artistName),
                lastFmApi.getArtistTopTracks(artistName)
            ]);

            const detailsHtml = this.createArtistDetailsContent(info.artist, topTracks.toptracks.track);
            this.detailsSection.querySelector('.details-content').innerHTML = detailsHtml;
            
            this.hidePopularContent();
            this.searchResultsSection.style.display = 'none';
            this.detailsSection.style.display = 'block';
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Показывает детальную информацию о треке
     * @param {string} trackName - Название трека
     * @param {string} artistName - Имя исполнителя
     */
    async showTrackDetails(trackName, artistName) {
        try {
            this.setLoading(true);
            const info = await lastFmApi.getTrackInfo(trackName, artistName);

            const detailsHtml = this.createTrackDetailsContent(info.track);
            this.detailsSection.querySelector('.details-content').innerHTML = detailsHtml;
            
            this.hidePopularContent();
            this.searchResultsSection.style.display = 'none';
            this.detailsSection.style.display = 'block';
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Создает HTML для детальной информации об исполнителе
     * @param {Object} artist - Информация об исполнителе
     * @param {Array} topTracks - Топ треки исполнителя
     * @returns {string} HTML разметка
     */
    createArtistDetailsContent(artist, topTracks) {
        return `
            <div class="artist-details">
                <img src="${getImageUrl(artist)}" alt="${artist.name}" class="artist-image">
                <h2 class="artist-name">${artist.name}</h2>
                <div class="artist-stats">
                    <p>Слушателей: ${artist.stats.listeners}</p>
                    <p>Проигрываний: ${artist.stats.playcount}</p>
                </div>
                <div class="artist-bio">
                    <h3>Биография</h3>
                    <p>${artist.bio.summary}</p>
                </div>
                <div class="artist-top-tracks">
                    <h3>Популярные треки</h3>
                    <ul>
                        ${topTracks.map(track => `
                            <li>
                                <span class="track-name">${track.name}</span>
                                <span class="track-plays">${track.playcount} прослушиваний</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Создает HTML для детальной информации о треке
     * @param {Object} track - Информация о треке
     * @returns {string} HTML разметка
     */
    createTrackDetailsContent(track) {
        return `
            <div class="track-details">
                <img src="${getImageUrl(track)}" alt="${track.name}" class="track-image">
                <h2 class="track-name">${track.name}</h2>
                <h3 class="track-artist">${track.artist.name}</h3>
                <div class="track-stats">
                    <p>Слушателей: ${track.listeners}</p>
                    <p>Проигрываний: ${track.playcount}</p>
                </div>
                ${track.wiki ? `
                    <div class="track-wiki">
                        <h3>О треке</h3>
                        <p>${track.wiki.summary}</p>
                    </div>
                ` : ''}
                ${track.toptags?.tag ? `
                    <div class="track-tags">
                        <h3>Теги</h3>
                        <div class="tags-list">
                            ${track.toptags.tag.map(tag => `
                                <span class="tag">${tag.name}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Инициализирует приложение
     */
    async initializeApp() {
        try {
            this.setLoading(true);
            await Promise.all([
                this.loadTopArtists(),
                this.loadTopTracks()
            ]);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Загружает популярных исполнителей
     */
    async loadTopArtists() {
        try {
            console.log('Загрузка популярных исполнителей, страница:', this.state.currentPage.artists);
            this.setLoading(true);

            // Получаем данные до анимации, чтобы убедиться, что они есть
            const data = await lastFmApi.getTopArtists(
                this.state.itemsPerPage,
                this.state.currentPage.artists
            );

            if (!data.artists || !data.artists.artist) {
                throw new Error('Некорректный формат данных от API');
            }

            // Плавно скрываем и удаляем текущие карточки
            if (this.popularArtistsContainer) {
                const currentCards = Array.from(this.popularArtistsContainer.children);
                // Анимация исчезновения
                currentCards.forEach(card => {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                });
                
                // Ждем завершения анимации
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Удаляем все старые карточки
                currentCards.forEach(card => card.remove());
            } else {
                console.error('Контейнер для исполнителей не найден');
                return;
            }

            // Создаем новые карточки
            const artistCards = data.artists.artist.map(artist => {
                const card = this.createArtistCard(artist);
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                return card;
            });

            // Добавляем новые карточки
            artistCards.forEach(card => {
                this.popularArtistsContainer.appendChild(card);
            });

            // Запускаем анимацию появления
            requestAnimationFrame(() => {
                artistCards.forEach(card => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                });
            });

            // Обновляем пагинацию
            const total = parseInt(data.artists['@attr'].total);
            const totalPages = Math.ceil(total / this.state.itemsPerPage);
            
            this.updatePagination(
                this.artistsPagination,
                this.state.currentPage.artists,
                totalPages
            );

        } catch (error) {
            console.error('Ошибка при загрузке исполнителей:', error);
            this.showError('Не удалось загрузить популярных исполнителей');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Загружает популярные треки
     */
    async loadTopTracks() {
        try {
            console.log('Загрузка популярных треков, страница:', this.state.currentPage.tracks);
            this.setLoading(true);

            // Получаем данные до анимации, чтобы убедиться, что они есть
            const data = await lastFmApi.getTopTracks(
                this.state.itemsPerPage,
                this.state.currentPage.tracks
            );

            if (!data.tracks || !data.tracks.track) {
                throw new Error('Некорректный формат данных от API');
            }

            // Плавно скрываем и удаляем текущие карточки
            if (this.popularTracksContainer) {
                const currentCards = Array.from(this.popularTracksContainer.children);
                // Анимация исчезновения
                currentCards.forEach(card => {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                });
                
                // Ждем завершения анимации
                await new Promise(resolve => setTimeout(resolve, 300));
                
                // Удаляем все старые карточки
                currentCards.forEach(card => card.remove());
            } else {
                console.error('Контейнер для треков не найден');
                return;
            }

            // Создаем новые карточки
            const trackCards = data.tracks.track.map(track => {
                const card = this.createTrackCard(track);
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                return card;
            });

            // Добавляем новые карточки
            trackCards.forEach(card => {
                this.popularTracksContainer.appendChild(card);
            });

            // Запускаем анимацию появления
            requestAnimationFrame(() => {
                trackCards.forEach(card => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                });
            });

            // Обновляем пагинацию
            const total = parseInt(data.tracks['@attr'].total);
            const totalPages = Math.ceil(total / this.state.itemsPerPage);
            
            this.updatePagination(
                this.tracksPagination,
                this.state.currentPage.tracks,
                totalPages
            );

        } catch (error) {
            console.error('Ошибка при загрузке треков:', error);
            this.showError('Не удалось загрузить популярные треки');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Обрабатывает поисковый запрос
     * @param {boolean} resetPage - Сбросить страницу на первую
     */
    async handleSearch(resetPage = true) {
        const query = this.searchInput.value.trim();
        if (!query) {
            this.showError('Пожалуйста, введите запрос для поиска');
            return;
        }

        console.log('Поисковый запрос:', query);
        console.log('Тип поиска:', this.state.searchType);

        if (resetPage) {
            this.state.currentPage.search = 1;
        }
        
        this.state.lastSearchQuery = query;
        this.setLoading(true);
        this.clearSearchResults();

        try {
            let results = [];
            let totalPages = 1;
            
            if (this.state.searchType === 'all' || this.state.searchType === 'artist') {
                console.log('Поиск артистов...');
                const artistRes = await lastFmApi.searchArtists(
                    query, 
                    this.state.itemsPerPage,
                    this.state.currentPage.search
                );
                
                if (artistRes.results.artistmatches && artistRes.results.artistmatches.artist) {
                    results.push({
                        type: 'artist',
                        title: 'Найденные исполнители',
                        items: artistRes.results.artistmatches.artist
                    });
                    totalPages = Math.ceil(parseInt(artistRes.results['opensearch:totalResults']) / this.state.itemsPerPage);
                }
            }
            
            if (this.state.searchType === 'all' || this.state.searchType === 'track') {
                console.log('Поиск треков...');
                const trackRes = await lastFmApi.searchTracks(
                    query, 
                    this.state.itemsPerPage,
                    this.state.currentPage.search
                );
                
                if (trackRes.results.trackmatches && trackRes.results.trackmatches.track) {
                    results.push({
                        type: 'track',
                        title: 'Найденные треки',
                        items: trackRes.results.trackmatches.track
                    });
                    const trackTotalPages = Math.ceil(parseInt(trackRes.results['opensearch:totalResults']) / this.state.itemsPerPage);
                    totalPages = Math.max(totalPages, trackTotalPages);
                }
            }

            console.log('Результаты поиска:', results);

            // Скрываем популярный контент и показываем результаты поиска
            this.hidePopularContent();
            this.detailsSection.style.display = 'none';
            this.searchResultsSection.style.display = 'block';

            // Отображаем результаты
            results.forEach(result => {
                if (result.items.length > 0) {
                    const section = this.createSearchSection(
                        result.title,
                        result.items,
                        result.type === 'artist' ? this.createArtistCard.bind(this) : this.createTrackCard.bind(this)
                    );
                    this.searchResultsContainer.appendChild(section);
                }
            });

            // Обновляем пагинацию поиска
            console.log('Обновление пагинации поиска:', {
                currentPage: this.state.currentPage.search,
                totalPages: totalPages
            });
            
            this.updatePagination(
                this.searchPagination,
                this.state.currentPage.search,
                totalPages
            );

        } catch (error) {
            console.error('Ошибка при поиске:', error);
            this.showError(error.message || 'Произошла ошибка при поиске');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Создает секцию с результатами поиска
     * @param {string} title - Заголовок секции
     * @param {Array} items - Массив элементов
     * @param {Function} createCard - Функция создания карточки
     * @returns {HTMLElement} Секция с результатами
     */
    createSearchSection(title, items, createCard) {
        const section = createElement('section', { className: 'popular-section' });
        const heading = createElement('h2', { className: 'section-title' }, title);
        section.appendChild(heading);

        if (items.length) {
            const grid = createElement('div', { className: 'content-grid' });
            items.forEach(item => grid.appendChild(createCard(item)));
            section.appendChild(grid);
        } else {
            section.appendChild(createElement('p', {}, 'Ничего не найдено.'));
        }

        return section;
    }

    /**
     * Очищает результаты поиска
     */
    clearSearchResults() {
        while (this.searchResultsContainer.firstChild) {
            this.searchResultsContainer.removeChild(this.searchResultsContainer.firstChild);
        }
    }

    /**
     * Скрывает секции с популярным контентом
     */
    hidePopularContent() {
        if (this.popularArtistsSection) {
            this.popularArtistsSection.style.display = 'none';
        }
        if (this.popularTracksSection) {
            this.popularTracksSection.style.display = 'none';
        }
    }

    /**
     * Показывает секции с популярным контентом
     */
    showPopularContent() {
        if (this.popularArtistsSection) {
            this.popularArtistsSection.style.display = 'block';
        }
        if (this.popularTracksSection) {
            this.popularTracksSection.style.display = 'block';
        }
        if (this.searchResultsSection) {
        this.searchResultsSection.style.display = 'none';
        }
    }

    /**
     * Отображает список исполнителей
     * @param {Array} artists - Массив исполнителей
     */
    displayArtists(artists) {
        console.log('Отображение артистов:', artists.length);
        this.clearContainer(this.popularArtistsContainer);
        artists.forEach(artist => {
            this.popularArtistsContainer.appendChild(this.createArtistCard(artist));
        });
    }

    /**
     * Отображает список треков
     * @param {Array} tracks - Массив треков
     */
    displayTracks(tracks) {
        console.log('Отображение треков:', tracks.length);
        this.clearContainer(this.popularTracksContainer);
        tracks.forEach(track => {
            this.popularTracksContainer.appendChild(this.createTrackCard(track));
        });
    }

    /**
     * Очищает контейнер
     * @param {HTMLElement} container - Контейнер для очистки
     */
    clearContainer(container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    /**
     * Показывает сообщение об ошибке
     * @param {string} message - Текст сообщения
     */
    showError(message) {
        if (this.errorContainer) {
        this.errorContainer.textContent = message;
        this.errorContainer.style.display = 'block';
        setTimeout(() => {
            this.errorContainer.style.display = 'none';
        }, 5000);
        }
    }

    /**
     * Управляет индикатором загрузки
     * @param {boolean} isLoading - Состояние загрузки
     */
    setLoading(isLoading) {
        if (this.loadingIndicator) {
        this.loadingIndicator.style.display = isLoading ? 'block' : 'none';
            
            // Отключаем все кнопки во время загрузки
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                button.disabled = isLoading;
            });
        }
    }

    /**
     * Создает карточку исполнителя
     * @param {Object} artist - Данные исполнителя
     * @returns {HTMLElement} Элемент карточки
     */
    createArtistCard(artist) {
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

    /**
     * Создает карточку трека
     * @param {Object} track - Данные трека
     * @returns {HTMLElement} Элемент карточки
     */
    createTrackCard(track) {
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

// Создаем экземпляр приложения
    new App();