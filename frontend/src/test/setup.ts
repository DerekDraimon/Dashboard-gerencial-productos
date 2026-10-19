import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import {
  cloneElement,
  createElement,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import type * as Recharts from 'recharts';
import { afterEach, vi } from 'vitest';
import type * as RTL from '@testing-library/react';

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

// Components read app-specific palette tokens, so tests render inside the app theme like AppProviders does.
vi.mock('@testing-library/react', async (importOriginal) => {
  const rtl = await importOriginal<typeof RTL>();
  const { ThemeProvider } = await import('@mui/material/styles');
  const { theme } = await import('../app/theme');
  type Wrapper = ComponentType<{ children: ReactNode }>;
  const withTheme =
    (Inner?: Wrapper): Wrapper =>
    ({ children }) =>
      createElement(
        ThemeProvider,
        { theme },
        Inner ? createElement(Inner, null, children) : children,
      );

  const render = (ui: ReactNode, options?: RTL.RenderOptions) =>
    rtl.render(ui, { ...options, wrapper: withTheme(options?.wrapper as Wrapper | undefined) });
  const renderHook = <Result, Props>(
    callback: (props: Props) => Result,
    options?: RTL.RenderHookOptions<Props>,
  ) =>
    rtl.renderHook(callback, {
      ...options,
      wrapper: withTheme(options?.wrapper as Wrapper | undefined),
    });

  return { ...rtl, render, renderHook };
});

afterEach(() => {
  cleanup();
});
