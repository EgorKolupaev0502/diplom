import React, { useState, useEffect } from 'react';
import { LastFmApi } from '../api/lastfm';
import './SearchResults.css';

/**
 * Интерфейс элемента поискового результата
 * @interface SearchItem
 */
interface SearchItem {
  name: string;
  type: 'artist' | 'track' | 'album';
  artist?: {
    name: string;
  };
  image: Array<{ '#text': string; size: string }>;
}

/**
 * Интерфейс состояния результатов поиска
 * @interface ResultsState
 */
interface ResultsState {
  artists: SearchItem[];
  tracks: SearchItem[];
  albums: SearchItem[];
}

/**
 * Интерфейс состояния пагинации
 * @interface PaginationState
 */
interface PaginationState {
  artists: { page: number; hasMore: boolean; total: number; loading: boolean };
  tracks: { page: number; hasMore: boolean; total: number; loading: boolean };
  albums: { page: number; hasMore: boolean; total: number; loading: boolean };
}

/**
 * Интерфейс пропсов компонента SearchResults
 * @interface SearchResultsProps
 */
interface SearchResultsProps {
  query: string;
  type: 'all' | 'artist' | 'track' | 'album';
  onReset: () => void;
  api: LastFmApi;
}

/**
 * Компонент отображения результатов поиска
 * @component
 */
