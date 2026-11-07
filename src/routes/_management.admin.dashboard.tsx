import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/admin-dashboard"));
export const Route = createFileRoute("/_management/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard administrativo — LomusTrack" },
      { name: "description", content: "Dashboard administrativo no portal de gestão LomusTrack." },
      { property: "og:title", content: "Dashboard administrativo — LomusTrack" },
      {
        property: "og:description",
        content: "Dashboard administrativo no portal de gestão LomusTrack.",
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
