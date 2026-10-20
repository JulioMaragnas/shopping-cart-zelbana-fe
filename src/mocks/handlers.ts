import { http, HttpResponse } from 'msw';
import type { Category, PaginatedCatalogResponse, ProductDetailResponse } from '../features/search/types';
import type {
  CartValidationResponse,
  CartValidatedItem,
  ReserveResponse,
  ConfirmResponse,
  CancelResponse,
  OrderDetail,
  OrderItem,
  UserAddress,
  ShippingPromotionDTO,
  UpsellProductDTO,
} from '../features/cart/types';



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
  totalSold?: number;
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
    totalSold: 25,
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
    totalSold: 10,
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
    totalSold: 50,
  },
  {
    id: '4',
    name: 'Jeep cherokee',
    description: 'SUV compacta y versátil.',
    thumbnailUrl: minioUrl('prod-4-thumb.webp'),
    photos: [minioUrl('prod-4-1.webp')],
    salePrice: 35000,
    discountPercentage: 0,
    categoryId: 'cat-2',
    categoryName: 'Cuidado Facial',
    specs: [
      { label: 'Transmisión', value: 'Automática 9 velocidades' },
    ],
    currentStock: 25,
    totalSold: 5,
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
    totalSold: 2,
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

  const rawSort = url.searchParams.get('sort') || 'recommended';
  const sort = rawSort === 'discount_desc' ? 'highest_discount' : rawSort;
  const affinityTerms = (url.searchParams.get('affinityTerms') || '')
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
  const affinityCategories = (url.searchParams.get('affinityCategories') || '')
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

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

  // Ordenamiento con Regla Universal #0: Disponibles primero
  filtered = [...filtered].sort((a, b) => {
    const aStock = a.currentStock > 0 ? 1 : 0;
    const bStock = b.currentStock > 0 ? 1 : 0;
    if (aStock !== bStock) {
      return bStock - aStock;
    }

    if (sort === 'best_selling') {
      const aSold = a.totalSold ?? 0;
      const bSold = b.totalSold ?? 0;
      if (bSold !== aSold) return bSold - aSold;
      if (a.salePrice !== b.salePrice) return a.salePrice - b.salePrice;
      return a.id.localeCompare(b.id);
    }

    if (sort === 'highest_discount') {
      if (b.discountPercentage !== a.discountPercentage) return b.discountPercentage - a.discountPercentage;
      if (a.salePrice !== b.salePrice) return a.salePrice - b.salePrice;
      return a.id.localeCompare(b.id);
    }

    if (sort === 'price_asc') {
      if (a.salePrice !== b.salePrice) return a.salePrice - b.salePrice;
      return a.id.localeCompare(b.id);
    }

    if (sort === 'price_desc') {
      if (b.salePrice !== a.salePrice) return b.salePrice - a.salePrice;
      return a.id.localeCompare(b.id);
    }

    // Default: 'recommended'
    const computeBuyBoxScore = (item: MockCatalogEntry) => {
      let score = 0;
      if (affinityTerms.length > 0) {
        const itemText = `${item.name} ${item.description}`.toLowerCase();
        if (affinityTerms.some(term => itemText.includes(term))) {
          score += 50;
        }
      }
      if (affinityCategories.length > 0 && affinityCategories.includes(item.categoryId)) {
        score += 30;
      }
      if ((item.totalSold ?? 0) > 0) {
        score += 15;
      }
      if (item.discountPercentage > 0) {
        score += 5;
      }
      return score;
    };

    const scoreA = computeBuyBoxScore(a);
    const scoreB = computeBuyBoxScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const aSold = a.totalSold ?? 0;
    const bSold = b.totalSold ?? 0;
    if (bSold !== aSold) return bSold - aSold;

    if (b.discountPercentage !== a.discountPercentage) return b.discountPercentage - a.discountPercentage;
    if (a.salePrice !== b.salePrice) return a.salePrice - b.salePrice;
    return a.id.localeCompare(b.id);
  });

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
    isAvailable: item.currentStock > 0,
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
    isAvailable: item.currentStock > 0,
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

export let mockStoreSettings = {
  freeShippingEnabled: true,
  freeShippingThreshold: 50.0,
};

export const resetMockStoreSettings = () => {
  mockStoreSettings = {
    freeShippingEnabled: true,
    freeShippingThreshold: 50.0,
  };
};

// Handlers Carrito & Checkout según api_contracts_carrito.md
const handleCartValidate = async ({ request }: { request: Request }) => {
  try {
    const body = (await request.json()) as {
      cart?: Array<{ productId: string; quantity: number }>;
      affinityTerms?: string[];
      affinityCategories?: string[];
    };
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

    const threshold = mockStoreSettings.freeShippingThreshold;
    const enabled = mockStoreSettings.freeShippingEnabled;
    const isFreeShippingUnlocked = enabled && totalAmount >= threshold;
    const missingAmount = isFreeShippingUnlocked
      ? 0
      : Number(Math.max(0, threshold - totalAmount).toFixed(2));
    const percentage = enabled
      ? Math.min(100, Math.round((totalAmount / threshold) * 100))
      : 0;

    let upsellProducts: UpsellProductDTO[] = [];
    if (enabled && !isFreeShippingUnlocked) {
      const inCartIds = cart.map(c => c.productId);
      const candidates = mockCatalogItems
        .filter(item => !inCartIds.includes(item.id) && item.currentStock > 0)
        .sort((a, b) => {
          const aSweet = a.salePrice >= missingAmount && a.salePrice <= missingAmount + 20;
          const bSweet = b.salePrice >= missingAmount && b.salePrice <= missingAmount + 20;
          if (aSweet !== bSweet) return bSweet ? 1 : -1;
          return a.salePrice - b.salePrice;
        })
        .slice(0, 3);

      upsellProducts = candidates.map(item => ({
        id: item.id,
        name: item.name,
        thumbnailUrl: item.thumbnailUrl,
        salePrice: item.salePrice,
        discountPercentage: item.discountPercentage,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        isAvailable: item.currentStock > 0,
        disponible: item.currentStock > 0,
        maxOrderQuantity: Math.min(item.currentStock, 10),
        coversMissingAmount: item.salePrice >= missingAmount,
      }));
    }

    const shippingPromotion: ShippingPromotionDTO = {
      enabled,
      threshold,
      currentAmount: totalAmount,
      missingAmount,
      percentage,
      isFreeShippingUnlocked,
      upsellProducts,
    };

    const response: CartValidationResponse = {
      items,
      totalAmount,
      isValid,
      shippingPromotion,
    };

    return HttpResponse.json(response);
  } catch {
    return HttpResponse.json({ error: 'Formato de carrito inválido' }, { status: 400 });
  }
};

export const mockOrders: Record<string, OrderDetail> = {};

export const resetMockOrders = () => {
  Object.keys(mockOrders).forEach((k) => delete mockOrders[k]);
  mockOrders['ord-12345'] = {
    id: 'ord-12345',
    status: 'RESERVED',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    customerEmail: 'julio@ejemplo.com',
    shippingAddress: 'Carrera 65A 1 sur-10',
    shippingCoordinates: { lat: 6.2081, lng: -75.5684 },
    subtotalAmount: 65.0,
    discountAmount: 15.0,
    totalAmount: 50.0,
    items: [
      {
        productId: '1',
        name: 'Jabón de coco',
        thumbnailUrl: minioUrl('prod-1-thumb.webp'),
        quantity: 2,
        unitPrice: 20.0,
        salePrice: 12.5,
        discountPercentage: 37,
        lineSubtotal: 40.0,
        lineTotal: 25.0,
      },
      {
        productId: '2',
        name: 'Sal hidratante',
        thumbnailUrl: minioUrl('prod-2-thumb.webp'),
        quantity: 1,
        unitPrice: 25.0,
        salePrice: 25.0,
        discountPercentage: 0,
        lineSubtotal: 25.0,
        lineTotal: 25.0,
      },
    ],
  };

  mockOrders['ORD-1760731845000'] = {
    id: 'ORD-1760731845000',
    status: 'PAID',
    createdAt: '2026-10-14T15:42:00.000Z',
    expiresAt: '2026-10-14T15:57:00.000Z',
    customerEmail: 'maria@email.com',
    shippingAddress: 'Calle 93 # 14-20, Apto 402, Bogotá',
    shippingCoordinates: { lat: 4.6759, lng: -74.0536 },
    subtotalAmount: 142500,
    discountAmount: 0,
    totalAmount: 142500,
    items: [
      {
        productId: '1',
        name: 'Serum Niacinamida 10%',
        thumbnailUrl: minioUrl('prod-1-thumb.webp'),
        quantity: 1,
        unitPrice: 62000,
        salePrice: 62000,
        discountPercentage: 0,
        lineSubtotal: 62000,
        lineTotal: 62000,
      },
      {
        productId: '2',
        name: 'Gel Limpiador Purificante',
        thumbnailUrl: minioUrl('prod-2-thumb.webp'),
        quantity: 2,
        unitPrice: 35000,
        salePrice: 35000,
        discountPercentage: 0,
        lineSubtotal: 70000,
        lineTotal: 70000,
      },
      {
        productId: '3',
        name: 'Exfoliante Corporal Café & Coco',
        thumbnailUrl: minioUrl('prod-3-thumb.webp'),
        quantity: 1,
        unitPrice: 45500,
        salePrice: 45500,
        discountPercentage: 0,
        lineSubtotal: 45500,
        lineTotal: 45500,
      },
    ],
  };

  mockOrders['ORD-1758920100000'] = {
    id: 'ORD-1758920100000',
    status: 'PAID',
    createdAt: '2026-09-28T10:15:00.000Z',
    expiresAt: '2026-09-28T10:30:00.000Z',
    customerEmail: 'maria@email.com',
    shippingAddress: 'Calle 93 # 14-20, Bogotá',
    shippingCoordinates: { lat: 4.6759, lng: -74.0536 },
    subtotalAmount: 89900,
    discountAmount: 0,
    totalAmount: 89900,
    items: [
      {
        productId: '4',
        name: 'Crema Ceramidas',
        thumbnailUrl: minioUrl('prod-4-thumb.webp'),
        quantity: 1,
        unitPrice: 54900,
        salePrice: 54900,
        discountPercentage: 0,
        lineSubtotal: 54900,
        lineTotal: 54900,
      },
      {
        productId: '5',
        name: 'Bálsamo Labial',
        thumbnailUrl: minioUrl('prod-5-thumb.webp'),
        quantity: 2,
        unitPrice: 17500,
        salePrice: 17500,
        discountPercentage: 0,
        lineSubtotal: 35000,
        lineTotal: 35000,
      },
    ],
  };
};

resetMockOrders();

const handleGetOrders = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const rawEmail = url.searchParams.get('email');
  if (!rawEmail || typeof rawEmail !== 'string' || !rawEmail.trim()) {
    return HttpResponse.json(
      { error: 'El parámetro email es obligatorio para consultar pedidos.' },
      { status: 400 }
    );
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return HttpResponse.json(
      { error: 'Formato de correo electrónico inválido.' },
      { status: 400 }
    );
  }

  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 50;

  const paidOrders = Object.values(mockOrders)
    .filter(
      (order) =>
        order.status === 'PAID' &&
        Boolean(order.customerEmail) &&
        order.customerEmail!.trim().toLowerCase() === normalizedEmail
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((order) => ({
      ...order,
      orderId: order.id,
      paidAt: order.createdAt,
      currency: 'COP' as const,
    }));

  return HttpResponse.json({ orders: paidOrders });
};

const handleOrderLookup = async ({ request }: { request: Request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      orderId?: string;
      email?: string;
    };

    const orderId = body.orderId;
    const email = body.email;

    if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
      return HttpResponse.json(
        { error: 'El número de orden es requerido.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return HttpResponse.json(
        { error: 'El correo electrónico es requerido.' },
        { status: 400 }
      );
    }

    const trimmedOrderId = orderId.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return HttpResponse.json(
        { error: 'Formato de correo electrónico inválido.' },
        { status: 400 }
      );
    }

    const existing = Object.values(mockOrders).find(
      (o) =>
        o.id.toLowerCase() === trimmedOrderId.toLowerCase() &&
        o.status === 'PAID' &&
        Boolean(o.customerEmail) &&
        o.customerEmail!.trim().toLowerCase() === normalizedEmail
    );

    if (!existing) {
      return HttpResponse.json(
        {
          error:
            'No encontramos un pedido pagado asociado a ese número de orden y correo electrónico.',
        },
        { status: 404 }
      );
    }

    const resolvedOrder = {
      ...existing,
      orderId: existing.id,
      paidAt: existing.createdAt,
      currency: 'COP' as const,
    };

    return HttpResponse.json({ order: resolvedOrder });
  } catch {
    return HttpResponse.json(
      { error: 'Error interno al consultar la orden.' },
      { status: 500 }
    );
  }
};

