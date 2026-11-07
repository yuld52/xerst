import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const Page = lazy(() => import("@/features/lomustrack/notification-settings"));

export const Route = createFileRoute("/_dashboard/notification-settings")({
  head: () => ({
    meta: [
      { title: "Configurações de notificações — LomusTrack" },
      { name: "description", content: "Configure as notificações de vendas e relatórios." },
    ],
  }),
  component: Screen,
});

function Screen() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Carregando...</div>}>
      <Page />
    </Suspense>
  );
}
