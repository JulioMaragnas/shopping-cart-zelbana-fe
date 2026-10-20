import type { ShippingPromotionDTO, UpsellProductDTO } from '../../types';

export interface FreeShippingUpsellCarouselProps {
  promotion: ShippingPromotionDTO;
  onAddUpsellProduct: (product: UpsellProductDTO) => void;
  isAddingId?: string | null;
}
