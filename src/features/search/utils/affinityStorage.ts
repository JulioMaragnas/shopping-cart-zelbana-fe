export const AFFINITY_STORAGE_KEY = 'zelbana-user-affinity';
export const MAX_AFFINITY_ITEMS = 5;

export interface UserAffinityData {
  recentSearches: string[];
  recentCategories: string[];
}

const DEFAULT_AFFINITY_DATA: UserAffinityData = {
  recentSearches: [],
  recentCategories: [],
};

/**
 * Lee de forma segura los datos de afinidad desde localStorage con tolerancia a fallos.
 */
export function getAffinityData(): UserAffinityData {
  try {
    const raw = localStorage.getItem(AFFINITY_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AFFINITY_DATA };

    const parsed = JSON.parse(raw);
    const recentSearches = Array.isArray(parsed?.recentSearches)
      ? parsed.recentSearches.filter((item: unknown) => typeof item === 'string')
      : [];
    const recentCategories = Array.isArray(parsed?.recentCategories)
      ? parsed.recentCategories.filter((item: unknown) => typeof item === 'string')
      : [];

    return {
      recentSearches: recentSearches.slice(0, MAX_AFFINITY_ITEMS),
      recentCategories: recentCategories.slice(0, MAX_AFFINITY_ITEMS),
    };
  } catch {
    return { ...DEFAULT_AFFINITY_DATA };
  }
}

/**
 * Guarda de forma segura los datos de afinidad en localStorage.
 */
function saveAffinityData(data: UserAffinityData): void {
  try {
    localStorage.setItem(AFFINITY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Tolerancia silenciosa a errores de cuota o modo incógnito
  }
}

/**
 * Registra un término de búsqueda en recentSearches (FIFO máx 5, sin duplicados).
 * Regla anti-basura: se ignora si trim().length < 2.
 */
export function recordSearchAffinity(term: string): void {
  if (!term || typeof term !== 'string') return;
  const normalized = term.trim().toLowerCase();
  if (normalized.length < 2) return;

  const current = getAffinityData();
  const filtered = current.recentSearches.filter((item) => item !== normalized);
  const updated = [normalized, ...filtered].slice(0, MAX_AFFINITY_ITEMS);

  saveAffinityData({
    ...current,
    recentSearches: updated,
  });
}

/**
 * Registra una categoría en recentCategories (FIFO máx 5, sin duplicados).
 */
export function recordCategoryAffinity(categoryId: string): void {
  if (!categoryId || typeof categoryId !== 'string') return;
  const trimmed = categoryId.trim();
  if (!trimmed) return;

  const current = getAffinityData();
  const filtered = current.recentCategories.filter((id) => id !== trimmed);
  const updated = [trimmed, ...filtered].slice(0, MAX_AFFINITY_ITEMS);

  saveAffinityData({
    ...current,
    recentCategories: updated,
  });
}

/**
 * Limpia completamente la información de afinidad en localStorage.
 */
export function clearAffinityData(): void {
  try {
    localStorage.removeItem(AFFINITY_STORAGE_KEY);
  } catch {
    // Tolerancia silenciosa
  }
}

/**
 * Construye los query params para la petición al catálogo según la afinidad acumulada.
 */
export function buildAffinityQueryParams(): {
  affinityTerms?: string;
  affinityCategories?: string;
} {
  const data = getAffinityData();
  const result: { affinityTerms?: string; affinityCategories?: string } = {};

  if (data.recentSearches.length > 0) {
    result.affinityTerms = data.recentSearches.slice(0, MAX_AFFINITY_ITEMS).join(',');
  }
  if (data.recentCategories.length > 0) {
    result.affinityCategories = data.recentCategories.slice(0, MAX_AFFINITY_ITEMS).join(',');
  }

  return result;
}
