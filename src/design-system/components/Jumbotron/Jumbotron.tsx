import React from 'react';
import styles from './Jumbotron.module.css';

export function Jumbotron() {
  return (
    <div className={styles.jumbotron} data-testid="jumbotron">
      <span className={styles.text}>Jumbotron carrusel de productos</span>
    </div>
  );
}
