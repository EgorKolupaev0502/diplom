import React, { useState, FormEvent } from 'react';
import './Header.css';

/**
 * Интерфейс пропсов компонента Header
 * @interface HeaderProps
 * @property {function} onSearch - Функция обработки поиска
 */
interface HeaderProps {
  onSearch: (query: string, type: 'all' | 'artist' | 'track' | 'album') => void;
}

/**
 * Компонент заголовка с поисковой формой
 * @component
 * @param {HeaderProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент заголовка
 */
const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'artist' | 'track' | 'album'>('all');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isSelectFocused, setIsSelectFocused] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isButtonActive, setIsButtonActive] = useState(false);

  /**
   * Обработчик отправки формы поиска
   * @param {FormEvent} e - Событие отправки формы
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), searchType);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <h1 className="logo">Last.fm</h1>
          <form className="search-form" onSubmit={handleSubmit}>
            <div className="search-container">
              <input
                type="text"
                className={`search-input ${isInputFocused ? 'search-input-focused' : ''}`}
                placeholder="Поиск музыки..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              <select
                className={`search-type ${isSelectFocused ? 'search-type-focused' : ''}`}
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'all' | 'artist' | 'track' | 'album')}
                onFocus={() => setIsSelectFocused(true)}
                onBlur={() => setIsSelectFocused(false)}
              >
                <option value="all">Все результаты</option>
                <option value="artist">Исполнители</option>
                <option value="track">Треки</option>
                <option value="album">Альбомы</option>
              </select>
              <button
                type="submit"
                className={`search-button ${isButtonHovered ? 'search-button-hover' : ''} ${isButtonActive ? 'search-button-active' : ''}`}
                onMouseEnter={() => setIsButtonHovered(true)}
                onMouseLeave={() => setIsButtonHovered(false)}
                onMouseDown={() => setIsButtonActive(true)}
                onMouseUp={() => setIsButtonActive(false)}
              >
                Поиск
              </button>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header; 