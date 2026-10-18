import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { formatMoney, sumMoney } from './money';

const NBSP = String.fromCharCode(0xa0);

describe('sumMoney', () => {
  it('adds 0.1 and 0.2 to exactly 0.3', () => {
    expect(sumMoney([0.1, 0.2]).toString()).toBe('0.3');
  });

  it('adds many decimal prices without floating point drift', () => {
    const prices = Array.from({ length: 1000 }, () => 24.99);

    expect(sumMoney(prices).toString()).toBe('24990');
    expect(sumMoney(['19.99', 0.01, new Decimal('5.5')]).toString()).toBe('25.5');
  });

  it('returns 0 for no values', () => {
    expect(sumMoney([]).toString()).toBe('0');
  });
});

describe('formatMoney', () => {
  it('formats Colombian pesos without cents when the amount is whole', () => {
    expect(formatMoney(0)).toBe(`$${NBSP}0`);
    expect(formatMoney(89900)).toBe(`$${NBSP}89.900`);
    expect(formatMoney(4250000)).toBe(`$${NBSP}4.250.000`);
    expect(formatMoney(-1234)).toBe(`-$${NBSP}1.234`);
  });

  it('keeps two decimals when the amount has cents instead of rounding them away', () => {
    expect(formatMoney(24.99)).toBe(`$${NBSP}24,99`);
    expect(formatMoney(1234.5)).toBe(`$${NBSP}1.234,50`);
    expect(formatMoney(-1234.5)).toBe(`-$${NBSP}1.234,50`);
  });

  it('accepts strings and Decimals', () => {
    expect(formatMoney('1234567.891')).toBe(`$${NBSP}1.234.567,89`);
    expect(formatMoney(sumMoney([0.1, 0.2]))).toBe(`$${NBSP}0,30`);
    expect(formatMoney(new Decimal('1999.999'))).toBe(`$${NBSP}2.000`);
  });

  it('shows a dash for invalid values instead of throwing', () => {
    expect(formatMoney(Number.NaN)).toBe('—');
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe('—');
    expect(formatMoney('12,5 dólares')).toBe('—');
    expect(formatMoney('')).toBe('—');
  });
});
