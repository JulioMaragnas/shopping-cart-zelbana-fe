import React from 'react';
import { Navbar } from '../../../design-system/components/Navbar/Navbar';
import { CartItemRow } from '../../../design-system/components/CartItemRow/CartItemRow';
import { OrderSummaryCard } from '../../../design-system/components/OrderSummaryCard/OrderSummaryCard';
import { useCartStore } from '../store/useCartStore';
import { useCartValidate } from '../api/useCartValidate';
import styles from './CartPage.module.css';
import { Helmet } from 'react-helmet-async';

export function CartPage() {
  const cart = useCartStore((state) => state.cart);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  
  const { data: validationData, isFetching } = useCartValidate();

  const subtotal = cart.reduce((sum, item) => sum + (item.priceWhenAdded * item.quantity), 0);
  
  const currentTotal = (validationData as any[])?.reduce((sum, vItem) => {
    const cartItem = cart.find(c => c.id === vItem.productId);
    return sum + (vItem.currentPrice * (cartItem?.quantity || 1));
  }, 0) || subtotal;

  const itemDiscounts = subtotal - currentTotal;
  const timeDiscounts = 0;
  const finalTotal = currentTotal - timeDiscounts;

  return (
    <>
      <Helmet>
        <title>Zelbana | Checkout</title>
      </Helmet>
      
      <Navbar />
      
      <main className={styles.container}>
        <div className={styles.leftCol}>
          <h2 className={styles.title}>Tu Carrito</h2>
          
          {cart.length === 0 ? (
            <p>El carrito está vacío.</p>
          ) : (
            cart.map(item => {
              const validationItem = (validationData as any[])?.find(v => v.productId === item.id);
              const currentPrice = validationItem?.currentPrice || item.priceWhenAdded;
              const disponible = validationItem ? validationItem.available : true;
              
              return (
                <CartItemRow 
                  key={item.id}
                  item={item}
                  currentPrice={currentPrice}
                  disponible={disponible}
                  onRemove={removeItem}
                  onChangeQuantity={updateQuantity}
                />
              );
            })
          )}
        </div>
        
        <div className={styles.rightCol}>
          <OrderSummaryCard 
            subtotal={subtotal}
            itemDiscounts={itemDiscounts}
            timeDiscounts={timeDiscounts}
            total={finalTotal}
            isValidating={isFetching}
            isValid={cart.length > 0}
            onPay={() => alert('¡Checkout Flow finalizado!')}
          />
        </div>
      </main>
    </>
  );
}
