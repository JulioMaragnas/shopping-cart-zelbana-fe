import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { useProductDetail } from '../api/useProductDetail';
import { useCartStore } from '../../cart/store/useCartStore';
import styles from './ProductDetailPage.module.css';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProductDetail(id);
  const addItem = useCartStore((state) => state.addItem);

  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [showAddedNotice, setShowAddedNotice] = useState(false);

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

  const { name, description, photos, salePrice, originalPrice, disponible, lowStock, currentStock = 0 } = product;
  const hasDiscount = originalPrice > salePrice;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!disponible) return;
    const finalQuantity = typeof quantity === 'number' && quantity >= 1 ? quantity : 1;
    addItem({
      id: product.id,
      name: product.name,
      priceWhenAdded: product.salePrice,
      quantity: finalQuantity,
    });
    setShowAddedNotice(true);
    setTimeout(() => setShowAddedNotice(false), 3000);
  };

  const currentPhoto = photos[selectedPhoto] || photos[0] || 'https://via.placeholder.com/400';

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
          {/* Columna Izquierda: Galería */}
          <div className={styles.galleryColumn}>
            <div className={styles.mainImageContainer}>
              <img src={currentPhoto} alt={name} className={styles.mainImage} />
              {!disponible && <div className={styles.outOfStockOverlay}>Agotado</div>}
            </div>

            {photos.length > 1 && (
              <div className={styles.thumbnailRow}>
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.thumbnailBtn} ${selectedPhoto === idx ? styles.activeThumbnail : ''}`}
                    onClick={() => setSelectedPhoto(idx)}
                    aria-label={`Ver foto ${idx + 1}`}
                  >
                    <img src={photo} alt={`${name} ${idx + 1}`} className={styles.thumbnailImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Información y Compra */}
          <div className={styles.infoColumn}>
            <h1 className={styles.title}>{name}</h1>

            <div className={styles.priceRow}>
              <span className={styles.salePrice}>${salePrice.toFixed(2)}</span>
              {hasDiscount && (
                <>
                  <span className={styles.originalPrice}>${originalPrice.toFixed(2)}</span>
                  <span className={styles.discountBadge}>-{discountPercentage}% OFF</span>
                </>
              )}
            </div>

            {/* Estado de Stock */}
            <div className={styles.stockStatus}>
              {!disponible ? (
                <span className={styles.outOfStockBadge}>Producto Agotado</span>
              ) : lowStock ? (
                <span className={styles.lowStockBadge}>¡Pocas unidades disponibles! ({currentStock} en inventario)</span>
              ) : (
                <span className={styles.inStockBadge}>✓ Disponible en bodega</span>
              )}
            </div>

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
                  max={currentStock > 0 ? currentStock : 1}
                  value={quantity}
                  disabled={!disponible}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else {
                      const parsed = parseInt(val, 10);
                      setQuantity(isNaN(parsed) ? 1 : Math.max(1, parsed));
                    }
                  }}
                  onBlur={() => {
                    if (quantity === '' || quantity < 1) {
                      setQuantity(1);
                    }
                  }}
                  className={styles.quantityInput}
                />
              </div>

              <button
                type="button"
                className={`${styles.addToCartBtn} ${!disponible ? styles.disabledBtn : ''}`}
                disabled={!disponible}
                onClick={handleAddToCart}
              >
                {disponible ? 'Agregar al Carrito' : 'Agotado'}
              </button>
            </div>

            {showAddedNotice && (
              <div className={styles.addedNotice} role="status">
                ✓ ¡{quantity} {quantity === 1 ? 'unidad agregada' : 'unidades agregadas'} a tu carrito!
              </div>
            )}

            {/* Descripción y Especificaciones */}
            <div className={styles.detailsSection}>
              <h2 className={styles.sectionHeading}>Descripción</h2>
              <p className={styles.descriptionText}>{description}</p>

              <h2 className={styles.sectionHeading}>Especificaciones</h2>
              <ul className={styles.specsList}>
                <li><strong>Código de Referencia:</strong> #{product.id}</li>
                <li><strong>Categoría:</strong> {product.categoryId || 'General'}</li>
                <li><strong>Elaboración:</strong> Cosmética e higiene artesanal</li>
                <li><strong>Garantía:</strong> Sellado de fábrica con certificación sanitaria</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
