import { apiRequest } from "./api";

export interface CampaignRuleCondition {
  field: "spend" | "cpa" | "ctr" | "roas" | "sales";
  operator: "gt" | "gte" | "lt" | "lte" | "eq";
  value: string;
}

export interface CampaignRule {
  id: string;
  name: string;
  product: string;
  account: string;
  scope: string;
  nameFilter: string;
  action: "activate" | "pause" | "increase_budget" | "decrease_budget";
  conditions: CampaignRuleCondition[];
  period: string;
  frequency: string;
  interval: string;
  dailyLimit: string;
  actionValue?: number;
  enabled: boolean;
}

interface StoredRule {
  id: string;
  enabled: boolean;
  definition: CampaignRule;
}

export async function fetchCampaignRules(): Promise<CampaignRule[]> {
  const rows = await apiRequest<StoredRule[]>("/campaigns/rules");
  return rows.map((row) => ({ ...row.definition, enabled: row.enabled }));
}

export async function createCampaignRule(rule: CampaignRule): Promise<CampaignRule> {
  const row = await apiRequest<StoredRule>("/campaigns/rules", { method: "POST", body: rule });
  return { ...row.definition, enabled: row.enabled };
}

export async function setCampaignRuleEnabled(id: string, enabled: boolean): Promise<void> {
  await apiRequest(`/campaigns/rules/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: { enabled },
  });
}

export async function deleteCampaignRule(id: string): Promise<void> {
  await apiRequest(`/campaigns/rules/${encodeURIComponent(id)}`, { method: "DELETE" });
}
