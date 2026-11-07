import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/facebook-ads"));
export const Route = createFileRoute("/_dashboard/facebook-ads")({
  head: () => ({
    meta: [
      { title: "Facebook Ads — LomusTrack" },
      { name: "description", content: "Facebook Ads no portal de gestão LomusTrack." },
      { property: "og:title", content: "Facebook Ads — LomusTrack" },
      { property: "og:description", content: "Facebook Ads no portal de gestão LomusTrack." },
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
