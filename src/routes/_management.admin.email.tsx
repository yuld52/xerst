import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/admin-email"));
export const Route = createFileRoute("/_management/admin/email")({
  head: () => ({
    meta: [
      { title: "Comunicações — LomusTrack" },
      { name: "description", content: "Envie emails e notificações push para os usuários." },
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
