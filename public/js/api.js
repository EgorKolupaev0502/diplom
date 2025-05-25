/**
 * Сервис для работы с API Last.fm
 */
class LastFmApi {
    constructor() {
        this.apiKey = null;
        this.baseUrl = 'https://ws.audioscrobbler.com/2.0/';
    }

    /**
     * Инициализирует API с ключом
     * @param {string} apiKey - Ключ API Last.fm
     */
    initialize(apiKey) {
        if (!apiKey) {
            throw new Error('API ключ обязателен для работы с Last.fm API');
        }
        this.apiKey = apiKey;
    }

    /**
     * Проверяет инициализацию API
     * @throws {Error} Если API не инициализирован
     */
    checkInitialization() {
        if (!this.apiKey) {
            throw new Error('API не инициализирован. Пожалуйста, вызовите метод initialize() с вашим API ключом.');
        }
    }

    /**
     * Выполняет запрос к API Last.fm
     * @param {Object} params - Параметры запроса
     * @returns {Promise<Object>} Ответ от API
     * @throws {Error} Если запрос не удался
     */
    async makeRequest(params) {
        this.checkInitialization();
        
        console.log('API запрос с параметрами:', {
            method: params.method,
            limit: params.limit,
            page: params.page
        });
        
        const queryParams = new URLSearchParams({
            ...params,
            api_key: this.apiKey,
            format: 'json'
        });

        const url = `${this.baseUrl}?${queryParams}`;
        console.log('Выполняется запрос к:', url);

        try {
            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                console.error('Ошибка HTTP:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url
                });
                throw new Error(`Ошибка HTTP: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.error) {
                console.error('Ошибка API Last.fm:', {
                    error: data.error,
                    message: data.message
                });
                throw new Error(data.message || `Ошибка Last.fm API: ${data.error}`);
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка запроса к API:', {
                error: error.message,
                params: params
            });
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Не удалось подключиться к Last.fm API. Проверьте подключение к интернету.');
            }
            throw new Error(`Не удалось получить данные от Last.fm: ${error.message}`);
        }
    }

    /**
     * Получает список популярных исполнителей
     * @param {number} limit - Количество исполнителей
     * @param {number} page - Номер страницы
     * @returns {Promise<Object>} Список популярных исполнителей
     */
    async getTopArtists(limit = 10, page = 1) {
        return this.makeRequest({
            method: 'chart.gettopartists',
            limit,
            page
        });
    }

    /**
     * Получает список популярных треков
     * @param {number} limit - Количество треков
     * @param {number} page - Номер страницы
     * @returns {Promise<Object>} Список популярных треков
     */
    async getTopTracks(limit = 10, page = 1) {
        return this.makeRequest({
            method: 'chart.gettoptracks',
            limit,
            page
        });
    }

    /**
     * Ищет исполнителей
     * @param {string} query - Поисковый запрос
     * @param {number} limit - Количество результатов на странице
     * @param {number} page - Номер страницы
     * @returns {Promise<Object>} Результаты поиска
     */
    async searchArtists(query, limit = 10, page = 1) {
        return this.makeRequest({
            method: 'artist.search',
            artist: query,
            limit,
            page
        });
    }

    /**
     * Ищет треки
     * @param {string} query - Поисковый запрос
     * @param {number} limit - Количество результатов на странице
     * @param {number} page - Номер страницы
     * @returns {Promise<Object>} Результаты поиска
     */
    async searchTracks(query, limit = 10, page = 1) {
        return this.makeRequest({
            method: 'track.search',
            track: query,
            limit,
            page
        });
}

    /**
     * Получает информацию об исполнителе
     * @param {string} artist - Имя исполнителя
     * @returns {Promise<Object>} Информация об исполнителе
     */
    async getArtistInfo(artist) {
        return this.makeRequest({
            method: 'artist.getInfo',
            artist,
            lang: 'ru'
        });
    }

    /**
     * Получает топ треков исполнителя
     * @param {string} artist - Имя исполнителя
     * @param {number} limit - Количество треков
     * @returns {Promise<Object>} Список топ треков
     */
    async getArtistTopTracks(artist, limit = 10) {
        return this.makeRequest({
            method: 'artist.getTopTracks',
            artist,
            limit
        });
    }

    /**
     * Получает информацию о треке
     * @param {string} track - Название трека
     * @param {string} artist - Имя исполнителя
     * @returns {Promise<Object>} Информация о треке
     */
    async getTrackInfo(track, artist) {
        return this.makeRequest({
            method: 'track.getInfo',
            track,
            artist,
            lang: 'ru'
        });
    }
}

// Создаем и экспортируем экземпляр API
const lastFmApi = new LastFmApi();
export default lastFmApi; 