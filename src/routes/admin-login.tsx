import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/admin-login"));
export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Acesso administrativo — LomusTrack" },
      { name: "description", content: "Acesso administrativo no portal de gestão LomusTrack." },
      { property: "og:title", content: "Acesso administrativo — LomusTrack" },
      {
        property: "og:description",
        content: "Acesso administrativo no portal de gestão LomusTrack.",
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
