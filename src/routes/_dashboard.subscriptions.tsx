import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/subscriptions"));
export const Route = createFileRoute("/_dashboard/subscriptions")({
  head: () => ({
    meta: [
      { title: "Assinaturas — LomusTrack" },
      { name: "description", content: "Assinaturas no portal de gestão LomusTrack." },
      { property: "og:title", content: "Assinaturas — LomusTrack" },
      { property: "og:description", content: "Assinaturas no portal de gestão LomusTrack." },
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
