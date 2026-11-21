import {
  LayoutDashboard,
  Megaphone,
  TrendingUp,
  Users,
  Package,
  Filter,
  Wallet,
  Facebook,
  CreditCard,
  ArrowRightLeft,
  PanelLeft,
  X,
  ChevronRight,
} from "lucide-react";
import { useLocation, useNavigate } from "@/lib/import-navigation";
import {
  AnimatedSidebar,
  AnimatedSidebarClose,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupContent,
  AnimatedSidebarHeader,
  AnimatedSidebarInset,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuItem,
  AnimatedSidebarProvider,
  AnimatedSidebarRail,
  AnimatedSidebarTrigger,
  useAnimatedSidebar,
} from "@/components/ui/animated-sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { AiTrainingProfile } from "./AiTrainingProfile";
import { getStoredUser, logout } from "@/services/auth";
import { useAdvancedFeatures } from "@/contexts/AdvancedFeaturesContext";
import { Outlet } from "@/lib/import-navigation";
import { useEffect, useState } from "react";
import { fetchDisplayCurrency } from "@/services/company";
import { setCurrency, CURRENCIES, type CurrencyCode } from "@/lib/currencySettings";
import { isImportDemo } from "@/lib/import-demo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, LogOut, User, Settings, Headphones } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SupportModal } from "./SupportModal";

type UserRole = "owner" | "admin" | "viewer";

interface NavItem {
  title: string;
  icon: LucideIcon;
  url: string;
  roles?: UserRole[];
  featureKey?: "stripe_enabled";
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Análise",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
      { title: "Campanhas", icon: Megaphone, url: "/campaigns" },
      {
        title: "Métricas Stripe",
        icon: ArrowRightLeft,
        url: "/subscriptions",
        featureKey: "stripe_enabled",
      },
    ],
  },
  {
    label: "Comercial",
    items: [
      { title: "Vendas", icon: TrendingUp, url: "/sales" },
      { title: "Clientes", icon: Users, url: "/customers" },
    ],
  },
  {
    label: "Produtos",
    items: [
      {
        title: "Produtos",
        icon: Package,
        url: "/products",
        roles: ["owner", "admin", "viewer"],
      },
      { title: "Funil", icon: Filter, url: "/funnel" },
    ],
  },
  {
    label: "Integrações",
    items: [
      { title: "Plataformas", icon: Wallet, url: "/platforms", roles: ["owner", "admin"] },
      { title: "Facebook Ads", icon: Facebook, url: "/facebook-ads", roles: ["owner", "admin"] },
      {
        title: "Stripe",
        icon: CreditCard,
        url: "/stripe",
        roles: ["owner", "admin"],
        featureKey: "stripe_enabled",
      },
    ],
  },
  {
    label: "Conta",
    items: [{ title: "Assinatura", icon: CreditCard, url: "/my-subscription" }],
  },
];

function filterNavGroups(
  groups: NavGroup[],
  role: UserRole,
  features: Record<string, boolean>,
): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.roles && !item.roles.includes(role)) return false;
        if (item.featureKey && !features[item.featureKey]) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

function SidebarUserFooter() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [supportOpen, setSupportOpen] = useState(false);

  const initials =
    user?.name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "CA";

  const roleLabel =
    user?.role === "owner"
      ? "Owner"
      : user?.role === "admin"
        ? "Administrador"
        : user?.role === "viewer"
          ? "Visualizador"
          : "";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-xl p-1 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="size-9 rounded-full shrink-0">
            <AvatarFallback className="rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
            <span className="block truncate text-sm font-medium text-foreground">
              {user?.name || "Admin"}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {roleLabel}
            </span>
          </span>
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground group-data-[state=collapsed]/sidebar:hidden"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56 rounded-lg"
        side="right"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
            <Avatar className="size-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-xs text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user?.name || "Admin"}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email || "admin@lomus.com"}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="size-4" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/advanced-settings")}>
          <Settings className="size-4" />
          Configurações Avançadas
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setSupportOpen(true)}>
          <Headphones className="size-4" />
          Suporte
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          {isDark ? "Modo Claro" : "Modo Escuro"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} disabled={theme === "system"}>
          <Monitor className="size-4" />
          Automático
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="size-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <SupportModal
      open={supportOpen}
      onOpenChange={setSupportOpen}
      userEmail={user?.email}
      userName={user?.name}
    />
    </>
  );
}

function AppSidebarContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const role: UserRole = user?.role ?? "owner";
  const { features } = useAdvancedFeatures();

  const visibleGroups = filterNavGroups(navGroups, role, { ...features });
  const allNavItems = visibleGroups.flatMap((group) => group.items);
  const currentPath = location.pathname;

  return (
    <AnimatedSidebar
      ariaLabel="LomusTrack"
      collapsible="icon"
      className="min-h-0"
      panelClassName="h-full border-border"
    >
      <AnimatedSidebarHeader className="p-3 pb-2">
        <div className="flex min-h-11 items-center gap-3 overflow-hidden px-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-black p-1 shadow-sm">
            <img
              src="/brand-logo.png"
              alt="LomusTrack"
              className="h-full w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <span className="truncate text-sm font-bold text-foreground tracking-tight group-data-[state=collapsed]/sidebar:hidden">
            LomusTrack
          </span>
          <div className="ml-auto flex items-center gap-1 group-data-[state=collapsed]/sidebar:hidden">
            <NotificationBell />
          </div>
          <AnimatedSidebarClose className="ml-auto text-muted-foreground hover:bg-muted md:hidden">
            <X aria-hidden="true" className="size-4" />
          </AnimatedSidebarClose>
        </div>
      </AnimatedSidebarHeader>

      <AnimatedSidebarContent className="px-2 pt-1">
        <AnimatedSidebarGroup className="p-0">
          <AnimatedSidebarGroupContent>
            <AnimatedSidebarMenu className="gap-1">
              {allNavItems.map((item) => (
                <AnimatedSidebarMenuItem key={item.title}>
                  <AnimatedSidebarMenuButton
                    isActive={currentPath === item.url}
                    icon={<item.icon className="size-4" />}
                    onSelect={() => navigate(item.url)}
                  >
                    {item.title}
                  </AnimatedSidebarMenuButton>
                </AnimatedSidebarMenuItem>
              ))}
            </AnimatedSidebarMenu>
          </AnimatedSidebarGroupContent>
        </AnimatedSidebarGroup>
      </AnimatedSidebarContent>

      <AnimatedSidebarFooter className="gap-3 border-none p-3">
        <div className="group-data-[state=collapsed]/sidebar:hidden">
          <AiTrainingProfile />
        </div>
        <SidebarUserFooter />
      </AnimatedSidebarFooter>

      <AnimatedSidebarRail />
    </AnimatedSidebar>
  );
}

function DashboardContent() {
  const { state } = useAnimatedSidebar();

  return (
    <AnimatedSidebarInset className="min-h-0 bg-background overflow-y-auto overflow-x-hidden">
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-border border-b bg-background/80 backdrop-blur-sm px-4 md:hidden">
        <AnimatedSidebarTrigger className="text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <PanelLeft aria-hidden="true" className="size-4" />
        </AnimatedSidebarTrigger>
        <div className="h-5 w-px bg-border" />
        <span className="text-sm font-semibold text-foreground">LomusTrack</span>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto w-full min-h-full" style={{ maxWidth: "min(1600px, 100%)" }}>
          <Outlet />
        </div>
      </main>
    </AnimatedSidebarInset>
  );
}

export function AnimatedDashboardLayout() {
  useEffect(() => {
    if (isImportDemo()) return;
    fetchDisplayCurrency()
      .then(({ currency }) => {
        if (currency in CURRENCIES) setCurrency(currency as CurrencyCode);
      })
      .catch(() => undefined);
  }, []);

  return (
    <AnimatedSidebarProvider className="h-screen bg-background">
      <AppSidebarContent />
      <DashboardContent />
    </AnimatedSidebarProvider>
  );
}
