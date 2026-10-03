import { http, HttpResponse } from 'msw';
import type { Product } from '../features/search/types';

// Mock de la base de datos de productos para testing y UI
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Jeep wrangler',
    description: 'Todoterreno clásico, ideal para aventuras extremas.',
    photos: ['https://via.placeholder.com/150'],
    salePrice: 45000,
    originalPrice: 48000,
    disponible: true,
    lowStock: false,
  },
  {
    id: '2',
    name: 'Jeep grand cherokee',
    description: 'SUV de lujo con gran capacidad 4x4.',
    photos: ['https://via.placeholder.com/150'],
    salePrice: 55000,
    originalPrice: 55000,
    disponible: true,
    lowStock: true,
  },
  {
    id: '3',
    name: 'Jeep rubicon',
    description: 'La versión más extrema para el off-road.',
    photos: ['https://via.placeholder.com/150'],
    salePrice: 50000,
    originalPrice: 52000,
    disponible: false,
    lowStock: false,
  },
  {
    id: '4',
    name: 'Jeep cherokee',
    description: 'SUV compacta y versátil.',
    photos: ['https://via.placeholder.com/150'],
    salePrice: 35000,
    originalPrice: 37000,
    disponible: true,
    lowStock: false,
  },
  {
    id: '5',
    name: 'Jeep compass',
    description: 'Diseño moderno y eficiencia urbana.',
    photos: ['https://via.placeholder.com/150'],
    salePrice: 28000,
    originalPrice: 30000,
    disponible: true,
    lowStock: false,
  }
];

export const handlers = [
  // 1. Catálogo unificado y Búsqueda (Fuzzy)
  http.get('/api/products', async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const limit = Number(url.searchParams.get('limit')) || 20;
    
    let results = mockProducts;
    
    if (q) {
      const lowerQ = q.toLowerCase();
      // Simula búsqueda "fuzzy" o "trigram" simple
      results = mockProducts.filter(p => 
        p.name.toLowerCase().includes(lowerQ) || 
        p.description.toLowerCase().includes(lowerQ)
      );
    }
    
    // Retraso para simular carga pesada (catálogo)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HttpResponse.json(results.slice(0, limit)));
      }, 500); // 500ms delay para simular DB real
    });
  }),

  // 2. Typeahead ultrarrápido (Sugerencias)
  http.get('/api/search/suggestions', async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    
    if (!q) {
      return HttpResponse.json([]);
    }
    
    const lowerQ = q.toLowerCase();
    const suggestions = mockProducts
      .filter(p => p.name.toLowerCase().includes(lowerQ))
      .map(p => p.name);
      
    // Retraso mínimo, simula indexación rápida sin Kardex
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(HttpResponse.json(suggestions));
      }, 100); // 100ms delay 
    });
  })
];
