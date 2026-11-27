import { useEffect, useState, type ReactNode } from "react";
import { RiAddLine, RiDeleteBinLine, RiFacebookFill, RiInformationLine, RiLockLine } from "@remixicon/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createCampaignRule,
  deleteCampaignRule,
  fetchCampaignRules,
  setCampaignRuleEnabled,
  type CampaignRule,
} from "@/services/campaignRules";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useFacebookAccounts } from "@/hooks/useFacebookAccounts";
import type { FacebookAccountAPI } from "@/services/integrations";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import {
  fetchCampaignFilterOptions,
  type CampaignData,
  type CampaignFilterOptionsAPI,
} from "@/services/campaigns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "@tanstack/react-router";

type RuleAction = "activate" | "pause" | "increase_budget" | "decrease_budget";
type ConditionField = "spend" | "roas" | "cpa" | "ctr" | "sales";
type ConditionOperator = "gt" | "gte" | "lt" | "lte" | "eq";

interface RuleCondition {
  field: ConditionField;
  operator: ConditionOperator;
  value: string;
  currency?: "MZN" | "BRL" | "USD" | "EUR";
}

const actionLabels: Record<RuleAction, string> = {
  activate: "Ativar",
  pause: "Pausar",
  increase_budget: "Aumentar orçamento",
  decrease_budget: "Reduzir orçamento",
};

const fieldLabels: Record<ConditionField, string> = {
  spend: "Gasto",
  roas: "ROAS",
  cpa: "CPA",
  ctr: "CTR",
  sales: "Vendas",
};

const operatorLabels: Record<ConditionOperator, string> = {
  gt: "Maior que",
  gte: "Maior ou igual a",
  lt: "Menor que",
  lte: "Menor ou igual a",
  eq: "Igual a",
};

const emptyCondition = (): RuleCondition => ({ 
  field: "spend", 
  operator: "gt", 
  value: "0",
  currency: "MZN"
});

function RuleSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="min-w-0 w-full bg-background text-left whitespace-normal break-words [&>span]:line-clamp-none [&>span]:whitespace-normal">
        <SelectValue className="!line-clamp-none whitespace-normal" />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function RuleForm({
  open,
  onOpenChange,
  onSave,
  products,
  accounts,
  campaigns,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: CampaignRule) => void;
  products: { id: number; name: string }[];
  accounts: FacebookAccountAPI[];
  campaigns: CampaignData[];
}) {
  const [name, setName] = useState("");
  const [product, setProduct] = useState("any");
  const [account, setAccount] = useState("all");
  const [scope, setScope] = useState("active");
  const [nameFilter, setNameFilter] = useState("any");
  const [action, setAction] = useState<RuleAction>("activate");
  const [actionValue, setActionValue] = useState("10");
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [period, setPeriod] = useState("today");
  const frequency = "daily";

  useEffect(() => {
    if (!open) {
      setName("");
      setProduct("any");
      setAccount("all");
      setScope("active");
      setNameFilter("any");
      setAction("activate");
      setActionValue("10");
      setConditions([]);
      setPeriod("today");
    }
  }, [open]);

  const filteredCampaigns = campaigns.filter((c) => {
    if (account !== "all" && String(c.account_id) !== account) return false;
    if (scope === "active" && c.status !== "active") return false;
    return true;
  });

  useEffect(() => {
    if (nameFilter !== "any" && !filteredCampaigns.some((c) => c.id === nameFilter)) {
      setNameFilter("any");
    }
  }, [account, scope, nameFilter, filteredCampaigns]);

  const canSave =
    name.trim().length > 1 &&
    conditions.length > 0 &&
    conditions.every(
      (condition) => condition.value.trim() !== "" && Number.isFinite(Number(condition.value)),
    ) &&
    ((action !== "increase_budget" && action !== "decrease_budget") ||
      (Number(actionValue) >= 1 && Number(actionValue) <= 90));

  const save = () => {
    if (!canSave) return;
    onSave({
      id: crypto.randomUUID(),
      name: name.trim(),
      product,
      account,
      scope,
      nameFilter,
      action,
      conditions,
      period,
      frequency,
      interval: "any",
      dailyLimit: "1",
      actionValue: Number(actionValue),
      enabled: true,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[95vw] max-w-[800px] overflow-x-hidden overflow-y-auto p-0">
        <DialogHeader className="border-b px-4 py-4 sm:px-6 sm:py-5">
          <DialogTitle className="text-lg">Criar regra personalizada</DialogTitle>
          <DialogDescription>
            Atualize campanhas, conjuntos ou anúncios por meio de regras automatizadas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 px-4 py-4 sm:px-8 sm:py-6">
          <label className="block space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Nome da regra</span>
            <Input
              placeholder="Nome da regra"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Produto</span>
              <RuleSelect value={product} onChange={setProduct}>
                <SelectItem value="any">Qualquer</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </RuleSelect>
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium text-muted-foreground">Contas de anúncio</span>
              <RuleSelect value={account} onChange={setAccount}>
                <SelectItem value="all">Todas</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={String(acc.id)}>
                    {acc.label} ({acc.account_id})
                  </SelectItem>
                ))}
              </RuleSelect>
            </label>
          </div>
          <label className="block space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Aplicar regra a</span>
            <RuleSelect value={scope} onChange={setScope}>
              <SelectItem value="active">Campanhas Ativas</SelectItem>
              <SelectItem value="all">Todas as campanhas</SelectItem>
            </RuleSelect>
          </label>
          <label className="block space-y-2">
            <span
              className="text-xs font-medium text-muted-foreground"
              title="Define quais campanhas entram no filtro da regra."
            >
              Filtrar por nome{" "}
              <RiInformationLine
                className="inline size-3 cursor-help"
                aria-label="Define quais campanhas entram no filtro da regra"
              />
            </span>
            <RuleSelect value={nameFilter} onChange={setNameFilter}>
              <SelectItem value="any">Qualquer</SelectItem>
              {filteredCampaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </RuleSelect>
          </label>
          <label className="block space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Ação</span>
            <RuleSelect value={action} onChange={(value) => setAction(value as RuleAction)}>
              {Object.entries(actionLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </RuleSelect>
          </label>
          {(action === "increase_budget" || action === "decrease_budget") && (
            <label className="block space-y-2">
              <span className="text-xs font-medium text-muted-foreground">
                Alteração do orçamento (%)
              </span>
              <Input
                type="number"
                min="1"
                max="90"
                value={actionValue}
                onChange={(event) => setActionValue(event.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                A alteração será aplicada apenas a campanhas com orçamento diário.
              </span>
            </label>
          )}
          <div className="space-y-2">
            <div
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground"
              title="Adicione os critérios que precisam ser atendidos para executar a regra."
            >
              Condições{" "}
              <RiInformationLine
                className="size-3 cursor-help"
                aria-label="Adicione os critérios que precisam ser atendidos para executar a regra"
              />
            </div>
            <div className="space-y-2">
              {conditions.map((condition, index) => (
                <div
                  key={index}
                  className="grid min-w-0 gap-2 rounded-lg bg-muted/50 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.6fr)_auto]"
                >
                  <RuleSelect
                    value={condition.field}
                    onChange={(value) =>
                      setConditions((items) =>
                        items.map((item, i) =>
                          i === index ? { ...item, field: value as ConditionField } : item,
                        ),
                      )
                    }
                  >
                    {Object.entries(fieldLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </RuleSelect>
                  <RuleSelect
                    value={condition.operator}
                    onChange={(value) =>
                      setConditions((items) =>
                        items.map((item, i) =>
                          i === index ? { ...item, operator: value as ConditionOperator } : item,
                        ),
                      )
                    }
                  >
                    {Object.entries(operatorLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </RuleSelect>
                  <Input
                    value={condition.value}
                    onChange={(event) =>
                      setConditions((items) =>
                        items.map((item, i) =>
                          i === index ? { ...item, value: event.target.value } : item,
                        ),
                      )
                    }
                    placeholder={
                      condition.field === "spend" || condition.field === "cpa"
                        ? "0"
                        : condition.field === "roas"
                        ? "0.0x"
                        : condition.field === "ctr"
                        ? "0.0%"
                        : "0"
                    }
                  />
                  {(condition.field === "spend" || condition.field === "cpa") && (
                    <RuleSelect
                      value={condition.currency || "MZN"}
                      onChange={(value) =>
                        setConditions((items) =>
                          items.map((item, i) =>
                            i === index ? { ...item, currency: value as "MZN" | "BRL" | "USD" | "EUR" } : item,
                          ),
                        )
                      }
                    >
                      <SelectItem value="MZN">MT (MZN)</SelectItem>
                      <SelectItem value="BRL">R$ (BRL)</SelectItem>
                      <SelectItem value="USD">$ (USD)</SelectItem>
                      <SelectItem value="EUR">€ (EUR)</SelectItem>
                    </RuleSelect>
                  )}
                  {condition.field !== "spend" && condition.field !== "cpa" && (
                    <div className="flex items-center px-3 text-xs text-muted-foreground">
                      {condition.field === "roas" && "razão"}
                      {condition.field === "ctr" && "%"}
                      {condition.field === "sales" && "qtd"}
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setConditions((items) => items.filter((_, i) => i !== index))}
                  >
                    <RiDeleteBinLine className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setConditions((items) => [...items, emptyCondition()])}
            >
              <RiAddLine className="size-4" />
              Adicionar condição
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <label className="space-y-2">
              <span
                className="text-xs font-medium text-muted-foreground"
                title="Período usado para calcular os resultados da condição."
              >
                Período de Cálculo{" "}
                <RiInformationLine
                  className="inline size-3 cursor-help"
                  aria-label="Período usado para calcular os resultados da condição"
                />
              </span>
              <RuleSelect value={period} onChange={setPeriod}>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="yesterday">Ontem</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </RuleSelect>
            </label>
            <label className="space-y-2">
              <span
                className="text-xs font-medium text-muted-foreground"
                title="Define com que frequência a regra será verificada."
              >
                Frequência{" "}
                <RiInformationLine
                  className="inline size-3 cursor-help"
                  aria-label="Define com que frequência a regra será verificada"
                />
              </span>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                A cada 10 minutos
              </div>
              <p className="text-xs text-muted-foreground">
                As regras são verificadas automaticamente a cada 10 minutos (144 vezes por dia).
              </p>
            </label>
          </div>
        </div>
        <DialogFooter className="px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={!canSave}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RulesSection({ campaigns = [] }: { campaigns?: CampaignData[] }) {
  const [rules, setRules] = useState<CampaignRule[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const { subscription } = useSubscriptionLimits();
  const { accounts } = useFacebookAccounts();
  const { data: filterOptions } = useCachedQuery<CampaignFilterOptionsAPI>({
    cachePrefix: "campaign-filter-options",
    queryFn: fetchCampaignFilterOptions,
  });
  const products = filterOptions?.products ?? [];
  const navigate = useNavigate();
  
  const isFreePlan = subscription?.plan_id === "free";

  useEffect(() => {
    fetchCampaignRules()
      .then(setRules)
      .catch(() => toast.error("Não foi possível carregar as regras do servidor."));
  }, []);
  const saveRule = async (rule: CampaignRule) => {
    try {
      const saved = await createCampaignRule(rule);
      setRules((current) => [...current, saved]);
      toast.success("Regra salva e sincronizada.");
    } catch {
      toast.error("Não foi possível salvar a regra.");
    }
  };
  const deleteRule = async (id: string) => {
    try {
      await deleteCampaignRule(id);
      setRules((current) => current.filter((rule) => rule.id !== id));
    } catch {
      toast.error("Não foi possível excluir a regra.");
    }
  };
  const toggleRule = async (id: string) => {
    const rule = rules.find((item) => item.id === id);
    if (!rule) return;
    const enabled = !rule.enabled;
    try {
      await setCampaignRuleEnabled(id, enabled);
      setRules((current) => current.map((item) => (item.id === id ? { ...item, enabled } : item)));
    } catch {
      toast.error("Não foi possível atualizar a regra.");
    }
  };
  const deleteSelectedRules = async () => {
    try {
      await Promise.all(selectedRuleIds.map((id) => deleteCampaignRule(id)));
      setRules((current) => current.filter((rule) => !selectedRuleIds.includes(rule.id)));
      setSelectedRuleIds([]);
      toast.success("Regras selecionadas excluídas.");
    } catch {
      toast.error("Não foi possível excluir todas as regras selecionadas.");
    }
  };
  const allRulesSelected = rules.length > 0 && selectedRuleIds.length === rules.length;

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 shadow-sm sm:p-6">
      {isFreePlan && (
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
          <RiLockLine className="size-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-900 dark:text-orange-100">
            Regras de automação disponíveis apenas em planos pagos
          </AlertTitle>
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <p className="mb-3">
              As regras automatizadas permitem que você gerencie campanhas, conjuntos e anúncios de forma automática com base em condições de desempenho.
            </p>
            <Button
              size="sm"
              variant="default"
              onClick={() => navigate({ to: "/my-subscription" })}
            >
              Ver planos pagos
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-wrap items-center gap-6 border-b">
        <button
          className={cn(
            "flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-semibold",
            "border-primary text-primary",
          )}
        >
          <RiFacebookFill className="size-4" />
          Meta
        </button>
      </div>
      <div className="rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Regras</h2>
            <RiInformationLine
              className="size-4 text-muted-foreground"
              aria-label="Informações sobre regras automatizadas"
            />
          </div>
          <div className="flex gap-2">
            {selectedRuleIds.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive"
                onClick={() => void deleteSelectedRules()}
                disabled={isFreePlan}
              >
                <RiDeleteBinLine className="size-4" />
                Excluir selecionadas ({selectedRuleIds.length})
              </Button>
            )}
            <Button 
              size="sm" 
              className="gap-1.5" 
              onClick={() => setOpen(true)}
              disabled={isFreePlan}
            >
              <RiAddLine className="size-4" />
              Criar regra
            </Button>
          </div>
        </div>
        {rules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={allRulesSelected}
                      onCheckedChange={(checked) =>
                        setSelectedRuleIds(checked ? rules.map((rule) => rule.id) : [])
                      }
                      aria-label="Selecionar todas"
                    />
                  </th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3">NOME E PRODUTO</th>
                  <th className="px-4 py-3">APLICADA A</th>
                  <th className="px-4 py-3">AÇÃO E CONDIÇÃO</th>
                  <th className="px-4 py-3">FREQUÊNCIA E PERÍODO</th>
                  <th className="px-4 py-3">MAIS</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-t">
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={selectedRuleIds.includes(rule.id)}
                        onCheckedChange={(checked) =>
                          setSelectedRuleIds((ids) =>
                            checked ? [...ids, rule.id] : ids.filter((id) => id !== rule.id),
                          )
                        }
                        aria-label={`Ativar ${rule.name}`}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleRule(rule.id)}
                        title="Ativar ou pausar regra"
                        className={cn(
                          "rounded-full px-2 py-1 font-medium",
                          rule.enabled
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {rule.enabled ? "Ativa" : "Pausada"}
                      </button>
                    </td>
                    <td className="px-4 py-4 font-medium">
                      {rule.name}
                      <div className="mt-1 text-muted-foreground">
                        {rule.product === "any"
                          ? "Qualquer produto"
                          : (products.find((p) => String(p.id) === rule.product)?.name ?? rule.product)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {rule.scope === "active"
                        ? "Campanhas Ativas"
                        : rule.scope === "all"
                        ? "Todas as campanhas"
                        : rule.scope}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium">{actionLabels[rule.action]}</div>
                      <div className="mt-1 text-muted-foreground">
                        {rule.conditions
                          .map((condition) => {
                            const fieldLabel = fieldLabels[condition.field];
                            const operatorLabel = operatorLabels[condition.operator].toLowerCase();
                            const value = condition.value;
                            const currency = condition.currency || "MZN";
                            const unit = 
                              condition.field === "spend" || condition.field === "cpa"
                                ? ` ${currency}`
                                : condition.field === "roas"
                                ? "x"
                                : condition.field === "ctr"
                                ? "%"
                                : "";
                            return `${fieldLabel} ${operatorLabel} ${value}${unit}`;
                          })
                          .join(" e ")}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      Uma vez por dia, por volta das 08:00 (Maputo)
                      <div className="mt-1 text-muted-foreground">
                        {rule.period === "today" ? "Hoje" : rule.period}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRule(rule.id)}
                        title="Excluir regra"
                      >
                        <RiDeleteBinLine className="size-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex min-h-44 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            Nenhuma regra criada para o Meta.
          </div>
        )}
      </div>
      <RuleForm
        open={open}
        onOpenChange={setOpen}
        onSave={saveRule}
        products={products}
        accounts={accounts}
        campaigns={campaigns}
      />
    </section>
  );
}