const handleOrderDetail = ({ params }: { params: { orderId?: string } }) => {
  const orderId = params.orderId || '';
  const existing = mockOrders[orderId];
  if (existing) {
    // Si ya expiró por tiempo, devolver EXPIRED
    if (existing.status === 'RESERVED' && new Date(existing.expiresAt).getTime() <= Date.now()) {
      return HttpResponse.json({ ...existing, status: 'EXPIRED' });
    }
    return HttpResponse.json(existing);
  }

  // Fallback si no existe previamente
  const fallbackOrder: OrderDetail = {
    id: orderId,
    status: 'RESERVED',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    customerEmail: 'julio@ejemplo.com',
    shippingAddress: 'Carrera 65A 1 sur-10',
    shippingCoordinates: { lat: 6.2081, lng: -75.5684 },
    subtotalAmount: 65.0,
    discountAmount: 15.0,
    totalAmount: 50.0,
    items: [
      {
        productId: '1',
        name: 'Jabón de coco',
        thumbnailUrl: minioUrl('prod-1-thumb.webp'),
        quantity: 2,
        unitPrice: 20.0,
        salePrice: 12.5,
        discountPercentage: 37,
        lineSubtotal: 40.0,
        lineTotal: 25.0,
      },
      {
        productId: '2',
        name: 'Sal hidratante',
        thumbnailUrl: minioUrl('prod-2-thumb.webp'),
        quantity: 1,
        unitPrice: 25.0,
        salePrice: 25.0,
        discountPercentage: 0,
        lineSubtotal: 25.0,
        lineTotal: 25.0,
      },
    ],
  };
  mockOrders[orderId] = fallbackOrder;
  return HttpResponse.json(fallbackOrder);
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

    const orderId = `ord-${Date.now().toString().slice(-6)}`;
    const items: OrderItem[] = cart.map((item) => {
      const found = mockCatalogItems.find((c) => c.id === item.productId);
      const unitPrice = found ? found.salePrice * 1.25 : 20.0;
      const salePrice = found ? found.salePrice : 20.0;
      const discountPercentage = found ? found.discountPercentage : 0;
      const lineSubtotal = unitPrice * item.quantity;
      const lineTotal = salePrice * item.quantity;

      return {
        productId: item.productId,
        name: found ? found.name : `Producto ${item.productId}`,
        thumbnailUrl: found ? found.thumbnailUrl : null,
        quantity: item.quantity,
        unitPrice,
        salePrice,
        discountPercentage,
        lineSubtotal,
        lineTotal,
      };
    });

    const subtotalAmount = items.reduce((acc, item) => acc + item.lineSubtotal, 0);
    const totalAmount = items.reduce((acc, item) => acc + item.lineTotal, 0);
    const discountAmount = Math.max(0, subtotalAmount - totalAmount);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    const order: OrderDetail = {
      id: orderId,
      status: 'RESERVED',
      createdAt: now.toISOString(),
      expiresAt,
      customerEmail: 'julio@ejemplo.com',
      shippingAddress: 'Carrera 65A 1 sur-10',
      shippingCoordinates: { lat: 6.2081, lng: -75.5684 },
      subtotalAmount,
      discountAmount,
      totalAmount,
      items,
    };

    mockOrders[orderId] = order;

    const response: ReserveResponse = {
      success: true,
      order,
    };

    return HttpResponse.json(response);
  } catch {
    return HttpResponse.json({ error: 'Error al reservar' }, { status: 400 });
  }
};

