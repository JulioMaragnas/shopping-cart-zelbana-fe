export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  photos: string[];
  salePrice: number;
  discountPercentage: number;
  categoryId?: string;
  categoryName?: string;
  specs?: ProductSpec[];
  disponible: boolean;
  lowStock: boolean;
  maxOrderQuantity: number;
}

export interface Category {
  id: string;
  name: string;
  children?: Category[];
}

export interface CatalogProductPayload {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string | null;
  photos?: string[];
  salePrice: number;
  discountPercentage?: number;
  categoryId?: string;
  categoryName?: string;
  specs?: ProductSpec[];
  disponible?: boolean;
  lowStock?: boolean;
  maxOrderQuantity?: number;
}

export interface CatalogItem {
  product?: CatalogProductPayload;
  id?: string;
  name?: string;
  description?: string;
  thumbnailUrl?: string | null;
  photos?: string[];
  salePrice?: number;
  discountPercentage?: number;
  categoryId?: string;
  categoryName?: string;
  specs?: ProductSpec[];
  disponible?: boolean;
  lowStock?: boolean;
  maxOrderQuantity?: number;
}

export interface PaginatedCatalogResponse {
  items: CatalogItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export type ProductDetailResponse = CatalogItem;

export interface SearchParams {
  query?: string;
  q?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  offset?: number;
}

