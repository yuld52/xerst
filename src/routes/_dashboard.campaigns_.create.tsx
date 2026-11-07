import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/campaigns-create"));
export const Route = createFileRoute("/_dashboard/campaigns_/create")({
  head: () => ({
    meta: [
      { title: "Criar campanha — LomusTrack" },
      { name: "description", content: "Criar campanha no portal de gestão LomusTrack." },
      { property: "og:title", content: "Criar campanha — LomusTrack" },
      { property: "og:description", content: "Criar campanha no portal de gestão LomusTrack." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