export let mockAddresses: UserAddress[] = [
  {
    id: 'addr-1',
    userId: 'usr-123',
    label: 'Casa',
    receiverName: 'Julio Cano',
    receiverPhone: '+57 300 123 4567',
    city: 'Medellín',
    department: 'Antioquia',
    addressLine: 'Carrera 65A # 1 sur - 10',
    additionalInfo: 'Torre 2, Apto 402. Dejar en portería',
    coordinates: { lat: 6.2081, lng: -75.5684 },
    isDefault: true,
  },
];

const handleGetUserAddresses = () => {
  return HttpResponse.json(mockAddresses);
};

const handleCreateUserAddress = async ({ request }: { request: Request }) => {
  try {
    const body = (await request.json()) as Omit<UserAddress, 'id'>;
    const newId = `addr-${Date.now()}`;
    const isFirst = mockAddresses.length === 0;
    const isDefault = isFirst ? true : Boolean(body.isDefault);

    if (isDefault) {
      mockAddresses = mockAddresses.map((addr) => ({ ...addr, isDefault: false }));
    }

    const newAddress: UserAddress = {
      ...body,
      id: newId,
      isDefault,
    };
    mockAddresses.push(newAddress);
    return HttpResponse.json(newAddress, { status: 201 });
  } catch {
    return HttpResponse.json({ error: 'Error al registrar dirección' }, { status: 400 });
  }
};

