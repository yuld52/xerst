import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/funnel"));
export const Route = createFileRoute("/_dashboard/funnel")({
  head: () => ({
    meta: [
      { title: "Funil — LomusTrack" },
      { name: "description", content: "Funil no portal de gestão LomusTrack." },
      { property: "og:title", content: "Funil — LomusTrack" },
      { property: "og:description", content: "Funil no portal de gestão LomusTrack." },
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
