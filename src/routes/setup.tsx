import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/setup"));
export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Criar conta — LomusTrack" },
      { name: "description", content: "Criar conta no portal de gestão LomusTrack." },
      { property: "og:title", content: "Criar conta — LomusTrack" },
      { property: "og:description", content: "Criar conta no portal de gestão LomusTrack." },
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
