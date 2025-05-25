import React, { useState, useEffect, useRef } from 'react';
import { LastFmApi } from '../api/lastfm';

interface Artist {
  name: string;
  image: Array<{ '#text': string; size: string }>;
}

interface ArtistListProps {
  api: LastFmApi;
}

// Кэш для изображений
const imageCache = new Map<string, string>();

const ArtistList: React.FC<ArtistListProps> = ({ api }) => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10; // Показываем по 10 элементов на странице
  const loadingRef = useRef<boolean>(false);

  const loadArtists = async (nextPage: number, isLoadMore = false) => {
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const data = await api.getTopArtists(ITEMS_PER_PAGE, nextPage);
      
      if (!data.artists?.artist) {
        throw new Error('Не удалось загрузить данные');
      }

      const newArtists = data.artists.artist;
      const total = parseInt(data.artists['@attr'].total);

      await Promise.all(
        newArtists.map(async (artist: Artist) => {
          const imageUrl = getImageUrl(artist);
          if (!imageCache.has(imageUrl)) {
            try {
              const response = await fetch(imageUrl);
              const blob = await response.blob();
              imageCache.set(imageUrl, URL.createObjectURL(blob));
            } catch (err) {
              console.error('Failed to cache image:', err);
            }
          }
        })
      );

      if (isLoadMore) {
        const existingIds = new Set(artists.map((a: Artist) => a.name));
        const uniqueNewArtists = newArtists.filter((a: Artist) => !existingIds.has(a.name));
        setArtists(prev => [...prev, ...uniqueNewArtists]);
      } else {
        setArtists(newArtists);
      }

      setHasMore(nextPage * ITEMS_PER_PAGE < total);
      setCurrentPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки исполнителей');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    loadArtists(1, false);
    return () => {
      imageCache.forEach(url => URL.revokeObjectURL(url));
      imageCache.clear();
    };
  }, []);

  const getImageUrl = (artist: Artist) => {
    if (!artist.image?.length) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    }
    
    const mediumImage = artist.image.find(img => img.size === 'medium' || img.size === 'small');
    if (mediumImage?.['#text']) {
      return mediumImage['#text'];
    }
    
    const lastImage = artist.image.slice().reverse().find(img => img['#text']);
    return lastImage?.['#text'] || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  };

  if (error) return <div className="error-message">{error}</div>;

  return (
    <section className="popular-section">
      <h2 className="section-title">Популярные исполнители</h2>
      <div className="content-grid">
        {artists.map((artist) => (
          <article
            key={artist.name}
            className="content-card"
          >
            <img
              src={imageCache.get(getImageUrl(artist)) || getImageUrl(artist)}
              alt={artist.name}
              className="card-image"
              loading="lazy"
              width="174"
              height="174"
            />
            <h3 className="card-title">{artist.name}</h3>
          </article>
        ))}
      </div>
      {hasMore && (
        <div className="load-more">
          <button 
            className="load-more-button"
            onClick={() => loadArtists(currentPage + 1, true)}
            disabled={loading}
          >
            {loading ? 'Загрузка...' : 'ЕЩЁ'}
          </button>
        </div>
      )}
    </section>
  );
};

export default ArtistList; 