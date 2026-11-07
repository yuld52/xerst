import { convertFromBRL, withSymbol } from "@/lib/currencySettings";

// Valores do sistema estão em BRL; são convertidos para a moeda escolhida nas configurações.
function convert(brlValue: number): number {
  return convertFromBRL(brlValue);
}

/** Formata um valor já convertido com o símbolo da moeda escolhida */
export function formatMZN(value: number, decimals: number = 2): string {
  return withSymbol(
    value.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }),
  );
}

/** Converte BRL para a moeda escolhida e formata */
export function convertAndFormatMZN(brlValue: number, decimals: number = 2): string {
  return formatMZN(convert(brlValue), decimals);
}

export function fmtCompact(value: number): string {
  const v = convert(value);
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return withSymbol(
      `${sign}${(abs / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} B`,
    );
  if (abs >= 1_000_000)
    return withSymbol(
      `${sign}${(abs / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} M`,
    );
  if (abs >= 100_000)
    return withSymbol(
      `${sign}${(abs / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`,
    );
  return withSymbol(
    `${sign}${abs.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
  );
}

export function fmtFull(value: number): string {
  return withSymbol(
    convert(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  );
}

export function fmtNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000)
    return `${sign}${(abs / 1_000_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} B`;
  if (abs >= 1_000_000)
    return `${sign}${(abs / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} M`;
  if (abs >= 100_000)
    return `${sign}${(abs / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return value.toLocaleString("pt-BR");
}
