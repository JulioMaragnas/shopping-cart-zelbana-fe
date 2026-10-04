import { http, HttpResponse } from 'msw';
import type { Category, PaginatedCatalogResponse, ProductDetailResponse } from '../features/search/types';
import type { CartValidationResponse, CartValidatedItem, ReserveResponse, ConfirmResponse, CancelResponse } from '../features/cart/types';

// Mock de categorías según api_contracts_catalogo.md
export const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Cuidado Corporal',
    children: [
      {
        id: 'cat-3',
        name: 'Jabones Artesanales',
        children: []
      },
      {
        id: 'cat-4',
        name: 'Sales de Baño',
        children: []
      }
    ]
  },
  {
    id: 'cat-2',
    name: 'Cuidado Facial',
    children: []
  }
];

// Mock de productos con categoryId y fotos
export const mockCatalogItems = [
  {
    product: {
      id: '1',
      name: 'Jeep wrangler',
      description: 'Todoterreno clásico, ideal para aventuras extremas.',
      photos: ['https://via.placeholder.com/150'],
      salePrice: 45000,
      originalPrice: 48000,
      categoryId: 'cat-3'
    },
    currentStock: 15
  },
  {
    product: {
      id: '2',
      name: 'Jeep grand cherokee',
      description: 'SUV de lujo con gran capacidad 4x4.',
      photos: ['https://via.placeholder.com/150'],
      salePrice: 55000,
      originalPrice: 55000,
      categoryId: 'cat-3'
    },
    currentStock: 3 // Low stock <= 5
  },
  {
    product: {
      id: '3',
      name: 'Jeep rubicon',
      description: 'La versión más extrema para el off-road.',
      photos: ['https://via.placeholder.com/150'],
      salePrice: 50000,
      originalPrice: 52000,
      categoryId: 'cat-4'
    },
    currentStock: 0 // Agotado
  },
  {
    product: {
      id: '4',
      name: 'Jeep cherokee',
      description: 'SUV compacta y versátil.',
      photos: ['https://via.placeholder.com/150'],
      salePrice: 35000,
      originalPrice: 37000,
      categoryId: 'cat-2'
    },
    currentStock: 25
  },
  {
    product: {
      id: '5',
      name: 'Jeep compass',
      description: 'Diseño moderno y eficiencia urbana.',
      photos: ['https://via.placeholder.com/150'],
      salePrice: 28000,
      originalPrice: 30000,
      categoryId: 'cat-1'
    },
    currentStock: 10
  }
];

const handleCategories = () => {
  return HttpResponse.json(mockCategories);
};

const handleProducts = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('query') || url.searchParams.get('q') || '';
  const categoryId = url.searchParams.get('categoryId') || '';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.max(1, Number(url.searchParams.get('limit')) || 20);

  let filtered = mockCatalogItems;

  if (categoryId) {
    filtered = filtered.filter(item => {
      if (item.product.categoryId === categoryId) return true;
      const parent = mockCategories.find(c => c.id === categoryId);
      if (parent && parent.children?.some(ch => ch.id === item.product.categoryId)) {
        return true;
      }
      return false;
    });
  }

  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = filtered.filter(item =>
      item.product.name.toLowerCase().includes(lowerQuery) ||
      item.product.description.toLowerCase().includes(lowerQuery)
    );
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  const response: PaginatedCatalogResponse = {
    items: paginatedItems,
    totalItems,
    totalPages,
    currentPage: page
  };

  return HttpResponse.json(response);
};

const handleProductDetail = ({ params }: { params: Record<string, string | readonly string[] | undefined> }) => {
  const { id } = params;
  const item = mockCatalogItems.find(i => i.product.id === id);

  if (!item) {
    return HttpResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const response: ProductDetailResponse = item;
  return HttpResponse.json(response);
};

const handleSuggestions = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || url.searchParams.get('query') || '';

  if (!query) {
    return HttpResponse.json([]);
  }

  const lowerQuery = query.toLowerCase();
  const suggestions = mockCatalogItems
    .filter(item => item.product.name.toLowerCase().includes(lowerQuery))
    .map(item => item.product.name);

  return HttpResponse.json(suggestions);
};

