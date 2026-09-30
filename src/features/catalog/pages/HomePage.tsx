import React from 'react';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { Jumbotron } from '../../../design-system/components/Jumbotron/Jumbotron';
import { ProductCard } from '../../../design-system/components/ProductCard/ProductCard';
import { useProducts } from '../api/useProducts';
import { useCartStore } from '../../cart/store/useCartStore';
import styles from './HomePage.module.css';
import { Helmet } from 'react-helmet-async';

export function HomePage() {
  const { data: products, isLoading, isError } = useProducts();
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
        <Jumbotron />
        
        {isLoading && <p>Cargando catálogo...</p>}
        {isError && <p>Error al cargar el catálogo.</p>}
        
        {!isLoading && !isError && (
          <div className={styles.grid}>
            {products?.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAdd={() => handleAdd(product)} 
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
