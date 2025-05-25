/**
 * Класс для работы с Last.fm API
 * @class LastFmApi
 */
export class LastFmApi {
  private apiKey: string;
  private baseUrl = 'https://ws.audioscrobbler.com/2.0/';

  constructor() {
    this.apiKey = '';
  }

  /**
   * Инициализация API с ключом
   * @param {string} apiKey - API ключ Last.fm
   */
  initialize(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Выполняет HTTP запрос без использования fetch
   * @param {string} url - URL для запроса
   * @returns {Promise<any>} Результат запроса в формате JSON
   * @private
   */
  private makeHttpRequest(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          reject(new Error(`HTTP error! status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = function() {
        reject(new Error('Network error occurred'));
      };
      
      xhr.send();
    });
  }

  /**
   * Выполняет запрос к API Last.fm
   * @param {Record<string, string>} params - Параметры запроса
   * @returns {Promise<any>} Результат запроса в формате JSON
   * @throws {Error} Ошибка при выполнении запроса
   * @private
   */
  private async makeRequest(params: Record<string, string>) {
    try {
      const queryParams = new URLSearchParams({
        ...params,
        api_key: this.apiKey,
        format: 'json'
      }).toString();

      return await this.makeHttpRequest(`${this.baseUrl}?${queryParams}`);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Поиск по всем типам контента (исполнители, треки, альбомы)
   * @param {string} query - Поисковый запрос
   * @param {number} [limit=10] - Количество результатов на страницу
   * @param {number} [page=1] - Номер страницы
   * @returns {Promise<{artists: any[], tracks: any[], albums: any[]}>} Результаты поиска
   */
  async searchAll(query: string, limit = 10, page = 1) {
    const [artists, tracks, albums] = await Promise.all([
      this.searchArtists(query, limit, page),
      this.searchTracks(query, limit, page),
      this.searchAlbums(query, limit, page)
    ]);

    return {
      artists: artists.results?.artistmatches?.artist || [],
      tracks: tracks.results?.trackmatches?.track || [],
      albums: albums.results?.albummatches?.album || []
    };
  }

  /**
   * Поиск исполнителей
   * @param {string} query - Поисковый запрос
   * @param {number} [limit=10] - Количество результатов на страницу
   * @param {number} [page=1] - Номер страницы
   * @returns {Promise<any>} Результаты поиска исполнителей
   */
  async searchArtists(query: string, limit = 10, page = 1) {
    const data = await this.makeRequest({
      method: 'artist.search',
      artist: query,
      limit: limit.toString(),
      page: page.toString()
    });
    return data;
  }

  /**
   * Поиск треков
   * @param {string} query - Поисковый запрос
   * @param {number} [limit=10] - Количество результатов на страницу
   * @param {number} [page=1] - Номер страницы
   * @returns {Promise<any>} Результаты поиска треков
   */
  async searchTracks(query: string, limit = 10, page = 1) {
    const data = await this.makeRequest({
      method: 'track.search',
      track: query,
      limit: limit.toString(),
      page: page.toString()
    });
    return data;
  }

  /**
   * Поиск альбомов
   * @param {string} query - Поисковый запрос
   * @param {number} [limit=10] - Количество результатов на страницу
   * @param {number} [page=1] - Номер страницы
   * @returns {Promise<any>} Результаты поиска альбомов
   */
  async searchAlbums(query: string, limit = 10, page = 1) {
    const data = await this.makeRequest({
      method: 'album.search',
      album: query,
      limit: limit.toString(),
      page: page.toString()
    });
    return data;
  }

  /**
   * Получение популярных исполнителей
   * @param {number} [limit=10] - Количество результатов на страницу
   * @param {number} [page=1] - Номер страницы
   * @returns {Promise<any>} Список популярных исполнителей
   */
  async getTopArtists(limit = 10, page = 1) {
    const data = await this.makeRequest({
      method: 'chart.gettopartists',
      limit: limit.toString(),
      page: page.toString()
    });
    return data;
  }

  /**
   * Получение популярных треков
   * @param {number} [limit=10] - Количество результатов на страницу
   * @param {number} [page=1] - Номер страницы
   * @returns {Promise<any>} Список популярных треков
   */
  async getTopTracks(limit = 10, page = 1) {
    const data = await this.makeRequest({
      method: 'chart.gettoptracks',
      limit: limit.toString(),
      page: page.toString()
    });
    return data;
  }

  async getArtistInfo(artist: string) {
    return this.makeRequest({
      method: 'artist.getInfo',
      artist,
      lang: 'ru'
    });
  }

  async getTrackInfo(track: string, artist: string) {
    return this.makeRequest({
      method: 'track.getInfo',
      track,
      artist,
      lang: 'ru'
    });
  }

  async getAlbumInfo(album: string, artist: string) {
    return this.makeRequest({
      method: 'album.getInfo',
      album,
      artist,
      lang: 'ru'
    });
  }
} 