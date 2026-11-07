import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiMoneyDollarCircleLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CURRENCIES, getCurrency, setCurrency, type CurrencyCode } from "@/lib/currencySettings";
import { fetchDisplayCurrency, updateDisplayCurrency } from "@/services/company";

export function CurrencyCard() {
  const [code, setCode] = useState<CurrencyCode>("MZN");
  useEffect(() => {
    setCode(getCurrency());
    fetchDisplayCurrency()
      .then(({ currency }) => {
        if (currency in CURRENCIES) {
          setCode(currency as CurrencyCode);
          setCurrency(currency as CurrencyCode);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleChange = async (value: string) => {
    const next = value as CurrencyCode;
    try {
      await updateDisplayCurrency(next);
      setCurrency(next);
      setCode(next);
      toast.success(`Moeda salva para esta empresa: ${CURRENCIES[next].label}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a moeda.");
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <RiMoneyDollarCircleLine className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">Moeda</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Escolha a moeda em que os valores aparecem no app
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={code} onValueChange={handleChange}>
          <SelectTrigger aria-label="Moeda">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
              <SelectItem key={c} value={c}>
                {CURRENCIES[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Conversão com taxas aproximadas: 1 BRL = {CURRENCIES[code].rate} {code}
        </p>
      </CardContent>
    </Card>
  );
}
