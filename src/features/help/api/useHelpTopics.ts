import { useQuery } from '@tanstack/react-query';
import type { HelpTopic } from '../types/help';

export const useHelpTopics = () => {
  return useQuery<HelpTopic[]>({
    queryKey: ['helpTopics'],
    queryFn: async () => {
      const res = await fetch('/storefront/api/help');
      if (!res.ok) {
        throw new Error('Error al cargar los temas de ayuda');
      }
      const data = await res.json();
      return (data.helpTopics || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        icon: t.icon,
        content: t.content,
        displayOrder: t.displayOrder ?? t.display_order ?? 0,
        isActive: t.isActive ?? t.is_active ?? true,
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false,
  });
};
