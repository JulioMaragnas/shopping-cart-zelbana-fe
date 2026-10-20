import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAffinityData,
  recordSearchAffinity,
  recordCategoryAffinity,
  clearAffinityData,
  buildAffinityQueryParams,
  AFFINITY_STORAGE_KEY,
  MAX_AFFINITY_ITEMS,
} from '../utils/affinityStorage';

describe('useAffinityStore & affinityStorage (TDD-FE-01, TDD-FE-02)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('TDD-FE-01: Reglas FIFO (máx 5 términos, máx 5 categorías) y deduplicación', () => {
    it('returns empty lists when localStorage is empty', () => {
      const data = getAffinityData();
      expect(data).toEqual({ recentSearches: [], recentCategories: [] });
    });

    it('records valid search terms up to 5 items, FIFO, avoiding duplicates and moving them to the front', () => {
      recordSearchAffinity('serum');
      recordSearchAffinity('vitamina c');
      recordSearchAffinity('acido hialuronico');
      recordSearchAffinity('crema');
      recordSearchAffinity('bloqueador');

      let data = getAffinityData();
      expect(data.recentSearches).toHaveLength(5);
      expect(data.recentSearches[0]).toBe('bloqueador');
      expect(data.recentSearches[4]).toBe('serum');

      // Superar límite de 5: debe descartar el más antiguo ('serum')
      recordSearchAffinity('tonico');
      data = getAffinityData();
      expect(data.recentSearches).toHaveLength(5);
      expect(data.recentSearches[0]).toBe('tonico');
      expect(data.recentSearches).not.toContain('serum');

      // Deduplicación: re-insertar 'crema' debe moverlo al frente sin duplicar
      recordSearchAffinity('crema');
      data = getAffinityData();
      expect(data.recentSearches).toHaveLength(5);
      expect(data.recentSearches[0]).toBe('crema');
      expect(data.recentSearches.filter((item) => item === 'crema')).toHaveLength(1);
    });

    it('applies anti-garbage rule: does not record terms with trimmed length < 2', () => {
      recordSearchAffinity('');
      recordSearchAffinity('   ');
      recordSearchAffinity('a');
      recordSearchAffinity(' b ');

      const data = getAffinityData();
      expect(data.recentSearches).toEqual([]);
    });

    it('normalizes search terms with trim and lowercase', () => {
      recordSearchAffinity('  Vitamina C  ');
      const data = getAffinityData();
      expect(data.recentSearches).toEqual(['vitamina c']);
    });

    it('records categories up to 5 items, FIFO, moving existing category to the front', () => {
      recordCategoryAffinity('cat-1');
      recordCategoryAffinity('cat-2');
      recordCategoryAffinity('cat-3');
      recordCategoryAffinity('cat-4');
      recordCategoryAffinity('cat-5');

      let data = getAffinityData();
      expect(data.recentCategories).toHaveLength(5);
      expect(data.recentCategories[0]).toBe('cat-5');
      expect(data.recentCategories[4]).toBe('cat-1');

      // Superar límite: descarta 'cat-1'
      recordCategoryAffinity('cat-6');
      data = getAffinityData();
      expect(data.recentCategories).toHaveLength(5);
      expect(data.recentCategories[0]).toBe('cat-6');
      expect(data.recentCategories).not.toContain('cat-1');

      // Re-insertar 'cat-3' lo mueve al frente sin duplicar
      recordCategoryAffinity('cat-3');
      data = getAffinityData();
      expect(data.recentCategories).toHaveLength(5);
      expect(data.recentCategories[0]).toBe('cat-3');
      expect(data.recentCategories.filter((id) => id === 'cat-3')).toHaveLength(1);
    });

    it('buildAffinityQueryParams builds comma-separated string params up to MAX_AFFINITY_ITEMS', () => {
      recordSearchAffinity('cacao');
      recordSearchAffinity('avena');
      recordCategoryAffinity('cat-3');
      recordCategoryAffinity('cat-1');

      const params = buildAffinityQueryParams();
      expect(params).toEqual({
        affinityTerms: 'avena,cacao',
        affinityCategories: 'cat-1,cat-3',
      });
    });

    it('buildAffinityQueryParams returns empty object when affinity is empty', () => {
      const params = buildAffinityQueryParams();
      expect(params).toEqual({});
    });

    it('clearAffinityData resets the storage completely', () => {
      recordSearchAffinity('cacao');
      recordCategoryAffinity('cat-1');
      clearAffinityData();
      expect(getAffinityData()).toEqual({ recentSearches: [], recentCategories: [] });
    });
  });

  describe('TDD-FE-02: Tolerancia a fallos en localStorage (Safari Incognito / QuotaExceeded)', () => {
    it('returns empty lists if localStorage.getItem throws SecurityError or QuotaExceededError', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: The operation is insecure.');
      });

      const data = getAffinityData();
      expect(data).toEqual({ recentSearches: [], recentCategories: [] });
    });

    it('does not throw when localStorage.setItem fails (silent fallback)', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError: Dom storage limit reached.');
      });

      expect(() => recordSearchAffinity('protector solar')).not.toThrow();
      expect(() => recordCategoryAffinity('cat-2')).not.toThrow();
    });

    it('handles corrupted JSON in localStorage gracefully', () => {
      localStorage.setItem(AFFINITY_STORAGE_KEY, 'corrupted-non-json-string{{');
      const data = getAffinityData();
      expect(data).toEqual({ recentSearches: [], recentCategories: [] });
    });
  });
});
