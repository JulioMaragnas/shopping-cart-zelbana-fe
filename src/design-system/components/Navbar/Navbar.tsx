import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import { useCartStore } from '../../../features/cart/store/useCartStore';

export function Navbar() {
  const cart = useCartStore((state) => state.cart);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className={styles.navbar}>
      <div className={styles.leftSection}>
        <Link to="/" className={styles.logo} style={{textDecoration: 'none'}}>[ LOGO ]</Link>
        <span className={styles.navLink}>Categorías ▾</span>
      </div>

      <div className={styles.searchContainer}>
        <input 
          type="text" 
          placeholder="Buscar productos, marcas y más..." 
          className={styles.searchInput}
        />
        <button className={styles.searchButton}>Q</button>
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
