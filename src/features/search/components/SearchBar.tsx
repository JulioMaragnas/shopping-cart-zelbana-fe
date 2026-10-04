import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useSearchSuggestions } from '../api/useCatalogSearch';
import { useDebounce } from '../hooks/useDebounce';
import styles from './SearchBar.module.css';

export const SearchBar = ({ onSearch }: { onSearch: (q: string) => void }) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const debouncedInput = useDebounce(inputValue, 150); // debounce ultra rápido para typeahead
  const { data: suggestions = [] } = useSearchSuggestions(debouncedInput);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Muestra el dropdown cuando hay sugerencias
  useEffect(() => {
    if (debouncedInput.length > 0 && suggestions.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [debouncedInput, suggestions]);

  // Resetea el índice al cambiar las sugerencias
  useEffect(() => {
    setActiveIndex(-1);
  }, [suggestions]);

  // Manejar clic por fuera para cerrar el menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        handleSelect(suggestions[activeIndex]);
      } else {
        onSearch(inputValue);
        setIsOpen(false);
      }
    }
  };

  const handleSelect = (suggestion: string) => {
    setInputValue(suggestion);
    setIsOpen(false);
    onSearch(suggestion);
  };

  // Resalta en negrita la parte NO escrita de la palabra
  const highlightText = (text: string, match: string) => {
    if (!match) return text;
    const parts = text.split(new RegExp(`(${match})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === match.toLowerCase() ? 
            <span key={i} className={styles.normalWeight}>{part}</span> : 
            <strong key={i} className={styles.boldWeight}>{part}</strong>
        )}
      </>
    );
  };

  return (
    <div className={styles.searchWrapper} ref={wrapperRef}>
      <div className={styles.inputContainer}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar productos, marcas y más..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
        />
        <button 
          className={styles.searchButton} 
          onClick={() => { onSearch(inputValue); setIsOpen(false); }}
          aria-label="Buscar"
        >
          <Search size={18} />
        </button>
      </div>
      
      {isOpen && (
        <ul className={styles.dropdown}>
          {suggestions.map((suggestion, idx) => (
            <li 
              key={idx}
              data-testid={`suggestion-item-${idx}`}
              data-active={idx === activeIndex}
              className={`${styles.suggestionItem} ${idx === activeIndex ? styles.active : ''}`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <Search size={14} className={styles.dropdownIcon} />
              <span className={styles.suggestionText}>
                {highlightText(suggestion, debouncedInput)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
