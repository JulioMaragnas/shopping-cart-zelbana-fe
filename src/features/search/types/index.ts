export interface Product {
  id: string;
  name: string;
  description: string;
  photos: string[];
  salePrice: number;
  originalPrice: number;
  disponible: boolean;
  lowStock: boolean;
}

export interface SearchParams {
  q?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}
