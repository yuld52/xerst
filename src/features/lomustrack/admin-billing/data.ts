export type SubscriptionStatus = "active" | "trial" | "past_due" | "canceled";

export type LomusPlanId = "free" | "premium" | "monster";

export interface LomusPlan {
  id: LomusPlanId;
  name: string;
  description: string;
  monthlyPrice: number;
  features: string[];
}

export const LOMUS_PLANS: LomusPlan[] = [
  {
    id: "free",
    name: "Gratuito",
    description: "Recomendado para quem está começando agora.",
    monthlyPrice: 0,
    features: [
      "Até 80 vendas aprovadas",
      "1 conta de anúncio",
      "1 webhook",
      "Sem cobranças adicionais",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Recomendado para quem já possui uma operação.",
    monthlyPrice: 29,
    features: [
      "Tudo do plano Gratuito",
      "Até 1.000 vendas aprovadas por mês*",
      "3 contas de anúncio",
      "3 webhooks",
    ],
  },
  {
    id: "monster",
    name: "Monster",
    description: "Recomendado para quem já é um monstro da escala.",
    monthlyPrice: 79,
    features: [
      "Tudo do plano Premium",
      "Até 5.000 vendas aprovadas por mês*",
      "Contas de anúncio ilimitadas",
      "Webhooks ilimitados",
    ],
  },
];

export interface Subscription {
  id: string;
  user: string;
  email: string;
  plan: LomusPlanId;
  amount: number;
  cost: number | null;
  status: SubscriptionStatus;
  renewal: string;
}

export const SUBSCRIPTIONS_KEY = "lomustrack-admin-subscriptions-v2";

export const SEED_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub-001",
    user: "Ana Marketing",
    email: "ana@exemplo.com",
    plan: "premium",
    amount: 29,
    cost: null,
    status: "active",
    renewal: "2026-12-02",
  },
  {
    id: "sub-002",
    user: "Carlos Digital",
    email: "carlos@exemplo.com",
    plan: "monster",
    amount: 79,
    cost: null,
    status: "active",
    renewal: "2026-11-24",
  },
  {
    id: "sub-003",
    user: "Mariana Cursos",
    email: "mariana@exemplo.com",
    plan: "free",
    amount: 0,
    cost: null,
    status: "trial",
    renewal: "2026-11-18",
  },
  {
    id: "sub-004",
    user: "João Ads",
    email: "joao@exemplo.com",
    plan: "premium",
    amount: 29,
    cost: null,
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
