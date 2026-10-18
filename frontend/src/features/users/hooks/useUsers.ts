import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/api-error';
import { usePagination } from '../../../shared/hooks';
import { listUsers, type User } from '../api/users-api';

export type UserStatusFilter = 'all' | 'active' | 'inactive';

interface PageState {
  /** Identifies the request these rows answer; loading is "the current request has no answer yet". */
  key: string;
  rows: User[];
  total: number;
  error: unknown;
  /** A failed background refresh keeps the rows it could not replace. */
  refreshError: unknown;
}

const EMPTY_PAGE: PageState = { key: '', rows: [], total: 0, error: null, refreshError: null };

const ACTIVE_PARAM: Record<UserStatusFilter, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
};

export function useUsers() {
  const pagination = usePagination();
  const [status, setStatusState] = useState<UserStatusFilter>('all');
  const [attempt, setAttempt] = useState(0);
  // Not part of requestKey: a refresh refetches in the background without showing skeletons.
  const [refreshes, setRefreshes] = useState(0);
  const [page, setPage] = useState<PageState>(EMPTY_PAGE);

  const { offset, limit, setOffset } = pagination;
  const requestKey = JSON.stringify([status, offset, limit, attempt]);

  useEffect(() => {
    const controller = new AbortController();
    listUsers({ offset, limit, active: ACTIVE_PARAM[status] }, { signal: controller.signal }).then(
      (result) => {
        if (controller.signal.aborted) return;
        const { data: rows, meta } = result;
        setPage({ key: requestKey, rows, total: meta.total, error: null, refreshError: null });
      },
      (error: unknown) => {
        const canceled = error instanceof ApiError && error.code === 'REQUEST_CANCELED';
        if (canceled || controller.signal.aborted) return;
        setPage((current) =>
          current.key === requestKey && current.error === null
            ? { ...current, refreshError: error }
            : { ...EMPTY_PAGE, key: requestKey, error },
        );
      },
    );
    return () => controller.abort();
  }, [requestKey, refreshes, status, offset, limit]);

  // A refresh or a filter can shrink the list under the current page; fall back to the last one.
  const answered = page.key === requestKey && page.error === null;
  const lastOffset = Math.max(0, Math.ceil(page.total / limit) - 1) * limit;
  if (answered && page.rows.length === 0 && offset > lastOffset) setOffset(lastOffset);

  const setStatus = useCallback(
    (value: UserStatusFilter) => {
      setStatusState(value);
      setOffset(0);
    },
    [setOffset],
  );
  const clearFilters = useCallback(() => setStatus('all'), [setStatus]);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);
  const refresh = useCallback(() => setRefreshes((current) => current + 1), []);

  const updateLocally = useCallback((id: string, patch: Partial<Omit<User, 'id'>>) => {
    setPage((current) => {
      if (!current.rows.some((row) => row.id === id)) return current;
      const rows = current.rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
      return { ...current, rows };
    });
  }, []);

  return {
    rows: page.rows,
    total: page.total,
    loading: page.key !== requestKey,
    error: page.key === requestKey ? page.error : null,
    refreshError: page.key === requestKey ? page.refreshError : null,
    reload,
    refresh,
    pagination,
    status,
    setStatus,
    clearFilters,
    updateLocally,
  };
}

export type UseUsersResult = ReturnType<typeof useUsers>;
