import { useQuery } from '@tanstack/react-query';

export interface StoreSettingsResponse {
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
}

export const DEFAULT_SETTINGS: StoreSettingsResponse = {
  freeShippingEnabled: true,
  freeShippingThreshold: 50.0,
};

export const useStoreSettings = () => {
  return useQuery<StoreSettingsResponse>({
    queryKey: ['storeSettings'],
    queryFn: async () => {
      try {
        const res = await fetch('/storefront/api/settings');
        if (!res.ok) {
          return DEFAULT_SETTINGS;
        }
        const data = await res.json();
        return {
          freeShippingEnabled: Boolean(data?.freeShippingEnabled),
          freeShippingThreshold:
            typeof data?.freeShippingThreshold === 'number'
              ? data.freeShippingThreshold
              : DEFAULT_SETTINGS.freeShippingThreshold,
        };
      } catch {
        return DEFAULT_SETTINGS;
      }
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    initialData: DEFAULT_SETTINGS,
    initialDataUpdatedAt: 0,
  });
};
