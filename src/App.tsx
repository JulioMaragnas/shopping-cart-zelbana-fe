import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './features/catalog/pages/HomePage';
import { CartPage } from './features/cart/pages/CartPage';
import { CheckoutPage } from './features/cart/pages/CheckoutPage';
import { OrderSuccessPage } from './features/cart/pages/OrderSuccessPage';
import { ProductDetailPage } from './features/catalog/pages/ProductDetailPage';
import { MyOrdersPage } from './features/orders/pages/MyOrdersPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RegisterPage } from './features/auth/pages/RegisterPage';
import { MiniCartDrawer } from './features/cart/components/MiniCartDrawer';
import { WelcomeModal } from './features/marketing/components/WelcomeModal/WelcomeModal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout/:orderId" element={<CheckoutPage />} />
        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
        <Route path="/orders" element={<MyOrdersPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      <MiniCartDrawer />
      <WelcomeModal />
    </BrowserRouter>
  );
}

export default App;
