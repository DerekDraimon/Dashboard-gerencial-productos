import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { cloneElement, type ReactElement } from 'react';
import type * as Recharts from 'recharts';
import { afterEach, vi } from 'vitest';

// jsdom has no layout, so ResponsiveContainer would measure 0×0 and draw nothing: give charts a fixed size.
vi.mock('recharts', async (importOriginal) => {
  const recharts = await importOriginal<typeof Recharts>();
  return {
    ...recharts,
    ResponsiveContainer: ({
      children,
    }: {
      children: ReactElement<{ width?: number; height?: number }>;
    }) => cloneElement(children, { width: 480, height: 240 }),
  };
});

afterEach(() => {
  cleanup();
});
