import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/import-navigation";
import { DashboardHeader } from "./components/DashboardHeader";
import { DashboardEditor, type DashboardConfig } from "./components/DashboardEditor";
import { KpiGrid } from "./components/KpiGrid";
import { RevenueChart } from "./components/RevenueChart";
import { PaymentMethodChart } from "./components/PaymentMethodChart";
import { TopCampaigns } from "./components/TopCampaigns";
import { HourlySalesChart } from "./components/HourlySalesChart";
import { SalesByCountryCard } from "./components/SalesByCountryCard";
import { GlobalFilterBar } from "@/components/layout/GlobalFilterBar";
import { useDashboard } from "@/hooks/use-dashboard";
import { fetchCustomersFilterOptions } from "@/services/customers";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { UpsellOption } from "@/types/sale";

const STORAGE_KEY = "dashboard-config";

export default function DashboardPage() {
  const { data, settings, loading, filters, setFilters, reload } = useDashboard();
  const navigate = useNavigate();
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [upsells, setUpsells] = useState<UpsellOption[]>([]);
  const [platforms, setPlatforms] = useState<{ value: string; label: string }[]>([]);
  const [accounts, setAccounts] = useState<{ slug: string; name: string; platform: string }[]>([]);
  
  // Dashboard editor state
  const [editorOpen, setEditorOpen] = useState(false);
  
  // Dashboard configuration
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {
          kpis: true,
          revenueChart: true,
          paymentMethodChart: true,
          topCampaigns: true,
          hourlySalesChart: true,
          salesByCountry: true,
        };
      }
    }
    return {
      kpis: true,
      revenueChart: true,
      paymentMethodChart: true,
      topCampaigns: true,
      hourlySalesChart: true,
      salesByCountry: true,
    };
  });

  const handleConfigChange = (config: DashboardConfig) => {
    setDashboardConfig(config);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  };

  useEffect(() => {
    if (data?.meta_error === "token_invalid") {
      toast.error("Token do Facebook Ads inválido", {
        description:
          "O token de acesso expirou ou o app foi deletado. Atualize o token na página de integrações.",
        duration: Infinity,
        action: {
          label: "Corrigir agora",
          onClick: () => navigate("/facebook-ads"),
        },
        id: "meta-token-invalid",
      });
    } else if (data?.meta_error === "meta_data_unavailable") {
      toast.error("Dados incompletos da Meta Ads", {
        description:
          "Não foi possível buscar os gastos diários de uma ou mais contas. Confira a conexão das contas de anúncios.",
        id: "meta-daily-data-unavailable",
      });
    }
  }, [data?.meta_error, navigate]);

  useEffect(() => {
    fetchCustomersFilterOptions()
      .then((opt) => {
        setProducts(opt.products);
        setUpsells(opt.upsells ?? []);
        if (opt.platforms) setPlatforms(opt.platforms);
        if (opt.accounts) setAccounts(opt.accounts);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 p-3 sm:p-5 lg:p-6">
      <DashboardHeader onRefresh={reload} currentRevenue={data?.kpis?.total_revenue ?? 0} />
      <GlobalFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        settings={settings}
        products={products}
        upsells={upsells}
        platforms={platforms}
        accounts={accounts}
        showEditButton={true}
        onEditClick={() => setEditorOpen(true)}
      />
      {loading || !data ? (
        <div className="grid gap-2.5 sm:gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[74px] w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {dashboardConfig.kpis && (
            <KpiGrid
              kpis={data.kpis}
              taxEnabled={filters.taxEnabled}
              taxRate={settings?.tax_rate ?? 0}
              opCostsEnabled={filters.opCostsEnabled}
              opCostsTotal={settings?.operational_costs.reduce((s, c) => s + c.amount, 0) ?? 0}
            />
          )}
          
          {(dashboardConfig.revenueChart || dashboardConfig.paymentMethodChart) && (
            <div className="grid gap-3 sm:gap-4 lg:gap-5 lg:grid-cols-3">
              {dashboardConfig.revenueChart && (
                <div className="lg:col-span-2">
                  <RevenueChart data={data.daily_revenue} />
                </div>
              )}
              {dashboardConfig.paymentMethodChart && (
                <PaymentMethodChart data={data.payment_distribution} />
              )}
            </div>
          )}

          {(dashboardConfig.topCampaigns || dashboardConfig.hourlySalesChart || dashboardConfig.salesByCountry) && (
            <div className="grid gap-3 sm:gap-4 lg:gap-5 lg:grid-cols-3">
              {(dashboardConfig.topCampaigns || dashboardConfig.hourlySalesChart) && (
                <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
                  {dashboardConfig.topCampaigns && <TopCampaigns data={data.top_campaigns} />}
                  {dashboardConfig.hourlySalesChart && <HourlySalesChart data={data.hourly_sales} />}
                </div>
              )}
              {dashboardConfig.salesByCountry && (
                <div className="lg:col-span-2">
                  <SalesByCountryCard
                    startDate={filters.datePreset === "custom" ? filters.dateStart : undefined}
                    endDate={filters.datePreset === "custom" ? filters.dateEnd : undefined}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      <DashboardEditor 
        config={dashboardConfig} 
        onConfigChange={handleConfigChange}
        open={editorOpen}
        onOpenChange={setEditorOpen}
      />
    </div>
  );
}
