import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
const Page = lazy(() => import("@/features/lomustrack/admin-users"));
export const Route = createFileRoute("/_management/admin/users")({
  head: () => ({
    meta: [
      { title: "Usuários administrativos — LomusTrack" },
      { name: "description", content: "Usuários administrativos no portal de gestão LomusTrack." },
      { property: "og:title", content: "Usuários administrativos — LomusTrack" },
      {
        property: "og:description",
        content: "Usuários administrativos no portal de gestão LomusTrack.",
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
