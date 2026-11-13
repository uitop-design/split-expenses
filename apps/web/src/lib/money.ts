const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string, signDisplay: 'auto' | 'exceptZero'): Intl.NumberFormat {
  const key = `${currency}:${signDisplay}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      signDisplay,
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

export function fractionDigits(currency: string): number {
  return formatterFor(currency, 'auto').resolvedOptions().maximumFractionDigits ?? 2;
}

export function formatMoney(
  minorUnits: number,
  currency: string,
  { signed = false }: { signed?: boolean } = {},
): string {
  const value = minorUnits / 10 ** fractionDigits(currency);
  return formatterFor(currency, signed ? 'exceptZero' : 'auto').format(value);
}

export function parseMoney(input: string, currency: string): number | null {
  const digits = fractionDigits(currency);
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.');
  const pattern = digits > 0 ? new RegExp(`^\\d+(\\.\\d{0,${digits}})?$`) : /^\d+$/;
  if (!pattern.test(normalized)) {
    return null;
  }
  const [whole = '0', fraction = ''] = normalized.split('.');
  const minorUnits = Number(whole) * 10 ** digits + Number(fraction.padEnd(digits, '0') || '0');
  return Number.isSafeInteger(minorUnits) ? minorUnits : null;
}

export function toMajorInput(minorUnits: number, currency: string): string {
  const digits = fractionDigits(currency);
  return (minorUnits / 10 ** digits).toFixed(digits);
}
