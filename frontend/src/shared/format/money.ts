import Decimal from 'decimal.js';

export type MoneyValue = number | string | Decimal;

// es-CO renders USD as "US$ 1.234,56": Spanish separators with an unambiguous currency prefix.
const moneyFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' });

export function sumMoney(values: readonly MoneyValue[]): Decimal {
  return values.reduce<Decimal>((total, value) => total.plus(value), new Decimal(0));
}

const INVALID_MONEY = '—';

function toDecimal(value: MoneyValue): Decimal | null {
  try {
    const decimal = new Decimal(value);
    return decimal.isFinite() ? decimal : null;
  } catch {
    return null;
  }
}

/** Invalid amounts (NaN, Infinity, malformed strings) render as "—" so a bad value never breaks a screen. */
export function formatMoney(value: MoneyValue): string {
  const decimal = toDecimal(value);
  return decimal ? moneyFormatter.format(decimal.toDecimalPlaces(2).toNumber()) : INVALID_MONEY;
}