const SearchResults: React.FC<SearchResultsProps> = ({ query, type, onReset, api }) => {
  const [results, setResults] = useState<ResultsState>({
    artists: [],
    tracks: [],
    albums: []
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    artists: { page: 1, hasMore: true, total: 0, loading: false },
    tracks: { page: 1, hasMore: true, total: 0, loading: false },
    albums: { page: 1, hasMore: true, total: 0, loading: false }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 10;

  /**
   * Загрузка результатов поиска
   * @param {string} contentType - Тип контента (artist, track, album)
   * @param {boolean} isLoadMore - Флаг загрузки дополнительных результатов
   */
  const loadResults = async (contentType: 'artist' | 'track' | 'album', isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setPagination(prev => ({
          ...prev,
          [`${contentType}s`]: { ...prev[`${contentType}s`], loading: true }
        }));
      } else {
        setLoading(true);
      }
      setError(null);

      const currentPage = isLoadMore ? pagination[`${contentType}s`].page + 1 : 1;
      let data;

      switch (contentType) {
        case 'artist':
          data = await api.searchArtists(query, ITEMS_PER_PAGE, currentPage);
          break;
        case 'track':
          data = await api.searchTracks(query, ITEMS_PER_PAGE, currentPage);
          break;
        case 'album':
          data = await api.searchAlbums(query, ITEMS_PER_PAGE, currentPage);
          break;
      }

      const matches = contentType === 'artist' ? data.results?.artistmatches?.artist :
                     contentType === 'track' ? data.results?.trackmatches?.track :
                     data.results?.albummatches?.album;

      const total = parseInt(data.results['opensearch:totalResults'] || '0');
      const hasMore = currentPage * ITEMS_PER_PAGE < total;
      
      const newItems = matches?.map((item: any) => ({ ...item, type: contentType })) || [];

      if (isLoadMore) {
        const existingIds = new Set(results[`${contentType}s`].map(item => 
          `${item.type}-${item.name}-${item.artist?.name || ''}`));
        const uniqueNewItems = newItems.filter((item: SearchItem) => 
          !existingIds.has(`${item.type}-${item.name}-${item.artist?.name || ''}`));
        
        setResults(prev => ({
          ...prev,
          [`${contentType}s`]: [...prev[`${contentType}s`], ...uniqueNewItems]
        }));
      } else {
        setResults(prev => ({
          ...prev,
          [`${contentType}s`]: newItems
        }));
      }

      setPagination(prev => ({
        ...prev,
        [`${contentType}s`]: { 
          page: currentPage, 
          hasMore, 
          total,
          loading: false
        }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки результатов');
      setPagination(prev => ({
        ...prev,
        [`${contentType}s`]: { 
          ...prev[`${contentType}s`],
          loading: false
        }
      }));
    } finally {
      if (!isLoadMore) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const loadInitialResults = async () => {
      if (type === 'all') {
        await Promise.all([
          loadResults('artist'),
          loadResults('track'),
          loadResults('album')
        ]);
      } else {
        await loadResults(type);
      }
    };

    setResults({ artists: [], tracks: [], albums: [] });
    setPagination({
      artists: { page: 1, hasMore: true, total: 0, loading: false },
      tracks: { page: 1, hasMore: true, total: 0, loading: false },
      albums: { page: 1, hasMore: true, total: 0, loading: false }
    });
    loadInitialResults();
  }, [query, type]);

  /**
   * Получение URL изображения
   * @param {SearchItem} item - Элемент результата поиска
   * @returns {string} URL изображения
   */
  const getImageUrl = (item: SearchItem) => {
    if (!item.image?.length) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    }
    
    const mediumImage = item.image.find(img => img.size === 'medium' || img.size === 'small');
    if (mediumImage?.['#text']) {
      return mediumImage['#text'];
    }
    
    const lastImage = item.image.slice().reverse().find(img => img['#text']);
    return lastImage?.['#text'] || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  };

  /**
   * Отрисовка секции результатов
   * @param {string} title - Заголовок секции
   * @param {SearchItem[]} items - Элементы для отображения
   * @param {'artist' | 'track' | 'album'} contentType - Тип контента
   */
  const renderResultSection = (title: string, items: SearchItem[], contentType: 'artist' | 'track' | 'album') => {
    if ((type !== 'all' && type !== contentType) || items.length === 0) return null;

    const paginationInfo = pagination[`${contentType}s`];

    return (
      <div className={`result-section ${contentType === 'album' ? 'result-section-last' : ''}`}>
        <h3 className="result-section-title">
          {title} 
          <span className="result-count">
            {items.length} из {paginationInfo.total}
          </span>
        </h3>
        <div className="content-grid">
          {items.map((item, index) => (
            <article
              key={`${item.type}-${item.name}-${item.artist?.name || ''}-${index}`}
              className="content-card"
            >
              <img
                src={getImageUrl(item)}
                alt={item.name}
                className="card-image"
                loading="lazy"
                width="174"
                height="174"
              />
              <h3 className="card-title">{item.name}</h3>
              {(item.type === 'track' || item.type === 'album') && item.artist && (
                <p className="card-artist">{item.artist.name}</p>
              )}
            </article>
          ))}
        </div>
        {paginationInfo.hasMore && (
          <div className="load-more">
            <button 
              className={`load-more-button ${paginationInfo.loading ? 'load-more-button-loading' : ''}`}
              onClick={() => loadResults(contentType, true)}
              disabled={paginationInfo.loading}
            >
              {paginationInfo.loading ? 'Загрузка...' : 'ЕЩЁ'}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (error) return <div className="error-message">{error}</div>;

  return (
    <section className="search-results">
      <div className="search-header">
        <h2 className="section-title">
          Результаты поиска: {query}
          {type !== 'all' && ` (${
            type === 'artist' ? 'Исполнители' :
            type === 'track' ? 'Треки' :
            'Альбомы'
          })`}
        </h2>
        <button 
          className="return-button"
          onClick={onReset}
        >
          На главную
        </button>
      </div>
      
      {!loading && Object.values(results).every(items => items.length === 0) ? (
        <p className="no-results">Ничего не найдено</p>
      ) : (
        <>
          {renderResultSection('Исполнители', results.artists, 'artist')}
          {renderResultSection('Треки', results.tracks, 'track')}
          {renderResultSection('Альбомы', results.albums, 'album')}
        </>
      )}
    </section>
  );
};

export default SearchResults; 