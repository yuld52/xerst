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

export function CurrencyCard() {
  const [code, setCode] = useState<CurrencyCode>("MZN");
  useEffect(() => setCode(getCurrency()), []);

  const handleChange = (value: string) => {
    setCurrency(value as CurrencyCode);
    setCode(value as CurrencyCode);
    toast.success(`Moeda alterada para ${CURRENCIES[value as CurrencyCode].label}`);
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
