import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '../api/products-api';
import { ProductDetailDrawer } from './ProductDetailDrawer';

const product: Product = {
  id: 'p1',
  title: 'Silla',
  description: 'Silla de madera maciza',
  price: 1234.5,
  category: 'Muebles',
  images: [],
  stock: 7,
  creationAt: '2025-03-07T15:30:00.000Z',
  updatedAt: '2025-04-01T10:00:00.000Z',
};

describe('ProductDetailDrawer', () => {
  it('keeps showing the last product while the close animation runs', async () => {
    const { rerender } = render(<ProductDetailDrawer product={product} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: 'Silla' })).toBeInTheDocument();

    rerender(<ProductDetailDrawer product={null} onClose={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Silla', hidden: true })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
