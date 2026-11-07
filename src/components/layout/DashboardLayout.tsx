import { useEffect, useState } from "react";
import { Outlet } from "@/lib/import-navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileAIChat } from "./MobileAIChat";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchDisplayCurrency } from "@/services/company";
import { setCurrency, CURRENCIES, type CurrencyCode } from "@/lib/currencySettings";
import { isImportDemo } from "@/lib/import-demo";

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

  return (
    <>
      <SidebarProvider
        style={{ "--sidebar-width": "16rem" } as React.CSSProperties}
        className="h-screen bg-background"
      >
        <div className="flex flex-1 h-full min-w-0">
          <AppSidebar />
          <SidebarInset className="overflow-y-auto overflow-x-hidden flex-1 min-w-0 bg-background flex flex-col">
            <main className="flex-1 p-6 overflow-y-auto">
              <div className="mx-auto w-full min-h-full" style={{ maxWidth: "min(1600px, 100%)" }}>
                <Outlet />
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </>
  );
}
