import Decimal from 'decimal.js';

export type MoneyValue = number | string | Decimal;

// es-CO rounds COP to whole pesos by default, which would hide the cents a price may have.
const pesos = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  // Both bounds: engines that default COP to 2 minimum digits throw a RangeError on max < min.
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const pesosWithCents = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

/**
 * Colombian pesos: "$ 89.900" for whole amounts, "$ 24,99" when there are cents.
 * Invalid amounts (NaN, Infinity, malformed strings) render as "—" so a bad value never breaks a screen.
 */
export function formatMoney(value: MoneyValue): string {
  const decimal = toDecimal(value)?.toDecimalPlaces(2);
  if (!decimal) return INVALID_MONEY;
  const formatter = decimal.isInteger() ? pesos : pesosWithCents;
  return formatter.format(decimal.toNumber());
}