const handleCheckoutConfirm = async ({
  request,
  params,
}: {
  request: Request;
  params: { orderId?: string };
}) => {
  const orderId = params.orderId || '';
  try {
    const body = (await request.json().catch(() => ({}))) as {
      shippingAddress?: string;
      shippingCoordinates?: { lat: number; lng: number } | null;
      customerEmail?: string;
    };

    if (!body.shippingAddress || body.shippingAddress.trim() === '') {
      return HttpResponse.json(
        { error: 'La dirección de entrega es requerida para confirmar la compra.' },
        { status: 400 }
      );
    }

    if (mockOrders[orderId]) {
      mockOrders[orderId].shippingAddress = body.shippingAddress;
      if (body.shippingCoordinates !== undefined) {
        mockOrders[orderId].shippingCoordinates = body.shippingCoordinates;
      }
      if (body.customerEmail) {
        mockOrders[orderId].customerEmail = body.customerEmail;
      }
      mockOrders[orderId].status = 'PAID';
    }
  } catch {
    return HttpResponse.json(
      { error: 'La dirección de entrega es requerida para confirmar la compra.' },
      { status: 400 }
    );
  }

  const response: ConfirmResponse = {
    success: true,
    message: 'Pago consolidado en Kardex.',
  };
  return HttpResponse.json(response);
};

