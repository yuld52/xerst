import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/users"));
export const Route = createFileRoute("/_dashboard/users")({
  head: () => ({
    meta: [
      { title: "Usuários — LomusTrack" },
      { name: "description", content: "Usuários no portal de gestão LomusTrack." },
      { property: "og:title", content: "Usuários — LomusTrack" },
      { property: "og:description", content: "Usuários no portal de gestão LomusTrack." },
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
