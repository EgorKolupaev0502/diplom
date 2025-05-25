import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import ArtistList from './components/ArtistList';
import TrackList from './components/TrackList';
import SearchResults from './components/SearchResults';
import Footer from './components/Footer';
import { LastFmApi } from './api/lastfm';

interface Artist {
  name: string;
  image: Array<{ '#text': string; size: string }>;
}

interface Track {
  name: string;
  artist: { name: string };
  image: Array<{ '#text': string; size: string }>;
}

interface SearchResult {
  name: string;
  type: 'artist' | 'track' | 'album';
  artist?: { name: string };
  image: Array<{ '#text': string; size: string }>;
}

// Инициализируем API с ключом
const api = new LastFmApi();
api.initialize('efdc3fccaa2645cab4caa4f3e16908ac');

/**
 * Главный компонент приложения
 * @component
 */
const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'artist' | 'track' | 'album'>('all');
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  /**
   * Загружает начальные данные при монтировании компонента
   */
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoading(true);
        // Загружаем сначала артистов
        const artistsData = await api.getTopArtists(10);
        if (artistsData.artists?.artist) {
          setTopArtists(artistsData.artists.artist);
        }
        
        // Затем загружаем треки
        const tracksData = await api.getTopTracks(10);
        if (tracksData.tracks?.track) {
          setTopTracks(tracksData.tracks.track);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  /**
   * Обрабатывает поисковый запрос
   * @param {string} query - Поисковый запрос
   * @param {'all' | 'artist' | 'track' | 'album'} type - Тип поиска
   */
  const handleSearch = async (query: string, type: 'all' | 'artist' | 'track' | 'album') => {
    try {
      setLoading(true);
      setSearchQuery(query);
      setSearchType(type);
      setError(null);
      setSearchResults([]);
      
      if (type === 'all') {
        const data = await api.searchAll(query);
        setSearchResults([
          ...data.artists.map((item: Artist) => ({ ...item, type: 'artist' })),
          ...data.tracks.map((item: Track) => ({ ...item, type: 'track' })),
          ...data.albums.map((item: any) => ({ ...item, type: 'album' }))
        ]);
      } else {
        const data = await (
          type === 'artist' ? api.searchArtists(query) :
          type === 'track' ? api.searchTracks(query) :
          api.searchAlbums(query)
        );

        const matches = 
          type === 'artist' ? data.results?.artistmatches?.artist :
          type === 'track' ? data.results?.trackmatches?.track :
          data.results?.albummatches?.album;

        if (matches) {
          setSearchResults(matches.map((item: any) => ({ ...item, type })));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при поиске');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Сбрасывает состояние поиска
   */
  const resetSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="page">
      <div className="container">
        <Header onSearch={handleSearch} />
        
        {loading && <div className="loading-indicator">Загрузка...</div>}
        {error && (
          <div className="error-message">
            {error}
            <button className="retry-button" onClick={() => window.location.reload()}>
              Попробовать снова
            </button>
          </div>
        )}
        
        <main className="main-content">
          {!searchQuery && (
            <>
              <ArtistList api={api} />
              <TrackList api={api} initialTracks={topTracks} />
            </>
          )}
          {searchQuery && (
            <SearchResults
              api={api}
              query={searchQuery}
              type={searchType}
              onReset={resetSearch}
            />
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default App;
