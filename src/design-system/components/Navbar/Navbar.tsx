import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useCartStore } from '../../../features/cart/store/useCartStore';
import { SearchBar } from '../../../features/search/components/SearchBar';
import { useCategories } from '../../../features/catalog/api/useCategories';

export function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cart = useCartStore((state) => state.cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentQuery = searchParams.get('query') || searchParams.get('q') || '';
  const currentCategoryId = searchParams.get('categoryId') || '';

  const { data: categories = [] } = useCategories();

  const handleSearch = (q: string) => {
    const nextParams = new URLSearchParams();
    if (currentCategoryId) {
      nextParams.set('categoryId', currentCategoryId);
    }
    const trimmed = q.trim();
    if (trimmed) {
      nextParams.set('query', trimmed);
    }
    nextParams.set('page', '1');
    navigate(`/?${nextParams.toString()}`);
  };

  const handleSelectCategory = (categoryId?: string) => {
    setIsDropdownOpen(false);
    const nextParams = new URLSearchParams();
    if (categoryId) {
      nextParams.set('categoryId', categoryId);
    }
    if (currentQuery) {
      nextParams.set('query', currentQuery);
    }
    nextParams.set('page', '1');
    navigate(`/?${nextParams.toString()}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <header className={styles.navbar}>
      <div className={styles.leftSection}>
        <Link to="/" className={styles.logo}>
          [ LOGO ]
        </Link>

        <div className={styles.dropdownContainer} ref={dropdownRef}>
          <button
            type="button"
            className={styles.dropdownTrigger}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
          >
            Categorías ▾
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdownMenu} role="menu">
              <button
                type="button"
                className={styles.dropdownItemAll}
                onClick={() => handleSelectCategory()}
              >
                Todas las categorías
              </button>

              {categories.map((parent) => (
                <div key={parent.id} className={styles.categoryGroup}>
                  <button
                    type="button"
                    className={styles.dropdownParentItem}
                    onClick={() => handleSelectCategory(parent.id)}
                  >
                    {parent.name}
                  </button>
                  {parent.children && parent.children.length > 0 && (
                    <div className={styles.categoryChildrenList}>
                      {parent.children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          className={styles.dropdownChildItem}
                          onClick={() => handleSelectCategory(child.id)}
                        >
                          ↳ {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.searchContainer}>
        <SearchBar onSearch={handleSearch} initialQuery={currentQuery} />
      </div>

      <div className={styles.rightSection}>
        <span className={styles.navLink}>Hola, Julio Cano</span>
        <span className={styles.navLink}>Ayuda</span>
        <span className={styles.navLink}>Español ▾</span>
        <Link to="/cart" className={styles.cartLink} aria-label="Ver carrito de compras">
          <div className={styles.cartContainer}>
            <span>🛒</span>
            {totalItems > 0 && (
              <span className={styles.cartBadge} data-testid="cart-badge">
                {totalItems}
              </span>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
