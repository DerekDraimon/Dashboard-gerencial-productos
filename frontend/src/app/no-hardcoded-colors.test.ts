import { describe, expect, it } from 'vitest';

// Raw text of every source file; tests and the theme itself are left out.
const sources = import.meta.glob<string>(
  ['../**/*.{ts,tsx}', '!../**/*.test.{ts,tsx}', '!./theme.ts'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
);

const COLOR_LITERAL = /#[0-9a-f]{3,8}\b|rgba?\(/i;

describe('colors', () => {
  it('come only from the theme', () => {
    const offenders = Object.entries(sources).flatMap(([path, text]) =>
      text
        .split('\n')
        .flatMap((line, index) => (COLOR_LITERAL.test(line) ? [`${path}:${index + 1}`] : [])),
    );

    expect(Object.keys(sources).length).toBeGreaterThan(50);
    expect(offenders).toEqual([]);
  });
});
