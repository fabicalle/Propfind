const FILTERS_KEY = 'propfind_filters';

export function saveFiltersLocally(filters: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  } catch {
    // quota exceeded, etc.
  }
}

export function loadFiltersLocally<T>(): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
