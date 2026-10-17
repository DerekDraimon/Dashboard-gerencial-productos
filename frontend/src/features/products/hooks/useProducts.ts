import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../../../shared/api/api-error';
import { useDebouncedValue, usePagination } from '../../../shared/hooks';
import { listProducts, type Product } from '../api/products-api';

/** Dates are YYYY-MM-DD; empty strings mean "no filter". */
export interface ProductFilters {
  search: string;
  from: string;
  to: string;
}

interface PageState {
  /** Identifies the request these rows answer; loading is "the current request has no answer yet". */
  key: string;
  rows: Product[];
  total: number;
  error: unknown;
}

const EMPTY_FILTERS: ProductFilters = { search: '', from: '', to: '' };

export function useProducts() {
  const pagination = usePagination();
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState<PageState>({ key: '', rows: [], total: 0, error: null });

  // Each clear starts a new epoch, so a debounced value typed before it can never apply afterwards.
  const [searchEpoch, setSearchEpoch] = useState(0);
  const typed = useMemo(
    () => ({ search: filters.search.trim(), epoch: searchEpoch }),
    [filters.search, searchEpoch],
  );
  const debounced = useDebouncedValue(typed, 300);
  const search = debounced.epoch === searchEpoch ? debounced.search : '';
  const { from, to } = filters;
  const dateRangeError = from !== '' && to !== '' && from > to;

  const filterKey = JSON.stringify([search, from, to]);
  const [pagedFilterKey, setPagedFilterKey] = useState(filterKey);
  if (pagedFilterKey !== filterKey) {
    setPagedFilterKey(filterKey);
    pagination.setOffset(0);
  }

  const { offset, limit, setOffset } = pagination;
  const requestKey = JSON.stringify([filterKey, offset, limit, attempt]);

  useEffect(() => {
    if (dateRangeError) return;
    const controller = new AbortController();
    listProducts({ offset, limit, search, from, to }, { signal: controller.signal }).then(
      (result) => {
        if (controller.signal.aborted) return;
        setPage({ key: requestKey, rows: result.data, total: result.meta.total, error: null });
      },
      (error: unknown) => {
        const canceled = error instanceof ApiError && error.code === 'REQUEST_CANCELED';
        if (canceled || controller.signal.aborted) return;
        setPage({ key: requestKey, rows: [], total: 0, error });
      },
    );
    return () => controller.abort();
  }, [requestKey, dateRangeError, offset, limit, search, from, to]);

  const setSearch = useCallback((value: string) => {
    setFilters((current) => ({ ...current, search: value }));
    if (value.trim() === '') setSearchEpoch((current) => current + 1);
  }, []);
  const setFrom = useCallback((value: string) => {
    setFilters((current) => ({ ...current, from: value }));
  }, []);
  const setTo = useCallback((value: string) => {
    setFilters((current) => ({ ...current, to: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSearchEpoch((current) => current + 1);
    setOffset(0);
  }, [setOffset]);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  const removeLocally = useCallback((id: string) => {
    setPage((current) => {
      const rows = current.rows.filter((row) => row.id !== id);
      if (rows.length === current.rows.length) return current;
      return { ...current, rows, total: Math.max(0, current.total - 1) };
    });
  }, []);

  return {
    rows: page.rows,
    total: page.total,
    loading: !dateRangeError && page.key !== requestKey,
    error: page.key === requestKey ? page.error : null,
    reload,
    pagination,
    filters,
    setSearch,
    setFrom,
    setTo,
    clearFilters,
    dateRangeError,
    removeLocally,
  };
}

export type UseProductsResult = ReturnType<typeof useProducts>;
