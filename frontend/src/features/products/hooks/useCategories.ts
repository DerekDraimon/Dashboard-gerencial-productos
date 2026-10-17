import { useEffect, useState } from 'react';
import { listCategories } from '../api/products-api';

export interface UseCategoriesResult {
  categories: string[];
  loading: boolean;
}

export function useCategories(): UseCategoriesResult {
  const [state, setState] = useState<UseCategoriesResult>({ categories: [], loading: true });

  useEffect(() => {
    const controller = new AbortController();
    // Categories only feed the autocomplete, so a failure degrades to free text instead of an error.
    listCategories({ signal: controller.signal }).then(
      (categories) => setState({ categories, loading: false }),
      () => {
        if (!controller.signal.aborted) setState({ categories: [], loading: false });
      },
    );
    return () => controller.abort();
  }, []);

  return state;
}
