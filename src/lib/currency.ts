// Currency utility — defaults to Indian Rupee (INR)
// All internal cost values are stored in USD; display is converted to INR.

export const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', label: 'Indian Rupee', rateFromUSD: 83 },
  USD: { code: 'USD', symbol: '$', label: 'US Dollar', rateFromUSD: 1 },
  EUR: { code: 'EUR', symbol: '€', label: 'Euro', rateFromUSD: 0.92 },
  GBP: { code: 'GBP', symbol: '£', label: 'British Pound', rateFromUSD: 0.79 },
  AED: { code: 'AED', symbol: 'AED', label: 'UAE Dirham', rateFromUSD: 3.67 },
  JPY: { code: 'JPY', symbol: '¥', label: 'Japanese Yen', rateFromUSD: 149 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

/** Default display currency for the whole app */
export const DEFAULT_CURRENCY: CurrencyCode = 'INR';

/**
 * Convert a USD amount to the given currency and format it.
 * e.g. formatCurrency(1000, 'INR') → "₹83,000"
 */
export function formatCurrency(amountUSD: number, currency: CurrencyCode = DEFAULT_CURRENCY): string {
  const { symbol, rateFromUSD } = CURRENCIES[currency];
  const converted = Math.round(amountUSD * rateFromUSD);
  return `${symbol}${converted.toLocaleString('en-IN')}`;
}

/**
 * Convert a USD amount to the given currency (numeric only, no formatting).
 */
export function convertCurrency(amountUSD: number, currency: CurrencyCode = DEFAULT_CURRENCY): number {
  return Math.round(amountUSD * CURRENCIES[currency].rateFromUSD);
}
