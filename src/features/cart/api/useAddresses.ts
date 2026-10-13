import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserAddress } from '../types';

export const useUserAddresses = () => {
  return useQuery<UserAddress[], Error>({
    queryKey: ['userAddresses'],
    queryFn: async () => {
      const response = await fetch('/storefront/api/user/addresses');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener las direcciones del usuario');
      }

      return data;
    },
  });
};

export type CreateAddressInput = Omit<UserAddress, 'id' | 'userId'>;

export const useCreateUserAddress = () => {
  const queryClient = useQueryClient();

  return useMutation<UserAddress, Error, CreateAddressInput>({
    mutationFn: async (newAddress) => {
      const response = await fetch('/storefront/api/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAddress),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar la dirección');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAddresses'] });
    },
  });
};
