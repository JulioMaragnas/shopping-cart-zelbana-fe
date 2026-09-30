import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/useCartStore';

const createCartValidator = (cartItems: any[]) => async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const validationResult = cartItems.map(item => ({
        productId: item.id,
        requested: item.quantity,
        isValid: true,
        available: true,
        currentPrice: item.priceWhenAdded > 100000 ? item.priceWhenAdded - 50000 : item.priceWhenAdded
      }));
      resolve(validationResult);
    }, 1000);
  });
};

export const useCartValidate = () => {
  const cart = useCartStore(state => state.cart);
  return useQuery({
    queryKey: ['cartValidate', cart],
    queryFn: createCartValidator(cart),
    enabled: cart.length > 0,
  });
};
