import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const Page = lazy(() => import("@/features/lomustrack/verify-email"));

export const Route = createFileRoute("/verify-email")({
  head: () => ({
    meta: [
      { title: "Verificar email — LomusTrack" },
      { name: "description", content: "Verifique seu email para acessar o LomusTrack" },
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