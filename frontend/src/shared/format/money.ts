import Decimal from 'decimal.js';

export type MoneyValue = number | string | Decimal;

// es-CO renders USD as "US$ 1.234,56": Spanish separators with an unambiguous currency prefix.
const moneyFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD' });

export function sumMoney(values: readonly MoneyValue[]): Decimal {
  return values.reduce<Decimal>((total, value) => total.plus(value), new Decimal(0));
}

export function formatMoney(value: MoneyValue): string {
  const amount = new Decimal(value).toDecimalPlaces(2).toNumber();
  return moneyFormatter.format(amount);
}
