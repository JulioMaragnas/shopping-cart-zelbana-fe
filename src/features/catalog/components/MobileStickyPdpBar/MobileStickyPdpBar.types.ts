export interface MobileStickyPdpBarProps {
  name: string;
  thumbnailUrl?: string | null;
  salePrice: number;
  lowStock?: boolean;
  quantity: number | '';
  maxOrderQuantity: number;
  remainingAvailable: number;
  isPurchaseDisabled: boolean;
  buttonLabel: string;
  onQuantityChange: (qty: number | '') => void;
  onAddToCart: () => void;
}
