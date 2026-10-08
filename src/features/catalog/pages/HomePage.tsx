import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { Jumbotron } from '../../../design-system/components/Jumbotron/Jumbotron';
import { ProductGrid } from '../../search/components/ProductGrid';
import { useCatalogSearch } from '../../search/api/useCatalogSearch';
import { useCategories } from '../api/useCategories';
import { useCartStore } from '../../cart/store/useCartStore';
import styles from './HomePage.module.css';
import { Helmet } from 'react-helmet-async';
import type { Product } from '../../search/types';
import { findCategoryName } from '../utils/findCategoryName';

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') || searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const { data: catalogData, isLoading, isError } = useCatalogSearch({
    query,
    categoryId: categoryId || undefined,
    page,
    limit: 20,
  });

  const { data: categories = [] } = useCategories();
  const addItem = useCartStore((state) => state.addItem);
  const cart = useCartStore((state) => state.cart);

  const products = catalogData?.products || [];
  const totalPages = catalogData?.totalPages || 1;
  const currentPage = catalogData?.currentPage || 1;
  const totalItems = catalogData?.totalItems || 0;

  const selectedCategoryName = categoryId ? findCategoryName(categories, categoryId) : null;

  const handleClearFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('categoryId');
    nextParams.delete('query');
    nextParams.delete('q');
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdd = (product: Product) => {
    const quantityInCart = cart.find((i) => i.id === product.id)?.quantity ?? 0;
    if (!product.disponible || quantityInCart >= product.maxOrderQuantity) {
      return;
    }
    addItem({
      id: product.id,
      name: product.name,
      thumbnailUrl: product.thumbnailUrl,
      priceWhenAdded: product.salePrice,
      quantity: 1,
    });
  };

  const isFiltering = Boolean(query || categoryId);

  return (
    <>
      <Helmet>
        <title>
          {selectedCategoryName
            ? `Zelbana | ${selectedCategoryName}`
            : query
            ? `Zelbana | Búsqueda: ${query}`
            : 'Zelbana | Catálogo'}
        </title>
        <meta
          name="description"
          content="Catálogo de productos cosméticos y cuidado personal Zelbana"
        />
      </Helmet>

      <Navbar />

      <main className={styles.container}>
        {!isFiltering && <Jumbotron />}

        {isFiltering && (
          <div className={styles.filterBanner}>
            <div className={styles.filterInfo}>
              {selectedCategoryName && (
                <span>
                  Categoría: <strong>{selectedCategoryName}</strong>
                </span>
              )}
              {query && (
                <span>
                  Búsqueda: <strong>"{query}"</strong>
                </span>
              )}
              <span className={styles.itemCount}>({totalItems} productos)</span>
            </div>

            <button
              type="button"
              className={styles.clearFilterBtn}
              onClick={handleClearFilter}
              aria-label="Limpiar filtro"
            >
              ✕ Limpiar filtro
            </button>
          </div>
        )}

        {isError && <p className={styles.errorState}>Error al cargar el catálogo.</p>}

        {!isError && (
          <>
            <ProductGrid
              products={products}
              isLoading={isLoading}
              query={query}
              onAdd={handleAdd}
            />

            {!isLoading && products.length > 0 && (
              <div className={styles.paginationContainer}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Página anterior"
                >
                  ‹ Anterior
                </button>

                <span className={styles.pageStatus}>
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={currentPage >= totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Página siguiente"
                >
                  Siguiente ›
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
