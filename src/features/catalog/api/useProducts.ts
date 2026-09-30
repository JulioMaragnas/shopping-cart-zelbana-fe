import { useQuery } from '@tanstack/react-query';

export interface Product {
  id: string;
  name: string;
  description: string;
  salePrice: number;
  disponible: boolean;
}

// HOF for the fetching logic
const createProductFetcher = () => async (): Promise<Product[]> => {
  // In a real app, this would be:
  // const response = await fetch('/api/products');
  // return response.json();
  
  // Mock data for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', name: 'Ciclocomputador Bici', description: 'GPS Integrado, 20h batería', salePrice: 150000, disponible: true },
        { id: '2', name: 'Sensor de Cadencia', description: 'Bluetooth y ANT+', salePrice: 85000, disponible: true },
        { id: '3', name: 'Poste Asiento Carbono', description: 'Ultra ligero, 27.2mm', salePrice: 200000, disponible: false },
        { id: '4', name: 'Llave de Pedales', description: 'Acero reforzado, 15mm', salePrice: 45000, disponible: true },
      ]);
    }, 500);
  });
};

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: createProductFetcher(),
  });
};
