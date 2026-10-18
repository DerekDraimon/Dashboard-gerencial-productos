import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiCard } from './KpiCard';

describe('KpiCard', () => {
  it('renders the title, value and detail', () => {
    render(
      <KpiCard
        title="Total de productos"
        value="230"
        detail="Productos registrados"
        icon={<Inventory2Outlined />}
        tone="ochre"
      />,
    );

    const card = screen.getByRole('group', { name: 'Total de productos' });
    expect(card).toHaveTextContent('230');
    expect(card).toHaveTextContent('Productos registrados');
    expect(card).toHaveAttribute('aria-busy', 'false');
  });

  it('keeps a money value on one line and scales its font to the card width', () => {
    render(
      <KpiCard
        title="Valor del inventario"
        value="US$ 1.644,25"
        detail="Precio por stock"
        icon={<Inventory2Outlined />}
        tone="sage"
      />,
    );

    const value = screen.getByText('US$ 1.644,25');
    expect(value).toHaveStyle({ whiteSpace: 'nowrap' });
    expect(value).not.toHaveStyle({ fontSize: '32px' });
    expect(screen.getByRole('group', { name: 'Valor del inventario' })).toHaveStyle({
      containerType: 'inline-size',
    });
  });

  it('shows a busy skeleton instead of the value while loading', () => {
    render(
      <KpiCard
        title="Total de productos"
        value="230"
        detail="Productos registrados"
        icon={<Inventory2Outlined />}
        tone="ink"
        loading
      />,
    );

    const card = screen.getByRole('group', { name: 'Total de productos' });
    expect(card).toHaveAttribute('aria-busy', 'true');
    expect(card).not.toHaveTextContent('230');
    expect(card).not.toHaveTextContent('Productos registrados');
  });
});
