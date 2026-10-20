import React from 'react';
import styles from './BuyBoxSortBar.module.css';

export type SortOption =
  | 'recommended'
  | 'best_selling'
  | 'highest_discount'
  | 'price_asc'
  | 'price_desc';

export interface BuyBoxSortBarProps {
  /** Opción de ordenamiento actualmente activa */
  activeSort: SortOption;
  /** Callback disparado al hacer clic en una píldora diferente */
  onSortChange: (newSort: SortOption) => void;
  /** Total de productos encontrados para el encabezado contextual */
  totalItems?: number;
  /** Deshabilita la barra durante carga crítica o catálogo vacío */
  disabled?: boolean;
}

export interface SortPillDefinition {
  id: SortOption;
  label: string;
  emoji: string;
  ariaLabel: string;
}

export const SORT_PILLS: readonly SortPillDefinition[] = [
  { id: 'recommended', emoji: '✨', label: 'Recomendados', ariaLabel: 'Ordenar por recomendaciones inteligentes' },
  { id: 'best_selling', emoji: '🔥', label: 'Más vendidos', ariaLabel: 'Ordenar por los productos más vendidos' },
  { id: 'highest_discount', emoji: '🏷️', label: 'Mayor descuento', ariaLabel: 'Ordenar por mayor porcentaje de descuento' },
  { id: 'price_asc', emoji: '💲', label: 'Menor precio', ariaLabel: 'Ordenar por precio de menor a mayor' },
  { id: 'price_desc', emoji: '💎', label: 'Mayor precio', ariaLabel: 'Ordenar por precio de mayor a menor' },
] as const;

export function BuyBoxSortBar({
  activeSort,
  onSortChange,
  totalItems,
  disabled = false,
}: BuyBoxSortBarProps) {
  return (
    <section
      className={`${styles.container} ${disabled ? styles.disabledBar : ''}`}
      aria-label="Ordenamiento y filtros del catálogo"
      data-testid="buybox-sort-bar"
    >
      {typeof totalItems === 'number' && (
        <span className={styles.itemCount} data-testid="buybox-item-count">
          {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
        </span>
      )}

      <div
        className={styles.pillTrack}
        role="group"
        aria-label="Criterios de ordenamiento"
      >
        <span className={styles.sortLabel} id="sort-group-label">
          Ordenar por:
        </span>

        <div className={styles.pillsContainer}>
          {SORT_PILLS.map((pill) => {
            const isActive = activeSort === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                role="button"
                aria-pressed={isActive}
                aria-label={pill.ariaLabel}
                disabled={disabled}
                data-testid={`sort-pill-${pill.id}`}
                className={`${styles.pill} ${isActive ? styles.pillActive : ''}`}
                onClick={() => {
                  if (!isActive && !disabled) {
                    onSortChange(pill.id);
                  }
                }}
              >
                <span className={styles.pillEmoji} aria-hidden="true">
                  {pill.emoji}
                </span>
                <span className={styles.pillText}>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
