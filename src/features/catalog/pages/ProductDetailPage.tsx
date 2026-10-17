import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { useProductDetail } from '../api/useProductDetail';
import { useCategories } from '../api/useCategories';
import { useCartStore } from '../../cart/store/useCartStore';
import { findCategoryName } from '../utils/findCategoryName';
import styles from './ProductDetailPage.module.css';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProductDetail(id);
  const { data: categories = [] } = useCategories();
  const addItem = useCartStore((state) => state.addItem);
  const cart = useCartStore((state) => state.cart);

  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [mainImageError, setMainImageError] = useState(false);
  const [brokenThumbnails, setBrokenThumbnails] = useState<Record<number, boolean>>({});
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [addedQuantityNotice, setAddedQuantityNotice] = useState<number | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSelectedPhoto(0);
    setMainImageError(false);
    setBrokenThumbnails({});
    setQuantity(1);
  }, [id]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className={styles.container}>
          <div className={styles.loadingSkeleton}>Cargando detalle del producto...</div>
        </main>
      </>
    );
  }

  if (isError || !product) {
    return (
      <>
        <Navbar />
        <main className={styles.container}>
          <div className={styles.notFoundContainer}>
            <h2>Producto no encontrado</h2>
            <p>El producto solicitado no existe o no se encuentra disponible actualmente.</p>
            <Link to="/" className={styles.backLink}>
              ← Volver al catálogo
            </Link>
          </div>
        </main>
      </>
    );
  }

  const {
    name,
    description,
    thumbnailUrl,
    photos = [],
    salePrice,
    discountPercentage = 0,
    categoryId,
    categoryName,
    specs = [],
    disponible,
    lowStock,
    maxOrderQuantity = 0,
  } = product;

  const galleryPhotos = (
    photos.length > 0 ? photos : thumbnailUrl ? [thumbnailUrl] : []
  ).slice(0, 5);
  const currentPhoto = galleryPhotos[selectedPhoto] ?? galleryPhotos[0] ?? null;

  const quantityInCart = cart.find((item) => item.id === product.id)?.quantity ?? 0;
  const remainingAvailable = Math.max(0, maxOrderQuantity - quantityInCart);
  const isAvailable = disponible && maxOrderQuantity > 0;
  const isLimitReached = isAvailable && remainingAvailable === 0;
  const isPurchaseDisabled = !isAvailable || isLimitReached;

  const resolvedCategoryName =
    categoryName || (categoryId ? findCategoryName(categories, categoryId) : null);

  const handleSelectThumbnail = (idx: number) => {
    setSelectedPhoto(idx);
    setMainImageError(Boolean(brokenThumbnails[idx]));
  };

  const handleAddToCart = () => {
    if (isPurchaseDisabled) return;
    const rawQty = typeof quantity === 'number' && quantity >= 1 ? quantity : 1;
    const finalQuantity = Math.min(remainingAvailable, rawQty);
    if (finalQuantity < 1) return;

    addItem({
      id: product.id,
      name: product.name,
      thumbnailUrl: thumbnailUrl ?? galleryPhotos[0] ?? null,
      priceWhenAdded: product.salePrice,
      quantity: finalQuantity,
    });

    setQuantity(1);
    setAddedQuantityNotice(finalQuantity);
    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = setTimeout(() => {
      setAddedQuantityNotice(null);
    }, 3000);
  };

  let buttonLabel = 'Agregar al Carrito';
  if (!isAvailable) {
    buttonLabel = 'Agotado';
  } else if (isLimitReached) {
    buttonLabel = 'Máximo en carrito';
  }

  return (
    <>
      <Helmet>
        <title>{`${name} | Zelbana Storefront`}</title>
        <meta name="description" content={description} />
      </Helmet>

      <Navbar />

      <main className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/" className={styles.breadcrumbLink}>
            ← Volver al catálogo
          </Link>
        </nav>

        <div className={styles.contentGrid}>
          {/* Columna Izquierda: Galería (Fase 3.1) */}
          <div className={styles.galleryColumn}>
            <div className={styles.mainImageContainer}>
              {currentPhoto && !mainImageError ? (
                <img
                  src={currentPhoto}
                  alt={name}
                  onError={() => setMainImageError(true)}
                  className={styles.mainImage}
                />
              ) : (
                <div className={styles.placeholderImage}>Sin imagen disponible</div>
              )}
              {!isAvailable && <div className={styles.outOfStockOverlay}>Agotado</div>}
            </div>

            {galleryPhotos.length > 1 && (
              <div className={styles.thumbnailRow}>
                {galleryPhotos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.thumbnailBtn} ${
                      selectedPhoto === idx ? styles.activeThumbnail : ''
                    }`}
                    onClick={() => handleSelectThumbnail(idx)}
                    aria-label={`Ver foto ${idx + 1}`}
                  >
                    {!brokenThumbnails[idx] ? (
                      <img
                        src={photo}
                        alt={`${name} ${idx + 1}`}
                        onError={() =>
                          setBrokenThumbnails((prev) => ({ ...prev, [idx]: true }))
                        }
                        className={styles.thumbnailImg}
                      />
                    ) : (
                      <div className={styles.thumbnailPlaceholder}>Foto {idx + 1}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Información y Compra (Fases 3.2, 3.3, 3.4) */}
          <div className={styles.infoColumn}>
            <h1 className={styles.title}>{name}</h1>

            <div className={styles.priceRow}>
              <span className={styles.salePrice}>${salePrice.toFixed(2)}</span>
              {discountPercentage > 0 && (
                <span className={styles.discountBadge}>-{discountPercentage}% OFF</span>
              )}
            </div>

            {/* Estado de Stock (Ofuscado) */}
            <div className={styles.stockStatus}>
              {!isAvailable ? (
                <span className={styles.outOfStockBadge}>Producto Agotado</span>
              ) : lowStock ? (
                <span className={styles.lowStockBadge}>¡Pocas unidades disponibles!</span>
              ) : (
                <span className={styles.inStockBadge}>✓ Disponible</span>
              )}
            </div>

            {quantityInCart > 0 && (
              <div className={styles.cartQuantityNotice} role="status">
                Ya tienes {quantityInCart} unidad(es) en tu carrito
              </div>
            )}

            {isLimitReached && (
              <div className={styles.limitReachedNotice} role="alert">
                Ya tienes el máximo de unidades disponibles en tu carrito
              </div>
            )}

            {/* Selector de cantidad y acción */}
            <div className={styles.purchaseControls}>
              <div className={styles.quantityWrapper}>
                <label htmlFor="quantity" className={styles.quantityLabel}>
                  Cantidad:
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={remainingAvailable > 0 ? remainingAvailable : 1}
                  value={quantity}
                  disabled={isPurchaseDisabled}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else {
                      const parsed = parseInt(val, 10);
                      const maxSelectable = remainingAvailable > 0 ? remainingAvailable : 1;
                      setQuantity(
                        isNaN(parsed) ? 1 : Math.min(maxSelectable, Math.max(1, parsed))
                      );
                    }
                  }}
                  onBlur={() => {
                    if (quantity === '' || quantity < 1) {
                      setQuantity(1);
                    } else if (remainingAvailable > 0 && quantity > remainingAvailable) {
                      setQuantity(remainingAvailable);
                    }
                  }}
                  className={styles.quantityInput}
                />
              </div>

              <button
                type="button"
                className={`${styles.addToCartBtn} ${isPurchaseDisabled ? styles.disabledBtn : ''}`}
                disabled={isPurchaseDisabled}
                onClick={handleAddToCart}
              >
                {buttonLabel}
              </button>
            </div>

            {addedQuantityNotice !== null && (
              <div className={styles.addedNotice} role="status">
                ✓ ¡{addedQuantityNotice}{' '}
                {addedQuantityNotice === 1 ? 'unidad agregada' : 'unidades agregadas'} a tu carrito!
              </div>
            )}

            {/* Descripción y Especificaciones Dinámicas (Fase 3.3) */}
            <div className={styles.detailsSection}>
              <h2 className={styles.sectionHeading}>Descripción</h2>
              <p className={styles.descriptionText}>{description}</p>

              <h2 className={styles.sectionHeading}>Especificaciones</h2>
              <ul className={styles.specsList}>
                <li>
                  <strong>Código de Referencia:</strong> #{product.id}
                </li>
                {resolvedCategoryName && (
                  <li>
                    <strong>Categoría:</strong>{' '}
                    {categoryId ? (
                      <Link
                        to={`/?categoryId=${encodeURIComponent(categoryId)}&page=1`}
                        className={styles.categoryLink}
                      >
                        {resolvedCategoryName}
                      </Link>
                    ) : (
                      resolvedCategoryName
                    )}
                  </li>
                )}
                {specs.map((spec, idx) => (
                  <li key={`${spec.label}-${idx}`}>
                    <strong>{spec.label}:</strong> {spec.value}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
