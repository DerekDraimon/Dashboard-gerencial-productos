import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePagination } from '.';

describe('usePagination', () => {
  it('starts on the first page with a limit of 10', () => {
    const { result } = renderHook(() => usePagination());

    expect(result.current).toMatchObject({ offset: 0, limit: 10, page: 1 });
  });

  it('accepts an initial limit', () => {
    const { result } = renderHook(() => usePagination({ initialLimit: 25 }));

    expect(result.current).toMatchObject({ offset: 0, limit: 25, page: 1 });
  });

  it('moves with next, previous, setPage and setOffset', () => {
    const { result } = renderHook(() => usePagination());

    act(() => result.current.next());
    expect(result.current).toMatchObject({ offset: 10, page: 2 });

    act(() => result.current.setPage(4));
    expect(result.current).toMatchObject({ offset: 30, page: 4 });

    act(() => result.current.previous());
    expect(result.current).toMatchObject({ offset: 20, page: 3 });

    act(() => result.current.setOffset(40));
    expect(result.current).toMatchObject({ offset: 40, page: 5 });
  });

  it('never goes before the first page', () => {
    const { result } = renderHook(() => usePagination());

    act(() => result.current.previous());
    expect(result.current).toMatchObject({ offset: 0, page: 1 });

    act(() => result.current.setPage(0));
    expect(result.current).toMatchObject({ offset: 0, page: 1 });

    act(() => result.current.setOffset(-5));
    expect(result.current.offset).toBe(0);
  });

  it('resets to the first page when the limit changes', () => {
    const { result } = renderHook(() => usePagination());

    act(() => result.current.setPage(3));
    act(() => result.current.setLimit(50));

    expect(result.current).toMatchObject({ offset: 0, limit: 50, page: 1 });
  });

  it('reset returns to the first page and the initial limit', () => {
    const { result } = renderHook(() => usePagination({ initialLimit: 25 }));

    act(() => result.current.setLimit(50));
    act(() => result.current.next());
    act(() => result.current.reset());

    expect(result.current).toMatchObject({ offset: 0, limit: 25, page: 1 });
  });
});
