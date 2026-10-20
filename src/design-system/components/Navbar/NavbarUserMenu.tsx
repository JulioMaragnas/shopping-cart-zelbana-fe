import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { NavbarUserMenuProps } from '../../../features/auth/types';
import styles from './NavbarUserMenu.module.css';

export const NavbarUserMenu: React.FC<NavbarUserMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const firstName = user.name ? user.name.trim().split(/\s+/)[0] : '';

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(user.name);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Accessibility: Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.triggerBtn}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        data-testid="navbar-user-dropdown-btn"
      >
        <span className={styles.avatar} aria-hidden="true">
          {initials}
        </span>
        <span className={styles.greetingText}>Hola, {firstName}</span>
        <span className={`${styles.caret} ${isOpen ? styles.caretOpen : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          className={styles.dropdownMenu}
          role="menu"
          data-testid="navbar-user-dropdown-menu"
        >
          <div className={styles.userInfoHeader}>
            <p className={styles.userName}>{user.name}</p>
            <p className={styles.userEmail}>{user.email}</p>
          </div>

          <Link
            to="/orders"
            className={styles.menuItemLink}
            onClick={() => setIsOpen(false)}
            data-testid="navbar-user-orders-link"
            role="menuitem"
          >
            <span>📦</span>
            <span>Mis Pedidos</span>
          </Link>

          <div className={styles.divider} role="separator" />

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogoutClick}
            data-testid="navbar-user-logout-btn"
            role="menuitem"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
};
