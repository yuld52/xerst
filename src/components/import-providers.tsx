import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppGuard } from "@/components/layout/AppGuard";
import { PageDataProvider } from "@/contexts/PageDataContext";
import { AdvancedFeaturesProvider } from "@/contexts/AdvancedFeaturesContext";
import { ValueDisplayProvider } from "@/contexts/ValueDisplayContext";
import { PublishProgressProvider } from "@/contexts/PublishProgressContext";
import { AIChatProvider } from "@/components/ai-chat/AIChatProvider";
import { MockModeBanner } from "@/components/MockModeBanner";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";

export default function ImportProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="lomustrack-theme"
      disableTransitionOnChange
    >
      <PageDataProvider>
        <AdvancedFeaturesProvider>
          <ValueDisplayProvider>
            <PublishProgressProvider>
              <TooltipProvider>
                <AppGuard>{children}</AppGuard>
                <HotToaster position="top-right" />
                <Toaster richColors position="top-right" />
                <AIChatProvider />
                <MockModeBanner />
              </TooltipProvider>
            </PublishProgressProvider>
          </ValueDisplayProvider>
        </AdvancedFeaturesProvider>
      </PageDataProvider>
    </ThemeProvider>
  );
}
