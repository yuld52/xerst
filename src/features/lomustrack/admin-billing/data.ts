export type SubscriptionStatus = "active" | "trial" | "past_due" | "canceled";

export interface Subscription {
  id: string;
  user: string;
  email: string;
  plan: "Starter" | "Pro" | "Scale";
  amount: number;
  cost: number;
  status: SubscriptionStatus;
  renewal: string;
}

export const SUBSCRIPTIONS_KEY = "lomustrack-admin-subscriptions-v1";

export const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-001",
    user: "Ana Marketing",
    email: "ana@exemplo.com",
    plan: "Pro",
    amount: 299,
    cost: 48,
    status: "active",
    renewal: "2026-12-02",
  },
  {
    id: "sub-002",
    user: "Carlos Digital",
    email: "carlos@exemplo.com",
    plan: "Scale",
    amount: 699,
    cost: 82,
    status: "active",
    renewal: "2026-11-24",
  },
  {
    id: "sub-003",
    user: "Mariana Cursos",
    email: "mariana@exemplo.com",
    plan: "Starter",
    amount: 99,
    cost: 24,
    status: "trial",
    renewal: "2026-11-18",
  },
  {
    id: "sub-004",
    user: "João Ads",
    email: "joao@exemplo.com",
    plan: "Pro",
    amount: 299,
    cost: 48,
    status: "past_due",
    renewal: "2026-11-10",
  },
];

export function loadSubscriptions(): Subscription[] {
  if (typeof window === "undefined") return SEED_SUBSCRIPTIONS;
  try {
    const saved = window.localStorage.getItem(SUBSCRIPTIONS_KEY);
    return saved ? (JSON.parse(saved) as Subscription[]) : SEED_SUBSCRIPTIONS;
  } catch {
    return SEED_SUBSCRIPTIONS;
  }
}
