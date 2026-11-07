import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/products"));
export const Route = createFileRoute("/_dashboard/products")({
  head: () => ({
    meta: [
      { title: "Produtos — LomusTrack" },
      { name: "description", content: "Produtos no portal de gestão LomusTrack." },
      { property: "og:title", content: "Produtos — LomusTrack" },
      { property: "og:description", content: "Produtos no portal de gestão LomusTrack." },
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
