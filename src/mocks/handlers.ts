import { http, HttpResponse } from 'msw';
import type { Category, PaginatedCatalogResponse, ProductDetailResponse } from '../features/search/types';

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
      // Si la categoría tiene hijos (ej: cat-1 incluye cat-3 y cat-4)
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

export const handlers = [
  // Categories (ambas rutas para compatibilidad)
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
  http.get('*/api/products/:id', handleProductDetail)
];
