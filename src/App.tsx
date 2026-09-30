import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './features/catalog/pages/HomePage';
import { CartPage } from './features/cart/pages/CartPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
