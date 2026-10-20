import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useCartStore } from '../../../features/cart/store/useCartStore';
import { SearchBar } from '../../../features/search/components/SearchBar';
import { useCategories } from '../../../features/catalog/api/useCategories';
import { HelpModal } from '../../../features/help/components/HelpModal/HelpModal';
import { useAuthStore } from '../../../features/auth/store/useAuthStore';
import { NavbarUserMenu } from './NavbarUserMenu';

export function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cart = useCartStore((state) => state.cart);
  const toggleDrawer = useCartStore((state) => state.toggleDrawer);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentQuery = searchParams.get('query') || searchParams.get('q') || '';
  const currentCategoryId = searchParams.get('categoryId') || '';

  const { data: categories = [] } = useCategories();

  const handleCartClick = (e: React.MouseEvent) => {
    if (location.pathname === '/cart' || location.pathname.startsWith('/checkout')) {
      return;
    }
    e.preventDefault();
    toggleDrawer();
  };


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

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const [customerName] = useState<string | null>(() => {
    return typeof window !== 'undefined'
      ? localStorage.getItem('zelbana-customer-name')
      : null;
  });

  const firstName = customerName ? customerName.trim().split(/\s+/)[0] : '';

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
        {isAuthenticated && user ? (
          <NavbarUserMenu user={user} onLogout={logout} />
        ) : firstName ? (
          <span className={styles.navGreeting} data-testid="navbar-greeting">
            Hola, {firstName}
          </span>
        ) : (
          <div className={styles.authLinks} data-testid="navbar-auth-links">
            <Link to="/login" className={styles.authLink}>
              Iniciar Sesión
            </Link>
            <Link to="/register" className={styles.authLink}>
              Registrarse
            </Link>
          </div>
        )}

        <Link
          to="/orders"
          className={styles.navLink}
          data-testid="nav-link-my-orders"
        >
          Mis Pedidos
        </Link>

        <button
          type="button"
          className={styles.navButton}
          onClick={() => setIsHelpOpen(true)}
          data-testid="navbar-help-btn"
          aria-label="Abrir Centro de Ayuda"
        >
          Ayuda
        </button>

        <span className={styles.navLink}>Español ▾</span>
        <Link
          to="/cart"
          className={styles.cartLink}
          data-testid="cart-button"
          aria-label="Ver carrito de compras"
          onClick={handleCartClick}
        >
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

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </header>
  );
}
