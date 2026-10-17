import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from '.';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedValue', () => {
  it('updates only after the default 300 ms delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
      initialProps: { value: 'te' },
    });

    rerender({ value: 'teclado' });
    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe('te');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe('teclado');
  });

  it('restarts the delay when the value changes again', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(400));
    rerender({ value: 'abc' });
    act(() => vi.advanceTimersByTime(400));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('abc');
  });
});
