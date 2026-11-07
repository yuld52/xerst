import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/login"));
export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — LomusTrack" },
      { name: "description", content: "Entrar no portal de gestão LomusTrack." },
      { property: "og:title", content: "Entrar — LomusTrack" },
      { property: "og:description", content: "Entrar no portal de gestão LomusTrack." },
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
