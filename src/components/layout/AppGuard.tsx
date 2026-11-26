import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "@/lib/import-navigation";
import { isAuthenticated, logout } from "@/services/auth";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { SubscriptionWarningBanner } from "@/components/SubscriptionWarningBanner";

interface AppGuardProps {
  children: React.ReactNode;
}

type GuardStatus = "loading" | "ready";

export function AppGuard({ children }: AppGuardProps) {
  const [status, setStatus] = useState<GuardStatus>("loading");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    async function check() {
      try {
        console.log("=== AppGuard Check ===");
        console.log("Current path:", location.pathname);
        console.log("Search params:", location.search);
        
        // Rotas públicas sempre permitidas
        const publicPaths = ["/login", "/setup", "/admin-login", "/documentation", "/forgot-password", "/verify-email", "/reset-password"];
        const isPublicPath = publicPaths.includes(location.pathname);
        
        console.log("Is public path:", isPublicPath);

        // Se está em rota pública, permitir acesso
        if (isPublicPath) {
          console.log("=== Public path - allowing access ===");
          setStatus("ready");
          return;
        }

        // Se não está autenticado e tenta acessar rota privada, redirecionar para login
        if (!isAuthenticated()) {
          console.log("=== Not authenticated - redirecting to login ===");
          logout();
          navigate("/login", { replace: true });
          setStatus("ready");
          return;
        }

        console.log("=== Authenticated - allowing access ===");
        setStatus("ready");
      } catch (error) {
        console.error("=== AppGuard error ===", error);
        setStatus("ready");
      }
    }

    check();
  }, [location.pathname, location.search, navigate]);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <SubscriptionGuard>
        <SubscriptionWarningBanner />
        {children}
      </SubscriptionGuard>
    </>
  );
}
