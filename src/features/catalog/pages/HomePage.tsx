import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { Jumbotron } from '../../../design-system/components/Jumbotron/Jumbotron';
import { ProductGrid } from '../../search/components/ProductGrid';
import { useCatalogSearch } from '../../search/api/useCatalogSearch';
import { useCartStore } from '../../cart/store/useCartStore';
import styles from './HomePage.module.css';
import { Helmet } from 'react-helmet-async';

export function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  // Usamos nuestro hook con react-query que le pega al endpoint correcto (y soporta MSW)
  const { data: products = [], isLoading, isError } = useCatalogSearch(query);
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      priceWhenAdded: product.salePrice,
      quantity: 1
    });
  };

  return (
    <>
      <Helmet>
        <title>Zelbana | Catálogo</title>
        <meta name="description" content="Catálogo de repuestos y accesorios de bicicleta Zelbana" />
      </Helmet>
      
      <Navbar />
      
      <main className={styles.container}>
        {!query && <Jumbotron />}
        
        {isError && <p>Error al cargar el catálogo.</p>}
        
        {!isError && (
          <ProductGrid 
            products={products} 
            isLoading={isLoading} 
            query={query} 
            onAdd={handleAdd} 
          />
        )}
      </main>
    </>
  );
}
