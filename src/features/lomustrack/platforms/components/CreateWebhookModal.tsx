import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RiSearchLine, RiCloseLine } from "@remixicon/react";

interface CreateWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (platform: string, name: string, securityToken?: string) => Promise<void>;
  isLoading?: boolean;
}

const PLATFORMS = [
  "Hotmart", "Kiwify", "Cartpanda", "Vega", "Kirvano", "Shopify", "PerfectPay", "Yampi",
  "Lastlink", "Stripe", "Payt", "JVZoo", "Logzz", "Adoorei", "TriboPay", "Paradise",
  "Clickbank", "Ticto", "Eduzz", "Braip", "Pepper", "Woocommerce", "BuyGoods", "MundPay",
  "Disrupty", "Greenn", "Monetizze", "Guru", "Digistore", "Hubla", "Doppus", "Frendz",
  "InvictusPay", "Appmax", "NitroPagamentos", "GoatPay", "Hebreus", "IExperience",
  "PagTrust", "NuvemShop", "FortPay", "Systeme", "IronPay", "CinqPay", "SharkPays",
  "Maxweb", "Zouti", "Pantherfy", "StrivPay", "AtomoPay", "AllPay", "BullPay",
  "OctusPay", "Zippify", "Masterfy", "InovaPag", "SoutPay", "WolfPay", "SigmaPagamentos",
  "Nexopayt", "WeGate", "Unicornify", "Allpes", "VittaPay", "FluxionPay", "NezzyPay",
  "PMHMPay", "TrivexPay", "GatPay", "BearPay", "AmandisPay", "DigiPag", "AlphaPay",
  "AssetPay", "BrGateway", "Creedx", "Hotfy", "KlivoPay", "Plumify", "PrimeGate",
  "Wise2Pay", "VisionPay", "SharkBytePay", "SigmaPay", "ZeroOnePay", "Traxon", "Bloo",
  "KitePay", "Everflow", "B4you", "Risepay", "Urus", "Cakto", "Flashpay", "DigitalMart",
  "Exattus", "LunarCash", "YouShop", "BlackPay", "VenuzPay", "LunaCheckout", "FullSale",
  "BullsPay", "Moodi", "NikaPay", "GhostsPay", "KeedPay", "Salduu", "ViperPay", "Sunize",
  "Assiny", "Wiapy", "UnicoPag", "ImperialPay", "Zedy", "Sinix", "Voomp", "Ombrelone",
  "PushinPay", "Genesys", "OnProfit", "SacaPay", "Cloudfy", "Kuenha", "NinjaPay", "Xgrow",
  "ggCheckout", "PanteraCheckout", "NublaPay", "Cartly", "Pagah", "Pagsafe", "Nomadfy",
  "Sync", "LPQV", "Auryon369", "FirePay", "Lowify", "Hyppe", "Seedpay", "Membriz",
  "Cerefy", "PagAmerican", "AfiliaxPay", "Kambafy", "Aprovei", "ZuckPay", "XynonPay",
  "Kavoo", "Fruitfy", "Cooud", "ClickPay", "OrlaCheckout", "TukanoPay", "Corvex",
  "Ereemby", "Naut", "MaisFy", "SillientPay", "VaultVision", "VeltrixPay", "VitraPay",
  "Leona", "FendaPay", "KairosWay", "DigitalGoat", "Wiven",
];

export function CreateWebhookModal({
  open,
  onOpenChange,
  onCreate,
  isLoading,
}: CreateWebhookModalProps) {
  const [search, setSearch] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const filteredPlatforms = PLATFORMS.filter((p) =>
    p.toLowerCase().includes(search.toLowerCase())
  );

  const handlePlatformSelect = async (platform: string) => {
    setSelectedPlatform(platform);
    // Auto-create with platform name
    try {
      await onCreate(platform.toLowerCase(), platform, undefined);
      onOpenChange(false);
      setSearch("");
      setSelectedPlatform(null);
    } catch {
      // Keep modal open on error
    }
  };

  const handleClose = () => {
    setSearch("");
    setSelectedPlatform(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90%] md:w-[60%] lg:w-[30%] p-0 overflow-hidden flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Webhooks</SheetTitle>
            <button
              onClick={handleClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <RiCloseLine className="h-5 w-5" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-6">
          <div className="flex-none py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Selecione uma plataforma para começar:
            </p>
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por plataforma"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-2 pb-4">
              {filteredPlatforms.map((platform) => (
                <button
                  key={platform}
                  onClick={() => handlePlatformSelect(platform)}
                  disabled={isLoading}
                  className="px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-left text-sm font-semibold disabled:opacity-50"
                >
                  {platform}
                </button>
              ))}
            </div>
            {filteredPlatforms.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma plataforma encontrada
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
