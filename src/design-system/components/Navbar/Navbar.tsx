import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useCartStore } from '../../../features/cart/store/useCartStore';
import { SearchBar } from '../../../features/search/components/SearchBar';

export function Navbar() {
  const cart = useCartStore((state) => state.cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const navigate = useNavigate();

  const handleSearch = (q: string) => {
    navigate(`/?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.leftSection}>
        <Link to="/" className={styles.logo} style={{textDecoration: 'none'}}>[ LOGO ]</Link>
        <span className={styles.navLink}>Categorías ▾</span>
      </div>

      <div className={styles.searchContainer}>
        <SearchBar onSearch={handleSearch} />
      </div>

      <div className={styles.rightSection}>
        <span className={styles.navLink}>Hola, Julio Cano</span>
        <span className={styles.navLink}>Ayuda</span>
        <span className={styles.navLink}>Español ▾</span>
        <Link to="/cart" style={{textDecoration: 'none'}}>
          <div className={styles.cartContainer}>
            <span>🛒</span>
            {totalItems > 0 && (
              <span className={styles.cartBadge} data-testid="cart-badge">{totalItems}</span>
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
