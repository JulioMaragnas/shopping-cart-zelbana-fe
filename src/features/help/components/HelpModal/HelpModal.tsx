import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { HelpModalProps, HelpTopic } from '../../types/help';
import { useHelpTopics } from '../../api/useHelpTopics';
import styles from './HelpModal.module.css';

interface CategoryOption {
  key: string;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryOption[] = [
  { key: 'all', label: 'Todos los temas', icon: '✨' },
  { key: 'shipping', label: 'Envíos y Entregas', icon: '🚚' },
  { key: 'payment', label: 'Pagos y Seguridad', icon: '💳' },
  { key: 'orders', label: 'Mis Pedidos', icon: '📦' },
  { key: 'support', label: 'Atención y Soporte', icon: '💬' },
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  const { data: topics = [], isLoading, isError } = useHelpTopics();

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedCategory('all');
      setExpandedTopicId(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Filtrado de tópicos por categoría y búsqueda
  const filteredTopics = useMemo(() => {
    let result = topics.filter((t) => t.isActive !== false);

    if (selectedCategory !== 'all') {
      result = result.filter(
        (t) => t.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.content.toLowerCase().includes(q)
      );
    }

    return result.sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );
  }, [topics, selectedCategory, searchQuery]);

  // Si hay tópicos filtrados y ninguno está expandido, expandir el primero
  useEffect(() => {
    if (filteredTopics.length > 0 && (!expandedTopicId || !filteredTopics.some((t) => t.id === expandedTopicId))) {
      setExpandedTopicId(filteredTopics[0].id);
    }
  }, [filteredTopics, expandedTopicId]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleToggleAccordion = (id: string) => {
    setExpandedTopicId((current) => (current === id ? null : id));
  };

  return (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      data-testid="help-modal-backdrop"
    >
      <div
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        data-testid="help-modal"
        ref={modalRef}
      >
        {/* Header con Buscador */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <span className={styles.brandPill}>Atención y Soporte Zelbana</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar Centro de Ayuda"
              data-testid="help-modal-close-btn"
            >
              ✕
            </button>
          </div>

          <div>
            <h2 id="help-modal-title" className={styles.title}>
              Centro de Ayuda y Preguntas Frecuentes
            </h2>
            <p className={styles.subtitle}>
              Resuelve tus dudas sobre envíos, pagos, seguimiento de órdenes y rutinas botánicas.
            </p>
          </div>

          <div className={styles.searchContainer}>
            <span className={styles.searchIcon} aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Buscar temas: envíos, devoluciones, formas de pago..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="help-search-input"
              aria-label="Buscar en Centro de Ayuda"
            />
          </div>
        </header>

        {/* Contenido Principal con Sidebar y Panel de Respuestas */}
        <div className={styles.mainGrid}>
          {/* Sidebar de Categorías */}
          <aside className={styles.sidebar} aria-label="Categorías de ayuda">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  className={`${styles.categoryTab} ${
                    isActive ? styles.categoryTabActive : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.key)}
                  data-testid="help-category-tab"
                  aria-pressed={isActive}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Panel de Contenido */}
          <section className={styles.contentPane}>
            {/* Estado 1: Loading Skeleton */}
            {isLoading && (
              <div
                className={styles.skeletonPane}
                role="status"
                aria-busy="true"
                aria-label="Cargando temas de ayuda..."
              >
                <div className={styles.skeletonItem} />
                <div className={styles.skeletonItem} />
                <div className={styles.skeletonItem} />
                <div className={styles.skeletonItem} />
              </div>
            )}

            {/* Estado 4: Error State */}
            {!isLoading && isError && (
              <div
                className={styles.emptyState}
                role="alert"
                aria-live="assertive"
              >
                <div className={styles.emptyIcon} aria-hidden="true">⚠️</div>
                <h3 className={styles.emptyTitle}>Servicio de ayuda temporalmente no disponible</h3>
                <p className={styles.emptyText}>
                  No pudimos conectar con la base de conocimientos. Nuestro equipo de soporte directo está disponible para ayudarte.
                </p>
              </div>
            )}

            {/* Estado 3: Empty State (Búsqueda sin coincidencias) */}
            {!isLoading && !isError && filteredTopics.length === 0 && (
              <div
                className={styles.emptyState}
                role="status"
                aria-live="polite"
              >
                <div className={styles.emptyIcon} aria-hidden="true">🔍</div>
                <h3 className={styles.emptyTitle}>No encontramos artículos para tu búsqueda</h3>
                <p className={styles.emptyText}>
                  Intenta con otros términos o comunícate directamente con nuestro equipo de atención por WhatsApp.
                </p>
              </div>
            )}

            {/* Estado 2: Populated / Success */}
            {!isLoading && !isError && filteredTopics.length > 0 && (
              <div className={styles.accordionList} role="region" aria-label="Preguntas frecuentes">
                {filteredTopics.map((topic) => {
                  const isExpanded = expandedTopicId === topic.id;
                  const isFreeShippingTopic =
                    topic.id === 'help-shipping' ||
                    topic.title.toLowerCase().includes('envío') ||
                    topic.title.toLowerCase().includes('envio');

                  return (
                    <article
                      key={topic.id}
                      className={`${styles.accordionItem} ${
                        isExpanded ? styles.accordionItemActive : ''
                      }`}
                      data-testid="help-accordion-item"
                    >
                      <button
                        type="button"
                        className={styles.accordionHeader}
                        onClick={() => handleToggleAccordion(topic.id)}
                        aria-expanded={isExpanded}
                        aria-controls={`topic-content-${topic.id}`}
                        id={`topic-header-${topic.id}`}
                      >
                        <span>{topic.title}</span>
                        <span
                          className={`${styles.accordionIcon} ${
                            isExpanded ? styles.accordionIconOpen : ''
                          }`}
                          aria-hidden="true"
                        >
                          ▼
                        </span>
                      </button>

                      {isExpanded && (
                        <div
                          id={`topic-content-${topic.id}`}
                          role="region"
                          aria-labelledby={`topic-header-${topic.id}`}
                          className={styles.accordionBody}
                        >
                          {isFreeShippingTopic && (
                            <div className={styles.freeShippingNotice}>
                              <span>✨</span>
                              <span>BENEFICIO DESTACADO: Envío Gratis en compras &gt; $50.00</span>
                            </div>
                          )}
                          <p style={{ margin: 0 }}>{topic.content}</p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {/* Tarjeta de Soporte Directo (Siempre visible para asistencia humana) */}
            <div
              className={styles.supportCard}
              data-testid="help-direct-support-card"
            >
              <h4 className={styles.supportTitle}>¿Necesitas asistencia directa?</h4>
              <div className={styles.supportChannels}>
                <a
                  href="https://wa.me/573001234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.supportLink}
                  aria-label="Contactar por WhatsApp al +57 (300) 123-4567"
                >
                  <span>💬</span>
                  <span>WhatsApp: +57 (300) 123-4567</span>
                </a>

                <a
                  href="mailto:soporte@zelbana.com"
                  className={styles.supportLink}
                  aria-label="Enviar correo a soporte@zelbana.com"
                >
                  <span>✉️</span>
                  <span>soporte@zelbana.com</span>
                </a>
              </div>
              <p className={styles.supportNote}>
                Atención botánica personalizada de lunes a sábado de 8:00 AM a 6:00 PM.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
