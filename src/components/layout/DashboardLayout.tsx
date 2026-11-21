import { useEffect, useState } from "react";
import { Outlet } from "@/lib/import-navigation";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileAIChat } from "./MobileAIChat";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchDisplayCurrency } from "@/services/company";
import { setCurrency, CURRENCIES, type CurrencyCode } from "@/lib/currencySettings";
import { isImportDemo } from "@/lib/import-demo";
import { AnimatedDashboardLayout } from "./AnimatedDashboardLayout";

export function DashboardLayout() {
  const isMobile = useIsMobile();
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (isImportDemo()) return;
    fetchDisplayCurrency()
      .then(({ currency }) => {
        if (currency in CURRENCIES) setCurrency(currency as CurrencyCode);
      })
      .catch(() => undefined);
  }, []);

  if (isMobile) {
    return (
      <>
        <div className="flex flex-col min-h-[100dvh]">
          <main className="flex-1 overflow-auto pb-20">
            <div className="mx-auto w-full min-h-full">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileBottomNav onOpenAI={() => setAiOpen(true)} />
        <MobileAIChat isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      </>
    );
  }

  return <AnimatedDashboardLayout />;
}
