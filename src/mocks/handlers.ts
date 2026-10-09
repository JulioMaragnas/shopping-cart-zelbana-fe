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

export interface MockCatalogEntry {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  photos: string[];
  salePrice: number;
  discountPercentage: number;
  categoryId: string;
  categoryName: string;
  specs: Array<{ label: string; value: string }>;
  currentStock: number;
}

const minioUrl = (file: string) =>
  `/products/${file}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20261007%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261007T204131Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=7d3b730f64ddf56d85928d4573158adade43fdaf`;

export const mockCatalogItems: MockCatalogEntry[] = [
  {
    id: '1',
    name: 'Jeep wrangler',
    description: 'Todoterreno clásico, ideal para aventuras extremas.',
    thumbnailUrl: minioUrl('prod-1-thumb.webp'),
    photos: [
      minioUrl('prod-1-1.webp'),
      minioUrl('prod-1-2.webp'),
      minioUrl('prod-1-3.webp'),
    ],
    salePrice: 45000,
    discountPercentage: 20,
    categoryId: 'cat-3',
    categoryName: 'Jabones Artesanales',
    specs: [
      { label: 'Tracción', value: '4x4 Command-Trac' },
      { label: 'Capacidad', value: '5 pasajeros' },
    ],
    currentStock: 15,
  },
  {
    id: '2',
    name: 'Jeep grand cherokee',
    description: 'SUV de lujo con gran capacidad 4x4.',
    thumbnailUrl: minioUrl('prod-2-thumb.webp'),
    photos: [minioUrl('prod-2-1.webp')],
    salePrice: 55000,
    discountPercentage: 0,
    categoryId: 'cat-3',
    categoryName: 'Jabones Artesanales',
    specs: [
      { label: 'Motor', value: 'V6 Pentastar' },
    ],
    currentStock: 3, // Low stock <= 5
  },
  {
    id: '3',
    name: 'Jeep rubicon',
    description: 'La versión más extrema para el off-road.',
    thumbnailUrl: minioUrl('prod-3-thumb.webp'),
    photos: [minioUrl('prod-3-1.webp'), minioUrl('prod-3-2.webp')],
    salePrice: 50000,
    discountPercentage: 10,
    categoryId: 'cat-4',
    categoryName: 'Sales de Baño',
    specs: [
      { label: 'Diferenciales', value: 'Tru-Lok electrónicos' },
    ],
    currentStock: 0, // Agotado
  },
  {
    id: '4',
    name: 'Jeep cherokee',
    description: 'SUV compacta y versátil.',
    thumbnailUrl: minioUrl('prod-4-thumb.webp'),
    photos: [minioUrl('prod-4-1.webp')],
    salePrice: 35000,
    discountPercentage: 15,
    categoryId: 'cat-2',
    categoryName: 'Cuidado Facial',
    specs: [
      { label: 'Transmisión', value: 'Automática 9 velocidades' },
    ],
    currentStock: 25,
  },
  {
    id: '5',
    name: 'Jeep compass',
    description: 'Diseño moderno y eficiencia urbana.',
    thumbnailUrl: minioUrl('prod-5-thumb.webp'),
    photos: [minioUrl('prod-5-1.webp')],
    salePrice: 28000,
    discountPercentage: 0,
    categoryId: 'cat-1',
    categoryName: 'Cuidado Corporal',
    specs: [
      { label: 'Consumo', value: 'Eficiente en ciudad' },
    ],
    currentStock: 10,
  },
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
      if (item.categoryId === categoryId) return true;
      const parent = mockCategories.find(c => c.id === categoryId);
      if (parent && parent.children?.some(ch => ch.id === item.categoryId)) {
        return true;
      }
      return false;
    });
  }

  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery)
    );
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    thumbnailUrl: item.thumbnailUrl,
    salePrice: item.salePrice,
    discountPercentage: item.discountPercentage,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    disponible: item.currentStock > 0,
    lowStock: item.currentStock > 0 && item.currentStock <= 5,
    maxOrderQuantity: Math.min(item.currentStock, 10),
  }));

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
  const item = mockCatalogItems.find(i => i.id === id);

  if (!item) {
    return HttpResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  const response: ProductDetailResponse = {
    id: item.id,
    name: item.name,
    description: item.description,
    thumbnailUrl: item.thumbnailUrl,
    photos: item.photos,
    salePrice: item.salePrice,
    discountPercentage: item.discountPercentage,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    specs: item.specs,
    disponible: item.currentStock > 0,
    lowStock: item.currentStock > 0 && item.currentStock <= 5,
    maxOrderQuantity: Math.min(item.currentStock, 10),
  };
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
    .filter(item => item.name.toLowerCase().includes(lowerQuery))
    .map(item => item.name);

  return HttpResponse.json(suggestions);
};

// Handlers Carrito & Checkout según api_contracts_carrito.md
const handleCartValidate = async ({ request }: { request: Request }) => {
  try {
    const body = (await request.json()) as { cart?: Array<{ productId: string; quantity: number }> };
    const cart = body.cart || [];

    const items: CartValidatedItem[] = cart.map(item => {
      const found = mockCatalogItems.find(c => c.id === item.productId);
      if (!found) {
        return {
          productId: item.productId,
          name: 'Producto eliminado',
          thumbnailUrl: null,
          quantityRequested: item.quantity,
          quantityFulfilled: 0,
          availableStock: 0,
          salePrice: 0,
          unitPrice: 0,
          discountPercentage: 0,
          subtotal: 0,
          message: 'El producto ya no existe en el catálogo.',
        };
      }

      const availableStock = Math.min(Math.max(0, found.currentStock), 10);
      const salePrice = found.salePrice;
      const quantityFulfilled = Math.min(item.quantity, availableStock);
      const subtotal = Number((quantityFulfilled * salePrice).toFixed(2));

      let message = 'Stock disponible';
      if (availableStock === 0) {
        message = 'Producto agotado';
      } else if (quantityFulfilled < item.quantity) {
        message = `Stock parcial: solo quedan ${availableStock}`;
      }

      return {
        productId: item.productId,
        name: found.name,
        thumbnailUrl: found.thumbnailUrl,
        quantityRequested: item.quantity,
        quantityFulfilled,
        availableStock,
        salePrice,
        unitPrice: salePrice,
        discountPercentage: found.discountPercentage,
        subtotal,
        message,
      };
    });

    const isValid =
      items.length > 0 &&
      items.every(
        i =>
          i.quantityFulfilled === i.quantityRequested &&
          i.quantityFulfilled > 0 &&
          i.name !== 'Producto eliminado'
      );
    const totalAmount = Number(items.reduce((acc, i) => acc + i.subtotal, 0).toFixed(2));

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
      const found = mockCatalogItems.find(c => c.id === item.productId);
      return !found || found.currentStock < item.quantity;
    });

    if (hasOutOfStock) {
      return HttpResponse.json(
        { error: 'Stock insuficiente para uno o más productos de tu carrito.' },
        { status: 409 }
      );
    }

    const totalAmount = cart.reduce((acc, item) => {
      const found = mockCatalogItems.find(c => c.id === item.productId);
      return acc + (found ? found.salePrice * item.quantity : 0);
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
