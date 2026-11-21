import { describe, it, expect, beforeEach } from "vitest";
import {
  fetchCampaignRules,
  createCampaignRule,
  setCampaignRuleEnabled,
  deleteCampaignRule,
  type CampaignRule,
} from "@/services/campaignRules";

describe("Campaign Rules service & mock interceptor", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("mock_mode", "true");
  });

  it("fetches predefined campaign rules in demo mode", async () => {
    const rules = await fetchCampaignRules();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThanOrEqual(1);
    expect(rules[0]).toHaveProperty("id");
    expect(rules[0]).toHaveProperty("name");
    expect(rules[0]).toHaveProperty("enabled");
  });

  it("creates, toggles, and deletes an automated rule", async () => {
    const testRule: CampaignRule = {
      id: "test_custom_rule_" + Date.now(),
      name: "Regra Teste Unitário",
      product: "any",
      account: "all",
      scope: "active",
      nameFilter: "any",
      action: "pause",
      conditions: [{ field: "cpa", operator: "gt", value: "900" }],
      period: "today",
      frequency: "daily",
      interval: "any",
      dailyLimit: "none",
      actionValue: 15,
      enabled: true,
    };

    const created = await createCampaignRule(testRule);
    expect(created.id).toBe(testRule.id);
    expect(created.name).toBe("Regra Teste Unitário");
    expect(created.enabled).toBe(true);

    // Toggle rule
    await setCampaignRuleEnabled(created.id, false);
    const updatedList = await fetchCampaignRules();
    const found = updatedList.find((r) => r.id === created.id);
    expect(found).toBeDefined();
    expect(found?.enabled).toBe(false);

    // Delete rule
    await deleteCampaignRule(created.id);
    const afterDeleteList = await fetchCampaignRules();
    expect(afterDeleteList.some((r) => r.id === created.id)).toBe(false);
  });
});
