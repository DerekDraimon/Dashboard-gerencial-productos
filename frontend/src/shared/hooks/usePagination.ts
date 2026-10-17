import { useCallback, useMemo, useState } from 'react';

export interface PaginationOptions {
  initialLimit?: number;
}

export interface Pagination {
  offset: number;
  limit: number;
  page: number;
  setPage: (page: number) => void;
  setOffset: (offset: number) => void;
  setLimit: (limit: number) => void;
  next: () => void;
  previous: () => void;
  reset: () => void;
}

export function usePagination({ initialLimit = 10 }: PaginationOptions = {}): Pagination {
  const [state, setState] = useState({ offset: 0, limit: initialLimit });

  const setOffset = useCallback((offset: number) => {
    setState((current) => ({ ...current, offset: Math.max(0, offset) }));
  }, []);

  const setPage = useCallback((page: number) => {
    setState((current) => ({ ...current, offset: Math.max(0, page - 1) * current.limit }));
  }, []);

  const setLimit = useCallback((limit: number) => setState({ offset: 0, limit }), []);

  const next = useCallback(() => {
    setState((current) => ({ ...current, offset: current.offset + current.limit }));
  }, []);

  const previous = useCallback(() => {
    setState((current) => ({ ...current, offset: Math.max(0, current.offset - current.limit) }));
  }, []);

  const reset = useCallback(() => setState({ offset: 0, limit: initialLimit }), [initialLimit]);

  return useMemo(
    () => ({
      ...state,
      page: Math.floor(state.offset / state.limit) + 1,
      setPage,
      setOffset,
      setLimit,
      next,
      previous,
      reset,
    }),
    [state, setPage, setOffset, setLimit, next, previous, reset],
  );
}
