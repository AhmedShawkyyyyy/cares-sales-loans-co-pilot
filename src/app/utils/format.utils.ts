const amountFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_INDIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(EASTERN_ARABIC_DIGITS.indexOf(digit)))
    .replace(/[٬،]/g, ',')
    .replace(/٫/g, '.');
}

/** Formats a monetary/decimal amount with Latin digits and grouping. */
export function formatAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return amountFormatter.format(Number.isFinite(value) ? value : 0);
}

/** Formats a whole number (installments, etc.) with grouping. */
export function formatInteger(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return integerFormatter.format(value);
}

/** Formats a percentage with up to two decimal places. */
export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return percentFormatter.format(value);
}

/** Formats a value for a thousands-separated text input. */
export function formatThousandsInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }

  return integerFormatter.format(Math.round(value));
}

/**
 * Parses user input containing grouping separators, Arabic digits,
 * or a currency suffix into a finite number.
 */
export function parseNumericInput(rawValue: string): number | null {
  const normalized = normalizeDigits(rawValue)
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '')
    .trim();

  if (normalized === '' || normalized === '-' || normalized === '.') {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rounds a percentage input to a sane two-decimal precision. */
export function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}