// Handlers Carrito & Checkout según api_contracts_carrito.md
const handleCartValidate = async ({ request }: { request: Request }) => {
  try {
    const body = (await request.json()) as { cart?: Array<{ productId: string; quantity: number }> };
    const cart = body.cart || [];

    const items: CartValidatedItem[] = cart.map(item => {
      const found = mockCatalogItems.find(c => c.product.id === item.productId);
      const stock = found ? found.currentStock : 0;
      const name = found ? found.product.name : 'Producto Desconocido';
      const unitPrice = found ? found.product.salePrice : 0;
      const quantityFulfilled = Math.min(item.quantity, stock);
      const subtotal = quantityFulfilled * unitPrice;

      let message = 'Stock disponible';
      if (stock === 0) {
        message = 'Producto agotado';
      } else if (quantityFulfilled < item.quantity) {
        message = `Stock parcial: solo quedan ${stock}`;
      }

      return {
        productId: item.productId,
        name,
        quantityRequested: item.quantity,
        quantityFulfilled,
        unitPrice,
        subtotal,
        message,
      };
    });

    const isValid = items.length > 0 && items.every(i => i.quantityFulfilled === i.quantityRequested && i.quantityFulfilled > 0);
    const totalAmount = items.reduce((acc, i) => acc + i.subtotal, 0);

    const response: CartValidationResponse = {
      items,
      totalAmount,
      isValid,
    };

    return HttpResponse.json(response);
  } catch {
    return HttpResponse.json({ error: 'Formato de carrito inválido' }, { status: 400 });
  }
};

const handleCheckoutReserve = async ({ request }: { request: Request }) => {
  try {
    const body = (await request.json()) as { cart?: Array<{ productId: string; quantity: number }> };
    const cart = body.cart || [];

    // Si algún item tiene stock 0 (ej. rubicon id 3), responder 409 Conflict
    const hasOutOfStock = cart.some(item => {
      const found = mockCatalogItems.find(c => c.product.id === item.productId);
      return !found || found.currentStock < item.quantity;
    });

    if (hasOutOfStock) {
      return HttpResponse.json(
        { error: 'Stock insuficiente para uno o más productos de tu carrito.' },
        { status: 409 }
      );
    }

    const totalAmount = cart.reduce((acc, item) => {
      const found = mockCatalogItems.find(c => c.product.id === item.productId);
      return acc + (found ? found.product.salePrice * item.quantity : 0);
    }, 0);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const response: ReserveResponse = {
      success: true,
      order: {
        id: 'ord-12345',
        status: 'RESERVED',
        totalAmount,
        expiresAt,
      },
    };

    return HttpResponse.json(response);
  } catch {
    return HttpResponse.json({ error: 'Error al reservar' }, { status: 400 });
  }
};

const handleCheckoutConfirm = () => {
  const response: ConfirmResponse = {
    success: true,
    message: 'Pago consolidado en Kardex.',
  };
  return HttpResponse.json(response);
};

const handleCheckoutCancel = () => {
  const response: CancelResponse = {
    success: true,
    message: 'Reserva anulada y stock liberado.',
  };
  return HttpResponse.json(response);
};

export const handlers = [
  // Categories
  http.get('*/storefront/api/categories', handleCategories),
  http.get('*/api/categories', handleCategories),

  // Products PLP
  http.get('*/storefront/api/products', handleProducts),
  http.get('*/api/products', handleProducts),

  // Search Suggestions (Typeahead)
  http.get('*/storefront/api/search/suggestions', handleSuggestions),
  http.get('*/api/search/suggestions', handleSuggestions),

  // Product Detail (PDP)
  http.get('*/storefront/api/products/:id', handleProductDetail),
  http.get('*/api/products/:id', handleProductDetail),

  // Cart & Checkout (Zero Trust)
  http.post('*/storefront/api/cart/validate', handleCartValidate),
  http.post('*/api/cart/validate', handleCartValidate),

  http.post('*/storefront/api/checkout/reserve', handleCheckoutReserve),
  http.post('*/api/checkout/reserve', handleCheckoutReserve),

  http.post('*/storefront/api/checkout/confirm/:orderId', handleCheckoutConfirm),
  http.post('*/api/checkout/confirm/:orderId', handleCheckoutConfirm),

  http.post('*/storefront/api/checkout/cancel/:orderId', handleCheckoutCancel),
  http.post('*/api/checkout/cancel/:orderId', handleCheckoutCancel),
];
