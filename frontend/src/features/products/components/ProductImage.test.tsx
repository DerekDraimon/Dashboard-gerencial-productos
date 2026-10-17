import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductImage } from './ProductImage';

describe('ProductImage', () => {
  it('shows the image when it has a source', () => {
    render(<ProductImage src="https://example.com/silla.png" alt="Silla" />);

    expect(screen.getByRole('img', { name: 'Silla' })).toHaveAttribute(
      'src',
      'https://example.com/silla.png',
    );
  });

  it('shows the placeholder when the source is missing', () => {
    render(<ProductImage alt="Silla" />);

    const placeholder = screen.getByRole('img', { name: 'Silla' });
    expect(placeholder.tagName).not.toBe('IMG');
  });

  it('swaps to the placeholder when the image fails to load', () => {
    render(<ProductImage src="https://example.com/rota.png" alt="Silla" />);

    fireEvent.error(screen.getByRole('img', { name: 'Silla' }));

    const placeholder = screen.getByRole('img', { name: 'Silla' });
    expect(placeholder.tagName).not.toBe('IMG');
  });
});
