// Moeda de exibição escolhida pelo usuário. Os valores do sistema estão em BRL
// e são convertidos com taxas aproximadas fixas (1 BRL = X moeda).
export type CurrencyCode = "MZN" | "BRL" | "USD" | "EUR" | "ZAR" | "AOA";

export const CURRENCIES: Record<
  CurrencyCode,
  { label: string; symbol: string; rate: number; prefix: boolean }
> = {
  MZN: { label: "Metical (MZN)", symbol: "MT", rate: 13, prefix: false },
  BRL: { label: "Real (BRL)", symbol: "R$", rate: 1, prefix: true },
  USD: { label: "Dólar (USD)", symbol: "US$", rate: 0.18, prefix: true },
  EUR: { label: "Euro (EUR)", symbol: "€", rate: 0.17, prefix: true },
  ZAR: { label: "Rand (ZAR)", symbol: "R", rate: 3.3, prefix: true },
  AOA: { label: "Kwanza (AOA)", symbol: "Kz", rate: 165, prefix: false },
};

const KEY = "display_currency";

export function getCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "MZN";
  const v = window.localStorage.getItem(KEY) as CurrencyCode | null;
  return v && v in CURRENCIES ? v : "MZN";
}

export function setCurrency(code: CurrencyCode) {
  window.localStorage.setItem(KEY, code);
  window.dispatchEvent(new CustomEvent("currencychange", { detail: code }));
}

export function convertFromBRL(value: number, code: CurrencyCode = getCurrency()): number {
  return value * CURRENCIES[code].rate;
}

export function convertToBRL(value: number, code: CurrencyCode = getCurrency()): number {
  return value / CURRENCIES[code].rate;
}

export function withSymbol(formatted: string, code: CurrencyCode = getCurrency()): string {
  const c = CURRENCIES[code];
  return c.prefix ? `${c.symbol} ${formatted}` : `${formatted} ${c.symbol}`;
}
