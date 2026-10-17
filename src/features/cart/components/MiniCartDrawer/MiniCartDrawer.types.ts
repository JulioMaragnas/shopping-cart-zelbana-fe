export interface MiniCartDrawerProps {
  className?: string;
}

export interface MiniCartItemRowProps {
  id: string;
  name: string;
  thumbnailUrl?: string | null;
  salePrice: number;
  quantity: number;
  maxOrderQuantity?: number;
  availableStock?: number;
  stockMessage?: string;
  isAvailable?: boolean;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
}
