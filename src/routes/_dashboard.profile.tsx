import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/profile"));
export const Route = createFileRoute("/_dashboard/profile")({
  head: () => ({
    meta: [
      { title: "Perfil — LomusTrack" },
      { name: "description", content: "Perfil no portal de gestão LomusTrack." },
      { property: "og:title", content: "Perfil — LomusTrack" },
      { property: "og:description", content: "Perfil no portal de gestão LomusTrack." },
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
