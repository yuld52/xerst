import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const Page = lazy(() => import("@/features/lomustrack/forgot-password"));

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recuperar Senha — LomusTrack" },
      { name: "description", content: "Recuperar senha de acesso ao LomusTrack." },
      { property: "og:title", content: "Recuperar Senha — LomusTrack" },
      { property: "og:description", content: "Recuperar senha de acesso ao LomusTrack." },
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
