import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/campaigns"));
export const Route = createFileRoute("/_dashboard/campaigns")({
  head: () => ({
    meta: [
      { title: "Campanhas — LomusTrack" },
      { name: "description", content: "Campanhas no portal de gestão LomusTrack." },
      { property: "og:title", content: "Campanhas — LomusTrack" },
      { property: "og:description", content: "Campanhas no portal de gestão LomusTrack." },
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