const handleCheckoutCancel = ({ params }: { params: { orderId?: string } }) => {
  const orderId = params.orderId || '';
  if (mockOrders[orderId]) {
    mockOrders[orderId].status = 'CANCELLED';
  }
  const response: CancelResponse = {
    success: true,
    message: 'Reserva anulada y stock liberado.',
  };
  return HttpResponse.json(response);
};

export const mockHelpTopics = [
  {
    id: 'help-shipping',
    title: 'Envíos y Tiempos de Entrega',
    category: 'shipping',
    icon: 'truck',
    content:
      'Ofrecemos envíos a todo el país. Todas las compras con valor igual o superior a $50.00 cuentan con Envío Gratis automático aplicado en el carrito. Los tiempos de despacho habituales oscilan entre 2 y 4 días hábiles dependiendo de tu ciudad de destino. Recibirás notificaciones por correo electrónico con el estado de tu despacho.',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'help-payment',
    title: 'Medios de Pago y Transacciones Seguras',
    category: 'payment',
    icon: 'credit-card',
    content:
      'Procesamos pagos mediante pasarelas cifradas de alta seguridad (tarjetas de crédito, débito y PSE). Al iniciar tu proceso de pago, nuestro sistema reserva tu inventario de forma exclusiva durante 15 minutos en el Kardex para asegurar que nadie compre tus productos mientras completas la transacción.',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'help-orders',
    title: 'Seguimiento de Pedidos y Recompra',
    category: 'orders',
    icon: 'package',
    content:
      'Puedes consultar en cualquier momento tus compras confirmadas en la sección Mis Pedidos ingresando tu correo electrónico o tu número de orden (ORD-...). Desde allí puedes descargar tu comprobante de pago oficial e incluso repetir tu rutina favorita en 1 clic gracias a nuestro botón de Recompra Inteligente.',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'help-support',
    title: 'Contacto y Soporte Directo',
    category: 'support',
    icon: 'message-circle',
    content:
      '¿Tienes alguna duda sobre los ingredientes botánicos de nuestros productos o un requerimiento especial con tu orden? Escríbenos a soporte@zelbana.com o contáctanos por WhatsApp al +57 (300) 123-4567. Nuestro equipo de atención botánica te responderá en menos de 2 horas hábiles.',
    displayOrder: 4,
    isActive: true,
  },
];

const handleGetHelpTopics = () => {
  return HttpResponse.json({ helpTopics: mockHelpTopics });
};

