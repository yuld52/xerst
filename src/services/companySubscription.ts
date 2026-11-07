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
}

export function fetchCompanySubscription() {
  return apiRequest<CompanySubscription>("/subscriptions/current");
}
