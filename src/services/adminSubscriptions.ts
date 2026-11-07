import { apiRequest } from "./api";

export type ManagedCompanySubscription = {
  company_id: number;
  owner_name: string;
  owner_email: string;
  plan_id: "free" | "premium" | "monster";
  plan_name: string;
  monthly_price: number;
  user_count: number;
  is_active: boolean;
  started_at: string | null;
  expires_at: string | null;
  pending_request: { id: number; plan_id: "premium" | "monster"; created_at: string } | null;
};

export function fetchManagedSubscriptions() {
  return apiRequest<{ companies: ManagedCompanySubscription[] }>("/superadmin/subscriptions");
}

export function reviewPlanRequest(requestId: number, decision: "approved" | "rejected") {
  return apiRequest<{ id: number; status: string; message: string }>(
    `/superadmin/subscription-requests/${requestId}`,
    { method: "PATCH", body: { decision } },
  );
}
