import { apiRequest } from "./api";

export interface CompanySubscriptionPlan {
  id: "free" | "premium" | "monster";
  name: string;
  monthly_price: number;
  sales_limit: number;
  ad_account_limit: number | null;
  webhook_limit: number | null;
}

export interface CompanySubscription {
  plan_id: CompanySubscriptionPlan["id"];
  plan: Omit<CompanySubscriptionPlan, "id">;
  started_at: string | null;
  expires_at: string | null;
  usage: {
    approved_sales_this_month: number;
    ad_accounts: number;
    webhooks: number;
  };
  available_plans: CompanySubscriptionPlan[];
  pending_plan_request: { id: number; plan_id: CompanySubscriptionPlan["id"]; created_at: string } | null;
}

export function fetchCompanySubscription() {
  return apiRequest<CompanySubscription>("/subscriptions/current");
}

export function requestCompanyPlan(planId: "premium" | "monster") {
  return apiRequest<{ id: number; plan_id: string; status: string }>("/subscriptions/requests", {
    method: "POST",
    body: { plan_id: planId },
  });
}
