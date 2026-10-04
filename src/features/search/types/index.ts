export interface Product {
  id: string;
  name: string;
  description: string;
  photos: string[];
  unitPrice?: number;
  salePrice: number;
  originalPrice: number;
  categoryId?: string;
  disponible: boolean;
  lowStock: boolean;
  currentStock?: number;
}

export interface Category {
  id: string;
  name: string;
  children?: Category[];
}

export interface CatalogItem {
  product: {
    id: string;
    name: string;
    description: string;
    photos: string[];
    unitPrice?: number;
    salePrice: number;
    originalPrice: number;
    categoryId?: string;
  };
  currentStock: number;
}

export interface PaginatedCatalogResponse {
  items: CatalogItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface ProductDetailResponse {
  product: {
    id: string;
    name: string;
    description: string;
    photos: string[];
    unitPrice?: number;
    salePrice: number;
    originalPrice: number;
    categoryId?: string;
  };
  currentStock: number;
}

export interface SearchParams {
  query?: string;
  q?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  offset?: number;
}
