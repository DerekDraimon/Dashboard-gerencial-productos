import { describe, expect, it } from 'vitest';
import { theme } from './theme';

describe('theme', () => {
  it('uses the ochre primary with ink contrast text', () => {
    expect(theme.palette.primary.main).toBe('#D9A62E');
    expect(theme.palette.primary.contrastText).toBe('#24262B');
  });

  it('reserves the danger red with white text for errors', () => {
    expect(theme.palette.error.main).toBe('#A33A2E');
    expect(theme.palette.error.contrastText).toBe('#FFFFFF');
  });
});
