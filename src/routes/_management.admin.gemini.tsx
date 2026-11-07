import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/admin-gemini"));
export const Route = createFileRoute("/_management/admin/gemini")({
  head: () => ({
    meta: [
      { title: "OpenRouter — LomusTrack" },
      { name: "description", content: "OpenRouter no portal de gestão LomusTrack." },
      { property: "og:title", content: "OpenRouter — LomusTrack" },
      { property: "og:description", content: "OpenRouter no portal de gestão LomusTrack." },
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
