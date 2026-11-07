import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/advanced-settings"));
export const Route = createFileRoute("/_dashboard/advanced-settings")({
  head: () => ({
    meta: [
      { title: "Configurações avançadas — LomusTrack" },
      { name: "description", content: "Configurações avançadas no portal de gestão LomusTrack." },
      { property: "og:title", content: "Configurações avançadas — LomusTrack" },
      {
        property: "og:description",
        content: "Configurações avançadas no portal de gestão LomusTrack.",
      },
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
