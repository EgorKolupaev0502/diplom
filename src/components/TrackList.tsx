import React, { useState, useEffect, useRef } from 'react';
import { LastFmApi } from '../api/lastfm';

interface Track {
  name: string;
  artist: {
    name: string;
  };
  image: Array<{ '#text': string; size: string }>;
}

interface TrackListProps {
  api: LastFmApi;
  initialTracks?: Track[];
}

// Используем тот же кэш изображений
const imageCache = new Map<string, string>();

const TrackList: React.FC<TrackListProps> = ({ api, initialTracks = [] }) => {
  const [tracks, setTracks] = useState<Track[]>(initialTracks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10; // Показываем по 10 элементов на странице
  const loadingRef = useRef<boolean>(false);

  const loadTracks = async (nextPage: number, isLoadMore = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const data = await api.getTopTracks(ITEMS_PER_PAGE, nextPage);
      
      if (!data.tracks?.track) {
        throw new Error('Не удалось загрузить данные');
      }

      const newTracks = data.tracks.track;
      const total = parseInt(data.tracks['@attr'].total);

      // Предварительно загружаем изображения
      await Promise.all(
        newTracks.map(async (track: Track) => {
          const imageUrl = getImageUrl(track);
          if (!imageCache.has(imageUrl)) {
            try {
              const response = await fetch(imageUrl);
              const blob = await response.blob();
              const objectUrl = URL.createObjectURL(blob);
              imageCache.set(imageUrl, objectUrl);
            } catch (err) {
              console.error('Failed to cache image:', err);
            }
          }
        })
      );

      if (isLoadMore) {
        const existingIds = new Set(tracks.map((t: Track) => `${t.artist.name}-${t.name}`));
        const uniqueNewTracks = newTracks.filter((t: Track) => !existingIds.has(`${t.artist.name}-${t.name}`));
        setTracks(prev => [...prev, ...uniqueNewTracks]);
      } else {
        setTracks(newTracks);
      }

      const hasMoreItems = nextPage * ITEMS_PER_PAGE < total;
      setHasMore(hasMoreItems);
      
      setCurrentPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки треков');
      if (isLoadMore) {
        setCurrentPage(prev => prev);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadTracks(1, false);
    
    // Очистка кэша при размонтировании
    return () => {
      imageCache.forEach(url => URL.revokeObjectURL(url));
      imageCache.clear();
    };
  }, []);

  const handleLoadMore = async () => {
    if (!loading && hasMore && !loadingRef.current) {
      const nextPage = currentPage + 1;
      await loadTracks(nextPage, true);
    }
  };

  const getImageUrl = (track: Track) => {
    if (!track.image || !Array.isArray(track.image)) {
      return 'https://via.placeholder.com/174x174?text=Нет+изображения';
    }
    
    // Ищем изображение среднего размера для оптимальной загрузки
    const mediumImage = track.image.find(img => img.size === 'medium' || img.size === 'small');
    if (mediumImage && mediumImage['#text']) {
      return mediumImage['#text'];
    }
    
    // Если нет среднего размера, берем последнее доступное
    for (let i = track.image.length - 1; i >= 0; i--) {
      if (track.image[i]['#text']) {
        return track.image[i]['#text'];
      }
    }
    
    return 'https://via.placeholder.com/174x174?text=Нет+изображения';
  };

  if (error) return <div className="error-message">{error}</div>;

  return (
    <section className="popular-section">
      <h2 className="section-title">Популярные треки</h2>
      <div className="content-grid">
        {tracks.map((track) => (
          <article
            key={`${track.artist.name}-${track.name}`}
            className="content-card"
          >
            <img
              src={imageCache.get(getImageUrl(track)) || getImageUrl(track)}
              alt={`${track.artist.name} - ${track.name}`}
              className="card-image"
              loading="lazy"
              width="174"
              height="174"
            />
            <h3 className="card-title">{track.name}</h3>
            <p className="card-artist">{track.artist.name}</p>
          </article>
        ))}
      </div>
      {hasMore && (
        <div className="load-more">
          <button 
            className="load-more-button"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'ЕЩЁ'}
          </button>
        </div>
      )}
    </section>
  );
};

export default TrackList; 