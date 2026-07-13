import { useCallback, useEffect, useMemo, useState } from 'react';
import { CachedDocumentSummary, DocumentSummaryResponse, SummarySection } from '../types';

const AI_SERVICE_BASE_URL = 'http://localhost:8000';
const SUMMARY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface UseDocumentSummaryResult {
  sections: SummarySection[];
  loading: boolean;
  error: string;
  fromCache: boolean;
  refetch: () => Promise<void>;
  persistCache: () => void;
}

const getSummaryCacheKey = (handle: string) => `summary_${handle}`;

const readSummaryCache = (handle: string): CachedDocumentSummary | null => {
  if (!handle) {
    return null;
  }

  try {
    const cachedValue = window.localStorage.getItem(getSummaryCacheKey(handle));
    if (!cachedValue) {
      return null;
    }

    const parsedCache = JSON.parse(cachedValue) as CachedDocumentSummary;
    const isValidShape =
      parsedCache?.handle === handle &&
      typeof parsedCache.generatedAt === 'string' &&
      Array.isArray(parsedCache.sections);

    if (!isValidShape) {
      window.localStorage.removeItem(getSummaryCacheKey(handle));
      return null;
    }

    const generatedAtMs = Date.parse(parsedCache.generatedAt);
    if (Number.isNaN(generatedAtMs) || Date.now() - generatedAtMs > SUMMARY_CACHE_TTL_MS) {
      window.localStorage.removeItem(getSummaryCacheKey(handle));
      return null;
    }

    return parsedCache;
  } catch (cacheError) {
    console.error('Unable to read cached summary:', cacheError);
    window.localStorage.removeItem(getSummaryCacheKey(handle));
    return null;
  }
};

const writeSummaryCache = (handle: string, sections: SummarySection[]) => {
  if (!handle || sections.length === 0) {
    return;
  }

  const cacheEntry: CachedDocumentSummary = {
    handle,
    generatedAt: new Date().toISOString(),
    sections,
  };

  window.localStorage.setItem(getSummaryCacheKey(handle), JSON.stringify(cacheEntry));
};

const useDocumentSummary = (handle: string, enabled: boolean): UseDocumentSummaryResult => {
  const [sections, setSections] = useState<SummarySection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);

  const cachedSummary = useMemo(() => readSummaryCache(handle), [handle]);

  const fetchSummary = useCallback(async (forceRefresh = false) => {
    if (!enabled) {
      return;
    }

    if (!handle) {
      setError('Handle not available for this item.');
      setSections([]);
      setFromCache(false);
      return;
    }

    if (!forceRefresh && cachedSummary) {
      setSections(cachedSummary.sections);
      setError('');
      setLoading(false);
      setFromCache(true);
      return;
    }

    setLoading(true);
    setError('');
    setFromCache(false);

    try {
      const response = await fetch(`${AI_SERVICE_BASE_URL}/document/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle }),
      });

      if (!response.ok) {
        throw new Error('Summary request failed');
      }

      const data: DocumentSummaryResponse = await response.json();
      const normalizedSections = Array.isArray(data.sections)
        ? data.sections.filter((section) => Number.isFinite(section.page))
        : [];

      setSections(normalizedSections);
      setFromCache(false);
    } catch (requestError) {
      console.error('Unable to generate summary:', requestError);
      setError('Unable to generate summary.');
      setSections([]);
      setFromCache(false);
    } finally {
      setLoading(false);
    }
  }, [cachedSummary, enabled, handle]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const persistCache = useCallback(() => {
    if (!fromCache && sections.length > 0) {
      writeSummaryCache(handle, sections);
    }
  }, [fromCache, handle, sections]);

  return {
    sections,
    loading,
    error,
    fromCache,
    refetch: () => fetchSummary(true),
    persistCache,
  };
};

export default useDocumentSummary;
