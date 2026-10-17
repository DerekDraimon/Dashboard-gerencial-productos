import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/api-error';
import { listProducts, type Product } from '../api/products-api';

const PAGE_SIZE = 100;

interface AllProductsState {
  products: Product[];
  loading: boolean;
  error: unknown;
}

export interface UseAllProductsResult extends AllProductsState {
  reload: () => void;
}

async function fetchAllProducts(signal: AbortSignal): Promise<Product[]> {
  const products: Product[] = [];
  let total: number;
  do {
    const page = await listProducts({ offset: products.length, limit: PAGE_SIZE }, { signal });
    products.push(...page.data);
    total = page.meta.total;
    // An empty page means the catalog shrank while paging; stop instead of looping forever.
    if (page.data.length === 0) break;
  } while (products.length < total);
  return products;
}

export function useAllProducts(): UseAllProductsResult {
  const [state, setState] = useState<AllProductsState>({
    products: [],
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchAllProducts(controller.signal).then(
      (products) => setState({ products, loading: false, error: null }),
      (error: unknown) => {
        const canceled = error instanceof ApiError && error.code === 'REQUEST_CANCELED';
        if (canceled || controller.signal.aborted) return;
        setState({ products: [], loading: false, error });
      },
    );
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    setAttempt((current) => current + 1);
  }, []);

  return { ...state, reload };
}
