import { useCallback, useEffect, useState } from 'react';
import { listCategories } from '../api/products-api';

export interface UseCategoriesResult {
  categories: string[];
  loading: boolean;
  /** Loads the list again, e.g. after saving a product with a new category. */
  reload: () => void;
}

export function useCategories(): UseCategoriesResult {
  const [state, setState] = useState({ categories: [] as string[], loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // Categories only feed the autocomplete and the filter, so a failure degrades to an empty list.
    listCategories({ signal: controller.signal }).then(
      (categories) => setState({ categories, loading: false }),
      () => {
        if (!controller.signal.aborted) setState({ categories: [], loading: false });
      },
    );
    return () => controller.abort();
  }, [version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { ...state, reload };
}
