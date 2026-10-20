import React from 'react';
import type { SocialDividerProps } from '../types';
import styles from './SocialDivider.module.css';

export const SocialDivider: React.FC<SocialDividerProps> = ({
  label = 'o con tu correo',
  className = '',
}) => {
  return (
    <div
      className={`${styles.divider} ${className}`}
      data-testid="social-divider"
      role="separator"
      aria-label={label}
    >
      <span className={styles.dividerLine} aria-hidden="true" />
      <span className={styles.dividerText} data-testid="social-divider-text">
        {label}
      </span>
      <span className={styles.dividerLine} aria-hidden="true" />
    </div>
  );
};
