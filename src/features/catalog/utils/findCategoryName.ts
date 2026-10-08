import type { Category } from '../../search/types';

export const findCategoryName = (cats: Category[], targetId: string): string | null =>
  cats.reduce<string | null>(
    (found, cat) =>
      found ??
      (cat.id === targetId ? cat.name : findCategoryName(cat.children ?? [], targetId)),
    null
  );
