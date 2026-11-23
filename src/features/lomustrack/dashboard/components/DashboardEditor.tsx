import { useState, useEffect } from "react";
import { RiCheckLine } from "@remixicon/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export interface DashboardConfig {
  kpis: boolean;
  revenueChart: boolean;
  paymentMethodChart: boolean;
  topCampaigns: boolean;
  hourlySalesChart: boolean;
  salesByCountry: boolean;
}

const DEFAULT_CONFIG: DashboardConfig = {
  kpis: true,
  revenueChart: true,
  paymentMethodChart: true,
  topCampaigns: true,
  hourlySalesChart: true,
  salesByCountry: true,
};

interface DashboardEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: DashboardConfig;
  onConfigChange: (config: DashboardConfig) => void;
}

export function DashboardEditor({ open, onOpenChange, config, onConfigChange }: DashboardEditorProps) {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    if (open) {
      setLocalConfig(config);
    }
  }, [open, config]);

  const handleSave = () => {
    onConfigChange(localConfig);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setLocalConfig(config);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_CONFIG);
  };

  const toggleCard = (key: keyof DashboardConfig) => {
    setLocalConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[90%] md:w-[500px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Editar Dashboard</SheetTitle>
            <SheetDescription>
              Personalize quais métricas e gráficos você deseja visualizar
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* General Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Geral</h3>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="kpis" className="flex flex-col space-y-1 cursor-pointer flex-1">
                  <span className="font-medium">Resumo (KPIs)</span>
                  <span className="text-xs text-muted-foreground">
                    Cards com métricas principais: faturamento, vendas, ticket médio, etc.
                  </span>
                </Label>
                <Switch
                  id="kpis"
                  checked={localConfig.kpis}
                  onCheckedChange={() => toggleCard("kpis")}
                />
              </div>
            </div>

            <Separator />

            {/* Charts Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Gráficos Avançados</h3>

              <div className="flex items-center justify-between space-x-2">
                <Label
                  htmlFor="revenueChart"
                  className="flex flex-col space-y-1 cursor-pointer flex-1"
                >
                  <span className="font-medium">Faturamento Líquido</span>
                  <span className="text-xs text-muted-foreground">
                    Gráfico de linha com faturamento diário
                  </span>
                </Label>
                <Switch
                  id="revenueChart"
                  checked={localConfig.revenueChart}
                  onCheckedChange={() => toggleCard("revenueChart")}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label
                  htmlFor="paymentMethodChart"
                  className="flex flex-col space-y-1 cursor-pointer flex-1"
                >
                  <span className="font-medium">Meios de Pagamento</span>
                  <span className="text-xs text-muted-foreground">
                    Distribuição por forma de pagamento
                  </span>
                </Label>
                <Switch
                  id="paymentMethodChart"
                  checked={localConfig.paymentMethodChart}
                  onCheckedChange={() => toggleCard("paymentMethodChart")}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label
                  htmlFor="hourlySalesChart"
                  className="flex flex-col space-y-1 cursor-pointer flex-1"
                >
                  <span className="font-medium">Vendas por Horário</span>
                  <span className="text-xs text-muted-foreground">
                    Gráfico de barras com vendas por hora do dia
                  </span>
                </Label>
                <Switch
                  id="hourlySalesChart"
                  checked={localConfig.hourlySalesChart}
                  onCheckedChange={() => toggleCard("hourlySalesChart")}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label
                  htmlFor="salesByCountry"
                  className="flex flex-col space-y-1 cursor-pointer flex-1"
                >
                  <span className="font-medium">Vendas por País</span>
                  <span className="text-xs text-muted-foreground">
                    Mapa interativo com vendas por localização
                  </span>
                </Label>
                <Switch
                  id="salesByCountry"
                  checked={localConfig.salesByCountry}
                  onCheckedChange={() => toggleCard("salesByCountry")}
                />
              </div>
            </div>

            <Separator />

            {/* Rankings Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Rankings</h3>

              <div className="flex items-center justify-between space-x-2">
                <Label
                  htmlFor="topCampaigns"
                  className="flex flex-col space-y-1 cursor-pointer flex-1"
                >
                  <span className="font-medium">Top Campanhas</span>
                  <span className="text-xs text-muted-foreground">
                    Lista das campanhas com melhor desempenho
                  </span>
                </Label>
                <Switch
                  id="topCampaigns"
                  checked={localConfig.topCampaigns}
                  onCheckedChange={() => toggleCard("topCampaigns")}
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 space-y-3">
            <Button onClick={handleReset} variant="outline" className="w-full">
              Restaurar padrão
            </Button>
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <RiCheckLine className="size-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
  );
}