// Auth Handlers (Epic 13)
const handleAuthLogin = async ({ request }: { request: Request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    const { email, password } = body;

    if (!email || !password) {
      return HttpResponse.json(
        { error: 'Correo y contraseña son requeridos.' },
        { status: 400 }
      );
    }

    if (email === 'rate.limit@ejemplo.com' || password === 'ratelimit') {
      return HttpResponse.json(
        { error: 'Demasiados intentos fallidos. Por tu seguridad, espera 1 minuto.' },
        { status: 429 }
      );
    }

    if (password === 'wrong-password' || email === 'invalid@ejemplo.com' || password === 'wrongpassword') {
      return HttpResponse.json(
        { error: 'El correo o la contraseña son incorrectos.' },
        { status: 401 }
      );
    }

    const userName = email.includes('maria') ? 'María Pérez' : 'Julio Cano';
    return HttpResponse.json({
      success: true,
      token: 'mock-jwt-token-valid-7d',
      user: {
        id: 'usr-12345',
        name: userName,
        email: email.trim().toLowerCase(),
        avatarUrl: null,
        authProvider: 'local',
      },
    });
  } catch {
    return HttpResponse.json({ error: 'Error interno de autenticación' }, { status: 500 });
  }
};

const handleAuthRegister = async ({ request }: { request: Request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return HttpResponse.json(
        { error: 'Todos los campos son requeridos. (Contraseña de mínimo 8 caracteres y correo válido)' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return HttpResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      );
    }

    if (email === 'existente@ejemplo.com' || email === 'duplicado@ejemplo.com') {
      return HttpResponse.json(
        { error: 'El correo electrónico ya está registrado.' },
        { status: 409 }
      );
    }

    if (email === 'rate.limit@ejemplo.com') {
      return HttpResponse.json(
        { error: 'Demasiados intentos fallidos. Por tu seguridad, espera 1 minuto.' },
        { status: 429 }
      );
    }

    return HttpResponse.json(
      {
        success: true,
        token: 'mock-jwt-token-registered-7d',
        user: {
          id: `usr-${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          avatarUrl: null,
          authProvider: 'local',
        },
      },
      { status: 201 }
    );
  } catch {
    return HttpResponse.json({ error: 'Error interno de registro' }, { status: 500 });
  }
};

const handleAuthMe = ({ request }: { request: Request }) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.includes('expired')) {
    return HttpResponse.json(
      { error: 'Token de acceso no válido o expirado.' },
      { status: 401 }
    );
  }

  return HttpResponse.json({
    id: 'usr-12345',
    name: 'Julio Cano',
    email: 'julio@ejemplo.com',
    avatarUrl: null,
    authProvider: 'local',
  });
};

export const handlers = [
  // Auth Endpoints (Epic 13)
  http.post('*/storefront/api/auth/login', handleAuthLogin),
  http.post('*/api/auth/login', handleAuthLogin),

  http.post('*/storefront/api/auth/register', handleAuthRegister),
  http.post('*/api/auth/register', handleAuthRegister),

  http.get('*/storefront/api/auth/me', handleAuthMe),
  http.get('*/api/auth/me', handleAuthMe),

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

  // Orders & Lookup (Epic 11)
  http.get('*/storefront/api/orders', handleGetOrders),
  http.get('*/api/orders', handleGetOrders),

  http.post('*/storefront/api/orders/lookup', handleOrderLookup),
  http.post('*/api/orders/lookup', handleOrderLookup),

  // Orders & Checkout
  http.get('*/storefront/api/orders/:orderId', handleOrderDetail),
  http.get('*/api/orders/:orderId', handleOrderDetail),

  http.post('*/storefront/api/checkout/reserve', handleCheckoutReserve),
  http.post('*/api/checkout/reserve', handleCheckoutReserve),

  http.post('*/storefront/api/checkout/confirm/:orderId', handleCheckoutConfirm),
  http.post('*/api/checkout/confirm/:orderId', handleCheckoutConfirm),

  http.post('*/storefront/api/checkout/cancel/:orderId', handleCheckoutCancel),
  http.post('*/api/checkout/cancel/:orderId', handleCheckoutCancel),

  // User Addresses
  http.get('*/storefront/api/user/addresses', handleGetUserAddresses),
  http.get('*/api/user/addresses', handleGetUserAddresses),

  http.post('*/storefront/api/user/addresses', handleCreateUserAddress),
  http.post('*/api/user/addresses', handleCreateUserAddress),

  // Store Settings (Epic 09)
  http.get('*/storefront/api/settings', () => HttpResponse.json(mockStoreSettings)),
  http.get('*/api/settings', () => HttpResponse.json(mockStoreSettings)),

  // Help Topics (Epic 12)
  http.get('*/storefront/api/help', handleGetHelpTopics),
  http.get('*/api/help', handleGetHelpTopics),
];



