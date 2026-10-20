import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { FreeShippingBanner } from '../../../design-system/components/FreeShippingBanner/FreeShippingBanner';
import { Jumbotron } from '../../../design-system/components/Jumbotron/Jumbotron';
import { ProductGrid } from '../../search/components/ProductGrid';
import { useCatalogSearch } from '../../search/api/useCatalogSearch';
import { useCategories } from '../api/useCategories';
import { useCartStore } from '../../cart/store/useCartStore';
import { BuyBoxSortBar, type SortOption } from '../components/BuyBoxSortBar';
import {
  buildAffinityQueryParams,
  recordSearchAffinity,
  recordCategoryAffinity,
} from '../../search/utils/affinityStorage';
import styles from './HomePage.module.css';
import { Helmet } from 'react-helmet-async';
import type { Product } from '../../search/types';
import { findCategoryName } from '../utils/findCategoryName';

const VALID_SORTS: SortOption[] = [
  'recommended',
  'best_selling',
  'highest_discount',
  'price_asc',
  'price_desc',
];

export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') || searchParams.get('q') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const rawPageParam = searchParams.get('page');
  const parsedPage = Number(rawPageParam);
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const rawSortParam = searchParams.get('sort');
  const normalizedSort = rawSortParam === 'discount_desc' ? 'highest_discount' : rawSortParam;
  const currentSort: SortOption = VALID_SORTS.includes(normalizedSort as SortOption)
    ? (normalizedSort as SortOption)
    : 'recommended';

  const affinityParams = currentSort === 'recommended' ? buildAffinityQueryParams() : {};

  const { data: catalogData, isLoading, isError } = useCatalogSearch({
    query,
    categoryId: categoryId || undefined,
    page,
    limit: 20,
    sort: currentSort,
    ...affinityParams,
  });

  const { data: categories = [] } = useCategories();
  const addItem = useCartStore((state) => state.addItem);
  const cart = useCartStore((state) => state.cart);

  const products = catalogData?.products || [];
  const totalPages = Math.max(1, catalogData?.totalPages || 1);
  const currentPage = catalogData ? Math.min(page, totalPages) : page;
  const totalItems = catalogData?.totalItems || 0;

  // Regla Anti-Basura: Registrar búsqueda solo si hay resultados válidos
  React.useEffect(() => {
    if (!isLoading && catalogData && catalogData.totalItems > 0 && query.trim().length >= 2) {
      recordSearchAffinity(query);
    }
  }, [isLoading, catalogData, query]);

  // Registrar afinidad de categoría al filtrar
  React.useEffect(() => {
    if (categoryId && categoryId.trim()) {
      recordCategoryAffinity(categoryId);
    }
  }, [categoryId]);

  React.useEffect(() => {
    if (!isLoading && catalogData && rawPageParam !== null) {
      if (!Number.isInteger(parsedPage) || parsedPage < 1 || page > totalPages) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('page', String(currentPage));
        setSearchParams(nextParams, { replace: true });
      }
    }
  }, [isLoading, catalogData, rawPageParam, parsedPage, page, totalPages, currentPage, searchParams, setSearchParams]);

  const selectedCategoryName = categoryId ? findCategoryName(categories, categoryId) : null;

  const handleClearFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('categoryId');
    nextParams.delete('query');
    nextParams.delete('q');
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleSortChange = (newSort: SortOption) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newSort === 'recommended') {
      nextParams.delete('sort');
    } else {
      nextParams.set('sort', newSort);
    }
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
    const isAvailable = product.isAvailable ?? product.disponible;
    if (!isAvailable || quantityInCart >= product.maxOrderQuantity) {
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
      <FreeShippingBanner />

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
              data-testid="clear-filters-btn"
            >
              ✕ Limpiar filtro
            </button>
          </div>
        )}

        {isError && <p className={styles.errorState}>Error al cargar el catálogo.</p>}

        {!isError && (
          <>
            <BuyBoxSortBar
              activeSort={currentSort}
              onSortChange={handleSortChange}
              totalItems={totalItems}
              disabled={!isLoading && products.length === 0}
            />

            <ProductGrid
              products={products}
              isLoading={isLoading}
              query={query}
              onAdd={handleAdd}
              onClearFilters={handleClearFilter}
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
