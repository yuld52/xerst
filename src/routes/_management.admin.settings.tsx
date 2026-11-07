import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/admin-settings"));
export const Route = createFileRoute("/_management/admin/settings")({
  head: () => ({
    meta: [
      { title: "Configurações administrativas — LomusTrack" },
      {
        name: "description",
        content: "Configurações administrativas no portal de gestão LomusTrack.",
      },
      { property: "og:title", content: "Configurações administrativas — LomusTrack" },
      {
        property: "og:description",
        content: "Configurações administrativas no portal de gestão LomusTrack.",
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
