import { useEffect, useState } from "react";
import { getCurrency, type CurrencyCode } from "@/lib/currencySettings";

export function useCurrency(): CurrencyCode {
  const [currency, setCurrency] = useState<CurrencyCode>(() => getCurrency());

  useEffect(() => {
    const sync = () => setCurrency(getCurrency());
    window.addEventListener("currencychange", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("currencychange", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return currency;
}
