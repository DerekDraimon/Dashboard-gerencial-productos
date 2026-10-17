import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusChip, type StatusChipVariant } from '.';

const expectedColors: Record<StatusChipVariant, { background: string; color: string }> = {
  neutral: { background: 'rgb(230, 237, 230)', color: 'rgb(36, 38, 43)' },
  strong: { background: 'rgb(36, 38, 43)', color: 'rgb(245, 246, 243)' },
  success: { background: 'rgb(157, 181, 159)', color: 'rgb(36, 38, 43)' },
  muted: { background: 'rgb(228, 229, 224)', color: 'rgb(36, 38, 43)' },
};

describe('StatusChip', () => {
  it('renders the label with the neutral variant by default', () => {
    render(<StatusChip label="Electrónica" />);

    const chip = screen.getByText('Electrónica');
    const styles = getComputedStyle(chip);
    expect(styles.backgroundColor).toBe(expectedColors.neutral.background);
    expect(styles.color).toBe(expectedColors.neutral.color);
    expect(styles.borderRadius).toBe('999px');
    expect(styles.fontSize).toBe('12px');
    expect(styles.fontWeight).toBe('600');
    expect(styles.padding).toBe('4px 10px');
  });

  it.each(Object.entries(expectedColors))(
    'maps the %s variant to its colors',
    (variant, colors) => {
      render(<StatusChip label="Estado" variant={variant as StatusChipVariant} />);

      const styles = getComputedStyle(screen.getByText('Estado'));
      expect(styles.backgroundColor).toBe(colors.background);
      expect(styles.color).toBe(colors.color);
    },
  );
});
